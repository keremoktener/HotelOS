import { auth, currentUser } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { DashboardShell } from '@/components/layout/dashboard-shell'
import { getTenantId } from '@/lib/auth'
import { db } from '@/lib/db'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { userId, orgId } = await auth()
  if (!userId) redirect('/sign-in')
  if (!orgId) redirect('/onboarding')

  const user = await currentUser()
  const tenantId = await getTenantId(orgId)
  if (!tenantId) redirect('/onboarding')

  const tenant = await db.tenant.findUnique({ where: { id: tenantId }, select: { name: true } })
  const userName = user ? `${user.firstName ?? ''} ${user.lastName ?? ''}`.trim() : ''

  return (
    <DashboardShell userName={userName} orgName={tenant?.name ?? ''}>
      {children}
    </DashboardShell>
  )
}
