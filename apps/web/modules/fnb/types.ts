import { z } from 'zod'

// 14 EU mandatory allergens
export const ALLERGENS = [
  { code: 'GLUTEN',       label: 'Gluten' },
  { code: 'CRUSTACEANS',  label: 'Kabuklu deniz ürünleri' },
  { code: 'EGGS',         label: 'Yumurta' },
  { code: 'FISH',         label: 'Balık' },
  { code: 'PEANUTS',      label: 'Yer fıstığı' },
  { code: 'SOYBEANS',     label: 'Soya' },
  { code: 'MILK',         label: 'Süt / Laktoz' },
  { code: 'NUTS',         label: 'Kabuklu yemiş' },
  { code: 'CELERY',       label: 'Kereviz' },
  { code: 'MUSTARD',      label: 'Hardal' },
  { code: 'SESAME',       label: 'Susam' },
  { code: 'SULPHITES',    label: 'Sülfitler' },
  { code: 'LUPIN',        label: 'Acı bakla' },
  { code: 'MOLLUSCS',     label: 'Yumuşakçalar' },
] as const

export const allergenCodes = ALLERGENS.map(a => a.code) as [string, ...string[]]

export const categoryCreateSchema = z.object({
  name: z.string().min(1).max(60),
  sortOrder: z.number().int().min(0).default(0),
})

export const categoryUpdateSchema = categoryCreateSchema.partial()

export const menuItemCreateSchema = z.object({
  categoryId: z.string().uuid(),
  name: z.string().min(1).max(100),
  description: z.string().max(300).optional(),
  priceKurus: z.number().int().min(0).default(0),
  allergens: z.array(z.string()).default([]),
  isAvailable: z.boolean().default(true),
})

export const menuItemUpdateSchema = menuItemCreateSchema.partial()

export type CategoryCreateInput = z.infer<typeof categoryCreateSchema>
export type CategoryUpdateInput = z.infer<typeof categoryUpdateSchema>
export type MenuItemCreateInput = z.infer<typeof menuItemCreateSchema>
export type MenuItemUpdateInput = z.infer<typeof menuItemUpdateSchema>
