'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { trpc } from '@/lib/trpc/client'
import { trDate } from '@/lib/utils'
import { Chip } from '@/components/ui/chip'
import { StatTile } from '@/components/ui/stat-tile'
import { th, td } from '@/components/ui/data-table'
import { inputStyle } from '@/components/ui/kv'
import { AlertTriangle, CheckCircle, Loader, Plus, XCircle } from 'lucide-react'

const STATUS_LABEL: Record<string, string> = { OPEN: 'Açık', IN_PROGRESS: 'İşlemde', DONE: 'Tamamlandı', CANNOT_FIX: 'Çözülemez' }
const STATUS_TONE: Record<string, string> = { OPEN: 'bad', IN_PROGRESS: 'warn', DONE: 'good', CANNOT_FIX: 'muted' }
const PRIORITY_LABEL: Record<string, string> = { URGENT: 'Acil', NORMAL: 'Normal', LOW: 'Düşük' }
const PRIORITY_TONE: Record<string, string> = { URGENT: 'bad', NORMAL: 'warn', LOW: 'neutral' }
const FILTERS = ['ALL', 'OPEN', 'IN_PROGRESS', 'DONE', 'CANNOT_FIX'] as const
const FILTER_LABEL: Record<string, string> = { ALL: 'Tümü', OPEN: 'Açık', IN_PROGRESS: 'İşlemde', DONE: 'Tamamlandı', CANNOT_FIX: 'Çözülemez' }

interface Fault {
  id: string; location: string; description: string; priority: string; status: string
  reportedBy: string; assignedTo: string | null; cannotFixReason: string | null
  resolvedAt: string | null; createdAt: string
}
interface Props { faults: Fault[]; stats: Record<string, number> }

