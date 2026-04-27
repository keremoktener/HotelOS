import { z } from 'zod'

export const equipmentCreateSchema = z.object({
  name: z.string().min(1).max(100),
  category: z.string().min(1).max(60),
  serialNo: z.string().max(60).optional(),
  purchaseDate: z.coerce.date().optional(),
  warrantyExpiry: z.coerce.date().optional(),
  nextServiceDate: z.coerce.date().optional(),
})

export const equipmentUpdateSchema = equipmentCreateSchema.partial().extend({
  lastServiceDate: z.coerce.date().optional(),
})

export type EquipmentCreateInput = z.infer<typeof equipmentCreateSchema>
export type EquipmentUpdateInput = z.infer<typeof equipmentUpdateSchema>
