import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { getTenantId } from '@/lib/auth'
import { PageHeader } from '@/components/layout/page-header'
import { EquipmentClient } from './_components/equipment-client'
import * as equipmentRepo from '@/modules/maintenance/equipment-repository'

export const dynamic = 'force-dynamic'

export default async function EquipmentPage() {
  const { userId, orgId } = await auth()
  if (!userId) redirect('/sign-in')
  if (!orgId) redirect('/onboarding')
  const tenantId = await getTenantId(orgId)
  if (!tenantId) redirect('/onboarding')

  const [equipment, stats] = await Promise.all([
    equipmentRepo.listEquipment(tenantId),
    equipmentRepo.getEquipmentStats(tenantId),
  ])

  const plain = equipment.map(e => ({
    id: e.id,
    name: e.name,
    category: e.category,
    serialNo: e.serialNo ?? null,
    purchaseDate: e.purchaseDate?.toISOString() ?? null,
    warrantyExpiry: e.warrantyExpiry?.toISOString() ?? null,
    lastServiceDate: e.lastServiceDate?.toISOString() ?? null,
    nextServiceDate: e.nextServiceDate?.toISOString() ?? null,
    lastPM: e.preventiveMaintenance[0]?.completedAt?.toISOString() ?? null,
  }))

  return (
    <>
      <PageHeader title="Ekipman Sicili" breadcrumb={<Link href="/maintenance" style={{ color: 'var(--text-3)', textDecoration: 'none' }}>← Teknik Servis</Link>}/>
      <EquipmentClient equipment={plain} stats={stats}/>
    </>
  )
}
