'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { trpc } from '@/lib/trpc/client'
import { trDate } from '@/lib/utils'
import { Chip } from '@/components/ui/chip'
import { StatTile } from '@/components/ui/stat-tile'
import { th, td } from '@/components/ui/data-table'
import { inputStyle } from '@/components/ui/kv'
import { AlertTriangle, CheckCircle, Clock, Plus } from 'lucide-react'

interface Schedule {
  id: string; equipmentId: string; equipmentName: string; equipmentCategory: string
  scheduledDate: string; completedAt: string | null; notes: string | null; technicianId: string | null
}
interface Equipment { id: string; name: string; category: string }
interface Stats { overdue: number; upcoming: number; completed: number }
interface Props { schedules: Schedule[]; stats: Stats; equipment: Equipment[] }

type Filter = 'ALL' | 'PENDING' | 'COMPLETED'

export function PmClient({ schedules, stats, equipment }: Props) {
  const router = useRouter()
  const [filter, setFilter] = useState<Filter>('ALL')
  const [showForm, setShowForm] = useState(false)
  const [fEquipId, setFEquipId] = useState('')
  const [fDate, setFDate] = useState('')
  const [fNotes, setFNotes] = useState('')
  const [fTechnician, setFTechnician] = useState('')
  const [formError, setFormError] = useState('')
  const [completeId, setCompleteId] = useState<string | null>(null)
  const [completeNotes, setCompleteNotes] = useState('')

  const refresh = () => router.refresh()

  const createMut = trpc.maintenance.pm.create.useMutation({
    onSuccess: () => { refresh(); setShowForm(false); setFEquipId(''); setFDate(''); setFNotes(''); setFTechnician(''); setFormError('') },
    onError: (e) => setFormError(e.message),
  })
  const completeMut = trpc.maintenance.pm.complete.useMutation({
    onSuccess: () => { refresh(); setCompleteId(null); setCompleteNotes('') },
  })

  function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    if (!fEquipId || !fDate) { setFormError('Ekipman ve tarih zorunlu'); return }
    createMut.mutate({
      equipmentId: fEquipId,
      scheduledDate: new Date(fDate),
      notes: fNotes.trim() || undefined,
      technicianId: fTechnician.trim() || undefined,
    })
  }

  const now = new Date()
  const visible = schedules.filter(s => {
    if (filter === 'PENDING') return !s.completedAt
    if (filter === 'COMPLETED') return !!s.completedAt
    return true
  })

  function statusTone(s: Schedule): string {
    if (s.completedAt) return 'good'
    if (new Date(s.scheduledDate) < now) return 'bad'
    return 'warn'
  }
  function statusLabel(s: Schedule): string {
    if (s.completedAt) return `Tamamlandı ${trDate(s.completedAt)}`
    if (new Date(s.scheduledDate) < now) return 'Gecikmiş'
    return 'Planlandı'
  }

  return (
    <div style={{ height: 'calc(100% - 56px)', overflowY: 'auto', padding: 24 }}>
      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 20 }}>
        <StatTile icon={<AlertTriangle size={18}/>} label="Gecikmiş" value={String(stats.overdue)} color="var(--bad)" bg="var(--bad-bg)"/>
        <StatTile icon={<Clock size={18}/>} label="14 Gün İçinde" value={String(stats.upcoming)} color="var(--warn)" bg="var(--warn-bg)"/>
        <StatTile icon={<CheckCircle size={18}/>} label="Tamamlandı" value={String(stats.completed)} color="var(--good)" bg="var(--good-bg)"/>
      </div>

      {/* Filter + actions */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14, flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', background: 'var(--surface)', border: '1px solid var(--border-c)', borderRadius: 6, padding: 2 }}>
          {(['ALL', 'PENDING', 'COMPLETED'] as Filter[]).map(f => (
            <button key={f} onClick={() => setFilter(f)} style={{ padding: '5px 10px', background: filter === f ? 'var(--surface-2)' : 'transparent', color: filter === f ? 'var(--text)' : 'var(--text-2)', border: 0, borderRadius: 4, fontSize: 12, fontWeight: filter === f ? 600 : 450, cursor: 'pointer' }}>
              {{ ALL: 'Tümü', PENDING: 'Bekleyenler', COMPLETED: 'Tamamlananlar' }[f]}
            </button>
          ))}
        </div>
        <div style={{ flex: 1 }}/>
        <button onClick={() => { setShowForm(v => !v); setFormError('') }} style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '7px 14px', background: 'var(--accent-c)', color: 'var(--accent-fg)', border: 0, borderRadius: 6, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
          <Plus size={14}/> Bakım planla
        </button>
      </div>

      {/* Create form */}
      {showForm && (
        <form onSubmit={handleCreate} style={{ background: 'var(--surface)', border: '1px solid var(--border-c)', borderRadius: 10, padding: 16, marginBottom: 14, boxShadow: 'var(--shadow-sm)' }}>
          <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 12 }}>Yeni bakım planı</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, marginBottom: 10 }}>
            <div>
              <div style={{ fontSize: 11, color: 'var(--text-3)', fontWeight: 500, marginBottom: 3 }}>Ekipman *</div>
              <select value={fEquipId} onChange={e => setFEquipId(e.target.value)} style={inputStyle}>
                <option value="">Ekipman seçin…</option>
                {equipment.map(eq => <option key={eq.id} value={eq.id}>{eq.name} ({eq.category})</option>)}
              </select>
            </div>
            <div>
              <div style={{ fontSize: 11, color: 'var(--text-3)', fontWeight: 500, marginBottom: 3 }}>Planlanan tarih *</div>
              <input type="date" value={fDate} onChange={e => setFDate(e.target.value)} style={inputStyle}/>
            </div>
            <div>
              <div style={{ fontSize: 11, color: 'var(--text-3)', fontWeight: 500, marginBottom: 3 }}>Teknisyen</div>
              <input value={fTechnician} onChange={e => setFTechnician(e.target.value)} style={inputStyle} placeholder="Ad Soyad (opsiyonel)"/>
            </div>
          </div>
          <div style={{ marginBottom: 10 }}>
            <div style={{ fontSize: 11, color: 'var(--text-3)', fontWeight: 500, marginBottom: 3 }}>Notlar (opsiyonel)</div>
            <input value={fNotes} onChange={e => setFNotes(e.target.value)} style={inputStyle} placeholder="Bakımda yapılacak işlemler…"/>
          </div>
          {formError && <div style={{ padding: '6px 10px', background: 'var(--bad-bg)', color: 'var(--bad)', borderRadius: 6, fontSize: 12, marginBottom: 10 }}>{formError}</div>}
          <div style={{ display: 'flex', gap: 6 }}>
            <button type="submit" disabled={createMut.isPending} style={{ padding: '7px 18px', background: 'var(--accent-c)', color: 'var(--accent-fg)', border: 0, borderRadius: 6, fontSize: 13, fontWeight: 600, cursor: 'pointer', opacity: createMut.isPending ? 0.6 : 1 }}>
              {createMut.isPending ? 'Kaydediliyor…' : 'Kaydet'}
            </button>
            <button type="button" onClick={() => { setShowForm(false); setFormError('') }} style={{ padding: '7px 12px', background: 'var(--surface-2)', color: 'var(--text-2)', border: '1px solid var(--border-c)', borderRadius: 6, fontSize: 13, cursor: 'pointer' }}>İptal</button>
          </div>
        </form>
      )}

      {/* Table */}
      <div style={{ background: 'var(--surface)', border: '1px solid var(--border-c)', borderRadius: 10, overflow: 'hidden', boxShadow: 'var(--shadow-sm)' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead><tr>
              <th style={th}>Ekipman</th>
              <th style={th}>Planlanan Tarih</th>
              <th style={th}>Durum</th>
              <th style={th}>Teknisyen</th>
              <th style={th}>Notlar</th>
              <th style={{ ...th, width: 140 }}>İşlem</th>
            </tr></thead>
            <tbody>
              {visible.map(s => (
                <>
                  <tr key={s.id} style={{ borderTop: '1px solid var(--border-c)' }}>
                    <td style={{ ...td, fontWeight: 500 }}>
                      {s.equipmentName}
                      <div style={{ fontSize: 11, color: 'var(--text-3)' }}>{s.equipmentCategory}</div>
                    </td>
                    <td style={{ ...td, fontSize: 12, color: 'var(--text-2)' }}>{trDate(s.scheduledDate)}</td>
                    <td style={td}><Chip tone={statusTone(s)} dot>{statusLabel(s)}</Chip></td>
                    <td style={{ ...td, fontSize: 12, color: 'var(--text-2)' }}>{s.technicianId ?? '—'}</td>
                    <td style={{ ...td, fontSize: 12, color: 'var(--text-2)', maxWidth: 220 }}>{s.notes ?? '—'}</td>
                    <td style={td}>
                      {!s.completedAt && (
                        <button
                          onClick={() => setCompleteId(completeId === s.id ? null : s.id)}
                          style={{ padding: '4px 10px', background: 'var(--good-bg)', color: 'var(--good)', border: '1px solid var(--good)', borderRadius: 5, fontSize: 11, fontWeight: 600, cursor: 'pointer' }}
                        >
                          Tamamla
                        </button>
                      )}
                    </td>
                  </tr>
                  {completeId === s.id && (
                    <tr key={`${s.id}-complete`} style={{ borderTop: '1px solid var(--border-c)', background: 'var(--surface-2)' }}>
                      <td colSpan={6} style={{ padding: '10px 14px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <input value={completeNotes} onChange={e => setCompleteNotes(e.target.value)} style={{ ...inputStyle, flex: 1 }} placeholder="Tamamlama notu (opsiyonel)"/>
                          <button onClick={() => completeMut.mutate({ id: s.id, data: { notes: completeNotes.trim() || undefined } })} style={{ padding: '6px 14px', background: 'var(--good)', color: '#fff', border: 0, borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>Onayla</button>
                          <button onClick={() => { setCompleteId(null); setCompleteNotes('') }} style={{ padding: '6px 10px', background: 'transparent', color: 'var(--text-2)', border: '1px solid var(--border-c)', borderRadius: 6, fontSize: 12, cursor: 'pointer' }}>İptal</button>
                        </div>
                      </td>
                    </tr>
                  )}
                </>
              ))}
              {visible.length === 0 && (
                <tr><td colSpan={6} style={{ ...td, textAlign: 'center', color: 'var(--text-3)', padding: '32px 0' }}>Bakım planı yok</td></tr>
              )}
            </tbody>
          </table>
        </div>
        <div style={{ padding: '10px 16px', borderTop: '1px solid var(--border-c)', fontSize: 12, color: 'var(--text-3)' }}>
          {visible.length} kayıt gösteriliyor
        </div>
      </div>
    </div>
  )
}
