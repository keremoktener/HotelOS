// Run with: npm run worker:kbs (from apps/web)
// Requires: REDIS_URL in environment; KBS credentials optional (no-op when absent).

import { Worker } from 'bullmq'
import Redis from 'ioredis'
import { sendKbsNotification } from '@/lib/integrations/kbs/adapter'
import type { KbsJobData } from '@/lib/integrations/kbs/types'

const redisUrl = process.env.REDIS_URL
if (!redisUrl) { console.error('[kbs-worker] REDIS_URL is not set'); process.exit(1) }

const connection = new Redis(redisUrl, { maxRetriesPerRequest: null })

const worker = new Worker<KbsJobData>(
  'kbs',
  async (job) => {
    await sendKbsNotification(job.data)
  },
  { connection, concurrency: 2 },
)

worker.on('completed', (job) => {
  console.log(`[kbs-worker] job ${job.id} completed — reservation=${job.data.reservationId}`)
})
worker.on('failed', (job, err) => {
  console.error(`[kbs-worker] job ${job?.id} failed:`, err.message)
})

process.on('SIGTERM', async () => {
  await worker.close()
  await connection.quit()
})

console.log('[kbs-worker] started, concurrency=2')
