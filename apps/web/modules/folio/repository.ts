import { db } from '@/lib/db'

export function listLines(tenantId: string, reservationId: string) {
  return db.folioLine.findMany({
    where: { tenantId, reservationId },
    orderBy: { lineDate: 'asc' },
  })
}

export function addLine(tenantId: string, data: {
  reservationId: string
  description: string
  source: string
  amountKurus: number
  lineDate?: Date
}) {
  return db.folioLine.create({ data: { tenantId, ...data } })
}

export function removeLine(tenantId: string, id: string) {
  return db.folioLine.delete({ where: { id, tenantId } })
}

export function listPayments(reservationId: string) {
  return db.reservationPayment.findMany({
    where: { reservationId },
    orderBy: { paidAt: 'asc' },
  })
}

export async function getFolioSummary(tenantId: string, reservationId: string) {
  const [lines, payments] = await Promise.all([
    listLines(tenantId, reservationId),
    listPayments(reservationId),
  ])
  const totalCharges = lines.reduce((s, l) => s + l.amountKurus, 0)
  const totalPaid = payments.reduce((s, p) => s + p.amount, 0)
  return { totalCharges, totalPaid, balance: totalCharges - totalPaid }
}
