import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { getTenantId } from '@/lib/auth'
import { PageHeader } from '@/components/layout/page-header'
import { db } from '@/lib/db'
import { NametagsClient } from './_components/nametags-client'

export const dynamic = 'force-dynamic'

export default async function NametagsPage() {
  const { userId, orgId } = await auth()
  if (!userId) redirect('/sign-in')
  if (!orgId) redirect('/onboarding')
  const tenantId = await getTenantId(orgId)
  if (!tenantId) redirect('/onboarding')

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const reservations = await db.reservation.findMany({
    where: { tenantId, status: 'CHECKEDIN' },
    include: {
      guest: true,
      room: { include: { roomType: true } },
    },
    orderBy: { room: { number: 'asc' } },
  })

  const guests = reservations.map(r => ({
    reservationId: r.id,
    guestName: `${r.guest.firstName} ${r.guest.lastName}`,
    roomNumber: r.room?.number ?? '—',
    roomType: r.room?.roomType?.name ?? '',
    checkIn: r.checkIn.toISOString().slice(0, 10),
    checkOut: r.checkOut.toISOString().slice(0, 10),
  }))

  return (
    <>
      <PageHeader title="İsim Kartları" />
      <NametagsClient guests={guests} />
    </>
  )
}
