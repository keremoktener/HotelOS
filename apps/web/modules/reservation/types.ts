import { z } from 'zod'
import { ReservationStatus, PaymentMethod } from '@prisma/client'

export const reservationStatusSchema = z.nativeEnum(ReservationStatus)

export const reservationCreateSchema = z.object({
  guestId: z.string().uuid(),
  roomId: z.string().uuid(),
  agencyId: z.string().uuid().optional(),
  checkIn: z.date(),
  checkOut: z.date(),
  adults: z.number().int().min(1).max(20).default(1),
  children: z.number().int().min(0).max(10).default(0),
  notes: z.string().max(1000).optional(),
  specialRequests: z.string().max(1000).optional(),
})

export const reservationUpdateSchema = reservationCreateSchema.partial().omit({
  guestId: true,
  roomId: true,
})

export const reservationFiltersSchema = z.object({
  status: reservationStatusSchema.optional(),
  dateRangeFrom: z.date().optional(),
  dateRangeTo: z.date().optional(),
  guestName: z.string().optional(),
  agencyId: z.string().uuid().optional(),
  page: z.number().int().min(1).default(1),
  pageSize: z.number().int().min(1).max(100).default(20),
})

export const pricePreviewSchema = z.object({
  guestCount: z.number().int().min(1).max(20),
  checkIn: z.date(),
  checkOut: z.date(),
  agencyId: z.string().uuid().optional(),
})

export const paymentCreateSchema = z.object({
  reservationId: z.string().uuid(),
  amount: z.number().int().min(1),
  method: z.nativeEnum(PaymentMethod),
  reference: z.string().optional(),
  paidAt: z.date().optional(),
})

export type ReservationCreateInput = z.infer<typeof reservationCreateSchema>
export type ReservationUpdateInput = z.infer<typeof reservationUpdateSchema>
export type ReservationFilters = z.infer<typeof reservationFiltersSchema>
export type PricePreviewInput = z.infer<typeof pricePreviewSchema>
