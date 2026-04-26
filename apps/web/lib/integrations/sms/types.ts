export interface SmsMessage {
  to: string
  body: string
}

export interface SmsAdapter {
  sendSms(msg: SmsMessage): Promise<void>
  sendWhatsapp(msg: SmsMessage): Promise<void>
}

export interface SmsJobData {
  type: 'sms' | 'whatsapp'
  to: string
  body: string
  tenantId: string
  entityType?: string
  entityId?: string
}
