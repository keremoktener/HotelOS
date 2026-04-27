import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { getTenantId } from '@/lib/auth'
import { PageHeader } from '@/components/layout/page-header'
import { ServiceFirmsClient } from './_components/service-firms-client'
import * as firmRepo from '@/modules/maintenance/service-firm-repository'

export const dynamic = 'force-dynamic'

export default async function ServiceFirmsPage() {
  const { userId, orgId } = await auth()
  if (!userId) redirect('/sign-in')
  if (!orgId) redirect('/onboarding')
  const tenantId = await getTenantId(orgId)
  if (!tenantId) redirect('/onboarding')

  const [firms, visits] = await Promise.all([
    firmRepo.listFirms(tenantId),
    firmRepo.listVisits(tenantId),
  ])

  const plainFirms = firms.map(f => ({
    id: f.id,
    name: f.name,
    phone: f.phone,
    specialty: f.specialty ?? null,
    visitCount: f._count.serviceVisits,
    lastVisit: f.serviceVisits[0]?.visitDate.toISOString() ?? null,
  }))

  const plainVisits = visits.map(v => ({
    id: v.id,
    firmId: v.firmId,
    firmName: v.firm.name,
    visitDate: v.visitDate.toISOString(),
    description: v.description,
    invoiceId: v.invoiceId ?? null,
  }))

  return (
    <>
      <PageHeader
        title="Servis Firmaları"
        breadcrumb={<Link href="/maintenance" style={{ color: 'var(--text-3)', textDecoration: 'none' }}>← Teknik Servis</Link>}
      />
      <ServiceFirmsClient firms={plainFirms} visits={plainVisits}/>
    </>
  )
}
