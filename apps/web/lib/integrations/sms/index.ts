import type { SmsAdapter, SmsMessage } from './types'
import { NetgsmAdapter } from './netgsm'
import { logger } from '@/lib/logger'

class NoOpSmsAdapter implements SmsAdapter {
  async sendSms({ to }: SmsMessage) { logger.debug({ to }, 'sms:noop') }
  async sendWhatsapp({ to }: SmsMessage) { logger.debug({ to }, 'whatsapp:noop') }
}

let _adapter: SmsAdapter | null = null

export function getSmsAdapter(): SmsAdapter {
  if (_adapter) return _adapter
  const { NETGSM_USERCODE, NETGSM_PASSWORD, NETGSM_MSGHEADER } = process.env
  _adapter = NETGSM_USERCODE && NETGSM_PASSWORD
    ? new NetgsmAdapter(NETGSM_USERCODE, NETGSM_PASSWORD, NETGSM_MSGHEADER ?? 'HOTELOS')
    : new NoOpSmsAdapter()
  return _adapter
}

export type { SmsAdapter, SmsMessage }
