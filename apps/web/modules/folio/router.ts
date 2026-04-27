import { z } from 'zod'
import { router, tenantProcedure } from '@/lib/trpc/server'
import * as repo from './repository'

export const folioRouter = router({
  summary: tenantProcedure
    .input(z.object({ reservationId: z.string().uuid() }))
    .query(({ ctx, input }) => repo.getFolioSummary(ctx.tenantId, input.reservationId)),

  listLines: tenantProcedure
    .input(z.object({ reservationId: z.string().uuid() }))
    .query(({ ctx, input }) => repo.listLines(ctx.tenantId, input.reservationId)),

  addLine: tenantProcedure
    .input(z.object({
      reservationId: z.string().uuid(),
      description: z.string().min(1).max(200),
      source: z.enum(['LODGING', 'FNB', 'MANUAL']).default('MANUAL'),
      amountKurus: z.number().int(),
      lineDate: z.coerce.date().optional(),
    }))
    .mutation(({ ctx, input }) => repo.addLine(ctx.tenantId, input)),

  removeLine: tenantProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(({ ctx, input }) => repo.removeLine(ctx.tenantId, input.id)),

  postFnB: tenantProcedure
    .input(z.object({
      reservationId: z.string().uuid(),
      items: z.array(z.object({
        name: z.string(),
        priceKurus: z.number().int().min(0),
        qty: z.number().int().min(1),
      })).min(1),
    }))
    .mutation(async ({ ctx, input }) => {
      const reservation = await ctx.db.reservation.findFirst({
        where: { id: input.reservationId, tenantId: ctx.tenantId },
      })
      if (!reservation) throw new Error('Rezervasyon bulunamadı')

      const lines = input.items.map(item => ({
        reservationId: input.reservationId,
        description: `F&B — ${item.name}${item.qty > 1 ? ` × ${item.qty}` : ''}`,
        source: 'FNB' as const,
        amountKurus: item.priceKurus * item.qty,
      }))

      await Promise.all(lines.map(l => repo.addLine(ctx.tenantId, l)))
      return { count: lines.length }
    }),
})
