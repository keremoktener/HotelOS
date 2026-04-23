import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { getTenantId } from '@/lib/auth'
import { db } from '@/lib/db'
import { PageHeader } from '@/components/layout/page-header'
import { DashboardClient } from './_components/dashboard-client'

async function getData(tenantId: string) {
  const today = new Date(); today.setHours(0, 0, 0, 0)
  const tomorrow = new Date(today); tomorrow.setDate(today.getDate() + 1)

  const [totalRooms, checkedIn, arrivals, departures, urgentFaults, roomStatuses] = await Promise.all([
    db.room.count({ where: { tenantId } }),
    db.reservation.count({ where: { tenantId, status: 'CHECKEDIN' } }),
    db.reservation.findMany({
      where: { tenantId, checkIn: { gte: today, lt: tomorrow }, status: { in: ['WAITING', 'CONFIRMED'] } },
      include: { guest: true, room: { include: { roomType: true } } },
      orderBy: { checkIn: 'asc' },
      take: 20,
    }),
    db.reservation.findMany({
      where: { tenantId, checkOut: { gte: today, lt: tomorrow }, status: 'CHECKEDIN' },
      include: { guest: true, room: { include: { roomType: true } } },
      orderBy: { checkOut: 'asc' },
      take: 20,
    }),
    db.faultReport.count({ where: { tenantId, priority: 'URGENT', status: { in: ['OPEN', 'IN_PROGRESS'] } } }).catch(() => 0),
    db.room.groupBy({ by: ['status'], where: { tenantId }, _count: true }),
  ])

  return { totalRooms, checkedIn, arrivals, departures, urgentFaults, roomStatuses }
}

export default async function DashboardPage() {
  const { userId, orgId } = await auth()
  if (!userId) redirect('/sign-in')
  if (!orgId) redirect('/onboarding')
  const tenantId = await getTenantId(orgId)
  if (!tenantId) redirect('/onboarding')

  const data = await getData(tenantId)
  const occPct = data.totalRooms > 0 ? Math.round((data.checkedIn / data.totalRooms) * 100) : 0

  const plain = {
    totalRooms: data.totalRooms,
    checkedIn: data.checkedIn,
    arrivals: data.arrivals.map(r => ({
      id: r.id, status: r.status, checkIn: r.checkIn.toISOString(), checkOut: r.checkOut.toISOString(),
      guest: { firstName: r.guest.firstName, lastName: r.guest.lastName },
      room: r.room ? { number: r.room.number, typeName: r.room.roomType.name, status: r.room.status } : null,
    })),
    departures: data.departures.map(r => ({
      id: r.id, checkIn: r.checkIn.toISOString(), checkOut: r.checkOut.toISOString(),
      guest: { firstName: r.guest.firstName, lastName: r.guest.lastName },
      room: r.room ? { number: r.room.number } : null,
    })),
    urgentFaults: data.urgentFaults,
    occPct,
    roomStatuses: data.roomStatuses.map(s => ({ status: s.status, count: s._count })),
  }

  return (
    <>
      <PageHeader title="Özet" breadcrumb={new Date().toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric', weekday: 'long' })}/>
      <DashboardClient data={plain}/>
    </>
  )
}
