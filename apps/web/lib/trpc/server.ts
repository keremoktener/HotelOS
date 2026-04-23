import { initTRPC, TRPCError } from '@trpc/server'
import superjson from 'superjson'
import { ZodError } from 'zod'
import type { TRPCContext } from './context'

const t = initTRPC.context<TRPCContext>().create({
  transformer: superjson,
  errorFormatter({ shape, error }) {
    return {
      ...shape,
      data: {
        ...shape.data,
        zodError: error.cause instanceof ZodError ? error.cause.flatten() : null,
      },
    }
  },
})

export const router = t.router
export const createCallerFactory = t.createCallerFactory

export const publicProcedure = t.procedure

export const protectedProcedure = t.procedure.use(({ ctx, next }) => {
  if (!ctx.userId) {
    throw new TRPCError({ code: 'UNAUTHORIZED' })
  }
  return next({ ctx: { ...ctx, userId: ctx.userId } })
})

// All module procedures MUST use tenantProcedure — it guarantees tenantId is present
export const tenantProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (!ctx.tenantId) {
    throw new TRPCError({ code: 'UNAUTHORIZED', message: 'Tenant context required' })
  }
  return next({ ctx: { ...ctx, tenantId: ctx.tenantId } })
})
