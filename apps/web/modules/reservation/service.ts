import { TRPCError } from '@trpc/server'
import dayjs from 'dayjs'
import * as repo from './repository'
import { db } from '@/lib/db'
import { enqueueKbsNotification } from '@/lib/queues/kbs-queue'
import { createCheckoutTask } from '@/modules/housekeeping/service'
import type { ReservationCreateInput, ReservationFilters, ReservationUpdateInput, PricePreviewInput } from './types'

// CRITICAL: single source of truth for pricing — Section 5.7 of roadmap
// finalPrice = multiplier(persons) × nights × pricePerNight(dateRange) × (1 - agencyDiscount/100)
// All values are integers (kuruş). Round at end only.
export async function calculatePrice(
  tenantId: string,
  persons: number,
  checkIn: Date,
  checkOut: Date,
  agencyId?: string,
): Promise<{ totalPrice: number; pricePerNight: number; nights: number; multiplier: number; agencyDiscount: number }> {
  const nights = dayjs(checkOut).diff(dayjs(checkIn), 'day')
  if (nights <= 0) {
    throw new TRPCError({ code: 'BAD_REQUEST', message: 'Check-out must be after check-in' })
  }

  // Find price for this date range
  const priceCalendar = await db.priceCalendar.findFirst({
    where: {
      tenantId,
      ...(agencyId ? { agencyId } : { agencyId: null }),
      startDate: { lte: checkIn },
      endDate: { gte: checkOut },
    },
    orderBy: { createdAt: 'desc' },
  })

  const pricePerNight = priceCalendar?.pricePerNight ?? 0

  // Find person multiplier
  const multiplierRow = await db.multiplierMatrix.findFirst({
    where: { tenantId, persons },
  })
  // multiplier is stored as integer e.g. 100 = 1.00x, 150 = 1.50x
  const multiplier = multiplierRow?.multiplier ?? 100

  // Agency discount
  let agencyDiscount = 0
  if (agencyId) {
    const agency = await db.agency.findFirst({ where: { id: agencyId, tenantId } })
    agencyDiscount = agency?.commissionRate ?? 0
  }

  // SGK formula: multiplier(%) × nights × pricePerNight × (1 - agencyDiscount/100) / 100
  const totalPrice = Math.round(
    (multiplier / 100) * nights * pricePerNight * (1 - agencyDiscount / 100),
  )

  return { totalPrice, pricePerNight, nights, multiplier, agencyDiscount }
}

export async function listReservations(tenantId: string, filters: ReservationFilters) {
  return repo.listReservations(tenantId, filters)
}

export async function getReservation(tenantId: string, id: string) {
  const reservation = await repo.getReservationById(tenantId, id)
  if (!reservation) throw new TRPCError({ code: 'NOT_FOUND', message: 'Reservation not found' })
  return reservation
}

export async function createReservation(tenantId: string, input: ReservationCreateInput) {
  // Blacklist check
  const guest = await db.guest.findFirst({ where: { id: input.guestId, tenantId } })
  if (!guest) throw new TRPCError({ code: 'NOT_FOUND', message: 'Guest not found' })
  if (guest.blacklisted) {
    throw new TRPCError({
      code: 'FORBIDDEN',
      message: `Guest is blacklisted: ${guest.blacklistReason ?? 'No reason provided'}`,
    })
  }

  // Room availability check
  const room = await db.room.findFirst({ where: { id: input.roomId, tenantId } })
  if (!room) throw new TRPCError({ code: 'NOT_FOUND', message: 'Room not found' })

  // Calculate price — fall back to room type basePrice when no price calendar entry exists
  const persons = input.adults + input.children
  let { totalPrice } = await calculatePrice(tenantId, persons, input.checkIn, input.checkOut, input.agencyId)
  if (totalPrice === 0) {
    const roomWithType = await db.room.findFirst({ where: { id: input.roomId, tenantId }, include: { roomType: true } })
    const nights = Math.round((input.checkOut.getTime() - input.checkIn.getTime()) / 86400000)
    totalPrice = (roomWithType?.roomType.basePrice ?? 0) * nights
  }

  // Apply manual discount
  const discountPct = input.discountPct ?? 0
  if (discountPct > 0) {
    totalPrice = Math.round(totalPrice * (1 - discountPct / 100))
  }

  // Encode discount reason into specialRequests
  const specialRequests = discountPct > 0 && input.discountReason
    ? `[%${discountPct} indirim: ${input.discountReason}]${input.specialRequests ? '\n' + input.specialRequests : ''}`
    : input.specialRequests

  const { discountPct: _dp, discountReason: _dr, ...rest } = input
  return repo.createReservation(tenantId, { ...rest, specialRequests, totalPrice })
}

