import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { getTenantId } from '@/lib/auth'
import { db } from '@/lib/db'
import { PageHeader } from '@/components/layout/page-header'
import { LinenClient } from './_components/linen-client'
import * as linenRepo from '@/modules/housekeeping/linen-repository'

export const dynamic = 'force-dynamic'

export default async function LinenPage() {
  const { userId, orgId } = await auth()
  if (!userId) redirect('/sign-in')
  if (!orgId) redirect('/onboarding')
  const tenantId = await getTenantId(orgId)
  if (!tenantId) redirect('/onboarding')

  const [entries, stats, rooms] = await Promise.all([
    linenRepo.listLinen(tenantId, 30),
    linenRepo.getLinenStats(tenantId),
    db.room.findMany({
      where: { tenantId },
      select: { id: true, number: true, floor: true },
      orderBy: [{ floor: 'asc' }, { number: 'asc' }],
    }),
  ])

  const plain = entries.map(e => ({
    id: e.id,
    roomNumber: e.room.number,
    roomFloor: e.room.floor,
    sentCount: e.sentCount,
    returnedCount: e.returnedCount,
    date: e.date.toISOString(),
  }))

  return (
    <>
      <PageHeader
        title="Çamaşır Takibi"
        breadcrumb={<Link href="/housekeeping" style={{ color: 'var(--text-3)', textDecoration: 'none' }}>← Kat Hizmetleri</Link>}
      />
      <LinenClient entries={plain} stats={stats} rooms={rooms}/>
    </>
  )
}
