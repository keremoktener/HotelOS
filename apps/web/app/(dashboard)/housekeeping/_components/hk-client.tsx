'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { trpc } from '@/lib/trpc/client'
import { trDate } from '@/lib/utils'
import { Chip } from '@/components/ui/chip'
import { StatTile } from '@/components/ui/stat-tile'
import { th, td } from '@/components/ui/data-table'
import { inputStyle } from '@/components/ui/kv'
import { CheckCircle, Clock, Layers, Loader, Plus, RefreshCw } from 'lucide-react'

const STATUS_LABEL: Record<string, string> = { PENDING: 'Beklemede', IN_PROGRESS: 'İşlemde', DONE: 'Tamamlandı' }
const STATUS_TONE: Record<string, string> = { PENDING: 'warn', IN_PROGRESS: 'info', DONE: 'good' }
const TYPE_LABEL: Record<string, string> = { ROOM: 'Oda', COMMON_AREA: 'Ortak Alan' }
const FILTERS = ['ALL', 'PENDING', 'IN_PROGRESS', 'DONE'] as const
const FILTER_LABEL: Record<string, string> = { ALL: 'Tümü', PENDING: 'Beklemede', IN_PROGRESS: 'İşlemde', DONE: 'Tamamlandı' }

interface Task {
  id: string; status: string; type: string; notes: string
  assignedUserId: string | null; createdAt: string
  startedAt: string | null; completedAt: string | null; durationMinutes: number | null
  room: { id: string; number: string; floor: number | null; typeName: string } | null
}
interface Room { id: string; number: string; floor: number | null; typeName: string; status: string }
interface Schedule { id: string; scheduledDate: string; completedAt: string | null }
interface CommonArea { id: string; name: string; cleaningFrequencyDays: number; schedules: Schedule[] }

interface Props {
  tasks: Task[]
  stats: Record<string, number>
  rooms: Room[]
  commonAreas: CommonArea[]
}

type Tab = 'tasks' | 'areas'