export async function updateReservation(
  tenantId: string,
  id: string,
  input: ReservationUpdateInput,
) {
  const existing = await getReservation(tenantId, id)

  if (input.roomId) {
    const room = await db.room.findFirst({ where: { id: input.roomId, tenantId } })
    if (!room) throw new TRPCError({ code: 'NOT_FOUND', message: 'Room not found' })
  }

  const { discountPct, discountReason, ...rest } = input

  let totalPrice: number | undefined
  if (discountPct && discountPct > 0) {
    totalPrice = Math.round(existing.totalPrice * (1 - discountPct / 100))
  }

  const specialRequests = discountPct && discountPct > 0 && discountReason
    ? `[%${discountPct} indirim: ${discountReason}]${rest.specialRequests ? '\n' + rest.specialRequests : ''}`
    : rest.specialRequests

  return repo.updateReservation(tenantId, id, {
    ...rest,
    ...(specialRequests !== undefined && { specialRequests }),
    ...(totalPrice !== undefined && { totalPrice }),
  })
}

export async function checkInReservation(tenantId: string, id: string) {
  const reservation = await getReservation(tenantId, id)

  const room = await db.room.findFirst({ where: { id: reservation.roomId, tenantId } })
  if (room?.status === 'FAULTY') {
    throw new TRPCError({ code: 'PRECONDITION_FAILED', message: 'Room is faulty — cannot check in' })
  }
  if (room?.status === 'DIRTY') {
    throw new TRPCError({ code: 'PRECONDITION_FAILED', message: 'Room is dirty — cannot check in' })
  }

  const updated = await repo.updateReservationStatus(tenantId, id, 'CHECKEDIN')

  // Mark room as DIRTY after check-in
  await db.room.update({ where: { id: reservation.roomId }, data: { status: 'DIRTY' } })

  // KBS: notify Jandarma within 5 minutes (fire-and-forget, non-blocking)
  const guest = await db.guest.findFirst({ where: { id: reservation.guestId } })
  if (guest && room) {
    enqueueKbsNotification({
      reservationId: reservation.id, tenantId,
      guestFirstName: guest.firstName, guestLastName: guest.lastName,
      guestTcId: guest.tcId, guestPassportNo: guest.passportNo,
      guestNationality: guest.nationality, guestDateOfBirth: guest.dateOfBirth,
      roomNumber: room.number, checkIn: reservation.checkIn,
    }).catch(() => {})
  }

  return updated
}

export async function checkOutReservation(tenantId: string, id: string) {
  const reservation = await getReservation(tenantId, id)
  const result = await repo.updateReservationStatus(tenantId, id, 'CHECKEDOUT')

  // Auto-create HK cleaning task for vacated room (fire-and-forget)
  if (reservation.roomId) {
    createCheckoutTask(tenantId, reservation.roomId).catch(() => {})
  }

  return result
}

export async function cancelReservation(tenantId: string, id: string, reason: string) {
  await getReservation(tenantId, id)
  return repo.updateReservation(tenantId, id, { notes: reason })
    .then(() => repo.updateReservationStatus(tenantId, id, 'CANCELLED'))
}

export async function pricePreview(tenantId: string, input: PricePreviewInput) {
  const result = await calculatePrice(tenantId, input.guestCount, input.checkIn, input.checkOut, input.agencyId)
  if (result.totalPrice === 0 && input.roomId) {
    const room = await db.room.findFirst({ where: { id: input.roomId, tenantId }, include: { roomType: true } })
    if (room) {
      const nights = Math.round((input.checkOut.getTime() - input.checkIn.getTime()) / 86400000)
      return { ...result, totalPrice: room.roomType.basePrice * nights, pricePerNight: room.roomType.basePrice }
    }
  }
  return result
}

export async function getDashboardData(tenantId: string) {
  const [arrivals, departures, occupancy] = await Promise.all([
    repo.getTodayArrivals(tenantId),
    repo.getTodayDepartures(tenantId),
    repo.getOccupancySummary(tenantId),
  ])
  return { arrivals, departures, occupancy }
}
