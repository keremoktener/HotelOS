import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { getTenantId } from '@/lib/auth'
import { db } from '@/lib/db'
import { PageHeader } from '@/components/layout/page-header'
import { HKClient } from './_components/hk-client'
import * as service from '@/modules/housekeeping/service'

export const dynamic = 'force-dynamic'

export default async function HousekeepingPage() {
  const { userId, orgId } = await auth()
  if (!userId) redirect('/sign-in')
  if (!orgId) redirect('/onboarding')
  const tenantId = await getTenantId(orgId)
  if (!tenantId) redirect('/onboarding')

  const [tasks, stats, rooms] = await Promise.all([
    service.listTasks(tenantId, {}),
    service.getStats(tenantId),
    db.room.findMany({
      where: { tenantId },
      include: { roomType: true },
      orderBy: [{ floor: 'asc' }, { number: 'asc' }],
    }),
  ])

  const plainTasks = tasks.map(t => ({
    id: t.id, status: t.status, type: t.type,
    notes: t.notes ?? '',
    assignedUserId: t.assignedUserId ?? null,
    createdAt: t.createdAt.toISOString(),
    startedAt: t.startedAt?.toISOString() ?? null,
    completedAt: t.completedAt?.toISOString() ?? null,
    durationMinutes: t.durationMinutes ?? null,
    room: t.room ? {
      id: t.room.id, number: t.room.number, floor: t.room.floor,
      typeName: t.room.roomType.name,
    } : null,
  }))

  const plainRooms = rooms.map(r => ({
    id: r.id, number: r.number, floor: r.floor,
    typeName: r.roomType.name, status: r.status,
  }))

  return (
    <>
      <PageHeader title="Kat Hizmetleri"/>
      <HKClient tasks={plainTasks} stats={stats} rooms={plainRooms}/>
    </>
  )
}
