'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { trpc } from '@/lib/trpc/client'
import { trDate } from '@/lib/utils'
import { Chip } from '@/components/ui/chip'
import { StatTile } from '@/components/ui/stat-tile'
import { th, td } from '@/components/ui/data-table'
import { inputStyle } from '@/components/ui/kv'
import { Archive, CheckCircle, Package, Plus } from 'lucide-react'

interface Item {
  id: string; description: string; foundBy: string; foundAt: string
  returnedAt: string | null; roomNumber: string | null; guestName: string | null
}
interface Room { id: string; number: string }
interface Stats { total: number; unclaimed: number; returned: number }
interface Props { items: Item[]; stats: Stats; rooms: Room[] }

export function LafClient({ items, stats, rooms }: Props) {
  const router = useRouter()
  const [filter, setFilter] = useState<'ALL' | 'UNCLAIMED' | 'RETURNED'>('ALL')
  const [showForm, setShowForm] = useState(false)
  const [fDesc, setFDesc] = useState('')
  const [fFoundBy, setFFoundBy] = useState('')
  const [fRoomId, setFRoomId] = useState('')
  const [fFoundAt, setFFoundAt] = useState(new Date().toISOString().slice(0, 10))
  const [formError, setFormError] = useState('')

  const refresh = () => router.refresh()

  const createMut = trpc.lostFound.create.useMutation({
    onSuccess: () => { refresh(); setShowForm(false); setFDesc(''); setFFoundBy(''); setFRoomId(''); setFormError('') },
    onError: (e) => setFormError(e.message),
  })
  const updateMut = trpc.lostFound.update.useMutation({ onSuccess: refresh })

  function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    if (!fDesc.trim() || !fFoundBy.trim()) { setFormError('Açıklama ve bulan kişi zorunlu'); return }
    createMut.mutate({
      description: fDesc.trim(),
      foundBy: fFoundBy.trim(),
      foundAt: new Date(fFoundAt),
      roomId: fRoomId || undefined,
    })
  }

  const visible = items.filter(i => {
    if (filter === 'UNCLAIMED') return !i.returnedAt
    if (filter === 'RETURNED') return !!i.returnedAt
    return true
  })

  return (
    <div style={{ height: 'calc(100% - 56px)', overflowY: 'auto', padding: 24 }}>
      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 20 }}>
        <StatTile icon={<Package size={18}/>} label="Toplam" value={String(stats.total)} color="var(--text-2)" bg="var(--surface-2)"/>
        <StatTile icon={<Archive size={18}/>} label="Teslim Edilmedi" value={String(stats.unclaimed)} color="var(--warn)" bg="var(--warn-bg)"/>
        <StatTile icon={<CheckCircle size={18}/>} label="Teslim Edildi" value={String(stats.returned)} color="var(--good)" bg="var(--good-bg)"/>
      </div>

      {/* Filter + actions */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14, flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', background: 'var(--surface)', border: '1px solid var(--border-c)', borderRadius: 6, padding: 2 }}>
          {(['ALL', 'UNCLAIMED', 'RETURNED'] as const).map(f => (
            <button key={f} onClick={() => setFilter(f)} style={{ padding: '5px 10px', background: filter === f ? 'var(--surface-2)' : 'transparent', color: filter === f ? 'var(--text)' : 'var(--text-2)', border: 0, borderRadius: 4, fontSize: 12, fontWeight: filter === f ? 600 : 450, cursor: 'pointer' }}>
              {{ ALL: 'Tümü', UNCLAIMED: 'Bekleyenler', RETURNED: 'Teslim Edilenler' }[f]}
            </button>
          ))}
        </div>
        <div style={{ flex: 1 }}/>
        <button onClick={() => setShowForm(v => !v)} style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '7px 14px', background: 'var(--accent-c)', color: 'var(--accent-fg)', border: 0, borderRadius: 6, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
          <Plus size={14}/> Kayıt ekle
        </button>
      </div>

      {/* Create form */}
      {showForm && (
        <form onSubmit={handleCreate} style={{ background: 'var(--surface)', border: '1px solid var(--border-c)', borderRadius: 10, padding: 16, marginBottom: 14, boxShadow: 'var(--shadow-sm)' }}>
          <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 12 }}>Yeni kayıp eşya kaydı</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 10 }}>
            <div>
              <div style={{ fontSize: 11, color: 'var(--text-3)', fontWeight: 500, marginBottom: 3 }}>Açıklama *</div>
              <input value={fDesc} onChange={e => setFDesc(e.target.value)} style={inputStyle} placeholder="Siyah cüzdan, şarj aleti…"/>
            </div>
            <div>
              <div style={{ fontSize: 11, color: 'var(--text-3)', fontWeight: 500, marginBottom: 3 }}>Bulan kişi *</div>
              <input value={fFoundBy} onChange={e => setFFoundBy(e.target.value)} style={inputStyle} placeholder="Ad Soyad"/>
            </div>
            <div>
              <div style={{ fontSize: 11, color: 'var(--text-3)', fontWeight: 500, marginBottom: 3 }}>Bulunma tarihi</div>
              <input type="date" value={fFoundAt} onChange={e => setFFoundAt(e.target.value)} style={inputStyle}/>
            </div>
            <div>
              <div style={{ fontSize: 11, color: 'var(--text-3)', fontWeight: 500, marginBottom: 3 }}>Oda (opsiyonel)</div>
              <select value={fRoomId} onChange={e => setFRoomId(e.target.value)} style={inputStyle}>
                <option value="">Oda seçin…</option>
                {rooms.map(r => <option key={r.id} value={r.id}>{r.number}</option>)}
              </select>
            </div>
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
              <th style={th}>Açıklama</th>
              <th style={th}>Bulan</th>
              <th style={th}>Oda</th>
              <th style={th}>Tarih</th>
              <th style={th}>Durum</th>
              <th style={{ ...th, width: 140 }}>İşlem</th>
            </tr></thead>
            <tbody>
              {visible.map(i => (
                <tr key={i.id} style={{ borderTop: '1px solid var(--border-c)' }}>
                  <td style={{ ...td, fontWeight: 500 }}>{i.description}</td>
                  <td style={{ ...td, fontSize: 12, color: 'var(--text-2)' }}>{i.foundBy}</td>
                  <td style={{ ...td, fontSize: 12, color: 'var(--text-2)' }}>{i.roomNumber ?? '—'}</td>
                  <td style={{ ...td, fontSize: 12, color: 'var(--text-2)' }}>{trDate(i.foundAt)}</td>
                  <td style={td}>
                    <Chip tone={i.returnedAt ? 'good' : 'warn'} dot>
                      {i.returnedAt ? `Teslim ${trDate(i.returnedAt)}` : 'Bekliyor'}
                    </Chip>
                  </td>
                  <td style={td}>
                    {!i.returnedAt && (
                      <button
                        onClick={() => updateMut.mutate({ id: i.id, data: { returnedAt: new Date() } })}
                        style={{ padding: '4px 10px', background: 'var(--good-bg)', color: 'var(--good)', border: '1px solid var(--good)', borderRadius: 5, fontSize: 11, fontWeight: 600, cursor: 'pointer' }}
                      >
                        Teslim edildi
                      </button>
                    )}
                  </td>
                </tr>
              ))}
              {visible.length === 0 && (
                <tr><td colSpan={6} style={{ ...td, textAlign: 'center', color: 'var(--text-3)', padding: '32px 0' }}>Kayıt yok</td></tr>
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
