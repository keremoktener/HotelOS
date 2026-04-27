import dayjs from 'dayjs'
import { db } from '@/lib/db'
import type { CommonAreaCreateInput, CommonAreaUpdateInput } from './common-area-types'

export function listCommonAreas(tenantId: string) {
  return db.commonArea.findMany({
    where: { tenantId },
    include: {
      schedules: {
        orderBy: { scheduledDate: 'desc' },
        take: 5,
      },
    },
    orderBy: { name: 'asc' },
  })
}

export function createCommonArea(tenantId: string, data: CommonAreaCreateInput) {
  return db.commonArea.create({ data: { ...data, tenantId } })
}

export function updateCommonArea(tenantId: string, id: string, data: CommonAreaUpdateInput) {
  return db.commonArea.update({ where: { id, tenantId }, data })
}

export function deleteCommonArea(tenantId: string, id: string) {
  return db.commonArea.delete({ where: { id, tenantId } })
}

export function completeSchedule(id: string) {
  return db.commonAreaSchedule.update({ where: { id }, data: { completedAt: new Date() } })
}

// Called by daily cron worker — idempotent per area per day
export async function createDueSchedules(tenantId: string): Promise<number> {
  const today = dayjs().startOf('day').toDate()
  const todayEnd = dayjs().endOf('day').toDate()

  const areas = await db.commonArea.findMany({ where: { tenantId } })
  let created = 0

  for (const area of areas) {
    // Skip if already scheduled today
    const existing = await db.commonAreaSchedule.findFirst({
      where: { commonAreaId: area.id, scheduledDate: { gte: today, lte: todayEnd } },
    })
    if (existing) continue

    // Check last schedule date to respect frequency
    const last = await db.commonAreaSchedule.findFirst({
      where: { commonAreaId: area.id },
      orderBy: { scheduledDate: 'desc' },
    })

    const daysSinceLast = last
      ? dayjs(today).diff(dayjs(last.scheduledDate).startOf('day'), 'day')
      : area.cleaningFrequencyDays // no history → always due

    if (daysSinceLast >= area.cleaningFrequencyDays) {
      await db.commonAreaSchedule.create({
        data: { commonAreaId: area.id, scheduledDate: today },
      })
      created++
    }
  }

  return created
}
