'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { CheckCircle, AlertTriangle, Moon, Bed } from 'lucide-react'
import { trpc } from '@/lib/trpc/client'

const STATUS_META: Record<string, { label: string; tone: string; accent: string }> = {
  CLEAN:  { label: 'Temiz',   tone: 'good', accent: 'var(--good)' },
  DIRTY:  { label: 'Kirli',   tone: 'warn', accent: 'var(--warn)' },
  FAULTY: { label: 'Arızalı', tone: 'bad',  accent: 'var(--bad)' },
  DND:    { label: 'DND',     tone: 'info', accent: 'var(--info)' },
}

const STATUS_OPTIONS = ['CLEAN', 'DIRTY', 'FAULTY', 'DND'] as const
type RoomStatus = typeof STATUS_OPTIONS[number]

interface Room {
  id: string; number: string; floor: number | null; status: string; faultNote: string | null
  roomType: { name: string; capacity: number; basePrice: number }
  currentGuest: { firstName: string; lastName: string; checkOut: string } | null
}

interface Props { rooms: Room[]; countBy: Record<string, number> }

function Chip({ tone, dot, children }: { tone: string; dot?: boolean; children: React.ReactNode }) {
  const map: Record<string, { bg: string; fg: string }> = {
    good: { bg: 'var(--good-bg)', fg: 'var(--good)' }, warn: { bg: 'var(--warn-bg)', fg: 'var(--warn)' },
    bad:  { bg: 'var(--bad-bg)',  fg: 'var(--bad)' },  info: { bg: 'var(--info-bg)', fg: 'var(--info)' },
    neutral: { bg: 'var(--surface-2)', fg: 'var(--text-2)' },
  }
  const t = map[tone] ?? map.neutral
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '2px 8px', borderRadius: 999, fontSize: 11, fontWeight: 500, background: t.bg, color: t.fg }}>
      {dot && <span style={{ width: 6, height: 6, borderRadius: 999, background: 'currentColor' }}/>}
      {children}
    </span>
  )
}

function trDate(iso: string) {
  const d = new Date(iso)
  const M = ['Oca','Şub','Mar','Nis','May','Haz','Tem','Ağu','Eyl','Eki','Kas','Ara']
  return `${d.getDate()} ${M[d.getMonth()]}`
}

function formatCurrency(kurus: number) { return (kurus / 100).toLocaleString('tr-TR') + ' ₺' }

const STAT_ICONS: Record<string, React.ReactNode> = {
  CLEAN: <CheckCircle size={16}/>, DIRTY: <Bed size={16}/>,
  FAULTY: <AlertTriangle size={16}/>, DND: <Moon size={16}/>,
}
const STAT_COLORS: Record<string, { color: string; bg: string }> = {
  CLEAN:  { color: 'var(--good)', bg: 'var(--good-bg)' },
  DIRTY:  { color: 'var(--warn)', bg: 'var(--warn-bg)' },
  FAULTY: { color: 'var(--bad)',  bg: 'var(--bad-bg)'  },
  DND:    { color: 'var(--info)', bg: 'var(--info-bg)' },
}

