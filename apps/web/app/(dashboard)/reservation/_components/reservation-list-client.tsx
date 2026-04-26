'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { MoreHorizontal, Search } from 'lucide-react'
import { trDate, displayCurrency } from '@/lib/utils'
import { Chip } from '@/components/ui/chip'
import { Avatar } from '@/components/ui/avatar'
import { th, td } from '@/components/ui/data-table'

const STATUS_LABEL: Record<string, string> = {
  WAITING: 'Beklemede', CONFIRMED: 'Onaylandı', CHECKEDIN: 'Girişte',
  CHECKEDOUT: 'Çıkış yapıldı', CANCELLED: 'İptal', NOSHOW: 'No-show',
}
const STATUS_TONE: Record<string, string> = {
  WAITING: 'info', CONFIRMED: 'neutral', CHECKEDIN: 'good',
  CHECKEDOUT: 'muted', CANCELLED: 'bad', NOSHOW: 'bad',
}
const FILTERS = ['ALL', 'WAITING', 'CONFIRMED', 'CHECKEDIN', 'CHECKEDOUT', 'CANCELLED']
const FILTER_LABEL: Record<string, string> = { ALL: 'Tümü', WAITING: 'Beklemede', CONFIRMED: 'Onaylandı', CHECKEDIN: 'Girişte', CHECKEDOUT: 'Çıkış', CANCELLED: 'İptal' }

type SortKey = 'guest' | 'room' | 'date' | 'price'
type SortDir = 'asc' | 'desc'
const DEFAULT_DIR: Record<SortKey, SortDir> = { guest: 'asc', room: 'asc', date: 'asc', price: 'desc' }

function SortIcon({ active, dir }: { active: boolean; dir: SortDir }) {
  if (!active) return <span style={{ opacity: 0.3, marginLeft: 4, fontSize: 10 }}>⇅</span>
  return <span style={{ marginLeft: 4, fontSize: 10 }}>{dir === 'asc' ? '↑' : '↓'}</span>
}

interface Reservation {
  id: string; status: string; totalPrice: number; checkIn: string; checkOut: string
  adults: number; children: number
  guest: { firstName: string; lastName: string }
  room: { number: string; typeName: string } | null
}

interface Props {
  reservations: Reservation[]; total: number; page: number; totalPages: number; activeStatus?: string
}

