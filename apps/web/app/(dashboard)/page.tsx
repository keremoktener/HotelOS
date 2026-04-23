import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { getTenantId } from '@/lib/auth'
import { db } from '@/lib/db'
import { formatDate } from '@/lib/utils'
import { StatCard, GuestList } from './_components/stat-card'

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
        <StatCard title="Doluluk Oranı" value={`%${occupancyRate}`} sub={`${data.checkedIn} / ${data.totalRooms} oda`} iconName="BedDouble" color="blue" />
        <StatCard title="Bugün Giriş" value={String(data.arrivals.length)} sub="beklenen" iconName="LogIn" color="green" />
        <StatCard title="Bugün Çıkış" value={String(data.departures.length)} sub="beklenen" iconName="LogOut" color="orange" />
        <StatCard title="Acil Arızalar" value={String(data.urgentFaults)} sub="bekleyen" iconName="AlertTriangle" color="red" />
      </div>

      {/* Today's arrivals & departures */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <GuestList title="Bugün Giriş Yapacaklar" reservations={data.arrivals} type="arrival" />
        <GuestList title="Bugün Çıkış Yapacaklar" reservations={data.departures} type="departure" />
      </div>
    </div>
  )
}

