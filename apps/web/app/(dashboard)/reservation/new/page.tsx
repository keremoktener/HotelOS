import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { getTenantId } from '@/lib/auth'
import { db } from '@/lib/db'
import { PageHeader } from '@/components/layout/page-header'
import { ReservationWizardClient } from './_components/reservation-wizard-client'
import Link from 'next/link'

export default async function NewReservationPage({ searchParams }: { searchParams: { guestId?: string } }) {
  const { userId, orgId } = await auth()
  if (!userId) redirect('/sign-in')
  if (!orgId) redirect('/onboarding')
  const tenantId = await getTenantId(orgId)
  if (!tenantId) redirect('/onboarding')

  const rooms = await db.room.findMany({
    where: { tenantId },
    include: { roomType: true },
    orderBy: [{ floor: 'asc' }, { number: 'asc' }],
  })

  const availableRooms = rooms.map(r => ({
    id: r.id,
    number: r.number,
    floor: r.floor,
    status: r.status,
    roomTypeId: r.typeId,
    roomTypeName: r.roomType.name,
    capacity: r.roomType.capacity,
    basePrice: r.roomType.basePrice,
  }))

  const breadcrumb = (
    <><Link href="/reservation" style={{ color: 'var(--text-3)', textDecoration: 'none' }}>Rezervasyonlar</Link> · Yeni</>
  )

  return (
    <>
      <PageHeader title="Yeni rezervasyon" breadcrumb={breadcrumb}/>
      <ReservationWizardClient availableRooms={availableRooms} initialGuestId={searchParams.guestId}/>
    </>
  )
}
