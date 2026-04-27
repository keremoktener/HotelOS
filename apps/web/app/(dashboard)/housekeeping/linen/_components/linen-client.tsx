'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { trpc } from '@/lib/trpc/client'
import { trDate } from '@/lib/utils'
import { Chip } from '@/components/ui/chip'
import { StatTile } from '@/components/ui/stat-tile'
import { th, td } from '@/components/ui/data-table'
import { inputStyle } from '@/components/ui/kv'
import { ArrowDownToLine, ArrowUpFromLine, Plus, Scale } from 'lucide-react'

interface Entry {
  id: string; roomNumber: string; roomFloor: number | null
  sentCount: number; returnedCount: number; date: string
}
interface Room { id: string; number: string; floor: number | null }
interface Stats { sent: number; returned: number; outstanding: number }
interface Props { entries: Entry[]; stats: Stats; rooms: Room[] }

export function LinenClient({ entries, stats, rooms }: Props) {
  const router = useRouter()
  const [showForm, setShowForm] = useState(false)
  const [fRoomId, setFRoomId] = useState('')
  const [fSent, setFSent] = useState(0)
  const [fReturned, setFReturned] = useState(0)
  const [fDate, setFDate] = useState(new Date().toISOString().slice(0, 10))
  const [formError, setFormError] = useState('')

  const refresh = () => router.refresh()

  const logMut = trpc.hk.linen.log.useMutation({
    onSuccess: () => {
      refresh()
      setShowForm(false)
      setFRoomId(''); setFSent(0); setFReturned(0)
      setFDate(new Date().toISOString().slice(0, 10))
      setFormError('')
    },
    onError: (e) => setFormError(e.message),
  })

  function handleLog(e: React.FormEvent) {
    e.preventDefault()
    if (!fRoomId) { setFormError('Oda seçin'); return }
    if (fSent === 0 && fReturned === 0) { setFormError('En az bir değer girin'); return }
    logMut.mutate({ roomId: fRoomId, sentCount: fSent, returnedCount: fReturned, date: new Date(fDate) })
  }

  return (
    <div style={{ height: 'calc(100% - 56px)', overflowY: 'auto', padding: 24 }}>
      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 20 }}>
        <StatTile icon={<ArrowUpFromLine size={18}/>} label="Gönderilen" value={String(stats.sent)} color="var(--warn)" bg="var(--warn-bg)"/>
        <StatTile icon={<ArrowDownToLine size={18}/>} label="İade Edilen" value={String(stats.returned)} color="var(--good)" bg="var(--good-bg)"/>
        <StatTile
          icon={<Scale size={18}/>}
          label="Dışarıda"
          value={String(stats.outstanding)}
          color={stats.outstanding > 0 ? 'var(--bad)' : 'var(--good)'}
          bg={stats.outstanding > 0 ? 'var(--bad-bg)' : 'var(--good-bg)'}
        />
      </div>

      {/* Actions */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 14 }}>
        <button onClick={() => setShowForm(v => !v)} style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '7px 14px', background: 'var(--accent-c)', color: 'var(--accent-fg)', border: 0, borderRadius: 6, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
          <Plus size={14}/> Kayıt ekle
        </button>
      </div>

      {/* Log form */}
      {showForm && (
        <form onSubmit={handleLog} style={{ background: 'var(--surface)', border: '1px solid var(--border-c)', borderRadius: 10, padding: 16, marginBottom: 14, boxShadow: 'var(--shadow-sm)' }}>
          <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 12 }}>Çamaşır hareketi</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 100px 100px 140px', gap: 10, marginBottom: 10 }}>
            <div>
              <div style={{ fontSize: 11, color: 'var(--text-3)', fontWeight: 500, marginBottom: 3 }}>Oda *</div>
              <select value={fRoomId} onChange={e => setFRoomId(e.target.value)} style={inputStyle}>
                <option value="">Oda seçin…</option>
                {rooms.map(r => (
                  <option key={r.id} value={r.id}>{r.number}{r.floor != null ? ` (Kat ${r.floor})` : ''}</option>
                ))}
              </select>
            </div>
            <div>
              <div style={{ fontSize: 11, color: 'var(--text-3)', fontWeight: 500, marginBottom: 3 }}>Gönderilen</div>
              <input type="number" min={0} value={fSent} onChange={e => setFSent(Number(e.target.value))} style={inputStyle}/>
            </div>
            <div>
              <div style={{ fontSize: 11, color: 'var(--text-3)', fontWeight: 500, marginBottom: 3 }}>İade Edilen</div>
              <input type="number" min={0} value={fReturned} onChange={e => setFReturned(Number(e.target.value))} style={inputStyle}/>
            </div>
            <div>
              <div style={{ fontSize: 11, color: 'var(--text-3)', fontWeight: 500, marginBottom: 3 }}>Tarih</div>
              <input type="date" value={fDate} onChange={e => setFDate(e.target.value)} style={inputStyle}/>
            </div>
          </div>
          {formError && <div style={{ padding: '6px 10px', background: 'var(--bad-bg)', color: 'var(--bad)', borderRadius: 6, fontSize: 12, marginBottom: 10 }}>{formError}</div>}
          <div style={{ display: 'flex', gap: 6 }}>
            <button type="submit" disabled={logMut.isPending} style={{ padding: '7px 18px', background: 'var(--accent-c)', color: 'var(--accent-fg)', border: 0, borderRadius: 6, fontSize: 13, fontWeight: 600, cursor: 'pointer', opacity: logMut.isPending ? 0.6 : 1 }}>
              {logMut.isPending ? 'Kaydediliyor…' : 'Kaydet'}
            </button>
            <button type="button" onClick={() => { setShowForm(false); setFormError('') }} style={{ padding: '7px 12px', background: 'var(--surface-2)', color: 'var(--text-2)', border: '1px solid var(--border-c)', borderRadius: 6, fontSize: 13, cursor: 'pointer' }}>İptal</button>
          </div>
        </form>
      )}

      {/* Log table */}
      <div style={{ background: 'var(--surface)', border: '1px solid var(--border-c)', borderRadius: 10, overflow: 'hidden', boxShadow: 'var(--shadow-sm)' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead><tr>
              <th style={th}>Oda</th>
              <th style={th}>Tarih</th>
              <th style={th}>Gönderilen</th>
              <th style={th}>İade Edilen</th>
              <th style={th}>Net</th>
            </tr></thead>
            <tbody>
              {entries.map(e => {
                const net = e.sentCount - e.returnedCount
                return (
                  <tr key={e.id} style={{ borderTop: '1px solid var(--border-c)' }}>
                    <td style={{ ...td, fontWeight: 500 }}>
                      <span style={{ fontFamily: 'var(--font-mono)' }}>{e.roomNumber}</span>
                      {e.roomFloor != null && <div style={{ fontSize: 11, color: 'var(--text-3)' }}>Kat {e.roomFloor}</div>}
                    </td>
                    <td style={{ ...td, fontSize: 12, color: 'var(--text-2)' }}>{trDate(e.date)}</td>
                    <td style={td}>
                      {e.sentCount > 0
                        ? <Chip tone="warn">{e.sentCount} gönderildi</Chip>
                        : <span style={{ color: 'var(--text-3)', fontSize: 12 }}>—</span>}
                    </td>
                    <td style={td}>
                      {e.returnedCount > 0
                        ? <Chip tone="good">{e.returnedCount} iade</Chip>
                        : <span style={{ color: 'var(--text-3)', fontSize: 12 }}>—</span>}
                    </td>
                    <td style={td}>
                      <span style={{ fontSize: 12, fontWeight: 600, color: net > 0 ? 'var(--bad)' : net < 0 ? 'var(--info)' : 'var(--good)' }}>
                        {net > 0 ? `+${net} dışarıda` : net < 0 ? `${net} fazla iade` : 'Dengede'}
                      </span>
                    </td>
                  </tr>
                )
              })}
              {entries.length === 0 && (
                <tr><td colSpan={5} style={{ ...td, textAlign: 'center', color: 'var(--text-3)', padding: '32px 0' }}>Son 30 günde kayıt yok</td></tr>
              )}
            </tbody>
          </table>
        </div>
        <div style={{ padding: '10px 16px', borderTop: '1px solid var(--border-c)', fontSize: 12, color: 'var(--text-3)' }}>
          {entries.length} kayıt · Son 30 gün
        </div>
      </div>
    </div>
  )
}
