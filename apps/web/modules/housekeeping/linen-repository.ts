import dayjs from 'dayjs'
import { db } from '@/lib/db'
import type { LinenLogInput } from './linen-types'

export function listLinen(tenantId: string, days = 30) {
  const since = dayjs().subtract(days, 'day').startOf('day').toDate()
  return db.linenTracking.findMany({
    where: { tenantId, date: { gte: since } },
    include: { room: { select: { number: true, floor: true } } },
    orderBy: [{ date: 'desc' }, { room: { number: 'asc' } }],
  })
}

export function logLinen(tenantId: string, data: LinenLogInput) {
  return db.linenTracking.create({ data: { ...data, tenantId } })
}

export async function getLinenStats(tenantId: string) {
  const rows = await db.linenTracking.aggregate({
    where: { tenantId },
    _sum: { sentCount: true, returnedCount: true },
  })
  const sent     = rows._sum.sentCount ?? 0
  const returned = rows._sum.returnedCount ?? 0
  return { sent, returned, outstanding: sent - returned }
}
