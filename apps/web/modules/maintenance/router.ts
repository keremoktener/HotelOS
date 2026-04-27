import { z } from 'zod'
import { router, tenantProcedure } from '@/lib/trpc/server'
import * as service from './service'
import * as equipmentRepo from './equipment-repository'
import * as firmRepo from './service-firm-repository'
import * as pmRepo from './pm-repository'
import { faultCreateSchema, faultUpdateSchema, faultFiltersSchema } from './types'
import { equipmentCreateSchema, equipmentUpdateSchema } from './equipment-types'
import { firmCreateSchema, firmUpdateSchema, visitCreateSchema } from './service-firm-types'
import { pmCreateSchema, pmCompleteSchema } from './pm-types'

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

  firms: router({
    list: tenantProcedure
      .query(({ ctx }) => firmRepo.listFirms(ctx.tenantId)),

    create: tenantProcedure
      .input(firmCreateSchema)
      .mutation(({ ctx, input }) => firmRepo.createFirm(ctx.tenantId, input)),

    update: tenantProcedure
      .input(z.object({ id: z.string().uuid(), data: firmUpdateSchema }))
      .mutation(({ ctx, input }) => firmRepo.updateFirm(ctx.tenantId, input.id, input.data)),

    delete: tenantProcedure
      .input(z.object({ id: z.string().uuid() }))
      .mutation(({ ctx, input }) => firmRepo.deleteFirm(ctx.tenantId, input.id)),

    listVisits: tenantProcedure
      .input(z.object({ firmId: z.string().uuid().optional() }))
      .query(({ ctx, input }) => firmRepo.listVisits(ctx.tenantId, input.firmId)),

    createVisit: tenantProcedure
      .input(visitCreateSchema)
      .mutation(({ ctx, input }) => firmRepo.createVisit(ctx.tenantId, input)),
  }),

  pm: router({
    list: tenantProcedure
      .input(z.object({ onlyPending: z.boolean().default(false) }))
      .query(({ ctx, input }) => pmRepo.listPm(ctx.tenantId, input.onlyPending)),

    create: tenantProcedure
      .input(pmCreateSchema)
      .mutation(({ ctx, input }) => {
        // Verify equipment belongs to tenant before creating PM
        return import('@/lib/db').then(({ db }) =>
          db.equipment.findFirst({ where: { id: input.equipmentId, tenantId: ctx.tenantId } })
        ).then(eq => {
          if (!eq) throw new Error('Equipment not found')
          return pmRepo.createPm(input)
        })
      }),

    complete: tenantProcedure
      .input(z.object({ id: z.string().uuid(), data: pmCompleteSchema }))
      .mutation(({ ctx: _ctx, input }) => pmRepo.completePm(input.id, input.data.notes)),

    stats: tenantProcedure
      .query(({ ctx }) => pmRepo.getPmStats(ctx.tenantId)),
  }),
})
