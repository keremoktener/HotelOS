import { db } from '@/lib/db'
import type { LafCreateInput, LafUpdateInput } from './types'

export async function listItems(tenantId: string, onlyUnclaimed: boolean) {
  return db.lostAndFound.findMany({
    where: {
      tenantId,
      ...(onlyUnclaimed && { returnedAt: null }),
    },
    include: {
      room: { select: { number: true } },
      guest: { select: { firstName: true, lastName: true } },
    },
    orderBy: { foundAt: 'desc' },
  })
}

export async function createItem(tenantId: string, data: LafCreateInput) {
  return db.lostAndFound.create({ data: { ...data, tenantId } })
}

export async function updateItem(tenantId: string, id: string, data: LafUpdateInput) {
  return db.lostAndFound.update({ where: { id, tenantId }, data })
}

export async function getStats(tenantId: string) {
  const [total, unclaimed] = await Promise.all([
    db.lostAndFound.count({ where: { tenantId } }),
    db.lostAndFound.count({ where: { tenantId, returnedAt: null } }),
  ])
  return { total, unclaimed, returned: total - unclaimed }
}
