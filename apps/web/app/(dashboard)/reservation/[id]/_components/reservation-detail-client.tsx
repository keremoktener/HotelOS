'use client'

import Link from 'next/link'

const STATUS_META: Record<string, { label: string; tone: string }> = {
  WAITING: { label: 'Beklemede', tone: 'info' }, CONFIRMED: { label: 'Onaylandı', tone: 'neutral' },
  CHECKEDIN: { label: 'Girişte', tone: 'good' }, CHECKEDOUT: { label: 'Çıkış yapıldı', tone: 'muted' },
  CANCELLED: { label: 'İptal', tone: 'bad' }, NOSHOW: { label: 'No-show', tone: 'bad' },
}
const ROOM_STATUS_META: Record<string, { label: string; tone: string }> = {
  CLEAN: { label: 'Temiz', tone: 'good' }, DIRTY: { label: 'Kirli', tone: 'warn' },
  FAULTY: { label: 'Arızalı', tone: 'bad' }, DND: { label: 'DND', tone: 'info' },
}
const PAY_METHOD: Record<string, string> = {
  CASH: 'Nakit', CREDIT_CARD: 'Kredi kartı', WIRE: 'Havale', VIRTUAL_POS: 'Sanal POS', OTHER: 'Diğer',
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

function KV({ k, v, full }: { k: string; v: React.ReactNode; full?: boolean }) {
  return (
    <div style={{ gridColumn: full ? '1 / -1' : 'auto' }}>
      <div style={{ fontSize: 11, color: 'var(--text-3)', marginBottom: 3 }}>{k}</div>
      <div style={{ fontSize: 13, color: 'var(--text)' }}>{v}</div>
    </div>
  )
}

function trDate(iso: string) {
  const d = new Date(iso)
  const M = ['Oca','Şub','Mar','Nis','May','Haz','Tem','Ağu','Eyl','Eki','Kas','Ara']
  return `${d.getDate()} ${M[d.getMonth()]} ${d.getFullYear()}`
}
function formatCurrency(kurus: number) { return (kurus / 100).toLocaleString('tr-TR') + ' ₺' }

const th: React.CSSProperties = { textAlign: 'left', padding: '10px 14px', fontSize: 11, fontWeight: 600, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.05em', background: 'var(--surface-2)' }
const td: React.CSSProperties = { padding: '11px 14px', fontSize: 13, color: 'var(--text)', verticalAlign: 'middle' }

interface Payment { id: string; amount: number; method: string; reference: string; createdAt: string }
interface Reservation {
  id: string; status: string; totalPrice: number; paidAmount: number
  checkIn: string; checkOut: string; adults: number; children: number; notes: string
  guest: { id: string; firstName: string; lastName: string; phone: string; email: string; nationality: string; tcId: string | null; passportNo: string | null }
  room: { id: string; number: string; floor: number | null; status: string; faultNote: string | null; roomType: { name: string; capacity: number } } | null
  payments: Payment[]
}

export function ReservationDetailClient({ reservation: r }: { reservation: Reservation }) {
  const nights = Math.round((new Date(r.checkOut).getTime() - new Date(r.checkIn).getTime()) / (1000 * 60 * 60 * 24))
  const balance = r.totalPrice - r.paidAmount
  const statusMeta = STATUS_META[r.status] ?? { label: r.status, tone: 'neutral' }

  return (
    <div style={{ height: 'calc(100% - 56px)', overflowY: 'auto', padding: 24 }}>
      {/* Guest header */}
      <div style={{ background: 'var(--surface)', border: '1px solid var(--border-c)', borderRadius: 10, padding: 20, marginBottom: 16, display: 'flex', gap: 16, boxShadow: 'var(--shadow-sm)' }}>
        <div style={{ width: 56, height: 56, borderRadius: 999, background: 'var(--accent-weak)', color: 'var(--accent-c)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, fontWeight: 600, flexShrink: 0 }}>
          {r.guest.firstName[0]}{r.guest.lastName[0]}
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <div style={{ fontSize: 22, fontWeight: 600, letterSpacing: '-0.02em', color: 'var(--text)' }}>{r.guest.firstName} {r.guest.lastName}</div>
            <Chip tone={statusMeta.tone} dot>{statusMeta.label}</Chip>
          </div>
          <div style={{ display: 'flex', gap: 18, fontSize: 12, color: 'var(--text-2)', flexWrap: 'wrap' }}>
            {r.guest.phone && <span>{r.guest.phone}</span>}
            {r.guest.email && <span>{r.guest.email}</span>}
            <span>{r.guest.nationality}</span>
            {(r.guest.tcId || r.guest.passportNo) && <span>{r.guest.tcId ?? r.guest.passportNo}</span>}
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'auto auto', gap: '4px 24px', alignContent: 'center' }}>
          {[
            ['Giriş', trDate(r.checkIn)], ['Çıkış', trDate(r.checkOut)],
            ['Gece', String(nights)],     ['Kişi',  `${r.adults}${r.children ? `+${r.children}` : ''}`],
          ].map(([k, v]) => (
            <React.Fragment key={k}>
              <div style={{ fontSize: 11, color: 'var(--text-3)' }}>{k}</div>
              <div style={{ fontSize: 13, fontWeight: 500, textAlign: 'right' }}>{v}</div>
            </React.Fragment>
          ))}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 16 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Stay summary */}
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border-c)', borderRadius: 10, boxShadow: 'var(--shadow-sm)' }}>
            <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--border-c)', fontWeight: 600, fontSize: 14 }}>Konaklama özeti</div>
            <div style={{ padding: 16, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <KV k="Oda" v={r.room ? `${r.room.number} · ${r.room.roomType.name}` : '—'}/>
              <KV k="Kapasite" v={r.room ? `${r.room.roomType.capacity} kişi` : '—'}/>
              <KV k="Oda durumu" v={r.room ? <Chip tone={ROOM_STATUS_META[r.room.status]?.tone ?? 'neutral'} dot>{ROOM_STATUS_META[r.room.status]?.label ?? r.room.status}</Chip> : '—'}/>
              <KV k="Kat" v={r.room ? (r.room.floor != null ? `Kat ${r.room.floor}` : '—') : '—'}/>
              <KV k="Özel istekler" v={r.notes || <span style={{ color: 'var(--text-3)' }}>Yok</span>} full/>
            </div>
          </div>

          {/* Price */}
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border-c)', borderRadius: 10, boxShadow: 'var(--shadow-sm)' }}>
            <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--border-c)', fontWeight: 600, fontSize: 14 }}>Fiyat</div>
            <div style={{ padding: 16 }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <tbody>
                  <tr><td style={{ padding: '7px 0', fontSize: 13, color: 'var(--text-2)' }}>{nights} gece × gecelik fiyat</td><td style={{ padding: '7px 0', textAlign: 'right', fontFamily: 'var(--font-mono)', fontSize: 13 }}></td></tr>
                  <tr style={{ borderTop: '1px solid var(--border-c)' }}>
                    <td style={{ padding: '10px 0 0', fontWeight: 600, fontSize: 13 }}>Toplam</td>
                    <td style={{ padding: '10px 0 0', textAlign: 'right', fontWeight: 600, fontSize: 15, color: 'var(--text)' }}>{formatCurrency(r.totalPrice)}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Payments */}
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border-c)', borderRadius: 10, overflow: 'hidden', boxShadow: 'var(--shadow-sm)' }}>
            <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--border-c)', fontWeight: 600, fontSize: 14 }}>Ödemeler</div>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead><tr><th style={th}>Tarih</th><th style={th}>Yöntem</th><th style={th}>Referans</th><th style={{ ...th, textAlign: 'right' }}>Tutar</th></tr></thead>
              <tbody>
                {r.payments.map(p => (
                  <tr key={p.id} style={{ borderTop: '1px solid var(--border-c)' }}>
                    <td style={td}>{trDate(p.createdAt)}</td>
                    <td style={td}>{PAY_METHOD[p.method] ?? p.method}</td>
                    <td style={{ ...td, fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--text-2)' }}>{p.reference || '—'}</td>
                    <td style={{ ...td, textAlign: 'right', fontWeight: 500 }}>{formatCurrency(p.amount)}</td>
                  </tr>
                ))}
                {r.payments.length === 0 && <tr><td colSpan={4} style={{ ...td, textAlign: 'center', color: 'var(--text-3)' }}>Ödeme kaydı yok</td></tr>}
                {balance > 0 && (
                  <tr style={{ borderTop: '1px solid var(--border-c)', background: 'var(--warn-bg)' }}>
                    <td colSpan={3} style={{ ...td, color: 'var(--warn)', fontWeight: 500 }}>Kalan bakiye</td>
                    <td style={{ ...td, textAlign: 'right', color: 'var(--warn)', fontWeight: 600 }}>{formatCurrency(balance)}</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right rail */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {r.room && (
            <div style={{ background: 'var(--surface)', border: '1px solid var(--border-c)', borderRadius: 10, padding: 16, boxShadow: 'var(--shadow-sm)' }}>
              <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 12 }}>Oda durumu</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                <div style={{ fontSize: 24, fontWeight: 600, letterSpacing: '-0.02em' }}>{r.room.number}</div>
                <Chip tone={ROOM_STATUS_META[r.room.status]?.tone ?? 'neutral'} dot>{ROOM_STATUS_META[r.room.status]?.label ?? r.room.status}</Chip>
              </div>
              <div style={{ fontSize: 11, color: 'var(--text-3)' }}>{r.room.roomType.name}{r.room.floor != null ? ` · Kat ${r.room.floor}` : ''}</div>
              {r.room.faultNote && (
                <div style={{ marginTop: 10, padding: '8px 10px', background: 'var(--bad-bg)', color: 'var(--bad)', borderRadius: 6, fontSize: 12 }}><b>Arıza:</b> {r.room.faultNote}</div>
              )}
            </div>
          )}
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border-c)', borderRadius: 10, padding: 16, boxShadow: 'var(--shadow-sm)' }}>
            <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 12 }}>Misafir</div>
            <Link href={`/guests/${r.guest.id}`} style={{ fontSize: 13, color: 'var(--accent-c)', textDecoration: 'none', fontWeight: 500 }}>{r.guest.firstName} {r.guest.lastName}</Link>
            <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 4 }}>{r.guest.phone}</div>
          </div>
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border-c)', borderRadius: 10, padding: 16, boxShadow: 'var(--shadow-sm)' }}>
            <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 8 }}>Dahili notlar</div>
            <textarea defaultValue={r.notes} style={{ width: '100%', minHeight: 60, resize: 'vertical', padding: 10, border: '1px solid var(--border-c)', borderRadius: 6, background: 'var(--bg)', fontSize: 12, color: 'var(--text)', outline: 'none', fontFamily: 'inherit' }}/>
          </div>
        </div>
      </div>
    </div>
  )
}

// Need React for Fragment
import React from 'react'
