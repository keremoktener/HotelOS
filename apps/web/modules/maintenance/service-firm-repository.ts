import { db } from '@/lib/db'
import type { FirmCreateInput, FirmUpdateInput, VisitCreateInput } from './service-firm-types'

export function listFirms(tenantId: string) {
  return db.externalServiceFirm.findMany({
    where: { tenantId },
    include: {
      serviceVisits: {
        orderBy: { visitDate: 'desc' },
        take: 1,
      },
      _count: { select: { serviceVisits: true } },
    },
    orderBy: { name: 'asc' },
  })
}

export function createFirm(tenantId: string, data: FirmCreateInput) {
  return db.externalServiceFirm.create({ data: { ...data, tenantId } })
}

export function updateFirm(tenantId: string, id: string, data: FirmUpdateInput) {
  return db.externalServiceFirm.update({ where: { id, tenantId }, data })
}

export function deleteFirm(tenantId: string, id: string) {
  return db.externalServiceFirm.delete({ where: { id, tenantId } })
}

export function listVisits(tenantId: string, firmId?: string) {
  return db.serviceVisit.findMany({
    where: { tenantId, ...(firmId && { firmId }) },
    include: { firm: { select: { name: true } } },
    orderBy: { visitDate: 'desc' },
  })
}

export function createVisit(tenantId: string, data: VisitCreateInput) {
  return db.serviceVisit.create({ data: { ...data, tenantId } })
}
