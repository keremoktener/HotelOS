import { z } from 'zod'
import { router, tenantProcedure } from '@/lib/trpc/server'
import * as service from './service'
import {
  roomCreateSchema,
  roomTypeCreateSchema,
  roomUpdateSchema,
  roomUpdateStatusSchema,
  roomFiltersSchema,
} from './types'

export const roomRouter = router({
  list: tenantProcedure
    .input(roomFiltersSchema.optional())
    .query(({ ctx, input }) => service.listRooms(ctx.tenantId, input ?? {})),

  get: tenantProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(({ ctx, input }) => service.getRoom(ctx.tenantId, input.id)),

  create: tenantProcedure
    .input(roomCreateSchema)
    .mutation(({ ctx, input }) => service.createRoom(ctx.tenantId, input)),

  update: tenantProcedure
    .input(z.object({ id: z.string().uuid(), data: roomUpdateSchema }))
    .mutation(({ ctx, input }) => service.updateRoom(ctx.tenantId, input.id, input.data)),

  updateStatus: tenantProcedure
    .input(roomUpdateStatusSchema)
    .mutation(({ ctx, input }) =>
      service.updateRoomStatus(ctx.tenantId, input.id, input.status, input.faultDetail),
    ),

  types: {
    list: tenantProcedure
      .query(({ ctx }) => service.listRoomTypes(ctx.tenantId)),

    create: tenantProcedure
      .input(roomTypeCreateSchema)
      .mutation(({ ctx, input }) => service.createRoomType(ctx.tenantId, input)),
  },
})
