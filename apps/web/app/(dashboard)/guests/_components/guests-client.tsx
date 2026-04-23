'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

function trDate(iso: string) {
  const d = new Date(iso)
  const M = ['Oca','Şub','Mar','Nis','May','Haz','Tem','Ağu','Eyl','Eki','Kas','Ara']
  return `${d.getDate()} ${M[d.getMonth()]} ${d.getFullYear()}`
}

function formatCurrency(kurus: number) { return (kurus / 100).toLocaleString('tr-TR') + ' ₺' }

function Chip({ tone, dot, children }: { tone: string; dot?: boolean; children: React.ReactNode }) {
  const map: Record<string, { bg: string; fg: string }> = {
    good: { bg: 'var(--good-bg)', fg: 'var(--good)' }, warn: { bg: 'var(--warn-bg)', fg: 'var(--warn)' },
    bad: { bg: 'var(--bad-bg)', fg: 'var(--bad)' }, info: { bg: 'var(--info-bg)', fg: 'var(--info)' },
    neutral: { bg: 'var(--surface-2)', fg: 'var(--text-2)' }, muted: { bg: 'transparent', fg: 'var(--text-3)' },
  }
  const t = map[tone] ?? map.neutral
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '2px 8px', borderRadius: 999, fontSize: 11, fontWeight: 500, background: t.bg, color: t.fg }}>
      {dot && <span style={{ width: 6, height: 6, borderRadius: 999, background: 'currentColor' }}/>}
      {children}
    </span>
  )
}

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

const th: React.CSSProperties = { textAlign: 'left', padding: '10px 14px', fontSize: 11, fontWeight: 600, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.05em', background: 'var(--surface-2)' }
const td: React.CSSProperties = { padding: '11px 14px', fontSize: 13, color: 'var(--text)', verticalAlign: 'middle' }

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
        {[
          { label: 'Toplam misafir', value: String(guests.length) },
          { label: 'Kara listede', value: String(guests.filter(g => g.blacklisted).length) },
          { label: 'Aktif misafir', value: String(guests.filter(g => g.totalStays > 0).length) },
        ].map(({ label, value }) => (
          <div key={label} style={{ background: 'var(--surface)', border: '1px solid var(--border-c)', borderRadius: 10, padding: '14px 16px', boxShadow: 'var(--shadow-sm)' }}>
            <div style={{ fontSize: 11, color: 'var(--text-3)', letterSpacing: '0.03em', fontWeight: 500, textTransform: 'uppercase' }}>{label}</div>
            <div style={{ fontSize: 22, fontWeight: 600, letterSpacing: '-0.02em', marginTop: 4 }}>{value}</div>
          </div>
        ))}
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
      <div style={{ background: 'var(--surface)', border: '1px solid var(--border-c)', borderRadius: 10, overflow: 'hidden', boxShadow: 'var(--shadow-sm)' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
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
                    <div style={{ width: 32, height: 32, borderRadius: 999, background: 'var(--accent-weak)', color: 'var(--accent-c)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 600, flexShrink: 0 }}>
                      {(g.firstName[0] ?? '').toUpperCase()}{(g.lastName[0] ?? '').toUpperCase()}
                    </div>
                    <div>
                      <div style={{ fontWeight: 500 }}>{g.firstName} {g.lastName}</div>
                    </div>
                  </div>
                </td>
                <td style={td}>
                  <div style={{ fontSize: 12, color: 'var(--text-2)' }}>{g.phone || '—'}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-3)' }}>{g.email || '—'}</div>
                </td>
                <td style={td}><span style={{ fontSize: 12, color: 'var(--text-2)' }}>{g.nationality}</span></td>
                <td style={{ ...td, textAlign: 'center', fontFamily: 'var(--font-mono)', fontWeight: 600 }}>{g.totalStays}</td>
                <td style={{ ...td, textAlign: 'right', fontWeight: 500, fontFamily: 'var(--font-mono)' }}>{formatCurrency(g.totalRevenue)}</td>
                <td style={{ ...td, color: 'var(--text-2)', fontSize: 12 }}>{g.lastStay ? trDate(g.lastStay) : <span style={{ color: 'var(--text-3)' }}>—</span>}</td>
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
        </table>
      </div>
    </div>
  )
}
