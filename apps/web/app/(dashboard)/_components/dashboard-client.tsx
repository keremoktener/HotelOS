'use client'

import Link from 'next/link'
import { Key, CheckCircle, Clock, AlertTriangle, Plus } from 'lucide-react'

const th: React.CSSProperties = { textAlign: 'left', padding: '10px 14px', fontSize: 11, fontWeight: 600, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.05em', background: 'var(--surface-2)', whiteSpace: 'nowrap' }
const td: React.CSSProperties = { padding: '11px 14px', fontSize: 13, color: 'var(--text)', verticalAlign: 'middle' }

interface Arrival { id: string; status: string; checkIn: string; checkOut: string; guest: { firstName: string; lastName: string }; room: { number: string; typeName: string; status: string } | null }
interface Departure { id: string; checkIn: string; checkOut: string; guest: { firstName: string; lastName: string }; room: { number: string } | null }
interface RoomStatus { status: string; count: number }

interface Props {
  data: {
    totalRooms: number; checkedIn: number; arrivals: Arrival[]; departures: Departure[]
    urgentFaults: number; occPct: number; roomStatuses: RoomStatus[]
  }
}

function StatTile({ label, value, sub, trend }: { label: string; value: string; sub?: string; trend?: number }) {
  return (
    <div style={{ flex: 1, padding: '14px 16px', background: 'var(--surface)', border: '1px solid var(--border-c)', borderRadius: 10, minWidth: 0 }}>
      <div style={{ fontSize: 11, color: 'var(--text-3)', letterSpacing: '0.03em', fontWeight: 500, marginBottom: 6 }}>{label}</div>
      <div style={{ fontSize: 26, fontWeight: 600, letterSpacing: '-0.02em', color: 'var(--text)' }}>{value}</div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
        {trend != null && <span style={{ fontSize: 11, fontWeight: 500, color: trend >= 0 ? 'var(--good)' : 'var(--bad)' }}>{trend >= 0 ? '▲' : '▼'} {Math.abs(trend)}%</span>}
        {sub && <span style={{ fontSize: 11, color: 'var(--text-3)' }}>{sub}</span>}
      </div>
    </div>
  )
}

function Chip({ tone, dot, children }: { tone: string; dot?: boolean; children: React.ReactNode }) {
  const map: Record<string, { bg: string; fg: string }> = {
    good:    { bg: 'var(--good-bg)',    fg: 'var(--good)' },
    warn:    { bg: 'var(--warn-bg)',    fg: 'var(--warn)' },
    bad:     { bg: 'var(--bad-bg)',     fg: 'var(--bad)' },
    info:    { bg: 'var(--info-bg)',    fg: 'var(--info)' },
    neutral: { bg: 'var(--surface-2)', fg: 'var(--text-2)' },
    muted:   { bg: 'transparent',      fg: 'var(--text-3)' },
  }
  const t = map[tone] ?? map.neutral
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '2px 8px', borderRadius: 999, fontSize: 11, fontWeight: 500, background: t.bg, color: t.fg, whiteSpace: 'nowrap', lineHeight: 1.4 }}>
      {dot && <span style={{ width: 6, height: 6, borderRadius: 999, background: 'currentColor' }}/>}
      {children}
    </span>
  )
}

function initials(first: string, last: string) { return `${first[0] ?? ''}${last[0] ?? ''}`.toUpperCase() }

function trDate(iso: string) {
  const d = new Date(iso)
  const M = ['Oca','Şub','Mar','Nis','May','Haz','Tem','Ağu','Eyl','Eki','Kas','Ara']
  return `${d.getDate()} ${M[d.getMonth()]}`
}

