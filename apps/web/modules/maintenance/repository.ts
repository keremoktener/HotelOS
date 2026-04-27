import { db } from '@/lib/db'
import type { FaultCreateInput, FaultFilters, FaultUpdateInput } from './types'

export async function listFaults(tenantId: string, filters: FaultFilters) {
  return db.faultReport.findMany({
    where: {
      tenantId,
      ...(filters.status && { status: filters.status }),
      ...(filters.priority && { priority: filters.priority }),
    },
    orderBy: [
      { priority: 'asc' },
      { createdAt: 'desc' },
    ],
  })
}

export async function getFault(tenantId: string, id: string) {
  return db.faultReport.findFirst({ where: { id, tenantId } })
}

export async function createFault(tenantId: string, data: FaultCreateInput) {
  return db.faultReport.create({ data: { ...data, tenantId } })
}

export async function updateFault(tenantId: string, id: string, data: FaultUpdateInput) {
  const patch: Record<string, unknown> = { ...data }
  if (data.status === 'DONE' || data.status === 'CANNOT_FIX') patch.resolvedAt = new Date()
  return db.faultReport.update({ where: { id, tenantId }, data: patch })
}

export async function getStats(tenantId: string) {
  const rows = await db.faultReport.groupBy({
    by: ['status'],
    where: { tenantId },
    _count: true,
  })
  const counts: Record<string, number> = { OPEN: 0, IN_PROGRESS: 0, DONE: 0, CANNOT_FIX: 0 }
  for (const r of rows) counts[r.status] = r._count
  return counts
}
