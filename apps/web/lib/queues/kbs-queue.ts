import { Queue } from 'bullmq'
import { redis } from '@/lib/redis'
import type { KbsJobData } from '@/lib/integrations/kbs/types'
import { logger } from '@/lib/logger'

let _queue: Queue<KbsJobData> | null = null

function getQueue(): Queue<KbsJobData> | null {
  if (!redis) return null
  if (!_queue) _queue = new Queue<KbsJobData>('kbs', { connection: redis })
  return _queue
}

export async function enqueueKbsNotification(data: KbsJobData): Promise<void> {
  const queue = getQueue()
  if (!queue) {
    logger.debug({ reservationId: data.reservationId }, 'kbs:queue-unavailable — skipped')
    return
  }
  // KBS requires notification within 5 minutes of check-in
  await queue.add('notify', data, {
    delay: 0,
    attempts: 5,
    backoff: { type: 'exponential', delay: 10_000 },
    removeOnComplete: { age: 86_400 * 30 },
    removeOnFail: { age: 86_400 * 90 },
  })
  logger.info({ reservationId: data.reservationId }, 'kbs:enqueued')
}
