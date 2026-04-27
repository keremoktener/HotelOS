import { z } from 'zod'

export const pmCreateSchema = z.object({
  equipmentId: z.string().uuid(),
  scheduledDate: z.coerce.date(),
  notes: z.string().max(500).optional(),
  technicianId: z.string().max(60).optional(),
})

export const pmCompleteSchema = z.object({
  notes: z.string().max(500).optional(),
})

export type PmCreateInput = z.infer<typeof pmCreateSchema>
export type PmCompleteInput = z.infer<typeof pmCompleteSchema>