export function MaintenanceClient({ faults, stats }: Props) {
  const router = useRouter()
  const [filter, setFilter] = useState<string>('ALL')
  const [showForm, setShowForm] = useState(false)
  const [fLocation, setFLocation] = useState('')
  const [fDesc, setFDesc] = useState('')
  const [fPriority, setFPriority] = useState<'URGENT' | 'NORMAL' | 'LOW'>('NORMAL')
  const [fReportedBy, setFReportedBy] = useState('')
  const [formError, setFormError] = useState('')
  const [cannotFixId, setCannotFixId] = useState<string | null>(null)
  const [cannotFixReason, setCannotFixReason] = useState('')

  const refresh = () => router.refresh()

  const createMut = trpc.maintenance.create.useMutation({
    onSuccess: () => { refresh(); setShowForm(false); setFLocation(''); setFDesc(''); setFPriority('NORMAL'); setFReportedBy(''); setFormError('') },
    onError: (e) => setFormError(e.message),
  })
  const updateMut = trpc.maintenance.update.useMutation({ onSuccess: refresh })

  function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    if (!fLocation.trim() || !fDesc.trim() || !fReportedBy.trim()) { setFormError('Tüm zorunlu alanları doldurun'); return }
    createMut.mutate({ location: fLocation.trim(), description: fDesc.trim(), priority: fPriority, reportedBy: fReportedBy.trim() })
  }

  function handleCannotFix(id: string) {
    if (!cannotFixReason.trim()) return
    updateMut.mutate({ id, data: { status: 'CANNOT_FIX', cannotFixReason: cannotFixReason.trim() } })
    setCannotFixId(null); setCannotFixReason('')
  }

  const visible = filter === 'ALL' ? faults : faults.filter(f => f.status === filter)

  return (
    <div style={{ height: 'calc(100% - 56px)', overflowY: 'auto', padding: 24 }}>
      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 20 }}>
        <StatTile icon={<AlertTriangle size={18}/>} label="Açık" value={String(stats.OPEN ?? 0)} color="var(--bad)" bg="var(--bad-bg)"/>
        <StatTile icon={<Loader size={18}/>} label="İşlemde" value={String(stats.IN_PROGRESS ?? 0)} color="var(--warn)" bg="var(--warn-bg)"/>
        <StatTile icon={<CheckCircle size={18}/>} label="Tamamlandı" value={String(stats.DONE ?? 0)} color="var(--good)" bg="var(--good-bg)"/>
        <StatTile icon={<XCircle size={18}/>} label="Çözülemez" value={String(stats.CANNOT_FIX ?? 0)} color="var(--text-3)" bg="var(--surface-2)"/>
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
          <Plus size={14}/> Arıza bildir
        </button>
      </div>

      {/* Create form */}
      {showForm && (
        <form onSubmit={handleCreate} style={{ background: 'var(--surface)', border: '1px solid var(--border-c)', borderRadius: 10, padding: 16, marginBottom: 14, boxShadow: 'var(--shadow-sm)' }}>
          <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 12 }}>Arıza bildirimi</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 10 }}>
            <div>
              <div style={{ fontSize: 11, color: 'var(--text-3)', fontWeight: 500, marginBottom: 3 }}>Konum *</div>
              <input value={fLocation} onChange={e => setFLocation(e.target.value)} style={inputStyle} placeholder="Oda 101, Lobi, Havuz…"/>
            </div>
            <div>
              <div style={{ fontSize: 11, color: 'var(--text-3)', fontWeight: 500, marginBottom: 3 }}>Öncelik</div>
              <select value={fPriority} onChange={e => setFPriority(e.target.value as typeof fPriority)} style={inputStyle}>
                <option value="URGENT">Acil</option>
                <option value="NORMAL">Normal</option>
                <option value="LOW">Düşük</option>
              </select>
            </div>
          </div>
          <div style={{ marginBottom: 10 }}>
            <div style={{ fontSize: 11, color: 'var(--text-3)', fontWeight: 500, marginBottom: 3 }}>Açıklama *</div>
            <textarea value={fDesc} onChange={e => setFDesc(e.target.value)} style={{ ...inputStyle, minHeight: 72, resize: 'vertical', fontFamily: 'inherit' }} placeholder="Arızanın detayını girin…"/>
          </div>
          <div style={{ marginBottom: 10 }}>
            <div style={{ fontSize: 11, color: 'var(--text-3)', fontWeight: 500, marginBottom: 3 }}>Bildiren *</div>
            <input value={fReportedBy} onChange={e => setFReportedBy(e.target.value)} style={inputStyle} placeholder="Ad Soyad"/>
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

      {/* Fault table */}
      <div style={{ background: 'var(--surface)', border: '1px solid var(--border-c)', borderRadius: 10, overflow: 'hidden', boxShadow: 'var(--shadow-sm)' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead><tr>
              <th style={th}>Konum</th>
              <th style={th}>Açıklama</th>
              <th style={th}>Öncelik</th>
              <th style={th}>Durum</th>
              <th style={th}>Bildiren</th>
              <th style={th}>Tarih</th>
              <th style={{ ...th, width: 200 }}>İşlem</th>
            </tr></thead>
            <tbody>
              {visible.map(f => (
                <>
                  <tr key={f.id} style={{ borderTop: '1px solid var(--border-c)' }}>
                    <td style={{ ...td, fontWeight: 500 }}>{f.location}</td>
                    <td style={{ ...td, maxWidth: 240, color: 'var(--text-2)' }}>{f.description}</td>
                    <td style={td}><Chip tone={PRIORITY_TONE[f.priority] ?? 'neutral'}>{PRIORITY_LABEL[f.priority] ?? f.priority}</Chip></td>
                    <td style={td}><Chip tone={STATUS_TONE[f.status] ?? 'neutral'} dot>{STATUS_LABEL[f.status] ?? f.status}</Chip></td>
                    <td style={{ ...td, fontSize: 12, color: 'var(--text-2)' }}>{f.reportedBy}</td>
                    <td style={{ ...td, fontSize: 12, color: 'var(--text-2)' }}>{trDate(f.createdAt)}</td>
                    <td style={td}>
                      <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
                        {f.status === 'OPEN' && (
                          <button onClick={() => updateMut.mutate({ id: f.id, data: { status: 'IN_PROGRESS' } })} style={{ padding: '4px 8px', background: 'var(--warn-bg)', color: 'var(--warn)', border: '1px solid var(--warn)', borderRadius: 5, fontSize: 11, fontWeight: 600, cursor: 'pointer' }}>İşleme al</button>
                        )}
                        {(f.status === 'OPEN' || f.status === 'IN_PROGRESS') && (
                          <button onClick={() => updateMut.mutate({ id: f.id, data: { status: 'DONE' } })} style={{ padding: '4px 8px', background: 'var(--good-bg)', color: 'var(--good)', border: '1px solid var(--good)', borderRadius: 5, fontSize: 11, fontWeight: 600, cursor: 'pointer' }}>Tamamla</button>
                        )}
                        {(f.status === 'OPEN' || f.status === 'IN_PROGRESS') && (
                          <button onClick={() => setCannotFixId(cannotFixId === f.id ? null : f.id)} style={{ padding: '4px 8px', background: 'var(--surface-2)', color: 'var(--text-2)', border: '1px solid var(--border-c)', borderRadius: 5, fontSize: 11, cursor: 'pointer' }}>Çözülemez</button>
                        )}
                      </div>
                    </td>
                  </tr>
                  {cannotFixId === f.id && (
                    <tr key={`${f.id}-cf`} style={{ borderTop: '1px solid var(--border-c)', background: 'var(--surface-2)' }}>
                      <td colSpan={7} style={{ padding: '10px 14px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <input value={cannotFixReason} onChange={e => setCannotFixReason(e.target.value)} style={{ ...inputStyle, flex: 1 }} placeholder="Çözülememe nedeni (zorunlu)"/>
                          <button onClick={() => handleCannotFix(f.id)} disabled={!cannotFixReason.trim()} style={{ padding: '6px 14px', background: 'var(--bad)', color: '#fff', border: 0, borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: 'pointer', opacity: cannotFixReason.trim() ? 1 : 0.5 }}>Onayla</button>
                          <button onClick={() => { setCannotFixId(null); setCannotFixReason('') }} style={{ padding: '6px 10px', background: 'transparent', color: 'var(--text-2)', border: '1px solid var(--border-c)', borderRadius: 6, fontSize: 12, cursor: 'pointer' }}>İptal</button>
                        </div>
                      </td>
                    </tr>
                  )}
                </>
              ))}
              {visible.length === 0 && (
                <tr><td colSpan={7} style={{ ...td, textAlign: 'center', color: 'var(--text-3)', padding: '32px 0' }}>Arıza kaydı yok</td></tr>
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
