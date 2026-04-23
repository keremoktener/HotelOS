import { auth, currentUser } from '@clerk/nextjs/server'
import { db } from '@/lib/db'
import { TRPCError } from '@trpc/server'

export async function getTenantId(clerkOrgId: string): Promise<string | null> {
  const tenant = await db.tenant.findFirst({
    where: { slug: clerkOrgId },
    select: { id: true },
  })
  return tenant?.id ?? null
}

export async function requireTenantId(clerkOrgId: string | null | undefined): Promise<string> {
  if (!clerkOrgId) {
    throw new TRPCError({ code: 'UNAUTHORIZED', message: 'No organization selected' })
  }
  const tenantId = await getTenantId(clerkOrgId)
  if (!tenantId) {
    throw new TRPCError({ code: 'UNAUTHORIZED', message: 'Tenant not found' })
  }
  return tenantId
}

export async function getOrCreateTenant(clerkOrgId: string, name: string): Promise<string> {
  const existing = await db.tenant.findFirst({ where: { slug: clerkOrgId } })
  if (existing) return existing.id

  const tenant = await db.tenant.create({
    data: {
      slug: clerkOrgId,
      name,
      plan: 'starter',
      activeModules: ['reservation', 'housekeeping', 'maintenance'],
    },
  })
  return tenant.id
}
