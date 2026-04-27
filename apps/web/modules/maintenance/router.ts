import { z } from 'zod'
import { router, tenantProcedure } from '@/lib/trpc/server'
import * as service from './service'
import * as equipmentRepo from './equipment-repository'
import { faultCreateSchema, faultUpdateSchema, faultFiltersSchema } from './types'
import { equipmentCreateSchema, equipmentUpdateSchema } from './equipment-types'

export const maintenanceRouter = router({
  list: tenantProcedure
    .input(faultFiltersSchema)
    .query(({ ctx, input }) => service.listFaults(ctx.tenantId, input)),

  get: tenantProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(({ ctx, input }) => service.getFault(ctx.tenantId, input.id)),

  create: tenantProcedure
    .input(faultCreateSchema)
    .mutation(({ ctx, input }) => service.createFault(ctx.tenantId, input)),

  update: tenantProcedure
    .input(z.object({ id: z.string().uuid(), data: faultUpdateSchema }))
    .mutation(({ ctx, input }) => service.updateFault(ctx.tenantId, input.id, input.data)),

  stats: tenantProcedure
    .query(({ ctx }) => service.getStats(ctx.tenantId)),

  equipment: router({
    list: tenantProcedure
      .query(({ ctx }) => equipmentRepo.listEquipment(ctx.tenantId)),

    create: tenantProcedure
      .input(equipmentCreateSchema)
      .mutation(({ ctx, input }) => equipmentRepo.createEquipment(ctx.tenantId, input)),

    update: tenantProcedure
      .input(z.object({ id: z.string().uuid(), data: equipmentUpdateSchema }))
      .mutation(({ ctx, input }) => equipmentRepo.updateEquipment(ctx.tenantId, input.id, input.data)),

    delete: tenantProcedure
      .input(z.object({ id: z.string().uuid() }))
      .mutation(({ ctx, input }) => equipmentRepo.deleteEquipment(ctx.tenantId, input.id)),

    stats: tenantProcedure
      .query(({ ctx }) => equipmentRepo.getEquipmentStats(ctx.tenantId)),
  }),
})
