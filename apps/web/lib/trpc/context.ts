import { auth } from '@clerk/nextjs/server'
import { db } from '@/lib/db'
import { getTenantId } from '@/lib/auth'
import type { FetchCreateContextFnOptions } from '@trpc/server/adapters/fetch'

export async function createTRPCContext(_opts: FetchCreateContextFnOptions) {
  const { userId, orgId } = await auth()
  const tenantId = orgId ? await getTenantId(orgId) : null

  return {
    db,
    userId,
    orgId,
    tenantId,
  }
}

export type TRPCContext = Awaited<ReturnType<typeof createTRPCContext>>
