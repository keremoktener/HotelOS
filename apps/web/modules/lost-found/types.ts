import { z } from 'zod'

export const lafCreateSchema = z.object({
  roomId: z.string().uuid().optional(),
  guestId: z.string().uuid().optional(),
  description: z.string().min(1).max(500),
  foundBy: z.string().min(1).max(100),
  foundAt: z.coerce.date(),
})

export const lafUpdateSchema = z.object({
  returnedAt: z.coerce.date().optional(),
  guestId: z.string().uuid().optional().nullable(),
  description: z.string().min(1).max(500).optional(),
})

export type LafCreateInput = z.infer<typeof lafCreateSchema>
export type LafUpdateInput = z.infer<typeof lafUpdateSchema>