export function ReservationListClient({ reservations, total, page, totalPages, activeStatus }: Props) {
  const router = useRouter()
  const [q, setQ] = useState('')
  const [sortKey, setSortKey] = useState<SortKey | null>(null)
  const [sortDir, setSortDir] = useState<SortDir>('asc')

  function handleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    } else {
      setSortKey(key)
      setSortDir(DEFAULT_DIR[key])
    }
  }

  const filtered = q
    ? reservations.filter(r => `${r.guest.firstName} ${r.guest.lastName} ${r.id} ${r.room?.number ?? ''}`.toLowerCase().includes(q.toLowerCase()))
    : reservations

  const sorted = sortKey
    ? [...filtered].sort((a, b) => {
        let cmp = 0
        if (sortKey === 'guest') {
          const na = `${a.guest.firstName} ${a.guest.lastName}`.toLowerCase()
          const nb = `${b.guest.firstName} ${b.guest.lastName}`.toLowerCase()
          cmp = na.localeCompare(nb, 'tr')
        } else if (sortKey === 'room') {
          cmp = (parseInt(a.room?.number ?? '0', 10) || 0) - (parseInt(b.room?.number ?? '0', 10) || 0)
        } else if (sortKey === 'date') {
          cmp = new Date(a.checkIn).getTime() - new Date(b.checkIn).getTime()
        } else if (sortKey === 'price') {
          cmp = a.totalPrice - b.totalPrice
        }
        return sortDir === 'asc' ? cmp : -cmp
      })
    : filtered

  function navStatus(s: string) {
    router.push(s === 'ALL' ? '/reservation' : `/reservation?status=${s}`)
  }

  const active = activeStatus ?? 'ALL'

  const sortableTh = (key: SortKey, label: string, align?: 'right') => (
    <th style={{ ...th, cursor: 'pointer', userSelect: 'none', textAlign: align ?? 'left' }} onClick={() => handleSort(key)}>
      {label}<SortIcon active={sortKey === key} dir={sortDir}/>
    </th>
  )

  return (
    <div style={{ height: 'calc(100% - 56px)', overflowY: 'auto', padding: 24 }}>
      {/* Filter bar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14, flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', background: 'var(--surface)', border: '1px solid var(--border-c)', borderRadius: 6, padding: 2 }}>
          {FILTERS.map(f => (
            <button key={f} onClick={() => navStatus(f)} style={{ padding: '5px 10px', background: active === f ? 'var(--surface-2)' : 'transparent', color: active === f ? 'var(--text)' : 'var(--text-2)', border: 0, borderRadius: 4, fontSize: 12, fontWeight: active === f ? 600 : 450, cursor: 'pointer' }}>
              {FILTER_LABEL[f]}
            </button>
          ))}
        </div>
        <div style={{ flex: 1 }}/>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, height: 30, padding: '0 10px', background: 'var(--surface)', border: '1px solid var(--border-c)', borderRadius: 6, color: 'var(--text-3)', fontSize: 12, minWidth: 220 }}>
          <Search size={13}/>
          <input value={q} onChange={e => setQ(e.target.value)} placeholder="Misafir adı, oda no…" style={{ flex: 1, border: 0, background: 'transparent', outline: 'none', color: 'var(--text)', fontSize: 12 }}/>
        </div>
      </div>

      <div style={{ background: 'var(--surface)', border: '1px solid var(--border-c)', borderRadius: 10, overflow: 'hidden', boxShadow: 'var(--shadow-sm)' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead><tr>
              <th style={th}>ID</th>
              {sortableTh('guest', 'Misafir')}
              {sortableTh('room', 'Oda')}
              {sortableTh('date', 'Giriş → Çıkış')}
              <th style={th}>Kişi</th>
              <th style={th}>Durum</th>
              {sortableTh('price', 'Toplam', 'right')}
              <th style={{ ...th, width: 40 }}></th>
            </tr></thead>
            <tbody>
              {sorted.map(r => (
                <tr key={r.id}
                  onClick={() => router.push(`/reservation/${r.id}`)}
                  style={{ borderTop: '1px solid var(--border-c)', cursor: 'pointer' }}
                  onMouseEnter={e => (e.currentTarget.style.background = 'var(--surface-2)')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                >
                  <td style={{ ...td, fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--text-2)' }}>{r.id.slice(0, 8)}</td>
                  <td style={td}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <Avatar initials={`${r.guest.firstName[0] ?? ''}${r.guest.lastName[0] ?? ''}`} size={26}/>
                      <span style={{ fontWeight: 500 }}>{r.guest.firstName} {r.guest.lastName}</span>
                    </div>
                  </td>
                  <td style={td}>
                    {r.room ? <><div style={{ fontWeight: 500 }}>{r.room.number}</div><div style={{ fontSize: 11, color: 'var(--text-3)' }}>{r.room.typeName}</div></> : <span style={{ color: 'var(--text-3)' }}>—</span>}
                  </td>
                  <td style={td}><div style={{ fontSize: 12 }}>{trDate(r.checkIn)} → {trDate(r.checkOut)}</div></td>
                  <td style={{ ...td, fontFamily: 'var(--font-mono)', fontSize: 12 }}>{r.adults}{r.children ? `+${r.children}` : ''}</td>
                  <td style={td}><Chip tone={STATUS_TONE[r.status] ?? 'neutral'} dot>{STATUS_LABEL[r.status] ?? r.status}</Chip></td>
                  <td style={{ ...td, textAlign: 'right', fontWeight: 500 }}>{displayCurrency(r.totalPrice)}</td>
                  <td style={{ ...td, textAlign: 'right' }} onClick={e => e.stopPropagation()}>
                    <button style={{ background: 'transparent', border: 0, color: 'var(--text-3)', padding: 4, borderRadius: 4, cursor: 'pointer' }}><MoreHorizontal size={14}/></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 16px', borderTop: '1px solid var(--border-c)' }}>
          <div style={{ fontSize: 12, color: 'var(--text-3)' }}>{sorted.length} kayıt gösteriliyor · {total} toplam</div>
          {totalPages > 1 && (
            <div style={{ display: 'flex', gap: 4 }}>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                <Link key={p} href={`/reservation?page=${p}${activeStatus ? `&status=${activeStatus}` : ''}`}
                  style={{ padding: '4px 10px', borderRadius: 4, fontSize: 12, background: p === page ? 'var(--accent-c)' : 'var(--surface)', color: p === page ? 'var(--accent-fg)' : 'var(--text-2)', border: '1px solid var(--border-c)', textDecoration: 'none' }}>
                  {p}
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
