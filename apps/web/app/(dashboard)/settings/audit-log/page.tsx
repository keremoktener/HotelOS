import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { getTenantId } from '@/lib/auth'
import { db } from '@/lib/db'
import { PageHeader } from '@/components/layout/page-header'
import { AuditLogClient } from './_components/audit-log-client'

export default async function AuditLogPage() {
  const { userId, orgId } = await auth()
  if (!userId) redirect('/sign-in')
  if (!orgId) redirect('/onboarding')
  const tenantId = await getTenantId(orgId)
  if (!tenantId) redirect('/onboarding')

  const [logs, total] = await Promise.all([
    db.auditLog.findMany({
      where: { tenantId },
      orderBy: { createdAt: 'desc' },
      take: 100,
    }),
    db.auditLog.count({ where: { tenantId } }),
  ])

  const plain = logs.map(l => ({
    id: l.id,
    userId: l.userId ?? null,
    action: l.action,
    entity: l.entity,
    entityId: l.entityId,
    diff: l.diff ?? null,
    createdAt: l.createdAt.toISOString(),
  }))

  return (
    <>
      <PageHeader title="Denetim kaydı" breadcrumb="Ayarlar · Tüm değişiklikler"/>
      <AuditLogClient logs={plain} total={total}/>
    </>
  )
}
