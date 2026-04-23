import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { getTenantId } from '@/lib/auth'
import { db } from '@/lib/db'
import { PageHeader } from '@/components/layout/page-header'
import { ReservationListClient } from './_components/reservation-list-client'
import Link from 'next/link'
import type { ReservationStatus } from '@prisma/client'

export default async function ReservationListPage({ searchParams }: { searchParams: { status?: string; page?: string } }) {
  const { userId, orgId } = await auth()
  if (!userId) redirect('/sign-in')
  if (!orgId) redirect('/onboarding')
  const tenantId = await getTenantId(orgId)
  if (!tenantId) redirect('/onboarding')

  const page = Number(searchParams.page ?? 1)
  const pageSize = 20
  const skip = (page - 1) * pageSize
  const status = searchParams.status as ReservationStatus | undefined

  const where = { tenantId, ...(status && { status }) }

  const [reservations, total] = await Promise.all([
    db.reservation.findMany({
      where,
      include: { guest: true, room: { include: { roomType: true } } },
      orderBy: { checkIn: 'desc' },
      skip, take: pageSize,
    }),
    db.reservation.count({ where }),
  ])

  const totalPages = Math.ceil(total / pageSize)

  const plain = reservations.map(r => ({
    id: r.id, status: r.status, totalPrice: r.totalPrice,
    checkIn: r.checkIn.toISOString(), checkOut: r.checkOut.toISOString(),
    adults: r.adults, children: r.children ?? 0,
    guest: { firstName: r.guest.firstName, lastName: r.guest.lastName },
    room: r.room ? { number: r.room.number, typeName: r.room.roomType.name } : null,
  }))

  const right = (
    <Link href="/reservation/new" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '6px 12px', background: 'var(--accent-c)', color: 'var(--accent-fg)', borderRadius: 6, fontSize: 13, fontWeight: 500, textDecoration: 'none' }}>
      + Yeni rezervasyon
    </Link>
  )

  return (
    <>
      <PageHeader title="Rezervasyonlar" breadcrumb={`${total} kayıt`} right={right}/>
      <ReservationListClient reservations={plain} total={total} page={page} totalPages={totalPages} activeStatus={status}/>
    </>
  )
}
