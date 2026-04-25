export const dynamic = 'force-dynamic'

import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { getTenantId } from '@/lib/auth'
import { db } from '@/lib/db'
import { PageHeader } from '@/components/layout/page-header'
import { RoomsClient } from './_components/rooms-client'

export default async function RoomsPage() {
  const { userId, orgId } = await auth()
  if (!userId) redirect('/sign-in')
  if (!orgId) redirect('/onboarding')
  const tenantId = await getTenantId(orgId)
  if (!tenantId) redirect('/onboarding')

  const [rooms, roomTypes] = await Promise.all([db.room.findMany({
    where: { tenantId },
    include: {
      roomType: true,
      reservations: {
        where: { status: { in: ['CHECKEDIN', 'CONFIRMED', 'WAITING'] } },
        include: { guest: true },
        take: 1,
        orderBy: { checkIn: 'asc' },
      },
    },
    orderBy: [{ floor: 'asc' }, { number: 'asc' }],
  }),
  db.roomType.findMany({ where: { tenantId }, orderBy: { name: 'asc' } })])

  const plain = rooms.map(r => ({
    id: r.id, number: r.number, floor: r.floor, status: r.status,
    faultNote: r.faultDetail ?? null,
    typeId: r.typeId,
    roomType: { name: r.roomType.name, capacity: r.roomType.capacity, basePrice: r.roomType.basePrice },
    currentGuest: r.reservations[0]
      ? { firstName: r.reservations[0].guest.firstName, lastName: r.reservations[0].guest.lastName, checkOut: r.reservations[0].checkOut.toISOString() }
      : null,
  }))

  const countBy = plain.reduce<Record<string, number>>((acc, r) => {
    acc[r.status] = (acc[r.status] ?? 0) + 1
    return acc
  }, {})

  return (
    <>
      <PageHeader title="Odalar" breadcrumb={`${rooms.length} oda · ${new Set(rooms.map(r => r.floor)).size} kat`}/>
      <RoomsClient rooms={plain} countBy={countBy} roomTypes={roomTypes.map(t => ({ id: t.id, name: t.name }))}/>
    </>
  )
}
