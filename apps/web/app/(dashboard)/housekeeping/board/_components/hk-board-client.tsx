'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { trpc } from '@/lib/trpc/client'

// ─── types ───────────────────────────────────────────────────────────────────
interface Room { id: string; number: string; floor: number; status: string; faultDetail: string | null; typeName: string }
interface Task {
  id: string; status: string; assignedUserId: string | null; notes: string
  startedAt: string | null; completedAt: string | null; durationMinutes: number | null
  room: Room | null; isArrivalRoom: boolean
}
interface FaultyRoom { id: string; number: string; floor: number; typeName: string; faultDetail: string | null }
interface Props { tasks: Task[]; faultyRooms: FaultyRoom[] }

type View = 'grid' | 'queue' | 'route'

// ─── board status derivation ─────────────────────────────────────────────────
type BoardStatus = 'DIRTY' | 'IN_PROGRESS' | 'CLEAN' | 'BLOCKED' | 'ARRIVAL'

function deriveStatus(t: Task): BoardStatus {
  if (t.room?.status === 'FAULTY') return 'BLOCKED'
  if (t.status === 'IN_PROGRESS') return 'IN_PROGRESS'
  if (t.status === 'DONE') return 'CLEAN'
  if (t.isArrivalRoom) return 'ARRIVAL'
  return 'DIRTY'
}

const STAT: Record<BoardStatus, { fg: string; bg: string; label: string; borderColor: string }> = {
  DIRTY:       { fg: 'var(--warn)', bg: 'var(--warn-bg)', label: 'Kirli', borderColor: 'var(--warn)' },
  IN_PROGRESS: { fg: 'var(--info)', bg: 'var(--info-bg)', label: 'Temizleniyor', borderColor: 'var(--info)' },
  CLEAN:       { fg: 'var(--good)', bg: 'var(--good-bg)', label: 'Temiz', borderColor: 'var(--good)' },
  BLOCKED:     { fg: 'var(--bad)',  bg: 'var(--bad-bg)',  label: 'Arızalı', borderColor: 'var(--bad)' },
  ARRIVAL:     { fg: '#7c3aed', bg: '#f5f3ff', label: 'Bekleyen giriş', borderColor: '#7c3aed' },
}

function initials(id: string | null): string {
  if (!id) return '—'
  return id.split(/\s+/).map(w => w[0]).join('').slice(0, 2).toUpperCase()
}

// ─── pill row ─────────────────────────────────────────────────────────────────
function PillRow({ value, onChange }: { value: View; onChange: (v: View) => void }) {
  const opts: { v: View; label: string }[] = [
    { v: 'grid', label: 'Kat' },
    { v: 'queue', label: 'Kuyruk' },
    { v: 'route', label: 'Rota' },
  ]
  return (
    <div style={{ display: 'inline-flex', background: 'var(--surface)', border: '1px solid var(--border-c)', borderRadius: 6, padding: 2 }}>
      {opts.map(o => (
        <button key={o.v} onClick={() => onChange(o.v)} style={{
          height: 22, padding: '0 10px', borderRadius: 4, border: 0, cursor: 'pointer', fontSize: 11.5,
          fontWeight: value === o.v ? 600 : 500,
          background: value === o.v ? 'var(--surface-2)' : 'transparent',
          color: value === o.v ? 'var(--text)' : 'var(--text-2)',
        }}>{o.label}</button>
      ))}
    </div>
  )
}

// ─── tally badge ─────────────────────────────────────────────────────────────
function Tally({ tone, label, count }: { tone: BoardStatus; label: string; count: number }) {
  const c = STAT[tone]
  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '0 10px', height: 28, background: 'var(--surface)', border: '1px solid var(--border-c)', borderRadius: 6 }}>
      <span style={{ width: 8, height: 8, borderRadius: 2, background: c.fg }}/>
      <span style={{ fontSize: 11.5, color: 'var(--text-2)' }}>{label}</span>
      <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text)' }}>{count}</span>
    </div>
  )
}