export function DashboardClient({ data }: Props) {
  const clean  = data.roomStatuses.find(s => s.status === 'CLEAN')?.count ?? 0
  const dirty  = data.roomStatuses.find(s => s.status === 'DIRTY')?.count ?? 0
  const faulty = data.roomStatuses.find(s => s.status === 'FAULTY')?.count ?? 0
  const dnd    = data.roomStatuses.find(s => s.status === 'DND')?.count ?? 0

  return (
    <div style={{ height: '100%', overflowY: 'auto', padding: 24 }}>
      {/* KPI row */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
        <StatTile label="DOLULUK" value={`${data.occPct}%`} sub={`${data.checkedIn} / ${data.totalRooms} oda`} trend={6}/>
        <StatTile label="BUGÜN GİRİŞ" value={String(data.arrivals.length)} sub="beklenen rezervasyon"/>
        <StatTile label="BUGÜN ÇIKIŞ" value={String(data.departures.length)} sub="check-out bekleniyor"/>
        <StatTile label="ACİL ARIZA" value={String(data.urgentFaults)} sub="bekleyen iş"/>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 16, marginBottom: 16 }}>
        {/* Arrivals table */}
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border-c)', borderRadius: 10, overflow: 'hidden', boxShadow: 'var(--shadow-sm)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px', borderBottom: '1px solid var(--border-c)' }}>
            <div style={{ fontWeight: 600, fontSize: 14, color: 'var(--text)' }}>Bugün giriş ({data.arrivals.length})</div>
            <Link href="/reservation" style={{ fontSize: 12, color: 'var(--text-2)', textDecoration: 'none', padding: '4px 10px', border: '1px solid var(--border-c)', borderRadius: 6 }}>Tümü</Link>
          </div>
          {data.arrivals.length === 0 ? (
            <div style={{ padding: 24, fontSize: 13, color: 'var(--text-3)', textAlign: 'center' }}>Bugün beklenen giriş yok</div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead><tr>
                  <th style={th}>Misafir</th><th style={th}>Oda</th><th style={th}>Konaklama</th><th style={{ ...th, textAlign: 'right' }}></th>
                </tr></thead>
                <tbody>
                  {data.arrivals.map(r => (
                    <tr key={r.id} style={{ borderTop: '1px solid var(--border-c)' }}>
                      <td style={td}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <div style={{ width: 30, height: 30, borderRadius: 999, background: 'var(--accent-weak)', color: 'var(--accent-c)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 600 }}>{initials(r.guest.firstName, r.guest.lastName)}</div>
                          <div>
                            <div style={{ fontWeight: 500 }}>{r.guest.firstName} {r.guest.lastName}</div>
                            <div style={{ fontSize: 11, color: 'var(--text-3)' }}>{r.id}</div>
                          </div>
                        </div>
                      </td>
                      <td style={td}>
                        {r.room ? <><div style={{ fontWeight: 500 }}>Oda {r.room.number}</div><div style={{ fontSize: 11, color: 'var(--text-3)' }}>{r.room.typeName}</div></> : <span style={{ color: 'var(--text-3)' }}>—</span>}
                      </td>
                      <td style={td}><div style={{ fontSize: 12, color: 'var(--text-2)' }}>{trDate(r.checkIn)} → {trDate(r.checkOut)}</div></td>
                      <td style={{ ...td, textAlign: 'right' }}>
                        <Link href={`/reservation/${r.id}`} style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '5px 10px', background: 'var(--accent-c)', color: 'var(--accent-fg)', borderRadius: 6, fontSize: 12, fontWeight: 500, textDecoration: 'none' }}>
                          <Key size={12}/>Check-in
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Room status board */}
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border-c)', borderRadius: 10, boxShadow: 'var(--shadow-sm)' }}>
          <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--border-c)', fontWeight: 600, fontSize: 14 }}>Oda durumu · Canlı</div>
          <div style={{ padding: 16 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 16 }}>
              <RoomStat icon={<CheckCircle size={14}/>} label="Temiz" count={clean} color="var(--good)" bg="var(--good-bg)"/>
              <RoomStat icon={<AlertTriangle size={14}/>} label="Kirli" count={dirty} color="var(--warn)" bg="var(--warn-bg)"/>
              <RoomStat icon={<AlertTriangle size={14}/>} label="Arızalı" count={faulty} color="var(--bad)" bg="var(--bad-bg)"/>
              <RoomStat icon={<Clock size={14}/>} label="DND" count={dnd} color="var(--info)" bg="var(--info-bg)"/>
            </div>
            <Link href="/rooms" style={{ display: 'block', textAlign: 'center', padding: '8px', background: 'var(--surface-2)', borderRadius: 6, fontSize: 12, color: 'var(--text-2)', textDecoration: 'none' }}>Tüm odaları gör →</Link>
          </div>
        </div>
      </div>

      {/* Departures + alerts */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border-c)', borderRadius: 10, boxShadow: 'var(--shadow-sm)' }}>
          <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--border-c)', fontWeight: 600, fontSize: 14 }}>Bugün çıkış ({data.departures.length})</div>
          {data.departures.length === 0 ? (
            <div style={{ padding: 24, fontSize: 13, color: 'var(--text-3)', textAlign: 'center' }}>Bugün beklenen çıkış yok</div>
          ) : (
            data.departures.map(r => (
              <div key={r.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px', borderTop: '1px solid var(--border-c)' }}>
                <div style={{ width: 30, height: 30, borderRadius: 999, background: 'var(--surface-2)', color: 'var(--text-2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 600 }}>{initials(r.guest.firstName, r.guest.lastName)}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 500, fontSize: 13 }}>{r.guest.firstName} {r.guest.lastName}</div>
                  {r.room && <div style={{ fontSize: 11, color: 'var(--text-3)' }}>Oda {r.room.number}</div>}
                </div>
                <Chip tone="warn" dot>Çıkış bekliyor</Chip>
              </div>
            ))
          )}
        </div>

        <div style={{ background: 'var(--surface)', border: '1px solid var(--border-c)', borderRadius: 10, boxShadow: 'var(--shadow-sm)' }}>
          <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--border-c)', fontWeight: 600, fontSize: 14 }}>Dikkat gereken</div>
          <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
            {data.urgentFaults > 0 && <Alert tone="bad" title={`${data.urgentFaults} acil arıza bekliyor`} body="Teknik servis ekibiyle iletişime geçin."/>}
            <Alert tone="info" title="Hızlı işlemler" body="Yeni rezervasyon oluşturmak için ⌘K kullanın."/>
            {data.arrivals.length > 0 && <Alert tone="good" title={`${data.arrivals.length} bugün giriş yapacak`} body="Check-in işlemleri hazır."/>}
          </div>
        </div>
      </div>
    </div>
  )
}

function RoomStat({ icon, label, count, color, bg }: { icon: React.ReactNode; label: string; count: number; color: string; bg: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', background: bg, borderRadius: 8 }}>
      <div style={{ color }}>{icon}</div>
      <div>
        <div style={{ fontSize: 11, color: 'var(--text-3)', fontWeight: 500 }}>{label}</div>
        <div style={{ fontSize: 20, fontWeight: 600, color: 'var(--text)', letterSpacing: '-0.02em' }}>{count}</div>
      </div>
    </div>
  )
}

function Alert({ tone, title, body }: { tone: string; title: string; body: string }) {
  const t = { bad: 'var(--bad)', warn: 'var(--warn)', info: 'var(--info)', good: 'var(--good)' }[tone] ?? 'var(--text-3)'
  const bg = { bad: 'var(--bad-bg)', warn: 'var(--warn-bg)', info: 'var(--info-bg)', good: 'var(--good-bg)' }[tone] ?? 'var(--surface-2)'
  return (
    <div style={{ display: 'flex', gap: 10, padding: '10px 12px', borderRadius: 6, background: bg, border: '1px solid var(--border-c)' }}>
      <div style={{ width: 3, borderRadius: 2, background: t, flexShrink: 0 }}/>
      <div>
        <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text)' }}>{title}</div>
        <div style={{ fontSize: 11, color: 'var(--text-2)', marginTop: 2 }}>{body}</div>
      </div>
    </div>
  )
}
