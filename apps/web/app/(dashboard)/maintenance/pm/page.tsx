import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { getTenantId } from '@/lib/auth'
import { PageHeader } from '@/components/layout/page-header'
import { PmClient } from './_components/pm-client'
import * as pmRepo from '@/modules/maintenance/pm-repository'
import * as equipmentRepo from '@/modules/maintenance/equipment-repository'

export const dynamic = 'force-dynamic'

export default async function PmPage() {
  const { userId, orgId } = await auth()
  if (!userId) redirect('/sign-in')
  if (!orgId) redirect('/onboarding')
  const tenantId = await getTenantId(orgId)
  if (!tenantId) redirect('/onboarding')

  const [schedules, stats, equipment] = await Promise.all([
    pmRepo.listPm(tenantId, false),
    pmRepo.getPmStats(tenantId),
    equipmentRepo.listEquipment(tenantId),
  ])

  const plainSchedules = schedules.map(s => ({
    id: s.id,
    equipmentId: s.equipmentId,
    equipmentName: s.equipment.name,
    equipmentCategory: s.equipment.category,
    scheduledDate: s.scheduledDate.toISOString(),
    completedAt: s.completedAt?.toISOString() ?? null,
    notes: s.notes ?? null,
    technicianId: s.technicianId ?? null,
  }))

  const plainEquipment = equipment.map(e => ({ id: e.id, name: e.name, category: e.category }))

  return (
    <>
      <PageHeader
        title="Önleyici Bakım"
        breadcrumb={<Link href="/maintenance" style={{ color: 'var(--text-3)', textDecoration: 'none' }}>← Teknik Servis</Link>}
      />
      <PmClient schedules={plainSchedules} stats={stats} equipment={plainEquipment}/>
    </>
  )
}
