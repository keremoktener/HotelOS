import { z } from 'zod'
import { router, tenantProcedure } from '@/lib/trpc/server'
import * as service from './service'
import { guestCreateSchema, guestSearchSchema, guestUpdateSchema } from './types'

export const guestRouter = router({
  search: tenantProcedure
    .input(guestSearchSchema)
    .query(({ ctx, input }) => service.searchGuests(ctx.tenantId, input.query)),

  get: tenantProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(({ ctx, input }) => service.getGuest(ctx.tenantId, input.id)),

  create: tenantProcedure
    .input(guestCreateSchema)
    .mutation(({ ctx, input }) => service.createGuest(ctx.tenantId, input)),

  update: tenantProcedure
    .input(z.object({ id: z.string().uuid(), data: guestUpdateSchema }))
    .mutation(({ ctx, input }) => service.updateGuest(ctx.tenantId, input.id, input.data)),

  checkBlacklist: tenantProcedure
    .input(z.object({ tcId: z.string().optional(), passportNo: z.string().optional() }))
    .query(({ ctx, input }) => service.checkBlacklist(ctx.tenantId, input.tcId, input.passportNo)),
})
