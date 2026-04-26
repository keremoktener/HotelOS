'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { trDate, displayCurrency } from '@/lib/utils'
import { Chip } from '@/components/ui/chip'
import { StatTile } from '@/components/ui/stat-tile'
import { Avatar } from '@/components/ui/avatar'
import { DataTable, th, td } from '@/components/ui/data-table'

interface Guest {
  id: string
  firstName: string
  lastName: string
  phone: string
  email: string
  nationality: string
  blacklisted: boolean
  totalStays: number
  totalRevenue: number
  lastStay: string | null
}

export function GuestsClient({ guests }: { guests: Guest[] }) {
  const router = useRouter()
  const [search, setSearch] = useState('')

  const filtered = guests.filter(g => {
    if (!search) return true
    const q = search.toLowerCase()
    return (
      g.firstName.toLowerCase().includes(q) ||
      g.lastName.toLowerCase().includes(q) ||
      g.phone.includes(q) ||
      g.email.toLowerCase().includes(q)
    )
  })

  return (
    <div style={{ height: 'calc(100% - 56px)', overflowY: 'auto', padding: 24 }}>
      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 16 }}>
        <StatTile label="TOPLAM MİSAFİR" value={String(guests.length)}/>
        <StatTile label="KARA LİSTEDE"   value={String(guests.filter(g => g.blacklisted).length)}/>
        <StatTile label="AKTİF MİSAFİR"  value={String(guests.filter(g => g.totalStays > 0).length)}/>
      </div>

      {/* Search toolbar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, height: 34, padding: '0 10px', background: 'var(--surface)', border: '1px solid var(--border-c)', borderRadius: 6, color: 'var(--text-3)', fontSize: 13, flex: 1, maxWidth: 360 }}>
          <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Ad, telefon veya e-posta ara…"
            style={{ flex: 1, border: 0, background: 'transparent', outline: 'none', color: 'var(--text)', fontSize: 13 }}
          />
        </div>
        <div style={{ marginLeft: 'auto' }}>
          <a href="/guests/new" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '7px 14px', background: 'var(--accent-c)', color: 'var(--accent-fg)', borderRadius: 6, fontSize: 13, fontWeight: 500, textDecoration: 'none' }}>
            + Yeni misafir
          </a>
        </div>
      </div>

      {/* Table */}
      <DataTable>
        <thead>
          <tr>
            <th style={th}>Misafir</th>
            <th style={th}>İletişim</th>
            <th style={th}>Uyruk</th>
            <th style={{ ...th, textAlign: 'center' }}>Konaklama</th>
            <th style={{ ...th, textAlign: 'right' }}>Toplam gelir</th>
            <th style={th}>Son konaklama</th>
            <th style={th}>Durum</th>
          </tr>
        </thead>
        <tbody>
          {filtered.map(g => (
            <tr
              key={g.id}
              onClick={() => router.push(`/guests/${g.id}`)}
              style={{ borderTop: '1px solid var(--border-c)', cursor: 'pointer' }}
              onMouseEnter={e => (e.currentTarget.style.background = 'var(--surface-2)')}
              onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
            >
              <td style={td}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <Avatar initials={`${g.firstName[0] ?? ''}${g.lastName[0] ?? ''}`}/>
                  <div style={{ fontWeight: 500 }}>{g.firstName} {g.lastName}</div>
                </div>
              </td>
              <td style={td}>
                <div style={{ fontSize: 12, color: 'var(--text-2)' }}>{g.phone || '—'}</div>
                <div style={{ fontSize: 11, color: 'var(--text-3)' }}>{g.email || '—'}</div>
              </td>
              <td style={td}><span style={{ fontSize: 12, color: 'var(--text-2)' }}>{g.nationality}</span></td>
              <td style={{ ...td, textAlign: 'center', fontFamily: 'var(--font-mono)', fontWeight: 600 }}>{g.totalStays}</td>
              <td style={{ ...td, textAlign: 'right', fontWeight: 500, fontFamily: 'var(--font-mono)' }}>{displayCurrency(g.totalRevenue)}</td>
              <td style={{ ...td, color: 'var(--text-2)', fontSize: 12 }}>{g.lastStay ? trDate(g.lastStay, true) : <span style={{ color: 'var(--text-3)' }}>—</span>}</td>
              <td style={td}>
                {g.blacklisted
                  ? <Chip tone="bad" dot>Kara liste</Chip>
                  : <Chip tone="neutral">Aktif</Chip>}
              </td>
            </tr>
          ))}
          {filtered.length === 0 && (
            <tr><td colSpan={7} style={{ ...td, textAlign: 'center', color: 'var(--text-3)' }}>Misafir bulunamadı</td></tr>
          )}
        </tbody>
      </DataTable>
    </div>
  )
}
