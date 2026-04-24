import { z } from 'zod'
import { RoomStatus } from '@prisma/client'

export const roomStatusSchema = z.nativeEnum(RoomStatus)

export const roomTypeCreateSchema = z.object({
  name: z.string().min(1).max(100),
  capacity: z.number().int().min(1).max(20),
  basePrice: z.number().int().min(0),
  minPhotosRequired: z.number().int().min(0).max(20).default(2),
})

export const roomCreateSchema = z.object({
  number: z.string().min(1).max(20),
  typeId: z.string().uuid(),
  floor: z.number().int().min(0).max(200).optional(),
  view: z.string().max(100).optional(),
  features: z.array(z.string()).default([]),
})

export const roomUpdateSchema = z.object({
  number: z.string().min(1).max(20).optional(),
  typeId: z.string().uuid().optional(),
  floor: z.number().int().min(0).max(200).nullable().optional(),
})

export const roomUpdateStatusSchema = z.object({
  id: z.string().uuid(),
  status: roomStatusSchema,
  faultDetail: z.string().optional(),
})

export const roomFiltersSchema = z.object({
  status: roomStatusSchema.optional(),
  typeId: z.string().uuid().optional(),
  floor: z.number().int().optional(),
})

export type RoomTypeCreateInput = z.infer<typeof roomTypeCreateSchema>
export type RoomCreateInput = z.infer<typeof roomCreateSchema>
export type RoomFilters = z.infer<typeof roomFiltersSchema>
