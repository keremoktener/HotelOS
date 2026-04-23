import pino from 'pino'

export const logger = pino({
  level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
  ...(process.env.NODE_ENV === 'development'
    ? { transport: { target: 'pino-pretty', options: { colorize: true } } }
    : {}),
  redact: {
    paths: ['*.tcId', '*.passportNo', '*.cardNumber', '*.password'],
    censor: '[REDACTED]',
  },
})

export function logMutation(params: {
  tenantId: string
  userId: string
  action: string
  entity: string
  entityId: string
}) {
  logger.info(params, 'mutation')
}
