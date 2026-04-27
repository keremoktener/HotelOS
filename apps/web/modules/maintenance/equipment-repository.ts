import { db } from '@/lib/db'
import type { EquipmentCreateInput, EquipmentUpdateInput } from './equipment-types'

export function listEquipment(tenantId: string) {
  return db.equipment.findMany({
    where: { tenantId },
    include: {
      preventiveMaintenance: {
        orderBy: { scheduledDate: 'desc' },
        take: 1,
      },
    },
    orderBy: [{ category: 'asc' }, { name: 'asc' }],
  })
}

export function createEquipment(tenantId: string, data: EquipmentCreateInput) {
  return db.equipment.create({ data: { ...data, tenantId } })
}

export function updateEquipment(tenantId: string, id: string, data: EquipmentUpdateInput) {
  return db.equipment.update({ where: { id, tenantId }, data })
}

export function deleteEquipment(tenantId: string, id: string) {
  return db.equipment.delete({ where: { id, tenantId } })
}

export async function getEquipmentStats(tenantId: string) {
  const now = new Date()
  const [total, warrantyExpiringSoon, serviceOverdue] = await Promise.all([
    db.equipment.count({ where: { tenantId } }),
    db.equipment.count({
      where: {
        tenantId,
        warrantyExpiry: { gte: now, lte: new Date(now.getTime() + 30 * 86_400_000) },
      },
    }),
    db.equipment.count({
      where: {
        tenantId,
        nextServiceDate: { lt: now },
      },
    }),
  ])
  return { total, warrantyExpiringSoon, serviceOverdue }
}
