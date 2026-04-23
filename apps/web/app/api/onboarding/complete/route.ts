import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import { getOrCreateTenant } from '@/lib/auth'
import { clerkClient } from '@clerk/nextjs/server'

export async function POST() {
  const { userId, orgId, orgSlug } = await auth()

  if (!userId || !orgId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const client = await clerkClient()
  const org = await client.organizations.getOrganization({ organizationId: orgId })
  await getOrCreateTenant(orgId, org.name)

  return NextResponse.json({ success: true })
}
