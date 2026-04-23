'use client'

import { useState } from 'react'

function actionTone(a: string) {
  if (['CREATED', 'SIGNED', 'CHECKED_IN'].includes(a)) return 'good'
  if (['DELETED', 'CANCELLED'].includes(a)) return 'bad'
  if (['UPDATED', 'TRIGGERED', 'EXECUTED', 'SYNCED'].includes(a)) return 'info'
  return 'neutral'
}

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

interface LogEntry {
  id: string
  userId: string | null
  action: string
  entity: string
  entityId: string
  diff: unknown
  createdAt: string
}

interface Props { logs: LogEntry[]; total: number }

const th: React.CSSProperties = { textAlign: 'left', padding: '10px 14px', fontSize: 10, fontWeight: 600, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.08em', background: 'var(--surface-2)' }

export function AuditLogClient({ logs, total }: Props) {
  const [filter, setFilter] = useState<'ALL' | 'SYSTEM' | 'USER'>('ALL')
  const [expanded, setExpanded] = useState<number>(-1)
  const [search, setSearch] = useState('')

  const tabs = [
    { k: 'ALL' as const, label: 'Tümü', count: total },
    { k: 'USER' as const, label: 'Kullanıcı', count: logs.filter(e => e.userId !== null).length },
    { k: 'SYSTEM' as const, label: 'Sistem', count: logs.filter(e => e.userId === null).length },
  ]

  const filtered = logs.filter(e => {
    if (filter === 'USER') return e.userId !== null
    if (filter === 'SYSTEM') return e.userId === null
    if (search) {
      const q = search.toLowerCase()
      return e.entity.toLowerCase().includes(q) || e.entityId.toLowerCase().includes(q) || e.action.toLowerCase().includes(q)
    }
    return true
  })

  function formatTime(iso: string) {
    const d = new Date(iso)
    return d.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
  }

  function shortId(id: string | null) {
    if (!id) return '—'
    return id.slice(0, 8)
  }

  return (
    <div style={{ height: 'calc(100% - 56px)', overflowY: 'auto', padding: 24 }}>
      {/* KPI strip */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 16 }}>
        {[
          { label: 'Toplam kayıt', value: String(total), sub: 'tüm zamanlar' },
          { label: 'Son 24 saat', value: String(logs.length), sub: 'son aktiviteler' },
          { label: 'Kullanıcı işlemi', value: String(logs.filter(l => l.userId).length), sub: 'son 24 saatte' },
          { label: 'Sistem işlemi', value: String(logs.filter(l => !l.userId).length), sub: 'otomatik tetikleyici' },
        ].map(({ label, value, sub }) => (
          <div key={label} style={{ background: 'var(--surface)', border: '1px solid var(--border-c)', borderRadius: 10, padding: '12px 16px', boxShadow: 'var(--shadow-sm)' }}>
            <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--text-3)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>{label}</div>
            <div style={{ fontSize: 22, fontWeight: 600, letterSpacing: '-0.01em', marginTop: 4 }}>{value}</div>
            <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 2 }}>{sub}</div>
          </div>
        ))}
      </div>

      {/* Filter bar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14, flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', background: 'var(--surface)', border: '1px solid var(--border-c)', borderRadius: 6, padding: 2 }}>
          {tabs.map(t => (
            <button key={t.k} onClick={() => setFilter(t.k)} style={{
              padding: '5px 10px', display: 'inline-flex', alignItems: 'center', gap: 6,
              background: filter === t.k ? 'var(--surface-2)' : 'transparent',
              color: filter === t.k ? 'var(--text)' : 'var(--text-2)',
              border: 0, borderRadius: 4, fontSize: 12, fontWeight: filter === t.k ? 600 : 450, cursor: 'pointer',
            }}>
              {t.label}
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-3)' }}>{t.count}</span>
            </button>
          ))}
        </div>
        <div style={{ flex: 1 }}/>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, height: 32, padding: '0 10px', background: 'var(--surface)', border: '1px solid var(--border-c)', borderRadius: 6, color: 'var(--text-3)', fontSize: 12, minWidth: 260 }}>
          <svg width={13} height={13} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Varlık, ID veya eylem ara…" style={{ flex: 1, border: 0, background: 'transparent', outline: 'none', color: 'var(--text)', fontSize: 12 }}/>
        </div>
      </div>

      {/* Log table */}
      <div style={{ background: 'var(--surface)', border: '1px solid var(--border-c)', borderRadius: 10, overflow: 'hidden', boxShadow: 'var(--shadow-sm)' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th style={th}>Saat</th>
              <th style={th}>Kullanıcı</th>
              <th style={th}>Eylem</th>
              <th style={th}>Varlık</th>
              <th style={th}>Varlık ID</th>
              <th style={th}>Diff</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((e, i) => {
              const isOpen = expanded === i
              const isSystem = !e.userId
              return (
                <React.Fragment key={e.id}>
                  <tr
                    onClick={() => setExpanded(isOpen ? -1 : i)}
                    style={{ borderTop: '1px solid var(--border-c)', cursor: 'pointer', background: isOpen ? 'var(--accent-weak)' : 'transparent' }}
                    onMouseEnter={el => { if (!isOpen) (el.currentTarget as HTMLElement).style.background = 'var(--surface-2)' }}
                    onMouseLeave={el => { if (!isOpen) (el.currentTarget as HTMLElement).style.background = 'transparent' }}
                  >
                    <td style={{ padding: '12px 14px', fontSize: 12, fontFamily: 'var(--font-mono)', color: 'var(--text-2)', whiteSpace: 'nowrap' }}>{formatTime(e.createdAt)}</td>
                    <td style={{ padding: '12px 14px', fontSize: 12 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div style={{ width: 24, height: 24, borderRadius: 999, background: isSystem ? 'var(--surface-2)' : 'var(--accent-weak)', color: isSystem ? 'var(--text-3)' : 'var(--accent-c)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 600, flexShrink: 0 }}>
                          {isSystem ? '⚙' : shortId(e.userId).slice(0, 2).toUpperCase()}
                        </div>
                        <span style={{ color: 'var(--text-2)', fontFamily: 'var(--font-mono)', fontSize: 11 }}>{isSystem ? 'Sistem' : shortId(e.userId)}</span>
                      </div>
                    </td>
                    <td style={{ padding: '12px 14px' }}><Chip tone={actionTone(e.action)} dot>{e.action}</Chip></td>
                    <td style={{ padding: '12px 14px', fontSize: 12, color: 'var(--text)' }}>{e.entity}</td>
                    <td style={{ padding: '12px 14px', fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--text-3)' }}>{e.entityId.slice(0, 8)}</td>
                    <td style={{ padding: '12px 14px', fontSize: 12, color: 'var(--text-2)', maxWidth: 300, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {e.diff ? JSON.stringify(e.diff).slice(0, 80) : <span style={{ color: 'var(--text-3)' }}>—</span>}
                    </td>
                  </tr>
                  {isOpen && (
                    <tr style={{ borderTop: '1px solid var(--border-c)', background: 'var(--accent-weak)' }}>
                      <td colSpan={6} style={{ padding: '0 14px 14px 52px' }}>
                        <div style={{ background: 'var(--surface)', border: '1px solid var(--border-c)', borderRadius: 6, padding: 12 }}>
                          <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--text-3)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 8 }}>Diff · JSON</div>
                          <pre style={{ margin: 0, fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-2)', whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>
                            {JSON.stringify(e.diff, null, 2)}
                          </pre>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              )
            })}
            {filtered.length === 0 && (
              <tr><td colSpan={6} style={{ padding: '24px 14px', textAlign: 'center', fontSize: 13, color: 'var(--text-3)' }}>Kayıt bulunamadı</td></tr>
            )}
          </tbody>
        </table>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 12, fontSize: 11, color: 'var(--text-3)' }}>
        <div>{filtered.length} kayıt gösteriliyor</div>
      </div>
    </div>
  )
}

import React from 'react'
