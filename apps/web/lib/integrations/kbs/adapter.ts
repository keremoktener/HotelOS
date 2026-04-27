import { logger } from '@/lib/logger'
import type { KbsJobData } from './types'

// Jandarma KBS (Kimlik Bildirme Sistemi) adapter.
// Real endpoint and credentials are supplied via env vars.
// When KBS_ENDPOINT is absent the adapter is a no-op so dev/staging don't fail.
export async function sendKbsNotification(data: KbsJobData): Promise<void> {
  const endpoint = process.env.KBS_ENDPOINT
  const username = process.env.KBS_USERNAME
  const password = process.env.KBS_PASSWORD

  if (!endpoint || !username || !password) {
    logger.debug({ reservationId: data.reservationId }, 'kbs:adapter-noop — credentials not configured')
    return
  }

  const payload = {
    username,
    password,
    reservationId: data.reservationId,
    firstName: data.guestFirstName,
    lastName: data.guestLastName,
    tcId: data.guestTcId ?? undefined,
    passportNo: data.guestPassportNo ?? undefined,
    nationality: data.guestNationality ?? 'TR',
    dateOfBirth: data.guestDateOfBirth?.toISOString().slice(0, 10),
    roomNumber: data.roomNumber,
    checkIn: data.checkIn.toISOString(),
  }

  const res = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
    signal: AbortSignal.timeout(15_000),
  })

  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new Error(`KBS responded ${res.status}: ${text.slice(0, 200)}`)
  }

  logger.info({ reservationId: data.reservationId }, 'kbs:notification-sent')
}
