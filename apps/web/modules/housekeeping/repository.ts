import { db } from '@/lib/db'
import type { HKTaskCreateInput, HKTaskFilters, HKTaskUpdateInput } from './types'

const taskInclude = {
  room: { include: { roomType: true } },
} as const

function todayRange() {
  const from = new Date(); from.setHours(0, 0, 0, 0)
  const to = new Date(from); to.setDate(to.getDate() + 1)
  return { from, to }
}

export async function listTasks(tenantId: string, filters: HKTaskFilters) {
  const { from, to } = todayRange()
  return db.hKTask.findMany({
    where: {
      tenantId,
      ...(filters.status && { status: filters.status }),
      ...(filters.type && { type: filters.type }),
      createdAt: { gte: from, lt: to },
    },
    include: taskInclude,
    orderBy: [{ status: 'asc' }, { createdAt: 'asc' }],
  })
}

export async function createTask(tenantId: string, data: HKTaskCreateInput) {
  return db.hKTask.create({ data: { ...data, tenantId }, include: taskInclude })
}

export async function updateTask(tenantId: string, id: string, data: HKTaskUpdateInput) {
  const patch: Record<string, unknown> = { ...data }
  if (data.status === 'IN_PROGRESS') patch.startedAt = new Date()
  if (data.status === 'DONE') patch.completedAt = new Date()
  return db.hKTask.update({ where: { id, tenantId }, data: patch, include: taskInclude })
}

export async function getStats(tenantId: string) {
  const { from, to } = todayRange()
  const rows = await db.hKTask.groupBy({
    by: ['status'],
    where: { tenantId, createdAt: { gte: from, lt: to } },
    _count: true,
  })
  const counts: Record<string, number> = { PENDING: 0, IN_PROGRESS: 0, DONE: 0 }
  for (const r of rows) counts[r.status] = r._count
  return counts
}