export function HKClient({ tasks, stats, rooms, commonAreas }: Props) {
  const router = useRouter()
  const [tab, setTab] = useState<Tab>('tasks')
  const [filter, setFilter] = useState<string>('ALL')
  const [showForm, setShowForm] = useState(false)
  const [fRoomId, setFRoomId] = useState('')
  const [fType, setFType] = useState<'ROOM' | 'COMMON_AREA'>('ROOM')
  const [fNotes, setFNotes] = useState('')
  const [formError, setFormError] = useState('')
  const [showAreaForm, setShowAreaForm] = useState(false)
  const [aName, setAName] = useState('')
  const [aFreq, setAFreq] = useState(1)
  const [areaError, setAreaError] = useState('')

  const refresh = () => router.refresh()

  const createMut = trpc.hk.create.useMutation({
    onSuccess: () => { refresh(); setShowForm(false); setFRoomId(''); setFType('ROOM'); setFNotes(''); setFormError('') },
    onError: (e) => setFormError(e.message),
  })
  const updateMut = trpc.hk.update.useMutation({ onSuccess: refresh })
  const createAreaMut = trpc.hk.commonArea.create.useMutation({
    onSuccess: () => { refresh(); setShowAreaForm(false); setAName(''); setAFreq(1); setAreaError('') },
    onError: (e) => setAreaError(e.message),
  })
  const deleteAreaMut = trpc.hk.commonArea.delete.useMutation({ onSuccess: refresh })
  const completeScheduleMut = trpc.hk.commonArea.completeSchedule.useMutation({ onSuccess: refresh })
  const triggerDueMut = trpc.hk.commonArea.triggerDue.useMutation({ onSuccess: refresh })

  function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    if (fType === 'ROOM' && !fRoomId) { setFormError('Oda seçin'); return }
    createMut.mutate({ roomId: fRoomId || undefined, type: fType, notes: fNotes.trim() || undefined })
  }

  function handleCreateArea(e: React.FormEvent) {
    e.preventDefault()
    if (!aName.trim()) { setAreaError('Alan adı zorunlu'); return }
    createAreaMut.mutate({ name: aName.trim(), cleaningFrequencyDays: aFreq })
  }

  const visible = filter === 'ALL' ? tasks : tasks.filter(t => t.status === filter)
  const today = new Date().toISOString().slice(0, 10)

  return (
    <div style={{ height: 'calc(100% - 56px)', overflowY: 'auto', padding: 24 }}>
      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 20 }}>
        <StatTile icon={<Clock size={18}/>} label="Beklemede" value={String(stats.PENDING ?? 0)} color="var(--warn)" bg="var(--warn-bg)"/>
        <StatTile icon={<Loader size={18}/>} label="İşlemde" value={String(stats.IN_PROGRESS ?? 0)} color="var(--info)" bg="var(--info-bg)"/>
        <StatTile icon={<CheckCircle size={18}/>} label="Tamamlandı" value={String(stats.DONE ?? 0)} color="var(--good)" bg="var(--good-bg)"/>
      </div>

      {/* Tab switcher + filters/actions */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14, flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', background: 'var(--surface)', border: '1px solid var(--border-c)', borderRadius: 6, padding: 2 }}>
          <button onClick={() => setTab('tasks')} style={{ padding: '5px 12px', background: tab === 'tasks' ? 'var(--surface-2)' : 'transparent', color: tab === 'tasks' ? 'var(--text)' : 'var(--text-2)', border: 0, borderRadius: 4, fontSize: 12, fontWeight: tab === 'tasks' ? 600 : 450, cursor: 'pointer' }}>
            Görevler
          </button>
          <button onClick={() => setTab('areas')} style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '5px 12px', background: tab === 'areas' ? 'var(--surface-2)' : 'transparent', color: tab === 'areas' ? 'var(--text)' : 'var(--text-2)', border: 0, borderRadius: 4, fontSize: 12, fontWeight: tab === 'areas' ? 600 : 450, cursor: 'pointer' }}>
            <Layers size={12}/> Ortak Alanlar ({commonAreas.length})
          </button>
        </div>

        {tab === 'tasks' && (
          <>
            <div style={{ display: 'flex', background: 'var(--surface)', border: '1px solid var(--border-c)', borderRadius: 6, padding: 2 }}>
              {FILTERS.map(f => (
                <button key={f} onClick={() => setFilter(f)} style={{ padding: '5px 10px', background: filter === f ? 'var(--surface-2)' : 'transparent', color: filter === f ? 'var(--text)' : 'var(--text-2)', border: 0, borderRadius: 4, fontSize: 12, fontWeight: filter === f ? 600 : 450, cursor: 'pointer' }}>
                  {FILTER_LABEL[f]}
                </button>
              ))}
            </div>
            <div style={{ flex: 1 }}/>
            <button onClick={() => setShowForm(v => !v)} style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '7px 14px', background: 'var(--accent-c)', color: 'var(--accent-fg)', border: 0, borderRadius: 6, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
              <Plus size={14}/> Yeni görev
            </button>
          </>
        )}

        {tab === 'areas' && (
          <>
            <div style={{ flex: 1 }}/>
            <button onClick={() => triggerDueMut.mutate()} disabled={triggerDueMut.isPending} style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '7px 12px', background: 'var(--surface-2)', color: 'var(--text-2)', border: '1px solid var(--border-c)', borderRadius: 6, fontSize: 13, cursor: 'pointer', opacity: triggerDueMut.isPending ? 0.6 : 1 }}>
              <RefreshCw size={13}/> Bugünü oluştur
            </button>
            <button onClick={() => setShowAreaForm(v => !v)} style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '7px 14px', background: 'var(--accent-c)', color: 'var(--accent-fg)', border: 0, borderRadius: 6, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
              <Plus size={14}/> Alan ekle
            </button>
          </>
        )}
      </div>

      {/* Task create form */}
      {tab === 'tasks' && showForm && (
        <form onSubmit={handleCreate} style={{ background: 'var(--surface)', border: '1px solid var(--border-c)', borderRadius: 10, padding: 16, marginBottom: 14, boxShadow: 'var(--shadow-sm)' }}>
          <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 12 }}>Yeni temizlik görevi</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 10 }}>
            <div>
              <div style={{ fontSize: 11, color: 'var(--text-3)', fontWeight: 500, marginBottom: 3 }}>Görev tipi</div>
              <select value={fType} onChange={e => setFType(e.target.value as typeof fType)} style={inputStyle}>
                <option value="ROOM">Oda temizliği</option>
                <option value="COMMON_AREA">Ortak alan temizliği</option>
              </select>
            </div>
            {fType === 'ROOM' && (
              <div>
                <div style={{ fontSize: 11, color: 'var(--text-3)', fontWeight: 500, marginBottom: 3 }}>Oda</div>
                <select value={fRoomId} onChange={e => setFRoomId(e.target.value)} style={inputStyle}>
                  <option value="">Oda seçin…</option>
                  {rooms.map(r => (
                    <option key={r.id} value={r.id}>{r.number} · {r.typeName}{r.floor != null ? ` (Kat ${r.floor})` : ''}</option>
                  ))}
                </select>
              </div>
            )}
          </div>
          <div style={{ marginBottom: 10 }}>
            <div style={{ fontSize: 11, color: 'var(--text-3)', fontWeight: 500, marginBottom: 3 }}>Notlar (opsiyonel)</div>
            <input value={fNotes} onChange={e => setFNotes(e.target.value)} style={inputStyle} placeholder="Ekstra temizlik, misafir talebi…"/>
          </div>
          {formError && <div style={{ padding: '6px 10px', background: 'var(--bad-bg)', color: 'var(--bad)', borderRadius: 6, fontSize: 12, marginBottom: 10 }}>{formError}</div>}
          <div style={{ display: 'flex', gap: 6 }}>
            <button type="submit" disabled={createMut.isPending} style={{ padding: '7px 18px', background: 'var(--accent-c)', color: 'var(--accent-fg)', border: 0, borderRadius: 6, fontSize: 13, fontWeight: 600, cursor: 'pointer', opacity: createMut.isPending ? 0.6 : 1 }}>
              {createMut.isPending ? 'Ekleniyor…' : 'Ekle'}
            </button>
            <button type="button" onClick={() => { setShowForm(false); setFormError('') }} style={{ padding: '7px 12px', background: 'var(--surface-2)', color: 'var(--text-2)', border: '1px solid var(--border-c)', borderRadius: 6, fontSize: 13, cursor: 'pointer' }}>İptal</button>
          </div>
        </form>
      )}

      {/* Common area create form */}
      {tab === 'areas' && showAreaForm && (
        <form onSubmit={handleCreateArea} style={{ background: 'var(--surface)', border: '1px solid var(--border-c)', borderRadius: 10, padding: 16, marginBottom: 14, boxShadow: 'var(--shadow-sm)' }}>
          <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 12 }}>Yeni ortak alan</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 160px', gap: 10, marginBottom: 10 }}>
            <div>
              <div style={{ fontSize: 11, color: 'var(--text-3)', fontWeight: 500, marginBottom: 3 }}>Alan adı *</div>
              <input value={aName} onChange={e => setAName(e.target.value)} style={inputStyle} placeholder="Lobi, Havuz, Resepsiyon…"/>
            </div>
            <div>
              <div style={{ fontSize: 11, color: 'var(--text-3)', fontWeight: 500, marginBottom: 3 }}>Sıklık (gün)</div>
              <input type="number" min={1} max={30} value={aFreq} onChange={e => setAFreq(Number(e.target.value))} style={inputStyle}/>
            </div>
          </div>
          {areaError && <div style={{ padding: '6px 10px', background: 'var(--bad-bg)', color: 'var(--bad)', borderRadius: 6, fontSize: 12, marginBottom: 10 }}>{areaError}</div>}
          <div style={{ display: 'flex', gap: 6 }}>
            <button type="submit" disabled={createAreaMut.isPending} style={{ padding: '7px 18px', background: 'var(--accent-c)', color: 'var(--accent-fg)', border: 0, borderRadius: 6, fontSize: 13, fontWeight: 600, cursor: 'pointer', opacity: createAreaMut.isPending ? 0.6 : 1 }}>
              {createAreaMut.isPending ? 'Ekleniyor…' : 'Ekle'}
            </button>
            <button type="button" onClick={() => { setShowAreaForm(false); setAreaError('') }} style={{ padding: '7px 12px', background: 'var(--surface-2)', color: 'var(--text-2)', border: '1px solid var(--border-c)', borderRadius: 6, fontSize: 13, cursor: 'pointer' }}>İptal</button>
          </div>
        </form>
      )}

      {/* Task table */}
      {tab === 'tasks' && (
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border-c)', borderRadius: 10, overflow: 'hidden', boxShadow: 'var(--shadow-sm)' }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead><tr>
                <th style={th}>Oda</th>
                <th style={th}>Tip</th>
                <th style={th}>Notlar</th>
                <th style={th}>Durum</th>
                <th style={th}>Oluşturulma</th>
                <th style={th}>Tamamlanma</th>
                <th style={{ ...th, width: 160 }}>İşlem</th>
              </tr></thead>
              <tbody>
                {visible.map(t => (
                  <tr key={t.id} style={{ borderTop: '1px solid var(--border-c)' }}>
                    <td style={{ ...td, fontWeight: 500 }}>
                      {t.room ? <><span style={{ fontFamily: 'var(--font-mono)' }}>{t.room.number}</span><div style={{ fontSize: 11, color: 'var(--text-3)' }}>{t.room.typeName}</div></> : <span style={{ color: 'var(--text-3)' }}>—</span>}
                    </td>
                    <td style={td}><Chip tone="neutral">{TYPE_LABEL[t.type] ?? t.type}</Chip></td>
                    <td style={{ ...td, color: 'var(--text-2)', maxWidth: 200 }}>{t.notes || <span style={{ color: 'var(--text-3)' }}>—</span>}</td>
                    <td style={td}><Chip tone={STATUS_TONE[t.status] ?? 'neutral'} dot>{STATUS_LABEL[t.status] ?? t.status}</Chip></td>
                    <td style={{ ...td, fontSize: 12, color: 'var(--text-2)' }}>{trDate(t.createdAt)}</td>
                    <td style={{ ...td, fontSize: 12, color: 'var(--text-2)' }}>{t.completedAt ? trDate(t.completedAt) : '—'}</td>
                    <td style={td}>
                      <div style={{ display: 'flex', gap: 6 }}>
                        {t.status === 'PENDING' && (
                          <button onClick={() => updateMut.mutate({ id: t.id, data: { status: 'IN_PROGRESS' } })} style={{ padding: '4px 10px', background: 'var(--info-bg)', color: 'var(--info)', border: '1px solid var(--info)', borderRadius: 5, fontSize: 11, fontWeight: 600, cursor: 'pointer' }}>Başlat</button>
                        )}
                        {(t.status === 'PENDING' || t.status === 'IN_PROGRESS') && (
                          <button onClick={() => updateMut.mutate({ id: t.id, data: { status: 'DONE' } })} style={{ padding: '4px 10px', background: 'var(--good-bg)', color: 'var(--good)', border: '1px solid var(--good)', borderRadius: 5, fontSize: 11, fontWeight: 600, cursor: 'pointer' }}>Tamamla</button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
                {visible.length === 0 && (
                  <tr><td colSpan={7} style={{ ...td, textAlign: 'center', color: 'var(--text-3)', padding: '32px 0' }}>Bugün için görev yok</td></tr>
                )}
              </tbody>
            </table>
          </div>
          <div style={{ padding: '10px 16px', borderTop: '1px solid var(--border-c)', fontSize: 12, color: 'var(--text-3)' }}>
            {visible.length} görev gösteriliyor
          </div>
        </div>
      )}

      {/* Common areas table */}
      {tab === 'areas' && (
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border-c)', borderRadius: 10, overflow: 'hidden', boxShadow: 'var(--shadow-sm)' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead><tr>
              <th style={th}>Alan</th>
              <th style={th}>Sıklık</th>
              <th style={th}>Bugün</th>
              <th style={th}>Son Temizlikler</th>
              <th style={{ ...th, width: 130 }}>İşlem</th>
            </tr></thead>
            <tbody>
              {commonAreas.map(a => {
                const todaySchedule = a.schedules.find(s => s.scheduledDate.slice(0, 10) === today)
                return (
                  <tr key={a.id} style={{ borderTop: '1px solid var(--border-c)' }}>
                    <td style={{ ...td, fontWeight: 500 }}>{a.name}</td>
                    <td style={{ ...td, fontSize: 12, color: 'var(--text-2)' }}>
                      Her {a.cleaningFrequencyDays === 1 ? 'gün' : `${a.cleaningFrequencyDays} günde bir`}
                    </td>
                    <td style={td}>
                      {todaySchedule
                        ? <Chip tone={todaySchedule.completedAt ? 'good' : 'warn'} dot>{todaySchedule.completedAt ? 'Tamamlandı' : 'Bekliyor'}</Chip>
                        : <Chip tone="muted">Planlanmadı</Chip>
                      }
                    </td>
                    <td style={td}>
                      <div style={{ display: 'flex', gap: 3, alignItems: 'center' }}>
                        {a.schedules.slice(0, 5).map(s => (
                          <span key={s.id} title={s.scheduledDate.slice(0, 10)} style={{ width: 8, height: 8, borderRadius: 2, background: s.completedAt ? 'var(--good)' : 'var(--warn)', display: 'inline-block' }}/>
                        ))}
                        {a.schedules.length === 0 && <span style={{ fontSize: 11, color: 'var(--text-3)' }}>Geçmiş yok</span>}
                      </div>
                    </td>
                    <td style={td}>
                      <div style={{ display: 'flex', gap: 5 }}>
                        {todaySchedule && !todaySchedule.completedAt && (
                          <button onClick={() => completeScheduleMut.mutate({ id: todaySchedule.id })} style={{ padding: '4px 8px', background: 'var(--good-bg)', color: 'var(--good)', border: '1px solid var(--good)', borderRadius: 5, fontSize: 11, fontWeight: 600, cursor: 'pointer' }}>Tamamla</button>
                        )}
                        <button onClick={() => { if (confirm('Alanı silmek istediğinizden emin misiniz?')) deleteAreaMut.mutate({ id: a.id }) }} style={{ padding: '4px 8px', background: 'var(--bad-bg)', color: 'var(--bad)', border: '1px solid var(--bad)', borderRadius: 5, fontSize: 11, cursor: 'pointer' }}>Sil</button>
                      </div>
                    </td>
                  </tr>
                )
              })}
              {commonAreas.length === 0 && (
                <tr><td colSpan={5} style={{ ...td, textAlign: 'center', color: 'var(--text-3)', padding: '32px 0' }}>Ortak alan tanımlanmamış</td></tr>
              )}
            </tbody>
          </table>
          <div style={{ padding: '10px 16px', borderTop: '1px solid var(--border-c)', fontSize: 12, color: 'var(--text-3)' }}>
            {commonAreas.length} alan · "Bugünü oluştur" veya günlük cron ile otomatik schedule oluşturulur
          </div>
        </div>
      )}
    </div>
  )
}
