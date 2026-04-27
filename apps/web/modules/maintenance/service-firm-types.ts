import { z } from 'zod'

export const firmCreateSchema = z.object({
  name: z.string().min(1).max(100),
  phone: z.string().min(1).max(30),
  specialty: z.string().max(80).optional(),
})

export const firmUpdateSchema = firmCreateSchema.partial()

export const visitCreateSchema = z.object({
  firmId: z.string().uuid(),
  visitDate: z.coerce.date(),
  description: z.string().min(1).max(500),
  invoiceId: z.string().max(60).optional(),
})

export type FirmCreateInput = z.infer<typeof firmCreateSchema>
export type FirmUpdateInput = z.infer<typeof firmUpdateSchema>
export type VisitCreateInput = z.infer<typeof visitCreateSchema>
