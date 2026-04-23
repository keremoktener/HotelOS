import { Webhook } from 'svix'
import { headers } from 'next/headers'
import type { WebhookEvent } from '@clerk/nextjs/server'
import { db } from '@/lib/db'
import { logger } from '@/lib/logger'

export async function POST(req: Request) {
  const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET
  if (!WEBHOOK_SECRET) {
    return new Response('Webhook secret not configured', { status: 500 })
  }

  const headerPayload = await headers()
  const svix_id = headerPayload.get('svix-id')
  const svix_timestamp = headerPayload.get('svix-timestamp')
  const svix_signature = headerPayload.get('svix-signature')

  if (!svix_id || !svix_timestamp || !svix_signature) {
    return new Response('Missing svix headers', { status: 400 })
  }

  const payload = await req.json()
  const body = JSON.stringify(payload)

  const wh = new Webhook(WEBHOOK_SECRET)
  let evt: WebhookEvent

  try {
    evt = wh.verify(body, {
      'svix-id': svix_id,
      'svix-timestamp': svix_timestamp,
      'svix-signature': svix_signature,
    }) as WebhookEvent
  } catch {
    return new Response('Invalid webhook signature', { status: 400 })
  }

  if (evt.type === 'organization.created') {
    const { id: clerkOrgId, name } = evt.data
    try {
      await db.tenant.upsert({
        where: { slug: clerkOrgId },
        create: {
          slug: clerkOrgId,
          name,
          plan: 'starter',
          activeModules: ['reservation', 'housekeeping', 'maintenance'],
        },
        update: {},
      })
      logger.info({ clerkOrgId, name }, 'tenant created from clerk webhook')
    } catch (err) {
      logger.error({ err, clerkOrgId }, 'failed to create tenant')
      return new Response('Failed to create tenant', { status: 500 })
    }
  }

  if (evt.type === 'user.created') {
    const { id: clerkId, email_addresses, first_name, last_name } = evt.data
    try {
      await db.user.upsert({
        where: { clerkId },
        create: {
          clerkId,
          tenantId: '',
          role: 'STAFF',
          isActive: true,
        },
        update: {},
      })
    } catch {
      // User may not have org yet — will be linked on first request
    }
  }

  return new Response('OK', { status: 200 })
}
