import { z } from 'zod'
import { FaultPriority, FaultStatus } from '@prisma/client'

export const faultCreateSchema = z.object({
  location: z.string().min(1).max(200),
  description: z.string().min(1).max(1000),
  priority: z.nativeEnum(FaultPriority).default('NORMAL'),
  reportedBy: z.string().min(1).max(100),
  assignedTo: z.string().max(100).optional(),
})

export const faultUpdateSchema = z.object({
  status: z.nativeEnum(FaultStatus).optional(),
  assignedTo: z.string().max(100).optional(),
  cannotFixReason: z.string().max(500).optional(),
})

export const faultFiltersSchema = z.object({
  status: z.nativeEnum(FaultStatus).optional(),
  priority: z.nativeEnum(FaultPriority).optional(),
})

export type FaultCreateInput = z.infer<typeof faultCreateSchema>
export type FaultUpdateInput = z.infer<typeof faultUpdateSchema>
export type FaultFilters = z.infer<typeof faultFiltersSchema>
