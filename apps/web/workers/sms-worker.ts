// Run with: npm run worker:sms (from apps/web)
// Requires: REDIS_URL, NETGSM_USERCODE, NETGSM_PASSWORD in environment.

import { Worker } from 'bullmq'
import Redis from 'ioredis'
import { getSmsAdapter } from '@/lib/integrations/sms'
import type { SmsJobData } from '@/lib/integrations/sms/types'

const redisUrl = process.env.REDIS_URL
if (!redisUrl) { console.error('[sms-worker] REDIS_URL is not set'); process.exit(1) }

const connection = new Redis(redisUrl, { maxRetriesPerRequest: null })
const adapter = getSmsAdapter()

const worker = new Worker<SmsJobData>(
  'sms',
  async (job) => {
    const { type, to, body } = job.data
    if (type === 'whatsapp') {
      await adapter.sendWhatsapp({ to, body })
    } else {
      await adapter.sendSms({ to, body })
    }
  },
  { connection, concurrency: 5 },
)

worker.on('completed', (job) => {
  console.log(`[sms-worker] job ${job.id} completed — to=${job.data.to}`)
})
worker.on('failed', (job, err) => {
  console.error(`[sms-worker] job ${job?.id} failed:`, err.message)
})

process.on('SIGTERM', async () => {
  await worker.close()
  await connection.quit()
})

console.log('[sms-worker] started, concurrency=5')
