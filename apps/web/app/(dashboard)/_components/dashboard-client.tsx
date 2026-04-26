'use client'

import Link from 'next/link'
import { Key, CheckCircle, Clock, AlertTriangle } from 'lucide-react'
import { trDate } from '@/lib/utils'
import { Chip } from '@/components/ui/chip'
import { StatTile } from '@/components/ui/stat-tile'
import { SectionCard } from '@/components/ui/section-card'
import { Avatar } from '@/components/ui/avatar'
import { th, td } from '@/components/ui/data-table'

interface Arrival { id: string; status: string; checkIn: string; checkOut: string; guest: { firstName: string; lastName: string }; room: { number: string; typeName: string; status: string } | null }
interface Departure { id: string; checkIn: string; checkOut: string; guest: { firstName: string; lastName: string }; room: { number: string } | null }
interface RoomStatus { status: string; count: number }

interface Props {
  data: {
    totalRooms: number; checkedIn: number; arrivals: Arrival[]; departures: Departure[]
    urgentFaults: number; occPct: number; roomStatuses: RoomStatus[]
  }
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
        <StatTile label="DOLULUK"     value={`${data.occPct}%`}              sub={`${data.checkedIn} / ${data.totalRooms} oda`} trend={6}/>
        <StatTile label="BUGÜN GİRİŞ" value={String(data.arrivals.length)}   sub="beklenen rezervasyon"/>
        <StatTile label="BUGÜN ÇIKIŞ" value={String(data.departures.length)} sub="check-out bekleniyor"/>
        <StatTile label="ACİL ARIZA"  value={String(data.urgentFaults)}      sub="bekleyen iş"/>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 16, marginBottom: 16 }}>
        {/* Arrivals */}
        <SectionCard
          title={`Bugün giriş (${data.arrivals.length})`}
          right={<Link href="/reservation" style={{ fontSize: 12, color: 'var(--text-2)', textDecoration: 'none', padding: '4px 10px', border: '1px solid var(--border-c)', borderRadius: 6 }}>Tümü</Link>}
        >
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
                          <Avatar initials={`${r.guest.firstName[0] ?? ''}${r.guest.lastName[0] ?? ''}`} size={30}/>
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
        </SectionCard>

        {/* Room status board */}
        <SectionCard title="Oda durumu · Canlı">
          <div style={{ padding: 16 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 16 }}>
              <RoomStat icon={<CheckCircle size={14}/>} label="Temiz"   count={clean}  color="var(--good)" bg="var(--good-bg)"/>
              <RoomStat icon={<AlertTriangle size={14}/>} label="Kirli" count={dirty}  color="var(--warn)" bg="var(--warn-bg)"/>
              <RoomStat icon={<AlertTriangle size={14}/>} label="Arızalı" count={faulty} color="var(--bad)" bg="var(--bad-bg)"/>
              <RoomStat icon={<Clock size={14}/>} label="DND"          count={dnd}    color="var(--info)" bg="var(--info-bg)"/>
            </div>
            <Link href="/rooms" style={{ display: 'block', textAlign: 'center', padding: '8px', background: 'var(--surface-2)', borderRadius: 6, fontSize: 12, color: 'var(--text-2)', textDecoration: 'none' }}>Tüm odaları gör →</Link>
          </div>
        </SectionCard>
      </div>

      {/* Departures + alerts */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <SectionCard title={`Bugün çıkış (${data.departures.length})`}>
          {data.departures.length === 0 ? (
            <div style={{ padding: 24, fontSize: 13, color: 'var(--text-3)', textAlign: 'center' }}>Bugün beklenen çıkış yok</div>
          ) : (
            data.departures.map(r => (
              <div key={r.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px', borderTop: '1px solid var(--border-c)' }}>
                <Avatar initials={`${r.guest.firstName[0] ?? ''}${r.guest.lastName[0] ?? ''}`} size={30} tone="muted"/>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 500, fontSize: 13 }}>{r.guest.firstName} {r.guest.lastName}</div>
                  {r.room && <div style={{ fontSize: 11, color: 'var(--text-3)' }}>Oda {r.room.number}</div>}
                </div>
                <Chip tone="warn" dot>Çıkış bekliyor</Chip>
              </div>
            ))
          )}
        </SectionCard>

        <SectionCard title="Dikkat gereken">
          <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
            {data.urgentFaults > 0 && <Alert tone="bad" title={`${data.urgentFaults} acil arıza bekliyor`} body="Teknik servis ekibiyle iletişime geçin."/>}
            <Alert tone="info" title="Hızlı işlemler" body="Yeni rezervasyon oluşturmak için ⌘K kullanın."/>
            {data.arrivals.length > 0 && <Alert tone="good" title={`${data.arrivals.length} bugün giriş yapacak`} body="Check-in işlemleri hazır."/>}
          </div>
        </SectionCard>
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
  const t  = { bad: 'var(--bad)', warn: 'var(--warn)', info: 'var(--info)', good: 'var(--good)' }[tone] ?? 'var(--text-3)'
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
