import { z } from 'zod'
import { router, tenantProcedure } from '@/lib/trpc/server'
import * as repo from './repository'
import {
  categoryCreateSchema, categoryUpdateSchema,
  menuItemCreateSchema, menuItemUpdateSchema,
} from './types'

export const fnbRouter = router({
  listCategories: tenantProcedure
    .query(({ ctx }) => repo.listCategories(ctx.tenantId)),

  createCategory: tenantProcedure
    .input(categoryCreateSchema)
    .mutation(({ ctx, input }) => repo.createCategory(ctx.tenantId, input)),

  updateCategory: tenantProcedure
    .input(z.object({ id: z.string().uuid(), data: categoryUpdateSchema }))
    .mutation(({ ctx, input }) => repo.updateCategory(ctx.tenantId, input.id, input.data)),

  deleteCategory: tenantProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(({ ctx, input }) => repo.deleteCategory(ctx.tenantId, input.id)),

  createItem: tenantProcedure
    .input(menuItemCreateSchema)
    .mutation(({ ctx, input }) => repo.createMenuItem(ctx.tenantId, input)),

  updateItem: tenantProcedure
    .input(z.object({ id: z.string().uuid(), data: menuItemUpdateSchema }))
    .mutation(({ ctx, input }) => repo.updateMenuItem(ctx.tenantId, input.id, input.data)),

  deleteItem: tenantProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(({ ctx, input }) => repo.deleteMenuItem(ctx.tenantId, input.id)),

  stats: tenantProcedure
    .query(({ ctx }) => repo.getMenuStats(ctx.tenantId)),
})
