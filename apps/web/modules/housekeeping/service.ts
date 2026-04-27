import { TRPCError } from '@trpc/server'
import { db } from '@/lib/db'
import * as repo from './repository'
import type { HKTaskCreateInput, HKTaskFilters, HKTaskUpdateInput } from './types'

export async function listTasks(tenantId: string, filters: HKTaskFilters) {
  return repo.listTasks(tenantId, filters)
}

export async function createTask(tenantId: string, data: HKTaskCreateInput) {
  if (data.roomId) {
    const room = await db.room.findFirst({ where: { id: data.roomId, tenantId } })
    if (!room) throw new TRPCError({ code: 'NOT_FOUND', message: 'Room not found' })
  }
  return repo.createTask(tenantId, data)
}

export async function updateTask(tenantId: string, id: string, data: HKTaskUpdateInput) {
  const task = await db.hKTask.findFirst({ where: { id, tenantId } })
  if (!task) throw new TRPCError({ code: 'NOT_FOUND', message: 'Task not found' })
  if (task.status === 'DONE' && data.status && data.status !== 'DONE') {
    throw new TRPCError({ code: 'BAD_REQUEST', message: 'Completed tasks cannot be reopened' })
  }
  return repo.updateTask(tenantId, id, data)
}

export async function getStats(tenantId: string) {
  return repo.getStats(tenantId)
}

// Called by checkout flow: create cleaning task for vacated room
export async function createCheckoutTask(tenantId: string, roomId: string) {
  return repo.createTask(tenantId, { roomId, type: 'ROOM', notes: 'Çıkış temizliği' })
}
