import { z } from 'zod'

export const guestCreateSchema = z.object({
  firstName: z.string().min(1).max(100),
  lastName: z.string().min(1).max(100),
  tcId: z.string().length(11).optional(),
  passportNo: z.string().max(30).optional(),
  phone: z.string().max(20).optional(),
  email: z.string().email().optional(),
  nationality: z.string().max(50).optional(),
  dateOfBirth: z.date().optional(),
  kvkkConsent: z.boolean().default(false),
})

export const guestUpdateSchema = guestCreateSchema.partial()

export const guestSearchSchema = z.object({
  query: z.string().min(1),
})

export type GuestCreateInput = z.infer<typeof guestCreateSchema>
export type GuestUpdateInput = z.infer<typeof guestUpdateSchema>
