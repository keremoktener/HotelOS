import { TRPCError } from '@trpc/server'
import dayjs from 'dayjs'
import * as repo from './repository'
import { db } from '@/lib/db'
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

  // Calculate price
  const persons = input.adults + input.children
  const { totalPrice } = await calculatePrice(
    tenantId,
    persons,
    input.checkIn,
    input.checkOut,
    input.agencyId,
  )

  return repo.createReservation(tenantId, { ...input, totalPrice })
}

export async function updateReservation(
  tenantId: string,
  id: string,
  input: ReservationUpdateInput,
) {
  await getReservation(tenantId, id)
  return repo.updateReservation(tenantId, id, input)
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

  return updated
}

export async function checkOutReservation(tenantId: string, id: string) {
  await getReservation(tenantId, id)
  return repo.updateReservationStatus(tenantId, id, 'CHECKEDOUT')
}

export async function cancelReservation(tenantId: string, id: string, reason: string) {
  await getReservation(tenantId, id)
  return repo.updateReservation(tenantId, id, { notes: reason })
    .then(() => repo.updateReservationStatus(tenantId, id, 'CANCELLED'))
}

export async function pricePreview(tenantId: string, input: PricePreviewInput) {
  return calculatePrice(tenantId, input.guestCount, input.checkIn, input.checkOut, input.agencyId)
}

export async function getDashboardData(tenantId: string) {
  const [arrivals, departures, occupancy] = await Promise.all([
    repo.getTodayArrivals(tenantId),
    repo.getTodayDepartures(tenantId),
    repo.getOccupancySummary(tenantId),
  ])
  return { arrivals, departures, occupancy }
}
