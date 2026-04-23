import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'
import dayjs from 'dayjs'
import utc from 'dayjs/plugin/utc'
import timezone from 'dayjs/plugin/timezone'

dayjs.extend(utc)
dayjs.extend(timezone)

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// All monetary values are stored as integers (kuruş = 1/100 TRY)
export function formatCurrency(kurus: number): string {
  return new Intl.NumberFormat('tr-TR', {
    style: 'currency',
    currency: 'TRY',
    minimumFractionDigits: 2,
  }).format(kurus / 100)
}

export function kurusToLira(kurus: number): number {
  return kurus / 100
}

export function liraToKurus(lira: number): number {
  return Math.round(lira * 100)
}

// Display dates in Istanbul timezone
export function formatDate(date: Date | string, format = 'DD.MM.YYYY'): string {
  return dayjs(date).tz('Europe/Istanbul').format(format)
}

export function formatDateTime(date: Date | string): string {
  return dayjs(date).tz('Europe/Istanbul').format('DD.MM.YYYY HH:mm')
}

export function calculateNights(checkIn: Date, checkOut: Date): number {
  return dayjs(checkOut).diff(dayjs(checkIn), 'day')
}
