import { auth } from '@clerk/nextjs/server'
import { NextRequest, NextResponse } from 'next/server'
import { getOrCreateTenant } from '@/lib/auth'
import { db } from '@/lib/db'
import { clerkClient } from '@clerk/nextjs/server'
import { z } from 'zod'

const bodySchema = z.object({
  roomTypes: z.array(z.object({
    name: z.string().min(1),
    capacity: z.number().int().min(1),
    basePrice: z.number().int().min(0),
  })).default([]),
  rooms: z.array(z.object({
    number: z.string().min(1),
    floor: z.number().int().optional(),
    typeName: z.string().min(1),
  })).default([]),
})

export async function POST(req: NextRequest) {
  const { userId, orgId } = await auth()

  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const client = await clerkClient()

  let activeOrgId = orgId
  if (!activeOrgId) {
    const memberships = await client.users.getOrganizationMembershipList({ userId })
    activeOrgId = memberships.data[0]?.organization.id ?? null
  }

  if (!activeOrgId) {
    return NextResponse.json({ error: 'No organization found' }, { status: 401 })
  }

  const org = await client.organizations.getOrganization({ organizationId: activeOrgId })
  const tenantId = await getOrCreateTenant(activeOrgId, org.name)

  const body = bodySchema.safeParse(await req.json().catch(() => ({})))
  if (!body.success) {
    return NextResponse.json({ error: 'Invalid body' }, { status: 400 })
  }

  const { roomTypes, rooms } = body.data

  // Create room types and build name → id map
  const typeMap = new Map<string, string>()
  for (const rt of roomTypes) {
    const created = await db.roomType.create({
      data: { tenantId, name: rt.name, capacity: rt.capacity, basePrice: rt.basePrice },
    })
    typeMap.set(rt.name, created.id)
  }

  // Create rooms (skip if typeId not found)
  for (const r of rooms) {
    const typeId = typeMap.get(r.typeName)
    if (!typeId) continue
    await db.room.create({
      data: { tenantId, number: r.number, floor: r.floor ?? null, typeId },
    })
  }

  return NextResponse.json({ success: true })
}
