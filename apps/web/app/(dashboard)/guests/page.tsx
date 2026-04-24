import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { getTenantId } from '@/lib/auth'
import { db } from '@/lib/db'
import { PageHeader } from '@/components/layout/page-header'
import { GuestsClient } from './_components/guests-client'

export const dynamic = 'force-dynamic'

export default async function GuestsPage() {
  const { userId, orgId } = await auth()
  if (!userId) redirect('/sign-in')
  if (!orgId) redirect('/onboarding')
  const tenantId = await getTenantId(orgId)
  if (!tenantId) redirect('/onboarding')

  const guests = await db.guest.findMany({
    where: { tenantId },
    include: {
      reservations: {
        where: { status: 'CHECKEDOUT' },
        include: { payments: true },
        orderBy: { checkOut: 'desc' },
      },
    },
    orderBy: [{ lastName: 'asc' }, { firstName: 'asc' }],
  })

  const plain = guests.map(g => {
    const totalRevenue = g.reservations.flatMap(r => r.payments).reduce((sum, p) => sum + p.amount, 0)
    const lastStay = g.reservations[0]?.checkOut ?? null
    return {
      id: g.id,
      firstName: g.firstName,
      lastName: g.lastName,
      phone: g.phone ?? '',
      email: g.email ?? '',
      nationality: g.nationality ?? 'TR',
      blacklisted: g.blacklisted,
      totalStays: g.reservations.length,
      totalRevenue,
      lastStay: lastStay ? lastStay.toISOString() : null,
    }
  })

  return (
    <>
      <PageHeader title="Misafirler" breadcrumb={`${guests.length} kayıt`}/>
      <GuestsClient guests={plain}/>
    </>
  )
}
