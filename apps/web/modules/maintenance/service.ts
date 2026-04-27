import { TRPCError } from '@trpc/server'
import * as repo from './repository'
import type { FaultCreateInput, FaultFilters, FaultUpdateInput } from './types'

export async function listFaults(tenantId: string, filters: FaultFilters) {
  return repo.listFaults(tenantId, filters)
}

export async function getFault(tenantId: string, id: string) {
  const fault = await repo.getFault(tenantId, id)
  if (!fault) throw new TRPCError({ code: 'NOT_FOUND', message: 'Fault report not found' })
  return fault
}

export async function createFault(tenantId: string, data: FaultCreateInput) {
  return repo.createFault(tenantId, data)
}

export async function updateFault(tenantId: string, id: string, data: FaultUpdateInput) {
  await getFault(tenantId, id)
  if (data.status === 'CANNOT_FIX' && !data.cannotFixReason?.trim()) {
    throw new TRPCError({ code: 'BAD_REQUEST', message: 'Çözülemez durumu için neden zorunludur' })
  }
  return repo.updateFault(tenantId, id, data)
}

export async function getStats(tenantId: string) {
  return repo.getStats(tenantId)
}
