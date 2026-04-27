import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { getTenantId } from '@/lib/auth'
import { db } from '@/lib/db'
import { PageHeader } from '@/components/layout/page-header'
import { KbsClient } from './_components/kbs-client'
import dayjs from 'dayjs'

export const dynamic = 'force-dynamic'

export default async function KbsQueuePage() {
  const { userId, orgId } = await auth()
  if (!userId) redirect('/sign-in')
  if (!orgId) redirect('/onboarding')
  const tenantId = await getTenantId(orgId)
  if (!tenantId) redirect('/onboarding')

  const since = dayjs().subtract(30, 'day').toDate()

  const reservations = await db.reservation.findMany({
    where: {
      tenantId,
      checkIn: { gte: since },
      status: { in: ['CHECKEDIN', 'CHECKEDOUT'] },
    },
    include: { guest: true, room: true },
    orderBy: { checkIn: 'desc' },
    take: 200,
  })

  const items = reservations.map(r => ({
    id: r.id,
    guestName: `${r.guest.firstName} ${r.guest.lastName}`,
    roomNumber: r.room?.number ?? '—',
    checkIn: r.checkIn.toISOString(),
    status: r.kbsNotificationStatus ?? 'NOT_SENT',
    code: r.kbsNotificationCode ?? null,
    reservationStatus: r.status,
  }))

  const counts = {
    pending:   items.filter(i => i.status === 'PENDING').length,
    submitted: items.filter(i => i.status === 'SUBMITTED').length,
    failed:    items.filter(i => i.status === 'FAILED').length,
    notSent:   items.filter(i => i.status === 'NOT_SENT').length,
  }

  return (
    <>
      <PageHeader title="KBS / Jandarma" subtitle="5 dakika gecikmeli otomatik bildirim"/>
      <KbsClient items={items} counts={counts}/>
    </>
  )
}
