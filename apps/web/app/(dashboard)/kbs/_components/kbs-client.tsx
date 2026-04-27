'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import dayjs from 'dayjs'
import { Chip } from '@/components/ui/chip'
import { StatTile } from '@/components/ui/stat-tile'
import { th, td } from '@/components/ui/data-table'
import { inputStyle } from '@/components/ui/kv'
import { Clock, CheckCircle, AlertTriangle, Send } from 'lucide-react'

function fmtDateTime(iso: string) {
  return dayjs(iso).format('DD MMM HH:mm')
}

const STATUS_LABEL: Record<string, string> = {
  PENDING:   'Kuyrukta',
  SUBMITTED: 'Gönderildi',
  FAILED:    'Başarısız',
  NOT_SENT:  'Gönderilmedi',
}
const STATUS_TONE: Record<string, string> = {
  PENDING:   'warn',
  SUBMITTED: 'good',
  FAILED:    'bad',
  NOT_SENT:  'neutral',
}

type Filter = 'ALL' | 'PENDING' | 'FAILED' | 'SUBMITTED' | 'NOT_SENT'

interface Item {
  id: string
  guestName: string
  roomNumber: string
  checkIn: string
  status: string
  code: string | null
  reservationStatus: string
}
interface Counts { pending: number; submitted: number; failed: number; notSent: number }
interface Props { items: Item[]; counts: Counts }

