import { Queue } from 'bullmq'
import { redis } from '@/lib/redis'
import { getSmsAdapter } from '@/lib/integrations/sms'
import type { SmsJobData } from '@/lib/integrations/sms/types'
import { logger } from '@/lib/logger'

const JOB_OPTIONS = {
  attempts: 3,
  backoff: { type: 'exponential' as const, delay: 5_000 },
  removeOnComplete: { age: 86_400 },
  removeOnFail: { age: 86_400 * 7 },
}

let _queue: Queue<SmsJobData> | null = null

function getQueue(): Queue<SmsJobData> | null {
  if (!redis) return null
  if (!_queue) _queue = new Queue<SmsJobData>('sms', { connection: redis })
  return _queue
}

export async function enqueueSms(data: SmsJobData): Promise<void> {
  const queue = getQueue()
  if (queue) {
    await queue.add('send', data, JOB_OPTIONS)
    return
  }
  // Redis unavailable — fire directly (dev / no-Redis environments)
  logger.debug(data, 'sms:queue-unavailable — sending directly')
  const adapter = getSmsAdapter()
  if (data.type === 'whatsapp') {
    await adapter.sendWhatsapp({ to: data.to, body: data.body })
  } else {
    await adapter.sendSms({ to: data.to, body: data.body })
  }
}
