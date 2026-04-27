import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import dayjs from 'dayjs'
import { getTenantId } from '@/lib/auth'
import { db } from '@/lib/db'
import { PageHeader } from '@/components/layout/page-header'
import { HkReportClient } from './_components/hk-report-client'

export const dynamic = 'force-dynamic'

interface Props {
  searchParams: { date?: string }
}

export default async function HkReportPage({ searchParams }: Props) {
  const { userId, orgId } = await auth()
  if (!userId) redirect('/sign-in')
  if (!orgId) redirect('/onboarding')
  const tenantId = await getTenantId(orgId)
  if (!tenantId) redirect('/onboarding')

  // Default to yesterday; allow ?date=YYYY-MM-DD override
  const targetDate = searchParams.date
    ? dayjs(searchParams.date)
    : dayjs().subtract(1, 'day')

  const from = targetDate.startOf('day').toDate()
  const to   = targetDate.endOf('day').toDate()

  const [tasks, caSchedules, lafToday, lafReturned] = await Promise.all([
    db.hKTask.findMany({
      where: { tenantId, createdAt: { gte: from, lte: to } },
      include: { room: { include: { roomType: true } } },
      orderBy: [{ status: 'asc' }, { createdAt: 'asc' }],
    }),
    db.commonAreaSchedule.findMany({
      where: {
        commonArea: { tenantId },
        scheduledDate: { gte: from, lte: to },
      },
      include: { commonArea: true },
      orderBy: { commonArea: { name: 'asc' } },
    }),
    db.lostAndFound.findMany({
      where: { tenantId, foundAt: { gte: from, lte: to } },
      include: { room: { select: { number: true } } },
    }),
    db.lostAndFound.findMany({
      where: { tenantId, returnedAt: { gte: from, lte: to } },
      select: { id: true, description: true },
    }),
  ])

  const completedTasks = tasks.filter(t => t.status === 'DONE')
  const pendingTasks   = tasks.filter(t => t.status !== 'DONE')

  const avgMinutes = completedTasks.length > 0
    ? Math.round(
        completedTasks.reduce((sum, t) => sum + (t.durationMinutes ?? 0), 0) / completedTasks.length,
      )
    : null

  return (
    <>
      <PageHeader
        title={`Kat Hizmetleri Raporu — ${targetDate.format('D MMMM YYYY')}`}
        breadcrumb={<Link href="/housekeeping" style={{ color: 'var(--text-3)', textDecoration: 'none' }}>← Kat Hizmetleri</Link>}
      />
      <HkReportClient
        date={targetDate.format('YYYY-MM-DD')}
        summary={{
          totalTasks: tasks.length,
          completedTasks: completedTasks.length,
          pendingTasks: pendingTasks.length,
          avgMinutes,
          caTotal: caSchedules.length,
          caCompleted: caSchedules.filter(s => s.completedAt).length,
          lafLogged: lafToday.length,
          lafReturned: lafReturned.length,
        }}
        tasks={tasks.map(t => ({
          id: t.id, status: t.status, type: t.type,
          notes: t.notes ?? '',
          completedAt: t.completedAt?.toISOString() ?? null,
          durationMinutes: t.durationMinutes ?? null,
          room: t.room
            ? { number: t.room.number, floor: t.room.floor, typeName: t.room.roomType.name }
            : null,
        }))}
        caSchedules={caSchedules.map(s => ({
          id: s.id,
          areaName: s.commonArea.name,
          completedAt: s.completedAt?.toISOString() ?? null,
        }))}
        lafItems={lafToday.map(i => ({
          id: i.id,
          description: i.description,
          foundBy: i.foundBy,
          roomNumber: i.room?.number ?? null,
        }))}
      />
    </>
  )
}
