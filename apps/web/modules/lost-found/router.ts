import { z } from 'zod'
import { router, tenantProcedure } from '@/lib/trpc/server'
import * as service from './service'
import { lafCreateSchema, lafUpdateSchema } from './types'

export const lostFoundRouter = router({
  list: tenantProcedure
    .input(z.object({ onlyUnclaimed: z.boolean().default(false) }))
    .query(({ ctx, input }) => service.listItems(ctx.tenantId, input.onlyUnclaimed)),

  create: tenantProcedure
    .input(lafCreateSchema)
    .mutation(({ ctx, input }) => service.createItem(ctx.tenantId, input)),

  update: tenantProcedure
    .input(z.object({ id: z.string().uuid(), data: lafUpdateSchema }))
    .mutation(({ ctx, input }) => service.updateItem(ctx.tenantId, input.id, input.data)),

  stats: tenantProcedure
    .query(({ ctx }) => service.getStats(ctx.tenantId)),
})
