import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { getTenantId } from '@/lib/auth'
import Link from 'next/link'
import { db } from '@/lib/db'
import { formatDate, formatCurrency } from '@/lib/utils'
import { Plus } from 'lucide-react'
import type { ReservationStatus } from '@prisma/client'

const STATUS_LABELS: Record<ReservationStatus, string> = {
  WAITING: 'Bekliyor',
  CONFIRMED: 'Onaylandı',
  CHECKEDIN: 'Girişte',
  CHECKEDOUT: 'Çıkış',
  CANCELLED: 'İptal',
  NOSHOW: 'Gelmedi',
}

const STATUS_COLORS: Record<ReservationStatus, string> = {
  WAITING: 'bg-yellow-100 text-yellow-800',
  CONFIRMED: 'bg-blue-100 text-blue-800',
  CHECKEDIN: 'bg-green-100 text-green-800',
  CHECKEDOUT: 'bg-gray-100 text-gray-800',
  CANCELLED: 'bg-red-100 text-red-800',
  NOSHOW: 'bg-orange-100 text-orange-800',
}

export default async function ReservationListPage({
  searchParams,
}: {
  searchParams: { status?: string; page?: string }
}) {
  const { userId, orgId } = await auth()
  if (!userId) redirect('/sign-in')
  if (!orgId) redirect('/onboarding')

  const tenantId = await getTenantId(orgId)
  if (!tenantId) redirect('/onboarding')

  const page = Number(searchParams.page ?? 1)
  const pageSize = 20
  const skip = (page - 1) * pageSize
  const status = searchParams.status as ReservationStatus | undefined

  const where = {
    tenantId,
    ...(status && { status }),
  }

  const [reservations, total] = await Promise.all([
    db.reservation.findMany({
      where,
      include: { guest: true, room: { include: { type: true } }, payments: true },
      orderBy: { checkIn: 'desc' },
      skip,
      take: pageSize,
    }),
    db.reservation.count({ where }),
  ])

  const totalPages = Math.ceil(total / pageSize)

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Rezervasyonlar</h1>
        <Link
          href="/reservation/new"
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
        >
          <Plus className="w-4 h-4" />
          Yeni Rezervasyon
        </Link>
      </div>

      {/* Status filter */}
      <div className="flex gap-2 flex-wrap">
        <Link
          href="/reservation"
          className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${!status ? 'bg-blue-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}
        >
          Tümü
        </Link>
        {Object.entries(STATUS_LABELS).map(([key, label]) => (
          <Link
            key={key}
            href={`/reservation?status=${key}`}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${status === key ? 'bg-blue-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}
          >
            {label}
          </Link>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-gray-600">
            <tr>
              <th className="text-left px-4 py-3 font-medium">Misafir</th>
              <th className="text-left px-4 py-3 font-medium">Oda</th>
              <th className="text-left px-4 py-3 font-medium">Giriş</th>
              <th className="text-left px-4 py-3 font-medium">Çıkış</th>
              <th className="text-left px-4 py-3 font-medium">Tutar</th>
              <th className="text-left px-4 py-3 font-medium">Durum</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {reservations.map((r) => (
              <tr key={r.id} className="hover:bg-gray-50">
                <td className="px-4 py-3">
                  <Link href={`/reservation/${r.id}`} className="font-medium text-blue-600 hover:underline">
                    {r.guest.firstName} {r.guest.lastName}
                  </Link>
                </td>
                <td className="px-4 py-3 text-gray-600">
                  {r.room.number} — {r.room.type.name}
                </td>
                <td className="px-4 py-3 text-gray-600">{formatDate(r.checkIn)}</td>
                <td className="px-4 py-3 text-gray-600">{formatDate(r.checkOut)}</td>
                <td className="px-4 py-3 text-gray-700 font-medium">{formatCurrency(r.totalPrice)}</td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-1 rounded-md text-xs font-medium ${STATUS_COLORS[r.status]}`}>
                    {STATUS_LABELS[r.status]}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {reservations.length === 0 && (
          <div className="text-center py-12 text-gray-400">Rezervasyon bulunamadı.</div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center gap-2">
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
            <Link
              key={p}
              href={`/reservation?page=${p}${status ? `&status=${status}` : ''}`}
              className={`px-3 py-1.5 rounded text-sm ${p === page ? 'bg-blue-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}
            >
              {p}
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
