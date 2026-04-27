import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import dayjs from 'dayjs'
import { getTenantId } from '@/lib/auth'
import { db } from '@/lib/db'
import { PageHeader } from '@/components/layout/page-header'
import { HkBoardClient } from './_components/hk-board-client'

export const dynamic = 'force-dynamic'

export default async function HkBoardPage() {
  const { userId, orgId } = await auth()
  if (!userId) redirect('/sign-in')
  if (!orgId) redirect('/onboarding')
  const tenantId = await getTenantId(orgId)
  if (!tenantId) redirect('/onboarding')

  const today = dayjs().startOf('day').toDate()
  const tomorrow = dayjs().endOf('day').toDate()

  const [tasks, rooms, arrivals] = await Promise.all([
    db.hKTask.findMany({
      where: { tenantId, type: 'ROOM', createdAt: { gte: today, lte: tomorrow } },
      include: { room: { include: { roomType: true } } },
      orderBy: [{ room: { floor: 'asc' } }, { room: { number: 'asc' } }],
    }),
    db.room.findMany({
      where: { tenantId },
      include: { roomType: true },
      orderBy: [{ floor: 'asc' }, { number: 'asc' }],
    }),
    db.reservation.findMany({
      where: { tenantId, checkIn: { gte: today, lte: tomorrow }, status: { in: ['WAITING', 'CONFIRMED'] } },
      select: { roomId: true, checkIn: true },
    }),
  ])

  const arrivalRoomIds = new Set(arrivals.map(a => a.roomId))

  const plain = tasks.map(t => ({
    id: t.id,
    status: t.status,
    assignedUserId: t.assignedUserId ?? null,
    notes: t.notes ?? '',
    startedAt: t.startedAt?.toISOString() ?? null,
    completedAt: t.completedAt?.toISOString() ?? null,
    durationMinutes: t.durationMinutes ?? null,
    room: t.room ? {
      id: t.room.id,
      number: t.room.number,
      floor: t.room.floor ?? 0,
      status: t.room.status,
      faultDetail: t.room.faultDetail ?? null,
      typeName: t.room.roomType.name,
    } : null,
    isArrivalRoom: t.room ? arrivalRoomIds.has(t.room.id) : false,
  }))

  // Rooms with FAULTY status that have no task today
  const taskRoomIds = new Set(tasks.map(t => t.roomId).filter(Boolean))
  const faultyRooms = rooms
    .filter(r => r.status === 'FAULTY' && !taskRoomIds.has(r.id))
    .map(r => ({
      id: r.id, number: r.number, floor: r.floor ?? 0,
      typeName: r.roomType.name, faultDetail: r.faultDetail ?? null,
    }))

  return (
    <>
      <PageHeader title="Süpervizör Panosu" subtitle={`${dayjs().format('D MMMM YYYY, dddd')} · ${plain.length} görev`}/>
      <HkBoardClient tasks={plain} faultyRooms={faultyRooms}/>
    </>
  )
}
