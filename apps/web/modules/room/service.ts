import { TRPCError } from '@trpc/server'
import * as repo from './repository'
import type { RoomCreateInput, RoomTypeCreateInput } from './types'
import type { RoomStatus } from '@prisma/client'

export async function listRooms(tenantId: string, filters = {}) {
  return repo.listRooms(tenantId, filters)
}

export async function getRoom(tenantId: string, id: string) {
  const room = await repo.getRoomById(tenantId, id)
  if (!room) throw new TRPCError({ code: 'NOT_FOUND', message: 'Room not found' })
  return room
}

export async function createRoom(tenantId: string, input: RoomCreateInput) {
  return repo.createRoom(tenantId, input)
}

export async function updateRoomStatus(
  tenantId: string,
  id: string,
  status: RoomStatus,
  faultDetail?: string,
) {
  await getRoom(tenantId, id)
  if (status === 'CANNOT_FIX' as any) {
    throw new TRPCError({ code: 'BAD_REQUEST' })
  }
  return repo.updateRoomStatus(tenantId, id, status, faultDetail)
}

export async function listRoomTypes(tenantId: string) {
  return repo.listRoomTypes(tenantId)
}

export async function createRoomType(tenantId: string, input: RoomTypeCreateInput) {
  return repo.createRoomType(tenantId, input)
}