// ─── grid view ───────────────────────────────────────────────────────────────
function GridView({ tasks, faultyRooms }: { tasks: Task[]; faultyRooms: FaultyRoom[] }) {
  const router = useRouter()
  const updateMut = trpc.hk.update.useMutation({ onSuccess: () => router.refresh() })

  const floors = Array.from(new Set(tasks.map(t => t.room?.floor ?? 0))).sort((a, b) => a - b)

  function RoomCard({ task }: { task: Task }) {
    const bs = deriveStatus(task)
    const s = STAT[bs]
    const room = task.room!
    return (
      <div style={{
        position: 'relative', width: 132, padding: '10px 12px',
        background: 'var(--surface)', border: `1px solid var(--border-c)`,
        borderLeft: `3px solid ${s.fg}`, borderRadius: 6,
        boxShadow: 'var(--shadow-sm)', cursor: 'pointer',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
          <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: 14, color: 'var(--text)' }}>{room.number}</div>
          {task.durationMinutes && bs === 'IN_PROGRESS' && (
            <div style={{ fontSize: 10, fontFamily: 'var(--font-mono)', color: s.fg, fontWeight: 600 }}>{task.durationMinutes} dk</div>
          )}
        </div>
        <div style={{ display: 'inline-block', fontSize: 10.5, fontWeight: 600, padding: '1px 6px', borderRadius: 3, background: s.bg, color: s.fg, marginBottom: 4 }}>
          {s.label}
        </div>
        {task.assignedUserId && <div style={{ fontSize: 11, color: 'var(--text-2)', marginTop: 2 }}>{task.assignedUserId}</div>}
        {task.notes && <div style={{ fontSize: 10.5, color: 'var(--text-3)', marginTop: 1 }}>{task.notes}</div>}
        {room.faultDetail && <div style={{ fontSize: 10.5, color: 'var(--bad)', marginTop: 2, fontWeight: 500 }}>↯ {room.faultDetail}</div>}
        {bs === 'DIRTY' && (
          <button
            onClick={e => { e.stopPropagation(); updateMut.mutate({ id: task.id, data: { status: 'IN_PROGRESS' } }) }}
            style={{ marginTop: 6, width: '100%', padding: '4px', background: 'var(--accent-c)', color: 'var(--accent-fg)', border: 'none', borderRadius: 4, fontSize: 10, fontWeight: 600, cursor: 'pointer' }}
          >Başlat</button>
        )}
        {bs === 'IN_PROGRESS' && (
          <button
            onClick={e => { e.stopPropagation(); updateMut.mutate({ id: task.id, data: { status: 'DONE' } }) }}
            style={{ marginTop: 6, width: '100%', padding: '4px', background: 'var(--good)', color: '#fff', border: 'none', borderRadius: 4, fontSize: 10, fontWeight: 600, cursor: 'pointer' }}
          >Tamamla</button>
        )}
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      {floors.map(floor => {
        const floorTasks = tasks.filter(t => (t.room?.floor ?? 0) === floor && t.room)
        return (
          <div key={floor} style={{ background: 'var(--surface)', border: '1px solid var(--border-c)', borderRadius: 10, padding: '14px 16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
              <div style={{ width: 30, height: 24, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--accent-c)', color: 'var(--accent-fg)', borderRadius: 4, fontSize: 11, fontWeight: 700, fontFamily: 'var(--font-mono)' }}>K{floor}</div>
              <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>Kat {floor}</div>
              <div style={{ fontSize: 11, color: 'var(--text-3)' }}>· {floorTasks.length} oda</div>
            </div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {floorTasks.map(t => <RoomCard key={t.id} task={t}/>)}
              {faultyRooms.filter(r => r.floor === floor).map(r => (
                <div key={r.id} style={{ width: 132, padding: '10px 12px', background: 'var(--surface)', border: '1px solid var(--border-c)', borderLeft: '3px solid var(--bad)', borderRadius: 6, boxShadow: 'var(--shadow-sm)' }}>
                  <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: 14, color: 'var(--text)', marginBottom: 6 }}>{r.number}</div>
                  <div style={{ display: 'inline-block', fontSize: 10.5, fontWeight: 600, padding: '1px 6px', borderRadius: 3, background: 'var(--bad-bg)', color: 'var(--bad)', marginBottom: 4 }}>Arızalı</div>
                  {r.faultDetail && <div style={{ fontSize: 10.5, color: 'var(--bad)', fontWeight: 500 }}>↯ {r.faultDetail}</div>}
                </div>
              ))}
            </div>
          </div>
        )
      })}
    </div>
  )
}

// ─── queue view (kanban) ─────────────────────────────────────────────────────
function QueueView({ tasks, faultyRooms }: { tasks: Task[]; faultyRooms: FaultyRoom[] }) {
  const router = useRouter()
  const updateMut = trpc.hk.update.useMutation({ onSuccess: () => router.refresh() })

  const cols: { key: BoardStatus; label: string }[] = [
    { key: 'DIRTY', label: 'Kirli' },
    { key: 'IN_PROGRESS', label: 'Temizleniyor' },
    { key: 'CLEAN', label: 'Temiz' },
    { key: 'BLOCKED', label: 'Arızalı' },
  ]

  const grouped: Record<BoardStatus, Task[]> = { DIRTY: [], IN_PROGRESS: [], CLEAN: [], BLOCKED: [], ARRIVAL: [] }
  tasks.filter(t => t.room).forEach(t => grouped[deriveStatus(t)].push(t))

  function KanbanCard({ task, col }: { task: Task; col: BoardStatus }) {
    const room = task.room!
    const s = STAT[col]
    return (
      <div style={{ background: 'var(--surface)', border: '1px solid var(--border-c)', borderRadius: 6, padding: '10px 12px', boxShadow: 'var(--shadow-sm)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: 13.5, color: 'var(--text)' }}>{room.number}</span>
            <span style={{ fontSize: 11, color: 'var(--text-3)' }}>K{room.floor} · {room.typeName}</span>
          </div>
          {task.durationMinutes && col === 'IN_PROGRESS' && (
            <span style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: s.fg, fontWeight: 600, padding: '1px 6px', background: s.bg, borderRadius: 4 }}>{task.durationMinutes} dk</span>
          )}
        </div>
        {task.notes && <div style={{ fontSize: 11.5, color: 'var(--text-2)', marginTop: 2 }}>{task.notes}</div>}
        {room.faultDetail && <div style={{ fontSize: 11.5, color: 'var(--bad)', marginTop: 2, fontWeight: 500 }}>↯ {room.faultDetail}</div>}
        {task.assignedUserId && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 6 }}>
            <div style={{ width: 18, height: 18, borderRadius: '50%', background: 'var(--surface-2)', color: 'var(--text-2)', fontSize: 9, fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {initials(task.assignedUserId)}
            </div>
            <span style={{ fontSize: 11.5, color: 'var(--text-2)' }}>{task.assignedUserId}</span>
          </div>
        )}
        <div style={{ display: 'flex', gap: 4, marginTop: 6 }}>
          {col === 'DIRTY' && (
            <button onClick={() => updateMut.mutate({ id: task.id, data: { status: 'IN_PROGRESS' } })} style={{ flex: 1, padding: '3px', fontSize: 10, fontWeight: 600, background: 'var(--accent-c)', color: 'var(--accent-fg)', border: 'none', borderRadius: 4, cursor: 'pointer' }}>Başlat</button>
          )}
          {col === 'IN_PROGRESS' && (
            <button onClick={() => updateMut.mutate({ id: task.id, data: { status: 'DONE' } })} style={{ flex: 1, padding: '3px', fontSize: 10, fontWeight: 600, background: 'var(--good)', color: '#fff', border: 'none', borderRadius: 4, cursor: 'pointer' }}>Tamamla</button>
          )}
        </div>
      </div>
    )
  }

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14 }}>
      {cols.map(col => {
        const s = STAT[col.key]
        const items = col.key === 'BLOCKED'
          ? [...grouped.BLOCKED, ...faultyRooms.map(r => ({ id: r.id, status: 'PENDING', assignedUserId: null, notes: r.faultDetail ?? '', startedAt: null, completedAt: null, durationMinutes: null, room: { id: r.id, number: r.number, floor: r.floor, status: 'FAULTY', faultDetail: r.faultDetail, typeName: r.typeName }, isArrivalRoom: false } as Task))]
          : grouped[col.key]
        return (
          <div key={col.key} style={{ background: 'var(--surface-2)', borderRadius: 10, padding: 12, minHeight: 300 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 10, paddingLeft: 4 }}>
              <span style={{ width: 8, height: 8, borderRadius: 2, background: s.fg }}/>
              <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text)' }}>{col.label}</span>
              <span style={{ fontSize: 11, color: 'var(--text-3)' }}>{items.length}</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {items.map(t => <KanbanCard key={t.id} task={t} col={col.key}/>)}
              {items.length === 0 && <div style={{ fontSize: 12, color: 'var(--text-3)', textAlign: 'center', padding: '24px 0' }}>—</div>}
            </div>
          </div>
        )
      })}
    </div>
  )
}

