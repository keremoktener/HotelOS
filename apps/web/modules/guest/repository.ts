import { db } from '@/lib/db'
import type { GuestCreateInput, GuestUpdateInput } from './types'

export async function searchGuests(tenantId: string, query: string) {
  return db.guest.findMany({
    where: {
      tenantId,
      OR: [
        { firstName: { contains: query, mode: 'insensitive' } },
        { lastName: { contains: query, mode: 'insensitive' } },
        { tcId: { contains: query } },
        { passportNo: { contains: query, mode: 'insensitive' } },
        { phone: { contains: query } },
        { email: { contains: query, mode: 'insensitive' } },
      ],
    },
    take: 20,
    orderBy: { lastName: 'asc' },
  })
}

export async function getGuestById(tenantId: string, id: string) {
  return db.guest.findFirst({
    where: { id, tenantId },
    include: {
      reservations: {
        orderBy: { checkIn: 'desc' },
        include: { room: { include: { type: true } }, payments: true },
      },
    },
  })
}

export async function createGuest(tenantId: string, data: GuestCreateInput) {
  return db.guest.create({ data: { ...data, tenantId } })
}

export async function updateGuest(tenantId: string, id: string, data: GuestUpdateInput) {
  return db.guest.update({ where: { id, tenantId }, data })
}

export async function getGuestByTcId(tenantId: string, tcId: string) {
  return db.guest.findFirst({ where: { tenantId, tcId } })
}

export async function getGuestByPassport(tenantId: string, passportNo: string) {
  return db.guest.findFirst({ where: { tenantId, passportNo } })
}

export async function setGuestBlacklist(
  tenantId: string,
  id: string,
  blacklisted: boolean,
  reason?: string,
) {
  return db.guest.update({
    where: { id, tenantId },
    data: { blacklisted, blacklistReason: blacklisted ? reason : null },
  })
}
