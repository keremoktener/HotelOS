'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { trpc } from '@/lib/trpc/client'
import { trDate } from '@/lib/utils'
import { Chip } from '@/components/ui/chip'
import { StatTile } from '@/components/ui/stat-tile'
import { th, td } from '@/components/ui/data-table'
import { inputStyle } from '@/components/ui/kv'
import { CheckCircle, Clock, Loader, Plus } from 'lucide-react'

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
interface Props {
  tasks: Task[]
  stats: Record<string, number>
  rooms: Room[]
}

export function HKClient({ tasks, stats, rooms }: Props) {
  const router = useRouter()
  const [filter, setFilter] = useState<string>('ALL')
  const [showForm, setShowForm] = useState(false)
  const [fRoomId, setFRoomId] = useState('')
  const [fType, setFType] = useState<'ROOM' | 'COMMON_AREA'>('ROOM')
  const [fNotes, setFNotes] = useState('')
  const [formError, setFormError] = useState('')

  const refresh = () => router.refresh()

  const createMut = trpc.hk.create.useMutation({
    onSuccess: () => { refresh(); setShowForm(false); setFRoomId(''); setFType('ROOM'); setFNotes(''); setFormError('') },
    onError: (e) => setFormError(e.message),
  })
  const updateMut = trpc.hk.update.useMutation({ onSuccess: refresh })

  function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    if (fType === 'ROOM' && !fRoomId) { setFormError('Oda seçin'); return }
    createMut.mutate({ roomId: fRoomId || undefined, type: fType, notes: fNotes.trim() || undefined })
  }

  const visible = filter === 'ALL' ? tasks : tasks.filter(t => t.status === filter)

  return (
    <div style={{ height: 'calc(100% - 56px)', overflowY: 'auto', padding: 24 }}>
      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 20 }}>
        <StatTile icon={<Clock size={18}/>} label="Beklemede" value={String(stats.PENDING ?? 0)} color="var(--warn)" bg="var(--warn-bg)"/>
        <StatTile icon={<Loader size={18}/>} label="İşlemde" value={String(stats.IN_PROGRESS ?? 0)} color="var(--info)" bg="var(--info-bg)"/>
        <StatTile icon={<CheckCircle size={18}/>} label="Tamamlandı" value={String(stats.DONE ?? 0)} color="var(--good)" bg="var(--good-bg)"/>
      </div>

      {/* Filter + actions */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14, flexWrap: 'wrap' }}>
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
      </div>

      {/* Create form */}
      {showForm && (
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

      {/* Task table */}
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
    </div>
  )
}
