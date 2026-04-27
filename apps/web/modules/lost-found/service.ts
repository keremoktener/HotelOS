import * as repo from './repository'
import type { LafCreateInput, LafUpdateInput } from './types'

export function listItems(tenantId: string, onlyUnclaimed = false) {
  return repo.listItems(tenantId, onlyUnclaimed)
}

export function createItem(tenantId: string, data: LafCreateInput) {
  return repo.createItem(tenantId, data)
}

export function updateItem(tenantId: string, id: string, data: LafUpdateInput) {
  return repo.updateItem(tenantId, id, data)
}

export function getStats(tenantId: string) {
  return repo.getStats(tenantId)
}
