'use client'

import { useState } from 'react'
import { CheckCircle, AlertTriangle, Clock, Moon, Bed } from 'lucide-react'

const STATUS_META: Record<string, { label: string; tone: string; accent: string }> = {
  CLEAN:  { label: 'Temiz',   tone: 'good', accent: 'var(--good)' },
  DIRTY:  { label: 'Kirli',   tone: 'warn', accent: 'var(--warn)' },
  FAULTY: { label: 'Arızalı', tone: 'bad',  accent: 'var(--bad)' },
  DND:    { label: 'DND',     tone: 'info', accent: 'var(--info)' },
}

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

function StatusStat({ icon, label, count, color, bg }: { icon: React.ReactNode; label: string; count: number; color: string; bg: string }) {
  return (
    <div style={{ flex: 1, padding: '14px 16px', background: 'var(--surface)', border: '1px solid var(--border-c)', borderRadius: 10, display: 'flex', alignItems: 'center', gap: 12 }}>
      <div style={{ width: 36, height: 36, borderRadius: 8, background: bg, color, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{icon}</div>
      <div>
        <div style={{ fontSize: 11, color: 'var(--text-3)', letterSpacing: '0.03em', fontWeight: 500 }}>{label.toUpperCase()}</div>
        <div style={{ fontSize: 22, fontWeight: 600, letterSpacing: '-0.02em', color: 'var(--text)' }}>{count}</div>
      </div>
    </div>
  )
}

function RoomCard({ r }: { r: Room }) {
  const meta = STATUS_META[r.status] ?? { label: r.status, tone: 'neutral', accent: 'var(--text-3)' }
  return (
    <div style={{ position: 'relative', background: 'var(--surface)', border: '1px solid var(--border-c)', borderRadius: 10, padding: '14px 14px 12px 16px', overflow: 'hidden', cursor: 'pointer' }}
      onMouseEnter={e => (e.currentTarget.style.background = 'var(--surface-2)')}
      onMouseLeave={e => (e.currentTarget.style.background = 'var(--surface)')}
    >
      <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 3, background: meta.accent }}/>
      <div style={{ display: 'flex', alignItems: 'start', justifyContent: 'space-between', marginBottom: 8 }}>
        <div>
          <div style={{ fontSize: 20, fontWeight: 600, letterSpacing: '-0.02em', color: 'var(--text)' }}>{r.number}</div>
          <div style={{ fontSize: 11, color: 'var(--text-3)' }}>{r.roomType.name}</div>
        </div>
        <Chip tone={meta.tone} dot>{meta.label}</Chip>
      </div>
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
  const [view, setView] = useState<'grid' | 'list'>('grid')
  const floors = Array.from(new Set(rooms.map(r => r.floor))).sort((a, b) => (b ?? 0) - (a ?? 0))

  const viewBtn = (v: 'grid' | 'list') => ({
    padding: '5px 12px', background: view === v ? 'var(--surface-2)' : 'transparent',
    color: view === v ? 'var(--text)' : 'var(--text-2)', border: 0, borderRadius: 4,
    fontSize: 12, fontWeight: view === v ? 600 : 450, cursor: 'pointer' as const,
  })

  const th: React.CSSProperties = { textAlign: 'left', padding: '10px 14px', fontSize: 11, fontWeight: 600, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.05em', background: 'var(--surface-2)' }
  const td: React.CSSProperties = { padding: '11px 14px', fontSize: 13, color: 'var(--text)', verticalAlign: 'middle' }

  return (
    <div style={{ height: 'calc(100% - 56px)', overflowY: 'auto', padding: 24 }}>
      {/* Stats */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
        <StatusStat icon={<CheckCircle size={16}/>} label="Temiz"   count={countBy.CLEAN  ?? 0} color="var(--good)" bg="var(--good-bg)"/>
        <StatusStat icon={<Bed size={16}/>}         label="Kirli"   count={countBy.DIRTY  ?? 0} color="var(--warn)" bg="var(--warn-bg)"/>
        <StatusStat icon={<AlertTriangle size={16}/>}label="Arızalı"count={countBy.FAULTY ?? 0} color="var(--bad)"  bg="var(--bad-bg)"/>
        <StatusStat icon={<Moon size={16}/>}         label="DND"     count={countBy.DND    ?? 0} color="var(--info)" bg="var(--info-bg)"/>
      </div>

      {/* Toolbar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
        <div style={{ display: 'flex', background: 'var(--surface)', border: '1px solid var(--border-c)', borderRadius: 6, padding: 2 }}>
          <button onClick={() => setView('grid')} style={viewBtn('grid')}>Izgara</button>
          <button onClick={() => setView('list')} style={viewBtn('list')}>Liste</button>
        </div>
      </div>

      {view === 'grid' ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {floors.map(f => (
            <div key={f} style={{ background: 'var(--surface)', border: '1px solid var(--border-c)', borderRadius: 10, boxShadow: 'var(--shadow-sm)', overflow: 'hidden' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px', borderBottom: '1px solid var(--border-c)' }}>
                <div style={{ fontWeight: 600, fontSize: 14 }}>Kat {f}</div>
                <span style={{ fontSize: 11, color: 'var(--text-3)' }}>{rooms.filter(r => r.floor === f).length} oda</span>
              </div>
              <div style={{ padding: 16, display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 10 }}>
                {rooms.filter(r => r.floor === f).map(r => <RoomCard key={r.id} r={r}/>)}
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
              {rooms.map(r => {
                const meta = STATUS_META[r.status] ?? { label: r.status, tone: 'neutral', accent: 'var(--text-3)' }
                return (
                  <tr key={r.id} style={{ borderTop: '1px solid var(--border-c)' }}>
                    <td style={{ ...td, fontWeight: 600, fontFamily: 'var(--font-mono)' }}>{r.number}</td>
                    <td style={td}>{r.roomType.name}</td>
                    <td style={td}>{r.floor}</td>
                    <td style={td}><Chip tone={meta.tone} dot>{meta.label}</Chip></td>
                    <td style={td}>{r.currentGuest ? `${r.currentGuest.firstName} ${r.currentGuest.lastName}` : <span style={{ color: 'var(--text-3)' }}>—</span>}</td>
                    <td style={{ ...td, textAlign: 'right', fontWeight: 500 }}>{formatCurrency(r.roomType.basePrice)}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
