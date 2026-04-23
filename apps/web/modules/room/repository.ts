import { db } from '@/lib/db'
import type { RoomStatus } from '@prisma/client'

export async function listRooms(
  tenantId: string,
  filters: { status?: RoomStatus; typeId?: string; floor?: number } = {},
) {
  return db.room.findMany({
    where: {
      tenantId,
      ...(filters.status && { status: filters.status }),
      ...(filters.typeId && { typeId: filters.typeId }),
      ...(filters.floor !== undefined && { floor: filters.floor }),
    },
    include: { type: true },
    orderBy: [{ floor: 'asc' }, { number: 'asc' }],
  })
}

export async function getRoomById(tenantId: string, id: string) {
  return db.room.findFirst({ where: { id, tenantId }, include: { type: true } })
}

export async function createRoom(tenantId: string, data: {
  number: string; typeId: string; floor?: number; view?: string; features?: string[]
}) {
  return db.room.create({
    data: { ...data, tenantId, features: data.features ?? [] },
    include: { type: true },
  })
}

export async function updateRoomStatus(
  tenantId: string,
  id: string,
  status: RoomStatus,
  faultDetail?: string,
) {
  return db.room.update({
    where: { id, tenantId },
    data: { status, faultDetail: faultDetail ?? null },
  })
}

export async function listRoomTypes(tenantId: string) {
  return db.roomType.findMany({ where: { tenantId }, orderBy: { name: 'asc' } })
}

export async function createRoomType(tenantId: string, data: {
  name: string; capacity: number; basePrice: number; minPhotosRequired: number
}) {
  return db.roomType.create({ data: { ...data, tenantId } })
}
