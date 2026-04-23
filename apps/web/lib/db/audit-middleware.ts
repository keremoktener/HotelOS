import type { Prisma } from '@prisma/client'
import { logger } from '@/lib/logger'

// Tables exempt from audit logging (high-volume, low-risk)
const EXEMPT_MODELS = new Set(['AuditLog', 'HKPhoto', 'LinenTracking'])

// Auto-log all create/update/delete mutations to AuditLog via Prisma middleware
export function createAuditMiddleware(
  context: { tenantId?: string; userId?: string },
): Prisma.Middleware {
  return async (params, next) => {
    const result = await next(params)

    if (
      params.model &&
      !EXEMPT_MODELS.has(params.model) &&
      ['create', 'update', 'delete', 'upsert'].includes(params.action)
    ) {
      const tenantId = context.tenantId ?? (params.args?.data as any)?.tenantId
      if (tenantId) {
        try {
          // Use raw db import here to avoid circular — this middleware is attached at request time
          const { db } = await import('./index')
          await db.auditLog.create({
            data: {
              tenantId,
              userId: context.userId ?? null,
              action: params.action,
              entity: params.model,
              entityId:
                (result as any)?.id ??
                (params.args?.where as any)?.id ??
                'unknown',
              diff: params.action === 'delete' ? null : (params.args?.data as any) ?? null,
            },
          })
        } catch (err) {
          // Audit log failure must never break the main operation
          logger.error({ err, model: params.model, action: params.action }, 'audit log failed')
        }
      }
    }

    return result
  }
}
