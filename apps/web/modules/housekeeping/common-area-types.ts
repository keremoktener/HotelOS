import { z } from 'zod'

export const commonAreaCreateSchema = z.object({
  name: z.string().min(1).max(100),
  cleaningFrequencyDays: z.number().int().min(1).max(30).default(1),
})

export const commonAreaUpdateSchema = commonAreaCreateSchema.partial()

export type CommonAreaCreateInput = z.infer<typeof commonAreaCreateSchema>
export type CommonAreaUpdateInput = z.infer<typeof commonAreaUpdateSchema>
