import { z } from 'zod'
import { router, tenantProcedure } from '@/lib/trpc/server'
import * as service from './service'
import * as caRepo from './common-area-repository'
import * as linenRepo from './linen-repository'
import { hkTaskCreateSchema, hkTaskUpdateSchema, hkTaskFiltersSchema } from './types'
import { commonAreaCreateSchema, commonAreaUpdateSchema } from './common-area-types'
import { linenLogSchema } from './linen-types'

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

  commonArea: router({
    list: tenantProcedure
      .query(({ ctx }) => caRepo.listCommonAreas(ctx.tenantId)),

    create: tenantProcedure
      .input(commonAreaCreateSchema)
      .mutation(({ ctx, input }) => caRepo.createCommonArea(ctx.tenantId, input)),

    update: tenantProcedure
      .input(z.object({ id: z.string().uuid(), data: commonAreaUpdateSchema }))
      .mutation(({ ctx, input }) => caRepo.updateCommonArea(ctx.tenantId, input.id, input.data)),

    delete: tenantProcedure
      .input(z.object({ id: z.string().uuid() }))
      .mutation(({ ctx, input }) => caRepo.deleteCommonArea(ctx.tenantId, input.id)),

    completeSchedule: tenantProcedure
      .input(z.object({ id: z.string().uuid() }))
      .mutation(({ ctx: _ctx, input }) => caRepo.completeSchedule(input.id)),

    triggerDue: tenantProcedure
      .mutation(({ ctx }) => caRepo.createDueSchedules(ctx.tenantId)),
  }),

  linen: router({
    list: tenantProcedure
      .input(z.object({ days: z.number().int().min(1).max(90).default(30) }))
      .query(({ ctx, input }) => linenRepo.listLinen(ctx.tenantId, input.days)),

    log: tenantProcedure
      .input(linenLogSchema)
      .mutation(({ ctx, input }) => linenRepo.logLinen(ctx.tenantId, input)),

    stats: tenantProcedure
      .query(({ ctx }) => linenRepo.getLinenStats(ctx.tenantId)),
  }),
})
