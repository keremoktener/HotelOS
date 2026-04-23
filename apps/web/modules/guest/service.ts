import { TRPCError } from '@trpc/server'
import * as repo from './repository'
import type { GuestCreateInput, GuestUpdateInput } from './types'

export async function searchGuests(tenantId: string, query: string) {
  return repo.searchGuests(tenantId, query)
}

export async function getGuest(tenantId: string, id: string) {
  const guest = await repo.getGuestById(tenantId, id)
  if (!guest) throw new TRPCError({ code: 'NOT_FOUND', message: 'Guest not found' })
  return guest
}

export async function createGuest(tenantId: string, input: GuestCreateInput) {
  return repo.createGuest(tenantId, input)
}

export async function updateGuest(tenantId: string, id: string, input: GuestUpdateInput) {
  await getGuest(tenantId, id)
  return repo.updateGuest(tenantId, id, input)
}

export async function checkBlacklist(
  tenantId: string,
  tcId?: string,
  passportNo?: string,
): Promise<{ blacklisted: boolean; reason?: string }> {
  if (tcId) {
    const guest = await repo.getGuestByTcId(tenantId, tcId)
    if (guest?.blacklisted) return { blacklisted: true, reason: guest.blacklistReason ?? undefined }
  }
  if (passportNo) {
    const guest = await repo.getGuestByPassport(tenantId, passportNo)
    if (guest?.blacklisted) return { blacklisted: true, reason: guest.blacklistReason ?? undefined }
  }
  return { blacklisted: false }
}
