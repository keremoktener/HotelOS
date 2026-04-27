import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { getTenantId } from '@/lib/auth'
import { PageHeader } from '@/components/layout/page-header'
import { MaintenanceClient } from './_components/maintenance-client'
import * as service from '@/modules/maintenance/service'

export const dynamic = 'force-dynamic'

export default async function MaintenancePage() {
  const { userId, orgId } = await auth()
  if (!userId) redirect('/sign-in')
  if (!orgId) redirect('/onboarding')
  const tenantId = await getTenantId(orgId)
  if (!tenantId) redirect('/onboarding')

  const [faults, stats] = await Promise.all([
    service.listFaults(tenantId, {}),
    service.getStats(tenantId),
  ])

  const plainFaults = faults.map(f => ({
    id: f.id, location: f.location, description: f.description,
    priority: f.priority, status: f.status,
    reportedBy: f.reportedBy, assignedTo: f.assignedTo ?? null,
    cannotFixReason: f.cannotFixReason ?? null,
    resolvedAt: f.resolvedAt?.toISOString() ?? null,
    createdAt: f.createdAt.toISOString(),
  }))

  return (
    <>
      <PageHeader title="Teknik Servis"/>
      <MaintenanceClient faults={plainFaults} stats={stats}/>
    </>
  )
}
