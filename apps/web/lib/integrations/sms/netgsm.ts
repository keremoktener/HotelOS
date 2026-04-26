import type { SmsAdapter, SmsMessage } from './types'
import { logger } from '@/lib/logger'

const SMS_URL = 'https://api.netgsm.com.tr/sms/send/get/'

// Netgsm response codes: '00 <msgid>' = success; anything else = error.
function assertSuccess(code: string, context: string) {
  if (!code.startsWith('00')) {
    throw new Error(`Netgsm ${context} error: ${code.trim()}`)
  }
}

export class NetgsmAdapter implements SmsAdapter {
  constructor(
    private readonly usercode: string,
    private readonly password: string,
    private readonly msgheader: string,
  ) {}

  async sendSms({ to, body }: SmsMessage): Promise<void> {
    const params = new URLSearchParams({
      usercode: this.usercode,
      password: this.password,
      gsmno: to,
      message: body,
      msgheader: this.msgheader,
      dil: 'TR',
    })
    const res = await fetch(`${SMS_URL}?${params}`)
    const text = await res.text()
    assertSuccess(text, 'sms')
    logger.info({ to, msgId: text.split(' ')[1]?.trim() }, 'sms:sent')
  }

  // Netgsm WhatsApp requires pre-approved templates.
  // Until templates are registered, SMS is used as fallback.
  async sendWhatsapp(msg: SmsMessage): Promise<void> {
    await this.sendSms(msg)
  }
}
