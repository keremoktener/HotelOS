import { z } from 'zod'
import { router, tenantProcedure } from '@/lib/trpc/server'
import * as service from './service'
import { hkTaskCreateSchema, hkTaskUpdateSchema, hkTaskFiltersSchema } from './types'

export const hkRouter = router({
  list: tenantProcedure
    .input(hkTaskFiltersSchema)
    .query(({ ctx, input }) => service.listTasks(ctx.tenantId, input)),

  create: tenantProcedure
    .input(hkTaskCreateSchema)
    .mutation(({ ctx, input }) => service.createTask(ctx.tenantId, input)),

  update: tenantProcedure
    .input(z.object({ id: z.string().uuid(), data: hkTaskUpdateSchema }))
    .mutation(({ ctx, input }) => service.updateTask(ctx.tenantId, input.id, input.data)),

  stats: tenantProcedure
    .query(({ ctx }) => service.getStats(ctx.tenantId)),
})
