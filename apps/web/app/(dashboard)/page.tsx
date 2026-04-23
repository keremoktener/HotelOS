import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { getTenantId } from '@/lib/auth'
import { db } from '@/lib/db'
import { formatDate } from '@/lib/utils'
import { BedDouble, LogIn, LogOut, AlertTriangle } from 'lucide-react'

async function getDashboardData(tenantId: string) {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const tomorrow = new Date(today)
  tomorrow.setDate(tomorrow.getDate() + 1)

  const [totalRooms, roomsByStatus, arrivals, departures, urgentFaults] = await Promise.all([
    db.room.count({ where: { tenantId } }),
    db.room.groupBy({ by: ['status'], where: { tenantId }, _count: true }),
    db.reservation.findMany({
      where: { tenantId, checkIn: { gte: today, lt: tomorrow }, status: { in: ['WAITING', 'CONFIRMED'] } },
      include: { guest: true, room: { include: { type: true } } },
      orderBy: { checkIn: 'asc' },
    }),
    db.reservation.findMany({
      where: { tenantId, checkOut: { gte: today, lt: tomorrow }, status: 'CHECKEDIN' },
      include: { guest: true, room: { include: { type: true } } },
      orderBy: { checkOut: 'asc' },
    }),
    db.faultReport.count({ where: { tenantId, priority: 'URGENT', status: { in: ['OPEN', 'IN_PROGRESS'] } } }),
  ])

  const occupiedCount = roomsByStatus.find(r => r.status === 'DIRTY' || r.status === 'CLEAN')
  const checkedIn = await db.reservation.count({
    where: { tenantId, status: 'CHECKEDIN' },
  })

  return { totalRooms, checkedIn, arrivals, departures, urgentFaults, roomsByStatus }
}

export default async function DashboardPage() {
  const { userId, orgId } = await auth()
  if (!userId) redirect('/sign-in')
  if (!orgId) redirect('/onboarding')

  const tenantId = await getTenantId(orgId)
  if (!tenantId) redirect('/onboarding')

  const data = await getDashboardData(tenantId)
  const occupancyRate = data.totalRooms > 0
    ? Math.round((data.checkedIn / data.totalRooms) * 100)
    : 0

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Panel</h1>
        <p className="text-gray-500">{formatDate(new Date(), 'DD MMMM YYYY, dddd')}</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard
          title="Doluluk Oranı"
          value={`%${occupancyRate}`}
          sub={`${data.checkedIn} / ${data.totalRooms} oda`}
          icon={<BedDouble className="w-5 h-5 text-blue-500" />}
          color="blue"
        />
        <StatCard
          title="Bugün Giriş"
          value={String(data.arrivals.length)}
          sub="beklenen"
          icon={<LogIn className="w-5 h-5 text-green-500" />}
          color="green"
        />
        <StatCard
          title="Bugün Çıkış"
          value={String(data.departures.length)}
          sub="beklenen"
          icon={<LogOut className="w-5 h-5 text-orange-500" />}
          color="orange"
        />
        <StatCard
          title="Acil Arızalar"
          value={String(data.urgentFaults)}
          sub="bekleyen"
          icon={<AlertTriangle className="w-5 h-5 text-red-500" />}
          color="red"
        />
      </div>

      {/* Today's arrivals & departures */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <GuestList title="Bugün Giriş Yapacaklar" reservations={data.arrivals} type="arrival" />
        <GuestList title="Bugün Çıkış Yapacaklar" reservations={data.departures} type="departure" />
      </div>
    </div>
  )
}

function StatCard({ title, value, sub, icon, color }: {
  title: string; value: string; sub: string; icon: React.ReactNode; color: string
}) {
  const colorMap: Record<string, string> = {
    blue: 'bg-blue-50', green: 'bg-green-50', orange: 'bg-orange-50', red: 'bg-red-50',
  }
  return (
    <div className={`${colorMap[color] ?? 'bg-gray-50'} rounded-xl p-4 flex items-start gap-3`}>
      <div className="mt-0.5">{icon}</div>
      <div>
        <p className="text-sm text-gray-500">{title}</p>
        <p className="text-2xl font-bold text-gray-900">{value}</p>
        <p className="text-xs text-gray-400">{sub}</p>
      </div>
    </div>
  )
}

function GuestList({ title, reservations, type }: {
  title: string
  reservations: Array<{ id: string; guest: { firstName: string; lastName: string }; room: { number: string; type: { name: string } } }>
  type: 'arrival' | 'departure'
}) {
  return (
    <div className="bg-white rounded-xl shadow-sm p-5">
      <h2 className="font-semibold text-gray-800 mb-3">{title}</h2>
      {reservations.length === 0 ? (
        <p className="text-sm text-gray-400">Kayıt yok</p>
      ) : (
        <ul className="space-y-2">
          {reservations.map(r => (
            <li key={r.id} className="flex items-center justify-between text-sm">
              <span className="text-gray-800 font-medium">
                {r.guest.firstName} {r.guest.lastName}
              </span>
              <span className="text-gray-500">
                Oda {r.room.number} — {r.room.type.name}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
