import { auth } from '@clerk/nextjs/server'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { getTenantId } from '@/lib/auth'
import { db } from '@/lib/db'
import { PageHeader } from '@/components/layout/page-header'
import { FolioClient } from './_components/folio-client'
import * as repo from '@/modules/folio/repository'

export const dynamic = 'force-dynamic'

export default async function FolioPage({ params }: { params: { id: string } }) {
  const { userId, orgId } = await auth()
  if (!userId) redirect('/sign-in')
  if (!orgId) redirect('/onboarding')
  const tenantId = await getTenantId(orgId)
  if (!tenantId) redirect('/onboarding')

  const reservation = await db.reservation.findFirst({
    where: { id: params.id, tenantId },
    include: { guest: true, room: { include: { roomType: true } } },
  })
  if (!reservation) notFound()

  const [lines, payments, summary] = await Promise.all([
    repo.listLines(tenantId, params.id),
    repo.listPayments(params.id),
    repo.getFolioSummary(tenantId, params.id),
  ])

  const nights = Math.round((reservation.checkOut.getTime() - reservation.checkIn.getTime()) / 86_400_000)

  return (
    <>
      <PageHeader
        title="Folio"
        breadcrumb={
          <Link href={`/reservation/${params.id}`} style={{ color: 'var(--text-3)', textDecoration: 'none', fontSize: 12 }}>
            ← Rezervasyon #{params.id.slice(0, 8).toUpperCase()}
          </Link>
        }
        subtitle={`${reservation.guest.firstName} ${reservation.guest.lastName} · Oda ${reservation.room?.number ?? '—'} · ${nights} gece`}
      />
      <FolioClient
        reservationId={params.id}
        summary={{ totalCharges: summary.totalCharges, totalPaid: summary.totalPaid, balance: summary.balance }}
        lines={lines.map(l => ({
          id: l.id,
          description: l.description,
          source: l.source,
          amountKurus: l.amountKurus,
          lineDate: l.lineDate.toISOString().slice(0, 10),
        }))}
        payments={payments.map(p => ({
          id: p.id,
          method: p.method,
          amount: p.amount,
          paidAt: p.paidAt.toISOString().slice(0, 10),
          reference: p.reference ?? null,
        }))}
      />
    </>
  )
}
