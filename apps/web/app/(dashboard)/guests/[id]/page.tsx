import { auth } from '@clerk/nextjs/server'
import { redirect, notFound } from 'next/navigation'
import { getTenantId } from '@/lib/auth'
import { db } from '@/lib/db'
import { PageHeader } from '@/components/layout/page-header'
import { GuestProfileClient } from './_components/guest-profile-client'
import Link from 'next/link'

export default async function GuestProfilePage({ params }: { params: { id: string } }) {
  const { userId, orgId } = await auth()
  if (!userId) redirect('/sign-in')
  if (!orgId) redirect('/onboarding')
  const tenantId = await getTenantId(orgId)
  if (!tenantId) redirect('/onboarding')

  const guest = await db.guest.findFirst({
    where: { id: params.id, tenantId },
    include: {
      reservations: {
        include: { room: { include: { roomType: true } }, payments: true },
        orderBy: { checkIn: 'desc' },
      },
    },
  })

  if (!guest) notFound()

  const totalRevenue = guest.reservations.flatMap(r => r.payments).reduce((sum, p) => sum + p.amount, 0)
  const activeRes = guest.reservations.find(r => r.status === 'CHECKEDIN' || r.status === 'CONFIRMED')

  const plain = {
    id: guest.id,
    firstName: guest.firstName, lastName: guest.lastName,
    phone: guest.phone ?? '', email: guest.email ?? '',
    nationality: guest.nationality ?? 'TR',
    tcId: guest.tcId ? '•••••••' + guest.tcId.slice(-4) : null,
    passportNo: guest.passportNo ?? null,
    blacklisted: guest.blacklisted, blacklistReason: guest.blacklistReason ?? null,
    totalStays: guest.reservations.filter(r => r.status === 'CHECKEDOUT').length,
    totalRevenue,
    activeReservation: activeRes ? {
      id: activeRes.id, status: activeRes.status,
      checkIn: activeRes.checkIn.toISOString(), checkOut: activeRes.checkOut.toISOString(),
      totalPrice: activeRes.totalPrice,
      room: activeRes.room ? { number: activeRes.room.number, typeName: activeRes.room.roomType.name } : null,
    } : null,
    history: guest.reservations.slice(0, 10).map(r => ({
      id: r.id, status: r.status,
      checkIn: r.checkIn.toISOString(), checkOut: r.checkOut.toISOString(),
      totalPrice: r.totalPrice,
      room: r.room ? { number: r.room.number, typeName: r.room.roomType.name } : null,
    })),
  }

  const breadcrumb = (
    <><Link href="/guests" style={{ color: 'var(--text-3)', textDecoration: 'none' }}>Misafirler</Link> · {guest.firstName} {guest.lastName}</>
  )

  return (
    <>
      <PageHeader title={`${guest.firstName} ${guest.lastName}`} breadcrumb={breadcrumb}/>
      <GuestProfileClient guest={plain} totalRevenue={totalRevenue}/>
    </>
  )
}
