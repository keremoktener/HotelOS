import { z } from 'zod'

export const linenLogSchema = z.object({
  roomId: z.string().uuid(),
  sentCount: z.number().int().min(0),
  returnedCount: z.number().int().min(0),
  date: z.coerce.date(),
})

export type LinenLogInput = z.infer<typeof linenLogSchema>
