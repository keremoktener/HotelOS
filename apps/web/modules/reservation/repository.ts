import { db } from '@/lib/db'
import type { ReservationStatus } from '@prisma/client'
import type { ReservationCreateInput, ReservationFilters } from './types'

const reservationInclude = {
  guest: true,
  room: { include: { roomType: true } },
  payments: true,
  signatures: true,
} as const

export async function listReservations(tenantId: string, filters: ReservationFilters) {
  const skip = (filters.page - 1) * filters.pageSize

  const where = {
    tenantId,
    ...(filters.status && { status: filters.status }),
    ...(filters.agencyId && { agencyId: filters.agencyId }),
    ...(filters.guestName && {
      guest: {
        OR: [
          { firstName: { contains: filters.guestName, mode: 'insensitive' as const } },
          { lastName: { contains: filters.guestName, mode: 'insensitive' as const } },
        ],
      },
    }),
    ...((filters.dateRangeFrom || filters.dateRangeTo) && {
      checkIn: {
        ...(filters.dateRangeFrom && { gte: filters.dateRangeFrom }),
        ...(filters.dateRangeTo && { lte: filters.dateRangeTo }),
      },
    }),
  }

  const [items, total] = await db.$transaction([
    db.reservation.findMany({
      where,
      include: reservationInclude,
      orderBy: { checkIn: 'desc' },
      skip,
      take: filters.pageSize,
    }),
    db.reservation.count({ where }),
  ])

  return { items, total, page: filters.page, pageSize: filters.pageSize }
}

export async function getReservationById(tenantId: string, id: string) {
  return db.reservation.findFirst({
    where: { id, tenantId },
    include: reservationInclude,
  })
}

export async function createReservation(
  tenantId: string,
  data: Omit<ReservationCreateInput, 'discountPct' | 'discountReason'> & { totalPrice: number },
) {
  return db.reservation.create({
    data: { ...data, tenantId, status: 'WAITING' },
    include: reservationInclude,
  })
}

export async function updateReservationStatus(
  tenantId: string,
  id: string,
  status: ReservationStatus,
) {
  return db.reservation.update({
    where: { id, tenantId },
    data: { status },
    include: reservationInclude,
  })
}

export async function updateReservation(
  tenantId: string,
  id: string,
  data: Partial<Omit<ReservationCreateInput, 'discountPct' | 'discountReason'>> & { totalPrice?: number },
) {
  return db.reservation.update({
    where: { id, tenantId },
    data,
    include: reservationInclude,
  })
}

export async function createPayment(
  tenantId: string,
  data: { reservationId: string; amount: number; method: any; reference?: string; paidAt?: Date },
) {
  const reservation = await db.reservation.findFirst({
    where: { id: data.reservationId, tenantId },
  })
  if (!reservation) return null
  return db.reservationPayment.create({ data: { ...data, paidAt: data.paidAt ?? new Date() } })
}

export async function getTodayArrivals(tenantId: string) {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const tomorrow = new Date(today)
  tomorrow.setDate(tomorrow.getDate() + 1)

  return db.reservation.findMany({
    where: {
      tenantId,
      checkIn: { gte: today, lt: tomorrow },
      status: { in: ['WAITING', 'CONFIRMED'] },
    },
    include: { guest: true, room: { include: { roomType: true } } },
    orderBy: { checkIn: 'asc' },
  })
}

export async function getTodayDepartures(tenantId: string) {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const tomorrow = new Date(today)
  tomorrow.setDate(tomorrow.getDate() + 1)

  return db.reservation.findMany({
    where: {
      tenantId,
      checkOut: { gte: today, lt: tomorrow },
      status: 'CHECKEDIN',
    },
    include: { guest: true, room: { include: { roomType: true } } },
    orderBy: { checkOut: 'asc' },
  })
}

export async function getOccupancySummary(tenantId: string) {
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const [totalRooms, occupiedRooms, roomsByStatus] = await db.$transaction([
    db.room.count({ where: { tenantId } }),
    db.reservation.count({
      where: { tenantId, status: 'CHECKEDIN', checkIn: { lte: today }, checkOut: { gte: today } },
    }),
    db.room.groupBy({ by: ['status'], where: { tenantId }, _count: true, orderBy: { status: 'asc' } }),
  ])

  return { totalRooms, occupiedRooms, roomsByStatus }
}