// ─── route (timeline) view ────────────────────────────────────────────────────
function RouteView({ tasks }: { tasks: Task[] }) {
  const HOUR_W = 88
  const HOURS = ['08', '09', '10', '11', '12', '13', '14', '15', '16', '17']
  const START_H = 8

  const now = new Date()
  const nowOffset = (now.getHours() - START_H) + now.getMinutes() / 60

  // Group by attendant
  const attendantMap = new Map<string, Task[]>()
  tasks.filter(t => t.room).forEach(t => {
    const key = t.assignedUserId ?? '—'
    if (!attendantMap.has(key)) attendantMap.set(key, [])
    attendantMap.get(key)!.push(t)
  })
  const attendants = Array.from(attendantMap.entries())

  function taskPosition(t: Task): { left: number; width: number } | null {
    if (!t.startedAt) return null
    const start = new Date(t.startedAt)
    const startOffset = (start.getHours() - START_H) + start.getMinutes() / 60
    let endOffset: number
    if (t.completedAt) {
      const end = new Date(t.completedAt)
      endOffset = (end.getHours() - START_H) + end.getMinutes() / 60
    } else if (t.status === 'IN_PROGRESS') {
      endOffset = nowOffset
    } else {
      endOffset = startOffset + (t.durationMinutes ? t.durationMinutes / 60 : 0.5)
    }
    return { left: startOffset * HOUR_W + 3, width: Math.max((endOffset - startOffset) * HOUR_W - 6, 32) }
  }

  const STATE_STYLE: Record<string, { fg: string; bg: string; border: string }> = {
    DONE:        { fg: 'var(--good)', bg: 'var(--good-bg)', border: 'var(--good)' },
    IN_PROGRESS: { fg: 'var(--info)', bg: 'var(--info-bg)', border: 'var(--info)' },
    PENDING:     { fg: 'var(--text-2)', bg: 'var(--surface)', border: 'var(--border-strong)' },
  }

  if (attendants.length === 0) {
    return <div style={{ padding: 48, textAlign: 'center', color: 'var(--text-3)', fontSize: 13 }}>Bugün henüz atanmış görev yok.</div>
  }

  return (
    <div style={{ background: 'var(--surface)', border: '1px solid var(--border-c)', borderRadius: 10, overflow: 'hidden', boxShadow: 'var(--shadow-sm)' }}>
      <div style={{ display: 'flex', overflowX: 'auto' }}>
        {/* frozen attendant column */}
        <div style={{ flexShrink: 0, width: 168, position: 'sticky', left: 0, zIndex: 2, background: 'var(--surface)', borderRight: '1px solid var(--border-c)' }}>
          <div style={{ height: 36, borderBottom: '1px solid var(--border-c)', padding: '0 14px', display: 'flex', alignItems: 'center', fontSize: 11, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.04em', fontWeight: 600 }}>Personel</div>
          {attendants.map(([name]) => (
            <div key={name} style={{ height: 64, padding: '0 14px', display: 'flex', alignItems: 'center', gap: 10, borderBottom: '1px solid var(--border-c)' }}>
              <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'var(--accent-c)', color: 'var(--accent-fg)', fontSize: 11, fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                {initials(name === '—' ? null : name)}
              </div>
              <div style={{ fontSize: 12.5, fontWeight: 500, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{name}</div>
            </div>
          ))}
        </div>

        {/* timeline */}
        <div style={{ flexShrink: 0 }}>
          {/* ruler */}
          <div style={{ height: 36, display: 'flex', borderBottom: '1px solid var(--border-c)', position: 'relative' }}>
            {HOURS.map(h => (
              <div key={h} style={{ width: HOUR_W, padding: '0 8px', borderLeft: '1px dashed var(--border-c)', fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--text-3)', display: 'flex', alignItems: 'center' }}>{h}:00</div>
            ))}
            {nowOffset >= 0 && nowOffset <= HOURS.length && (
              <div style={{ position: 'absolute', left: nowOffset * HOUR_W, top: 0, bottom: 0, width: 2, background: 'var(--bad)', opacity: 0.85 }}/>
            )}
          </div>

          {/* rows */}
          {attendants.map(([name, aTasks]) => (
            <div key={name} style={{ height: 64, position: 'relative', borderBottom: '1px solid var(--border-c)', background: 'var(--surface)' }}>
              {HOURS.map((_, i) => (
                <div key={i} style={{ position: 'absolute', left: i * HOUR_W, top: 0, bottom: 0, width: 1, borderLeft: '1px dashed var(--border-c)', pointerEvents: 'none' }}/>
              ))}
              {aTasks.map(t => {
                const pos = taskPosition(t)
                if (!pos) return null
                const s = STATE_STYLE[t.status] ?? STATE_STYLE.PENDING
                return (
                  <div key={t.id} style={{ position: 'absolute', top: 12, left: pos.left, width: pos.width, height: 40, background: s.bg, color: s.fg, border: `1px solid ${s.border}`, borderRadius: 5, padding: '0 8px', display: 'flex', flexDirection: 'column', justifyContent: 'center', overflow: 'hidden' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: 11.5 }}>{t.room?.number}</span>
                      {t.status === 'IN_PROGRESS' && <span style={{ fontSize: 9, fontWeight: 600 }}>● işlemde</span>}
                      {t.status === 'DONE' && <span style={{ fontSize: 10 }}>✓</span>}
                    </div>
                    <div style={{ fontSize: 10, opacity: 0.8, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.room?.typeName}</div>
                  </div>
                )
              })}
              {nowOffset >= 0 && nowOffset <= HOURS.length && (
                <div style={{ position: 'absolute', left: nowOffset * HOUR_W, top: 0, bottom: 0, width: 2, background: 'var(--bad)', opacity: 0.85, pointerEvents: 'none' }}/>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* legend */}
      <div style={{ padding: '10px 16px', borderTop: '1px solid var(--border-c)', display: 'flex', gap: 16, fontSize: 11.5, color: 'var(--text-2)' }}>
        {[
          { label: 'Tamamlandı', fg: 'var(--good)', bg: 'var(--good-bg)', border: 'var(--good)' },
          { label: 'İşlemde', fg: 'var(--info)', bg: 'var(--info-bg)', border: 'var(--info)' },
          { label: 'Planlandı', fg: 'var(--text-2)', bg: 'var(--surface)', border: 'var(--border-strong)' },
        ].map(l => (
          <span key={l.label} style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            <span style={{ width: 12, height: 8, background: l.bg, border: `1px solid ${l.border}`, borderRadius: 2 }}/>
            {l.label}
          </span>
        ))}
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
          <span style={{ width: 2, height: 12, background: 'var(--bad)' }}/>
          Şu an ({new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })})
        </span>
      </div>
    </div>
  )
}

// ─── root component ───────────────────────────────────────────────────────────
export function HkBoardClient({ tasks, faultyRooms }: Props) {
  const [view, setView] = useState<View>('grid')

  const boardStatuses: BoardStatus[] = ['DIRTY', 'IN_PROGRESS', 'CLEAN', 'BLOCKED', 'ARRIVAL']
  const tally = Object.fromEntries(
    boardStatuses.map(s => [s, tasks.filter(t => deriveStatus(t) === s).length])
  ) as Record<BoardStatus, number>

  const attendantCount = new Set(tasks.map(t => t.assignedUserId).filter(Boolean)).size

  return (
    <div style={{ height: 'calc(100% - 56px)', overflowY: 'auto', padding: 24 }}>
      {/* Controls */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 18, flexWrap: 'wrap' }}>
        <PillRow value={view} onChange={setView}/>
        <div style={{ width: 1, height: 20, background: 'var(--border-c)' }}/>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          <Tally tone="DIRTY" label="Kirli" count={tally.DIRTY}/>
          <Tally tone="IN_PROGRESS" label="Temizleniyor" count={tally.IN_PROGRESS}/>
          <Tally tone="CLEAN" label="Temiz" count={tally.CLEAN}/>
          <Tally tone="BLOCKED" label="Arızalı" count={tally.BLOCKED + faultyRooms.length}/>
          {tally.ARRIVAL > 0 && <Tally tone="ARRIVAL" label="Beklenen giriş" count={tally.ARRIVAL}/>}
        </div>
        <div style={{ marginLeft: 'auto', fontSize: 11, color: 'var(--text-3)' }}>
          Atanmış: <strong style={{ color: 'var(--text)' }}>{attendantCount} personel</strong>
        </div>
      </div>

      {view === 'grid'  && <GridView tasks={tasks} faultyRooms={faultyRooms}/>}
      {view === 'queue' && <QueueView tasks={tasks} faultyRooms={faultyRooms}/>}
      {view === 'route' && <RouteView tasks={tasks}/>}
    </div>
  )
}