export function KbsClient({ items, counts }: Props) {
  const router = useRouter()
  const [filter, setFilter] = useState<Filter>('ALL')
  const [search, setSearch] = useState('')
  const [detail, setDetail] = useState<Item | null>(null)

  const FILTER_OPTIONS: { value: Filter; label: string }[] = [
    { value: 'ALL',       label: 'Tümü' },
    { value: 'PENDING',   label: 'Kuyrukta' },
    { value: 'FAILED',    label: 'Başarısız' },
    { value: 'SUBMITTED', label: 'Gönderildi' },
    { value: 'NOT_SENT',  label: 'Gönderilmedi' },
  ]

  const filtered = items.filter(i => {
    if (filter !== 'ALL' && i.status !== filter) return false
    if (search) {
      const q = search.toLowerCase()
      if (!i.guestName.toLowerCase().includes(q) && !i.roomNumber.includes(q)) return false
    }
    return true
  })

  return (
    <div style={{ height: 'calc(100% - 56px)', overflowY: 'auto', padding: 24 }}>
      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 24 }}>
        <StatTile label="Kuyrukta"     value={counts.pending}   tone="warn" icon={<Clock size={16}/>}/>
        <StatTile label="Gönderildi"   value={counts.submitted} tone="good" icon={<CheckCircle size={16}/>}/>
        <StatTile label="Başarısız"    value={counts.failed}    tone="bad"  icon={<AlertTriangle size={16}/>}/>
        <StatTile label="Gönderilmedi" value={counts.notSent}              icon={<Send size={16}/>}/>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 14, alignItems: 'center', flexWrap: 'wrap' }}>
        <div style={{ display: 'inline-flex', background: 'var(--surface)', border: '1px solid var(--border-c)', borderRadius: 6, padding: 2 }}>
          {FILTER_OPTIONS.map(o => (
            <button
              key={o.value}
              onClick={() => setFilter(o.value)}
              style={{
                display: 'inline-flex', alignItems: 'center', height: 22,
                padding: '0 10px', borderRadius: 4,
                background: filter === o.value ? 'var(--surface-2)' : 'transparent',
                color: filter === o.value ? 'var(--text)' : 'var(--text-2)',
                border: 0, fontSize: 11.5, fontWeight: filter === o.value ? 600 : 500, cursor: 'pointer',
              }}
            >{o.label}</button>
          ))}
        </div>
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Misafir veya oda..."
          style={{ ...inputStyle, width: 200 }}
        />
        <div style={{ marginLeft: 'auto', fontSize: 12, color: 'var(--text-3)' }}>{filtered.length} kayıt</div>
      </div>

      {/* Table */}
      <div style={{ background: 'var(--surface)', border: '1px solid var(--border-c)', borderRadius: 10, overflow: 'hidden', boxShadow: 'var(--shadow-sm)' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th style={th}>Misafir</th>
              <th style={th}>Oda</th>
              <th style={th}>Giriş</th>
              <th style={th}>Durum</th>
              <th style={th}>KBS Kodu</th>
              <th style={{ ...th, width: 80 }}></th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr><td colSpan={6} style={{ ...td, textAlign: 'center', color: 'var(--text-3)' }}>Kayıt yok.</td></tr>
            ) : filtered.map((item, i) => (
              <tr
                key={item.id}
                style={{
                  borderTop: i === 0 ? 'none' : '1px solid var(--border-c)',
                  background: item.status === 'FAILED' ? 'var(--bad-bg)' : 'transparent',
                  cursor: 'pointer',
                }}
                onClick={() => setDetail(item)}
              >
                <td style={{ ...td, fontWeight: 500 }}>{item.guestName}</td>
                <td style={{ ...td, fontFamily: 'var(--font-mono)', fontWeight: 600 }}>{item.roomNumber}</td>
                <td style={{ ...td, fontSize: 12, color: 'var(--text-2)', fontFamily: 'var(--font-mono)' }}>{fmtDateTime(item.checkIn)}</td>
                <td style={td}><Chip tone={STATUS_TONE[item.status] ?? 'neutral'} dot>{STATUS_LABEL[item.status] ?? item.status}</Chip></td>
                <td style={{ ...td, fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--text-2)' }}>{item.code ?? '—'}</td>
                <td style={{ ...td, textAlign: 'right' }}>
                  <button style={{ fontSize: 11, padding: '3px 8px', background: 'var(--surface)', border: '1px solid var(--border-c)', borderRadius: 4, cursor: 'pointer', color: 'var(--text-2)' }}>Aç</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Detail drawer */}
      {detail && (
        <>
          <div
            style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.35)', zIndex: 40 }}
            onClick={() => setDetail(null)}
          />
          <div style={{
            position: 'fixed', top: 0, right: 0, bottom: 0, width: 480,
            background: 'var(--surface)', borderLeft: '1px solid var(--border-c)',
            boxShadow: '-12px 0 32px rgba(0,0,0,0.12)',
            display: 'flex', flexDirection: 'column', zIndex: 50,
          }}>
            <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--border-c)', display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 600 }}>{detail.guestName}</div>
                <div style={{ fontSize: 11, color: 'var(--text-3)', fontFamily: 'var(--font-mono)' }}>Oda {detail.roomNumber} · Giriş bildirimi</div>
              </div>
              <button onClick={() => setDetail(null)} style={{ background: 'none', border: 0, cursor: 'pointer', fontSize: 18, color: 'var(--text-3)', lineHeight: 1 }}>×</button>
            </div>

            <div style={{ flex: 1, overflow: 'auto', padding: 20 }}>
              {detail.status === 'FAILED' && (
                <div style={{ background: 'var(--bad-bg)', border: '1px solid var(--bad)', borderRadius: 8, padding: '12px 14px', marginBottom: 16 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--bad)', marginBottom: 4 }}>Gönderim başarısız</div>
                  <div style={{ fontSize: 12, color: 'var(--bad)' }}>{detail.code ?? 'Detay bilgisi yok.'}</div>
                </div>
              )}
              <div style={{ background: 'var(--surface-2)', border: '1px solid var(--border-c)', borderRadius: 8, padding: '14px 16px', marginBottom: 16 }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px 16px' }}>
                  {[
                    { label: 'Misafir', value: detail.guestName },
                    { label: 'Oda', value: detail.roomNumber },
                    { label: 'Giriş', value: fmtDateTime(detail.checkIn) },
                    { label: 'KBS Durumu', value: STATUS_LABEL[detail.status] ?? detail.status },
                    { label: 'KBS Kodu', value: detail.code ?? '—' },
                    { label: 'Rezervasyon', value: detail.reservationStatus },
                  ].map(row => (
                    <div key={row.label}>
                      <div style={{ fontSize: 11, color: 'var(--text-3)', marginBottom: 2 }}>{row.label}</div>
                      <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text)' }}>{row.value}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div style={{ padding: '12px 20px', borderTop: '1px solid var(--border-c)', display: 'flex', gap: 8 }}>
              <button onClick={() => setDetail(null)} style={{ padding: '6px 14px', background: 'var(--surface)', border: '1px solid var(--border-c)', borderRadius: 6, fontSize: 12, cursor: 'pointer', color: 'var(--text-2)' }}>Kapat</button>
              <div style={{ flex: 1 }}/>
              <button style={{ padding: '6px 14px', background: 'var(--accent-c)', color: 'var(--accent-fg)', border: 'none', borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
                Rezervasyona git ↗
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
