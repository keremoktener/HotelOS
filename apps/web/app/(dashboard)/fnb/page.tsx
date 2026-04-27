import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { getTenantId } from '@/lib/auth'
import { db } from '@/lib/db'
import { PageHeader } from '@/components/layout/page-header'
import { FnbClient } from './_components/fnb-client'
import * as repo from '@/modules/fnb/repository'

export const dynamic = 'force-dynamic'

export default async function FnbPage() {
  const { userId, orgId } = await auth()
  if (!userId) redirect('/sign-in')
  if (!orgId) redirect('/onboarding')
  const tenantId = await getTenantId(orgId)
  if (!tenantId) redirect('/onboarding')

  const [categories, stats, checkedIn] = await Promise.all([
    repo.listCategories(tenantId),
    repo.getMenuStats(tenantId),
    db.reservation.findMany({
      where: { tenantId, status: 'CHECKEDIN' },
      include: { guest: true, room: true },
      orderBy: [{ room: { number: 'asc' } }],
    }),
  ])

  const plain = (categories as Array<{
    id: string; name: string; sortOrder: number
    items: Array<{ id: string; name: string; description: string | null; priceKurus: number; allergens: string[]; isAvailable: boolean }>
  }>).map(c => ({
    id: c.id,
    name: c.name,
    sortOrder: c.sortOrder,
    items: c.items.map(i => ({
      id: i.id,
      name: i.name,
      description: i.description ?? null,
      priceKurus: i.priceKurus,
      allergens: i.allergens,
      isAvailable: i.isAvailable,
    })),
  }))

  const reservations = checkedIn.map(r => ({
    id: r.id,
    guestName: `${r.guest.firstName} ${r.guest.lastName}`,
    roomNumber: r.room?.number ?? '—',
  }))

  return (
    <>
      <PageHeader
        title="Yiyecek & İçecek"
        right={
          <Link href="/fnb/nametags" style={{ fontSize: 12, color: 'var(--text-2)', textDecoration: 'none', padding: '5px 10px', border: '1px solid var(--border-c)', borderRadius: 6, background: 'var(--surface-2)' }}>
            İsim Kartları
          </Link>
        }
      />
      <FnbClient categories={plain} stats={stats} reservations={reservations}/>
    </>
  )
}
