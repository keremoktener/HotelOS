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

const TR_MONTHS = ['Oca','Şub','Mar','Nis','May','Haz','Tem','Ağu','Eyl','Eki','Kas','Ara']

/** Short Turkish date: "26 Nis" or "26 Nis 2026" with withYear=true */
export function trDate(iso: string, withYear = false): string {
  const d = new Date(iso)
  const base = `${d.getDate()} ${TR_MONTHS[d.getMonth()]}`
  return withYear ? `${base} ${d.getFullYear()}` : base
}

/** Display currency in Turkish format: "1.234,56 ₺" */
export function displayCurrency(kurus: number): string {
  return (kurus / 100).toLocaleString('tr-TR', { minimumFractionDigits: 0, maximumFractionDigits: 2 }) + ' ₺'
}
