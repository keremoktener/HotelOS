// Run with: npm run worker:hk-cron (from apps/web)
// Requires: REDIS_URL, DATABASE_URL in environment.
// Schedules daily at 06:00 — creates CommonAreaSchedule records for all due areas.

import { Worker, Queue } from 'bullmq'
import Redis from 'ioredis'
import { createDueSchedules } from '@/modules/housekeeping/common-area-repository'
import { db } from '@/lib/db'

const redisUrl = process.env.REDIS_URL
if (!redisUrl) { console.error('[hk-cron] REDIS_URL is not set'); process.exit(1) }

const connection = new Redis(redisUrl, { maxRetriesPerRequest: null })

// Register the repeatable job (idempotent — BullMQ deduplicates by name+pattern)
const queue = new Queue('hk-cron', { connection })
queue.add('daily-schedule', {}, {
  repeat: { pattern: '0 6 * * *' }, jobId: 'hk-daily-schedule',
}).then(() => console.log('[hk-cron] repeatable job registered (06:00 daily)'))

const worker = new Worker(
  'hk-cron',
  async () => {
    const tenants = await db.tenant.findMany({ select: { id: true } })
    let total = 0
    for (const { id } of tenants) {
      const created = await createDueSchedules(id)
      total += created
      if (created > 0) console.log(`[hk-cron] tenant=${id} created=${created} schedules`)
    }
    console.log(`[hk-cron] run complete — ${total} schedules created across ${tenants.length} tenants`)
  },
  { connection, concurrency: 1 },
)

worker.on('completed', () => console.log('[hk-cron] job completed'))
worker.on('failed', (job, err) => console.error('[hk-cron] job failed:', err.message))

process.on('SIGTERM', () => {
  Promise.all([worker.close(), queue.close(), connection.quit()]).catch(() => {})
})

console.log('[hk-cron] worker started')