function RoomCard({ r, onChanged }: { r: Room; onChanged: () => void }) {
  const meta = STATUS_META[r.status] ?? { label: r.status, tone: 'neutral', accent: 'var(--text-3)' }
  const [open, setOpen] = useState(false)
  const [faultDetail, setFaultDetail] = useState('')

  const updateStatus = trpc.room.updateStatus.useMutation({
    onSuccess: () => { setOpen(false); setFaultDetail(''); onChanged() },
  })

  return (
    <div style={{ position: 'relative', background: 'var(--surface)', border: '1px solid var(--border-c)', borderRadius: 10, padding: '14px 14px 12px 16px', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 3, background: meta.accent }}/>
      <div style={{ display: 'flex', alignItems: 'start', justifyContent: 'space-between', marginBottom: 8 }}>
        <div>
          <div style={{ fontSize: 20, fontWeight: 600, letterSpacing: '-0.02em', color: 'var(--text)' }}>{r.number}</div>
          <div style={{ fontSize: 11, color: 'var(--text-3)' }}>{r.roomType.name}</div>
        </div>
        <button onClick={() => setOpen(v => !v)} style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer' }} title="Durum değiştir">
          <Chip tone={meta.tone} dot>{meta.label}</Chip>
        </button>
      </div>
      {open && (
        <div style={{ marginBottom: 10, background: 'var(--surface-2)', borderRadius: 6, padding: 8, display: 'flex', flexDirection: 'column', gap: 4 }}>
          {STATUS_OPTIONS.filter(s => s !== r.status).map(s => (
            <button key={s}
              onClick={() => { if (s === 'FAULTY' && !faultDetail.trim()) return; updateStatus.mutate({ id: r.id, status: s, faultDetail: s === 'FAULTY' ? faultDetail : undefined }) }}
              disabled={updateStatus.isPending || (s === 'FAULTY' && !faultDetail.trim())}
              style={{ padding: '5px 8px', background: 'var(--surface)', border: '1px solid var(--border-c)', borderRadius: 4, fontSize: 11, fontWeight: 500, cursor: 'pointer', textAlign: 'left', color: STATUS_META[s].accent, opacity: (s === 'FAULTY' && !faultDetail.trim()) ? 0.4 : 1 }}
            >→ {STATUS_META[s].label}</button>
          ))}
          <input value={faultDetail} onChange={e => setFaultDetail(e.target.value)}
            placeholder="Arıza notu (FAULTY için)"
            style={{ marginTop: 4, padding: '5px 8px', border: '1px solid var(--border-c)', borderRadius: 4, fontSize: 11, background: 'var(--bg)', color: 'var(--text)', outline: 'none' }}/>
          <button onClick={() => setOpen(false)} style={{ padding: '4px', fontSize: 10, color: 'var(--text-3)', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left' }}>Kapat</button>
        </div>
      )}
      <div style={{ display: 'flex', gap: 14, fontSize: 11, color: 'var(--text-2)', marginBottom: 8 }}>
        <span>{r.roomType.capacity} kişi</span>
        <span>{formatCurrency(r.roomType.basePrice)}</span>
      </div>
      {r.currentGuest ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 8px', background: 'var(--surface-2)', borderRadius: 6, fontSize: 11, color: 'var(--text-2)' }}>
          <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.currentGuest.firstName} {r.currentGuest.lastName}</span>
          <span style={{ color: 'var(--text-3)', fontFamily: 'var(--font-mono)' }}>→{trDate(r.currentGuest.checkOut)}</span>
        </div>
      ) : (
        <div style={{ fontSize: 11, color: 'var(--text-3)', padding: '6px 8px' }}>Boş</div>
      )}
      {r.faultNote && (
        <div style={{ marginTop: 6, fontSize: 11, color: 'var(--bad)', padding: '6px 8px', background: 'var(--bad-bg)', borderRadius: 6 }}>⚠ {r.faultNote}</div>
      )}
    </div>
  )
}

