import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { getTenantId } from '@/lib/auth'
import { PageHeader } from '@/components/layout/page-header'
import { LafClient } from './_components/laf-client'
import * as service from '@/modules/lost-found/service'

export const dynamic = 'force-dynamic'

export default async function LostFoundPage() {
  const { userId, orgId } = await auth()
  if (!userId) redirect('/sign-in')
  if (!orgId) redirect('/onboarding')
  const tenantId = await getTenantId(orgId)
  if (!tenantId) redirect('/onboarding')

  const [items, stats, rooms] = await Promise.all([
    service.listItems(tenantId, false),
    service.getStats(tenantId),
    import('@/lib/db').then(({ db }) =>
      db.room.findMany({
        where: { tenantId },
        select: { id: true, number: true },
        orderBy: { number: 'asc' },
      })
    ),
  ])

  const plain = items.map(i => ({
    id: i.id,
    description: i.description,
    foundBy: i.foundBy,
    foundAt: i.foundAt.toISOString(),
    returnedAt: i.returnedAt?.toISOString() ?? null,
    roomNumber: i.room?.number ?? null,
    guestName: i.guest ? `${i.guest.firstName} ${i.guest.lastName}` : null,
  }))

  return (
    <>
      <PageHeader title="Kayıp & Bulunan"/>
      <LafClient items={plain} stats={stats} rooms={rooms}/>
    </>
  )
}
