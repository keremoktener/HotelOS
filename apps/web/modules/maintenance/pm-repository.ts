import { db } from '@/lib/db'
import type { PmCreateInput } from './pm-types'

export function listPm(tenantId: string, onlyPending: boolean) {
  return db.preventiveMaintenance.findMany({
    where: {
      equipment: { tenantId },
      ...(onlyPending && { completedAt: null }),
    },
    include: { equipment: { select: { id: true, name: true, category: true } } },
    orderBy: { scheduledDate: 'asc' },
  })
}

export function createPm(data: PmCreateInput) {
  return db.preventiveMaintenance.create({ data })
}

export function completePm(id: string, notes?: string) {
  return db.preventiveMaintenance.update({
    where: { id },
    data: { completedAt: new Date(), notes },
  })
}

export async function getPmStats(tenantId: string) {
  const now = new Date()
  const soon = new Date(now.getTime() + 14 * 86_400_000)
  const [overdue, upcoming, completed] = await Promise.all([
    db.preventiveMaintenance.count({
      where: { equipment: { tenantId }, completedAt: null, scheduledDate: { lt: now } },
    }),
    db.preventiveMaintenance.count({
      where: { equipment: { tenantId }, completedAt: null, scheduledDate: { gte: now, lte: soon } },
    }),
    db.preventiveMaintenance.count({
      where: { equipment: { tenantId }, completedAt: { not: null } },
    }),
  ])
  return { overdue, upcoming, completed }
}