export function RoomsClient({ rooms, countBy }: Props) {
  const router = useRouter()
  const [view, setView] = useState<'grid' | 'list'>('grid')

  // Filters
  const [filterFloor, setFilterFloor] = useState<number | null | 'ALL'>('ALL')
  const [filterType, setFilterType] = useState<string>('ALL')
  const [filterStatuses, setFilterStatuses] = useState<Set<string>>(new Set())

  function toggleStatus(s: string) {
    setFilterStatuses(prev => {
      const next = new Set(prev)
      next.has(s) ? next.delete(s) : next.add(s)
      return next
    })
  }

  const hasFilters = filterFloor !== 'ALL' || filterType !== 'ALL' || filterStatuses.size > 0

  function clearFilters() {
    setFilterFloor('ALL'); setFilterType('ALL'); setFilterStatuses(new Set())
  }

  // Derive filter options from full room list
  const allFloors = Array.from(new Set(rooms.map(r => r.floor))).sort((a, b) => (a ?? 0) - (b ?? 0))
  const allTypes  = Array.from(new Set(rooms.map(r => r.roomType.name))).sort((a, b) => a.localeCompare(b, 'tr'))

  // Apply filters
  const filtered = rooms.filter(r => {
    if (filterFloor !== 'ALL' && r.floor !== filterFloor) return false
    if (filterType  !== 'ALL' && r.roomType.name !== filterType) return false
    if (filterStatuses.size > 0 && !filterStatuses.has(r.status)) return false
    return true
  })

  const visibleFloors = Array.from(new Set(filtered.map(r => r.floor))).sort((a, b) => (a ?? 0) - (b ?? 0))

  const th: React.CSSProperties = { textAlign: 'left', padding: '10px 14px', fontSize: 11, fontWeight: 600, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.05em', background: 'var(--surface-2)', whiteSpace: 'nowrap' }
  const td: React.CSSProperties = { padding: '11px 14px', fontSize: 13, color: 'var(--text)', verticalAlign: 'middle' }

  const viewBtn = (v: 'grid' | 'list') => ({
    padding: '5px 12px', background: view === v ? 'var(--surface-2)' : 'transparent',
    color: view === v ? 'var(--text)' : 'var(--text-2)', border: 0, borderRadius: 4,
    fontSize: 12, fontWeight: view === v ? 600 : 450, cursor: 'pointer' as const,
  })

  const pillActive: React.CSSProperties  = { padding: '4px 12px', borderRadius: 999, fontSize: 12, fontWeight: 600, cursor: 'pointer', border: '1px solid var(--accent-c)', background: 'var(--accent-c)', color: 'var(--accent-fg)' }
  const pillInactive: React.CSSProperties = { padding: '4px 12px', borderRadius: 999, fontSize: 12, fontWeight: 450, cursor: 'pointer', border: '1px solid var(--border-c)', background: 'transparent', color: 'var(--text-2)' }

  return (
    <div style={{ height: 'calc(100% - 56px)', overflowY: 'auto', padding: 24 }}>
      {/* Stats — clickable status filter */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
        {STATUS_OPTIONS.map(s => {
          const { color, bg } = STAT_COLORS[s]
          const active = filterStatuses.has(s)
          const dimmed = filterStatuses.size > 0 && !active
          return (
            <button key={s} onClick={() => toggleStatus(s)} style={{ flex: 1, padding: '14px 16px', background: 'var(--surface)', border: `1px solid ${active ? color : 'var(--border-c)'}`, borderRadius: 10, display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer', opacity: dimmed ? 0.45 : 1, transition: 'opacity 0.15s, border-color 0.15s', textAlign: 'left' }}>
              <div style={{ width: 36, height: 36, borderRadius: 8, background: bg, color, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{STAT_ICONS[s]}</div>
              <div>
                <div style={{ fontSize: 11, color: 'var(--text-3)', letterSpacing: '0.03em', fontWeight: 500 }}>{STATUS_META[s].label.toUpperCase()}</div>
                <div style={{ fontSize: 22, fontWeight: 600, letterSpacing: '-0.02em', color: 'var(--text)' }}>{countBy[s] ?? 0}</div>
              </div>
            </button>
          )
        })}
      </div>

      {/* Toolbar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14, flexWrap: 'wrap' }}>
        {/* View toggle */}
        <div style={{ display: 'flex', background: 'var(--surface)', border: '1px solid var(--border-c)', borderRadius: 6, padding: 2 }}>
          <button onClick={() => setView('grid')} style={viewBtn('grid')}>Izgara</button>
          <button onClick={() => setView('list')} style={viewBtn('list')}>Liste</button>
        </div>

        <div style={{ width: 1, height: 20, background: 'var(--border-c)' }}/>

        {/* Floor pills */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 11, color: 'var(--text-3)', fontWeight: 500, marginRight: 2 }}>KAT</span>
          <button onClick={() => setFilterFloor('ALL')} style={filterFloor === 'ALL' ? pillActive : pillInactive}>Tümü</button>
          {allFloors.map(f => (
            <button key={String(f)} onClick={() => setFilterFloor(f)} style={filterFloor === f ? pillActive : pillInactive}>
              {f != null ? `Kat ${f}` : '—'}
            </button>
          ))}
        </div>

        <div style={{ width: 1, height: 20, background: 'var(--border-c)' }}/>

        {/* Type select */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontSize: 11, color: 'var(--text-3)', fontWeight: 500 }}>TİP</span>
          <select
            value={filterType}
            onChange={e => setFilterType(e.target.value)}
            style={{ padding: '4px 8px', border: '1px solid var(--border-c)', borderRadius: 6, fontSize: 12, background: filterType !== 'ALL' ? 'var(--accent-c)' : 'var(--surface)', color: filterType !== 'ALL' ? 'var(--accent-fg)' : 'var(--text-2)', cursor: 'pointer', outline: 'none' }}
          >
            <option value="ALL">Tümü</option>
            {allTypes.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>

        {hasFilters && (
          <>
            <div style={{ flex: 1 }}/>
            <button onClick={clearFilters} style={{ padding: '4px 12px', borderRadius: 999, fontSize: 12, border: '1px solid var(--border-c)', background: 'var(--surface-2)', color: 'var(--text-3)', cursor: 'pointer' }}>
              ✕ Filtreyi temizle
            </button>
          </>
        )}

        <div style={{ marginLeft: hasFilters ? 0 : 'auto', fontSize: 12, color: 'var(--text-3)' }}>
          {filtered.length} / {rooms.length} oda
        </div>
      </div>

      {filtered.length === 0 && (
        <div style={{ padding: 48, textAlign: 'center', color: 'var(--text-3)', fontSize: 13, background: 'var(--surface)', border: '1px solid var(--border-c)', borderRadius: 10 }}>
          Seçili filtrelere uyan oda bulunamadı.
        </div>
      )}

      {view === 'grid' ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {visibleFloors.map(f => (
            <div key={String(f)} style={{ background: 'var(--surface)', border: '1px solid var(--border-c)', borderRadius: 10, boxShadow: 'var(--shadow-sm)', overflow: 'hidden' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px', borderBottom: '1px solid var(--border-c)' }}>
                <div style={{ fontWeight: 600, fontSize: 14 }}>{f != null ? `Kat ${f}` : 'Katsız'}</div>
                <span style={{ fontSize: 11, color: 'var(--text-3)' }}>{filtered.filter(r => r.floor === f).length} oda</span>
              </div>
              <div style={{ padding: 16, display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 10 }}>
                {filtered.filter(r => r.floor === f).map(r => <RoomCard key={r.id} r={r} onChanged={() => router.refresh()}/>)}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border-c)', borderRadius: 10, overflow: 'hidden', boxShadow: 'var(--shadow-sm)' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead><tr>
              <th style={th}>Oda</th><th style={th}>Tip</th><th style={th}>Kat</th>
              <th style={th}>Durum</th><th style={th}>Misafir</th><th style={{ ...th, textAlign: 'right' }}>Gecelik</th>
            </tr></thead>
            <tbody>
              {filtered.length === 0
                ? <tr><td colSpan={6} style={{ ...td, textAlign: 'center', color: 'var(--text-3)' }}>Seçili filtrelere uyan oda bulunamadı.</td></tr>
                : filtered.map(r => {
                    const meta = STATUS_META[r.status] ?? { label: r.status, tone: 'neutral', accent: 'var(--text-3)' }
                    return (
                      <tr key={r.id} style={{ borderTop: '1px solid var(--border-c)' }}>
                        <td style={{ ...td, fontWeight: 600, fontFamily: 'var(--font-mono)' }}>{r.number}</td>
                        <td style={td}>{r.roomType.name}</td>
                        <td style={td}>{r.floor ?? '—'}</td>
                        <td style={td}><Chip tone={meta.tone} dot>{meta.label}</Chip></td>
                        <td style={td}>{r.currentGuest ? `${r.currentGuest.firstName} ${r.currentGuest.lastName}` : <span style={{ color: 'var(--text-3)' }}>—</span>}</td>
                        <td style={{ ...td, textAlign: 'right', fontWeight: 500 }}>{formatCurrency(r.roomType.basePrice)}</td>
                      </tr>
                    )
                  })
              }
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
