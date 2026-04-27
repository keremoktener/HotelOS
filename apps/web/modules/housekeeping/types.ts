import { z } from 'zod'
import { HKTaskStatus, HKTaskType } from '@prisma/client'

export const hkTaskCreateSchema = z.object({
  roomId: z.string().uuid().optional(),
  type: z.nativeEnum(HKTaskType).default('ROOM'),
  assignedUserId: z.string().uuid().optional(),
  notes: z.string().max(500).optional(),
})

export const hkTaskUpdateSchema = z.object({
  status: z.nativeEnum(HKTaskStatus).optional(),
  assignedUserId: z.string().uuid().optional(),
  notes: z.string().max(500).optional(),
  durationMinutes: z.number().int().min(0).optional(),
})

export const hkTaskFiltersSchema = z.object({
  status: z.nativeEnum(HKTaskStatus).optional(),
  type: z.nativeEnum(HKTaskType).optional(),
})

export type HKTaskCreateInput = z.infer<typeof hkTaskCreateSchema>
export type HKTaskUpdateInput = z.infer<typeof hkTaskUpdateSchema>
export type HKTaskFilters = z.infer<typeof hkTaskFiltersSchema>
