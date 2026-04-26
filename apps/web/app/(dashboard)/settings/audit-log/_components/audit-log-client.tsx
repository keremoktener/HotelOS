'use client'

import { useState } from 'react'
import { Chip } from '@/components/ui/chip'
import { StatTile } from '@/components/ui/stat-tile'
import { Avatar } from '@/components/ui/avatar'
import { DataTable, th } from '@/components/ui/data-table'

function actionTone(a: string) {
  if (['CREATED', 'SIGNED', 'CHECKED_IN'].includes(a)) return 'good'
  if (['DELETED', 'CANCELLED'].includes(a)) return 'bad'
  if (['UPDATED', 'TRIGGERED', 'EXECUTED', 'SYNCED'].includes(a)) return 'info'
  return 'neutral'
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

export function AuditLogClient({ logs, total }: Props) {
  const [filter, setFilter] = useState<'ALL' | 'SYSTEM' | 'USER'>('ALL')
  const [expanded, setExpanded] = useState<number>(-1)
  const [search, setSearch] = useState('')

  const tabs = [
    { k: 'ALL' as const,    label: 'Tümü',      count: total },
    { k: 'USER' as const,   label: 'Kullanıcı', count: logs.filter(e => e.userId !== null).length },
    { k: 'SYSTEM' as const, label: 'Sistem',    count: logs.filter(e => e.userId === null).length },
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
        <StatTile label="TOPLAM KAYIT"    value={String(total)}                                  sub="tüm zamanlar"/>
        <StatTile label="SON 24 SAAT"     value={String(logs.length)}                            sub="son aktiviteler"/>
        <StatTile label="KULLANICI İŞLEMİ" value={String(logs.filter(l => l.userId).length)}    sub="son 24 saatte"/>
        <StatTile label="SİSTEM İŞLEMİ"  value={String(logs.filter(l => !l.userId).length)}     sub="otomatik tetikleyici"/>
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
      <DataTable>
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
              <>
                <tr key={e.id}
                  onClick={() => setExpanded(isOpen ? -1 : i)}
                  style={{ borderTop: '1px solid var(--border-c)', cursor: 'pointer', background: isOpen ? 'var(--accent-weak)' : 'transparent' }}
                  onMouseEnter={el => { if (!isOpen) (el.currentTarget as HTMLElement).style.background = 'var(--surface-2)' }}
                  onMouseLeave={el => { if (!isOpen) (el.currentTarget as HTMLElement).style.background = 'transparent' }}
                >
                  <td style={{ padding: '12px 14px', fontSize: 12, fontFamily: 'var(--font-mono)', color: 'var(--text-2)', whiteSpace: 'nowrap' }}>{formatTime(e.createdAt)}</td>
                  <td style={{ padding: '12px 14px', fontSize: 12 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <Avatar initials={isSystem ? '⚙' : shortId(e.userId).slice(0, 2)} size={24} tone={isSystem ? 'muted' : 'accent'}/>
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
                  <tr key={`${e.id}-expand`} style={{ borderTop: '1px solid var(--border-c)', background: 'var(--accent-weak)' }}>
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
              </>
            )
          })}
          {filtered.length === 0 && (
            <tr><td colSpan={6} style={{ padding: '24px 14px', textAlign: 'center', fontSize: 13, color: 'var(--text-3)' }}>Kayıt bulunamadı</td></tr>
          )}
        </tbody>
      </DataTable>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 12, fontSize: 11, color: 'var(--text-3)' }}>
        <div>{filtered.length} kayıt gösteriliyor</div>
      </div>
    </div>
  )
}
