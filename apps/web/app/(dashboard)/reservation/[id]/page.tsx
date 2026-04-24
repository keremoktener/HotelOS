import { auth } from '@clerk/nextjs/server'
import { redirect, notFound } from 'next/navigation'
import { getTenantId } from '@/lib/auth'
import { db } from '@/lib/db'
import { PageHeader } from '@/components/layout/page-header'
import { ReservationDetailClient } from './_components/reservation-detail-client'
import Link from 'next/link'

export default async function ReservationDetailPage({ params }: { params: { id: string } }) {
  const { userId, orgId } = await auth()
  if (!userId) redirect('/sign-in')
  if (!orgId) redirect('/onboarding')
  const tenantId = await getTenantId(orgId)
  if (!tenantId) redirect('/onboarding')

  const [reservation, allRooms] = await Promise.all([
    db.reservation.findFirst({
      where: { id: params.id, tenantId },
      include: {
        guest: true,
        room: { include: { roomType: true } },
        payments: { orderBy: { createdAt: 'desc' } },
      },
    }),
    db.room.findMany({
      where: { tenantId },
      include: { roomType: true },
      orderBy: [{ floor: 'asc' }, { number: 'asc' }],
    }),
  ])

  if (!reservation) notFound()

  const rooms = allRooms.map(r => ({
    id: r.id, number: r.number, floor: r.floor, status: r.status,
    roomTypeName: r.roomType.name,
  }))

  const plain = {
    id: reservation.id, status: reservation.status,
    totalPrice: reservation.totalPrice,
    paidAmount: reservation.payments.reduce((sum, p) => sum + p.amount, 0),
    checkIn: reservation.checkIn.toISOString(), checkOut: reservation.checkOut.toISOString(),
    adults: reservation.adults, children: reservation.children ?? 0,
    notes: reservation.notes ?? '',
    specialRequests: reservation.specialRequests ?? '',
    guest: {
      id: reservation.guest.id, firstName: reservation.guest.firstName, lastName: reservation.guest.lastName,
      phone: reservation.guest.phone ?? '', email: reservation.guest.email ?? '',
      nationality: reservation.guest.nationality ?? 'TR',
      tcId: reservation.guest.tcId ? '•••••••' + reservation.guest.tcId.slice(-4) : null,
      passportNo: reservation.guest.passportNo ?? null,
    },
    room: reservation.room ? {
      id: reservation.room.id, number: reservation.room.number, floor: reservation.room.floor,
      status: reservation.room.status, faultNote: reservation.room.faultDetail ?? null,
      roomType: { name: reservation.room.roomType.name, capacity: reservation.room.roomType.capacity },
    } : null,
    payments: reservation.payments.map(p => ({
      id: p.id, amount: p.amount, method: p.method, reference: p.reference ?? '',
      createdAt: p.createdAt.toISOString(),
    })),
  }

  const breadcrumb = (
    <><Link href="/reservation" style={{ color: 'var(--text-3)', textDecoration: 'none' }}>Rezervasyonlar</Link> · {reservation.id.slice(0, 8)}</>
  )

  return (
    <>
      <PageHeader title={`${reservation.guest.firstName} ${reservation.guest.lastName}`} breadcrumb={breadcrumb}/>
      <ReservationDetailClient reservation={plain} availableRooms={rooms}/>
    </>
  )
}
