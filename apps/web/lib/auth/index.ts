import { auth, currentUser } from '@clerk/nextjs/server'
import { db } from '@/lib/db'
import { cache } from 'react'
import { TRPCError } from '@trpc/server'

// React cache() deduplicates this call across all server components
// in the same request, so each page only hits the DB once per navigation.
export const getTenantId = cache(async (clerkOrgId: string): Promise<string | null> => {
  const tenant = await db.tenant.findFirst({
    where: { slug: clerkOrgId },
    select: { id: true },
  })
  return tenant?.id ?? null
})

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
