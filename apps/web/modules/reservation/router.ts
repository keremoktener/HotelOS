import { z } from 'zod'
import { router, tenantProcedure } from '@/lib/trpc/server'
import * as service from './service'
import {
  reservationCreateSchema,
  reservationUpdateSchema,
  reservationFiltersSchema,
  pricePreviewSchema,
  paymentCreateSchema,
} from './types'
import * as repo from './repository'

export const reservationRouter = router({
  list: tenantProcedure
    .input(reservationFiltersSchema)
    .query(({ ctx, input }) => service.listReservations(ctx.tenantId, input)),

  get: tenantProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(({ ctx, input }) => service.getReservation(ctx.tenantId, input.id)),

  create: tenantProcedure
    .input(reservationCreateSchema)
    .mutation(({ ctx, input }) => service.createReservation(ctx.tenantId, input)),

  update: tenantProcedure
    .input(z.object({ id: z.string().uuid(), data: reservationUpdateSchema }))
    .mutation(({ ctx, input }) => service.updateReservation(ctx.tenantId, input.id, input.data)),

  cancel: tenantProcedure
    .input(z.object({ id: z.string().uuid(), reason: z.string().min(1) }))
    .mutation(({ ctx, input }) => service.cancelReservation(ctx.tenantId, input.id, input.reason)),

  checkIn: tenantProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(({ ctx, input }) => service.checkInReservation(ctx.tenantId, input.id)),

  checkOut: tenantProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(({ ctx, input }) => service.checkOutReservation(ctx.tenantId, input.id)),

  pricePreview: tenantProcedure
    .input(pricePreviewSchema)
    .query(({ ctx, input }) => service.pricePreview(ctx.tenantId, input)),

  dashboard: tenantProcedure
    .query(({ ctx }) => service.getDashboardData(ctx.tenantId)),

  payment: {
    create: tenantProcedure
      .input(paymentCreateSchema)
      .mutation(({ ctx, input }) => repo.createPayment(ctx.tenantId, input)),
  },
})
