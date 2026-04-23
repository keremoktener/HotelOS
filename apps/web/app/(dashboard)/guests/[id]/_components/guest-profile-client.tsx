'use client'

import Link from 'next/link'

const STATUS_META: Record<string, { label: string; tone: string }> = {
  WAITING: { label: 'Beklemede', tone: 'info' }, CONFIRMED: { label: 'Onaylandı', tone: 'neutral' },
  CHECKEDIN: { label: 'Girişte', tone: 'good' }, CHECKEDOUT: { label: 'Çıkış yapıldı', tone: 'muted' },
  CANCELLED: { label: 'İptal', tone: 'bad' }, NOSHOW: { label: 'No-show', tone: 'bad' },
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

function trDate(iso: string) {
  const d = new Date(iso)
  const M = ['Oca','Şub','Mar','Nis','May','Haz','Tem','Ağu','Eyl','Eki','Kas','Ara']
  return `${d.getDate()} ${M[d.getMonth()]} ${d.getFullYear()}`
}
function formatCurrency(kurus: number) { return (kurus / 100).toLocaleString('tr-TR') + ' ₺' }

const th: React.CSSProperties = { textAlign: 'left', padding: '10px 14px', fontSize: 11, fontWeight: 600, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.05em', background: 'var(--surface-2)' }
const td: React.CSSProperties = { padding: '11px 14px', fontSize: 13, color: 'var(--text)', verticalAlign: 'middle' }

interface Reservation { id: string; status: string; checkIn: string; checkOut: string; totalPrice: number; room: { number: string; typeName: string } | null }
interface ActiveRes extends Reservation { }

interface Guest {
  id: string; firstName: string; lastName: string; phone: string; email: string
  nationality: string; tcId: string | null; passportNo: string | null
  blacklisted: boolean; blacklistReason: string | null
  totalStays: number; totalRevenue: number
  activeReservation: ActiveRes | null
  history: Reservation[]
}

export function GuestProfileClient({ guest: g, totalRevenue }: { guest: Guest; totalRevenue: number }) {
  const initials = `${g.firstName[0] ?? ''}${g.lastName[0] ?? ''}`.toUpperCase()

  return (
    <div style={{ height: 'calc(100% - 56px)', overflowY: 'auto', padding: 24 }}>
      {/* Header card */}
      <div style={{ background: 'var(--surface)', border: '1px solid var(--border-c)', borderRadius: 10, padding: 20, marginBottom: 16, boxShadow: 'var(--shadow-sm)' }}>
        <div style={{ display: 'flex', gap: 20, alignItems: 'flex-start' }}>
          <div style={{ width: 72, height: 72, borderRadius: 999, background: 'var(--accent-weak)', color: 'var(--accent-c)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 26, fontWeight: 600, flexShrink: 0 }}>{initials}</div>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
              <div style={{ fontSize: 24, fontWeight: 600, letterSpacing: '-0.02em', color: 'var(--text)' }}>{g.firstName} {g.lastName}</div>
              {g.blacklisted && <Chip tone="bad" dot>Kara liste</Chip>}
            </div>
            <div style={{ display: 'flex', gap: 24, fontSize: 12, color: 'var(--text-2)', flexWrap: 'wrap' }}>
              {g.phone && <span>{g.phone}</span>}
              {g.email && <span>{g.email}</span>}
              <span>{g.nationality}</span>
              {(g.tcId || g.passportNo) && <span>{g.tcId ?? g.passportNo}</span>}
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'auto auto', gap: '2px 28px', textAlign: 'right' }}>
            <div style={{ fontSize: 18, fontWeight: 600, letterSpacing: '-0.01em' }}>{g.totalStays}</div>
            <div style={{ fontSize: 10, color: 'var(--text-3)', letterSpacing: '0.05em', textTransform: 'uppercase', alignSelf: 'center' }}>Konaklama</div>
            <div style={{ fontSize: 18, fontWeight: 600, letterSpacing: '-0.01em' }}>{formatCurrency(totalRevenue)}</div>
            <div style={{ fontSize: 10, color: 'var(--text-3)', letterSpacing: '0.05em', textTransform: 'uppercase', alignSelf: 'center' }}>Toplam gelir</div>
          </div>
        </div>
        {g.blacklisted && g.blacklistReason && (
          <div style={{ marginTop: 14, padding: '10px 14px', background: 'var(--bad-bg)', borderRadius: 6, color: 'var(--bad)', fontSize: 12 }}>
            <b>Kara liste uyarısı:</b> {g.blacklistReason}
          </div>
        )}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 16 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Active reservation */}
          {g.activeReservation && (
            <div style={{ background: 'var(--surface)', border: '1px solid var(--border-c)', borderRadius: 10, boxShadow: 'var(--shadow-sm)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px', borderBottom: '1px solid var(--border-c)' }}>
                <div style={{ fontWeight: 600, fontSize: 14 }}>Aktif konaklama</div>
                <Chip tone={STATUS_META[g.activeReservation.status]?.tone ?? 'neutral'} dot>{STATUS_META[g.activeReservation.status]?.label ?? g.activeReservation.status}</Chip>
              </div>
              <div style={{ padding: 16, display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
                {[
                  ['Rezervasyon', g.activeReservation.id.slice(0, 8)],
                  ['Oda', g.activeReservation.room?.number ?? '—'],
                  ['Giriş → Çıkış', `${trDate(g.activeReservation.checkIn)} → ${trDate(g.activeReservation.checkOut)}`],
                  ['Toplam', formatCurrency(g.activeReservation.totalPrice)],
                ].map(([k, v]) => (
                  <div key={k}>
                    <div style={{ fontSize: 11, color: 'var(--text-3)', marginBottom: 3 }}>{k}</div>
                    <div style={{ fontSize: 13, color: 'var(--text)' }}>{v}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* History */}
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border-c)', borderRadius: 10, overflow: 'hidden', boxShadow: 'var(--shadow-sm)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px', borderBottom: '1px solid var(--border-c)' }}>
              <div style={{ fontWeight: 600, fontSize: 14 }}>Konaklama geçmişi</div>
              <span style={{ fontSize: 11, color: 'var(--text-3)' }}>{g.history.length} kayıt</span>
            </div>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead><tr><th style={th}>Tarih</th><th style={th}>Oda</th><th style={th}>Durum</th><th style={{ ...th, textAlign: 'right' }}>Tutar</th></tr></thead>
              <tbody>
                {g.history.map(h => (
                  <tr key={h.id} style={{ borderTop: '1px solid var(--border-c)' }}>
                    <td style={td}>
                      <div style={{ fontWeight: 500 }}>{trDate(h.checkIn)}</div>
                      <div style={{ fontSize: 11, color: 'var(--text-3)', fontFamily: 'var(--font-mono)' }}>{h.id.slice(0, 8)}</div>
                    </td>
                    <td style={td}>{h.room ? `${h.room.number} · ${h.room.typeName}` : '—'}</td>
                    <td style={td}><Chip tone={STATUS_META[h.status]?.tone ?? 'neutral'} dot>{STATUS_META[h.status]?.label ?? h.status}</Chip></td>
                    <td style={{ ...td, textAlign: 'right', fontWeight: 500 }}>{formatCurrency(h.totalPrice)}</td>
                  </tr>
                ))}
                {g.history.length === 0 && <tr><td colSpan={4} style={{ ...td, textAlign: 'center', color: 'var(--text-3)' }}>Konaklama geçmişi yok</td></tr>}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right rail */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border-c)', borderRadius: 10, padding: 16, boxShadow: 'var(--shadow-sm)' }}>
            <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 12 }}>Hızlı işlemler</div>
            <Link href={`/reservation/new?guestId=${g.id}`} style={{ display: 'block', padding: '8px 12px', background: 'var(--accent-c)', color: 'var(--accent-fg)', borderRadius: 6, fontSize: 13, fontWeight: 500, textDecoration: 'none', textAlign: 'center', marginBottom: 8 }}>
              + Yeni rezervasyon
            </Link>
            <button style={{ width: '100%', padding: '8px 12px', background: 'var(--surface-2)', color: 'var(--text-2)', border: '1px solid var(--border-c)', borderRadius: 6, fontSize: 13, cursor: 'pointer' }}>
              Mesaj gönder
            </button>
          </div>

          <div style={{ background: 'var(--surface)', border: '1px solid var(--border-c)', borderRadius: 10, padding: 16, boxShadow: 'var(--shadow-sm)' }}>
            <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 12 }}>İletişim</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, fontSize: 12, color: 'var(--text-2)' }}>
              {g.phone && <div>📞 {g.phone}</div>}
              {g.email && <div>✉ {g.email}</div>}
              <div>🌍 {g.nationality}</div>
              {(g.tcId || g.passportNo) && <div>🪪 {g.tcId ?? g.passportNo}</div>}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
