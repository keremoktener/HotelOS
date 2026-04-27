import { db } from '@/lib/db'
import type { CategoryCreateInput, CategoryUpdateInput, MenuItemCreateInput, MenuItemUpdateInput } from './types'

export function listCategories(tenantId: string) {
  return db.menuCategory.findMany({
    where: { tenantId },
    include: {
      items: {
        where: {},
        orderBy: { name: 'asc' },
      },
    },
    orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
  })
}

export function createCategory(tenantId: string, data: CategoryCreateInput) {
  return db.menuCategory.create({ data: { ...data, tenantId } })
}

export function updateCategory(tenantId: string, id: string, data: CategoryUpdateInput) {
  return db.menuCategory.update({ where: { id, tenantId }, data })
}

export function deleteCategory(tenantId: string, id: string) {
  return db.menuCategory.delete({ where: { id, tenantId } })
}

export function createMenuItem(tenantId: string, data: MenuItemCreateInput) {
  return db.menuItem.create({ data: { ...data, tenantId } })
}

export function updateMenuItem(tenantId: string, id: string, data: MenuItemUpdateInput) {
  return db.menuItem.update({ where: { id, tenantId }, data })
}

export function deleteMenuItem(tenantId: string, id: string) {
  return db.menuItem.delete({ where: { id, tenantId } })
}

export async function getMenuStats(tenantId: string) {
  const [categories, totalItems, availableItems] = await Promise.all([
    db.menuCategory.count({ where: { tenantId } }),
    db.menuItem.count({ where: { tenantId } }),
    db.menuItem.count({ where: { tenantId, isAvailable: true } }),
  ])
  return { categories, totalItems, availableItems }
}
