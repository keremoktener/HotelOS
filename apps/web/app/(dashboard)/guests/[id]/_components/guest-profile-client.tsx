'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { trpc } from '@/lib/trpc/client'

const DIAL_CODES = [
  { code: '+90',  label: '🇹🇷 +90'  }, { code: '+49',  label: '🇩🇪 +49'  },
  { code: '+44',  label: '🇬🇧 +44'  }, { code: '+1',   label: '🇺🇸 +1'   },
  { code: '+33',  label: '🇫🇷 +33'  }, { code: '+7',   label: '🇷🇺 +7'   },
  { code: '+31',  label: '🇳🇱 +31'  }, { code: '+32',  label: '🇧🇪 +32'  },
  { code: '+43',  label: '🇦🇹 +43'  }, { code: '+41',  label: '🇨🇭 +41'  },
  { code: '+39',  label: '🇮🇹 +39'  }, { code: '+34',  label: '🇪🇸 +34'  },
  { code: '+30',  label: '🇬🇷 +30'  }, { code: '+359', label: '🇧🇬 +359' },
  { code: '+995', label: '🇬🇪 +995' }, { code: '+994', label: '🇦🇿 +994' },
  { code: '+98',  label: '🇮🇷 +98'  }, { code: '+966', label: '🇸🇦 +966' },
  { code: '+971', label: '🇦🇪 +971' }, { code: '+965', label: '🇰🇼 +965' },
  { code: '+974', label: '🇶🇦 +974' }, { code: '+972', label: '🇮🇱 +972' },
  { code: '+962', label: '🇯🇴 +962' }, { code: '+20',  label: '🇪🇬 +20'  },
]

const COUNTRIES = [
  'Almanya','Amerika Birleşik Devletleri','Arjantin','Avustralya','Avusturya',
  'Azerbaycan','Belçika','Birleşik Arap Emirlikleri','Brezilya','Bulgaristan',
  'Çekya','Çin','Danimarka','Finlandiya','Fransa','Güney Kore','Gürcistan',
  'Hindistan','Hollanda','İngiltere','İran','İsrail','İspanya','İsveç','İsviçre',
  'İtalya','Japonya','Kanada','Katar','Kuveyt','Macaristan','Mısır','Norveç',
  'Pakistan','Polonya','Portekiz','Romanya','Rusya','Suudi Arabistan','Türkiye',
  'Ürdün','Yunanistan',
]

function parsePhone(phone: string): [string, string] {
  const match = DIAL_CODES.find(d => phone.startsWith(d.code))
  return match ? [match.code, phone.slice(match.code.length)] : ['+90', phone]
}

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
const inputStyle: React.CSSProperties = { padding: '7px 10px', border: '1px solid var(--border-c)', borderRadius: 6, fontSize: 13, background: 'var(--bg)', color: 'var(--text)', outline: 'none', width: '100%', boxSizing: 'border-box' }

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <label style={{ fontSize: 11, fontWeight: 500, color: 'var(--text-3)' }}>{label}</label>
      {children}
    </div>
  )
}

interface Reservation { id: string; status: string; checkIn: string; checkOut: string; totalPrice: number; room: { number: string; typeName: string } | null }
interface ActiveRes extends Reservation {}

interface Guest {
  id: string; firstName: string; lastName: string; phone: string; email: string
  nationality: string; tcId: string | null; passportNo: string | null
  dateOfBirth: string | null
  blacklisted: boolean; blacklistReason: string | null
  totalStays: number; totalRevenue: number
  activeReservation: ActiveRes | null
  history: Reservation[]
}

export function GuestProfileClient({ guest: g, totalRevenue }: { guest: Guest; totalRevenue: number }) {
  const router = useRouter()
  const [editing, setEditing] = useState(false)

  const [firstName, setFirstName] = useState(g.firstName)
  const [lastName, setLastName] = useState(g.lastName)
  const [dialCode, setDialCode] = useState(() => parsePhone(g.phone)[0])
  const [phoneNumber, setPhoneNumber] = useState(() => parsePhone(g.phone)[1])
  const [email, setEmail] = useState(g.email)
  const [nationality, setNationality] = useState(g.nationality)
  const [tcId, setTcId] = useState('')
  const [passportNo, setPassportNo] = useState(g.passportNo ?? '')
  const [dateOfBirth, setDateOfBirth] = useState(g.dateOfBirth ? g.dateOfBirth.slice(0, 10) : '')
  const [saveError, setSaveError] = useState('')

  const updateGuest = trpc.guest.update.useMutation({
    onSuccess: () => { router.refresh(); setEditing(false); setSaveError('') },
    onError: (err) => setSaveError(err.message),
  })

  function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setSaveError('')
    if (!firstName.trim() || !lastName.trim()) { setSaveError('Ad ve soyad zorunludur.'); return }
    const data: Record<string, unknown> = {
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      phone: phoneNumber.trim() ? `${dialCode}${phoneNumber.trim()}` : undefined,
      email: email.trim() || undefined,
      nationality: nationality.trim() || undefined,
      passportNo: passportNo.trim() || undefined,
      dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : undefined,
    }
    if (tcId.trim()) data.tcId = tcId.trim()
    updateGuest.mutate({ id: g.id, data })
  }

  function cancelEdit() {
    setFirstName(g.firstName); setLastName(g.lastName)
    const [dc, pn] = parsePhone(g.phone); setDialCode(dc); setPhoneNumber(pn)
    setEmail(g.email); setNationality(g.nationality)
    setPassportNo(g.passportNo ?? ''); setTcId('')
    setDateOfBirth(g.dateOfBirth ? g.dateOfBirth.slice(0, 10) : '')
    setSaveError(''); setEditing(false)
  }

  const initials = `${g.firstName[0] ?? ''}${g.lastName[0] ?? ''}`.toUpperCase()

  return (
    <div style={{ height: 'calc(100% - 56px)', overflowY: 'auto', padding: 24 }}>
      <button
        onClick={() => { router.refresh(); router.push('/guests') }}
        style={{ background: 'none', border: '1px solid var(--border-c)', borderRadius: 6, padding: '5px 10px', fontSize: 12, color: 'var(--text-2)', cursor: 'pointer', marginBottom: 16 }}
      >
        ← Misafirler
      </button>

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
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 12 }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'auto auto', gap: '2px 28px', textAlign: 'right' }}>
              <div style={{ fontSize: 18, fontWeight: 600, letterSpacing: '-0.01em' }}>{g.totalStays}</div>
              <div style={{ fontSize: 10, color: 'var(--text-3)', letterSpacing: '0.05em', textTransform: 'uppercase', alignSelf: 'center' }}>Konaklama</div>
              <div style={{ fontSize: 18, fontWeight: 600, letterSpacing: '-0.01em' }}>{formatCurrency(totalRevenue)}</div>
              <div style={{ fontSize: 10, color: 'var(--text-3)', letterSpacing: '0.05em', textTransform: 'uppercase', alignSelf: 'center' }}>Toplam gelir</div>
            </div>
            <button
              onClick={() => editing ? cancelEdit() : setEditing(true)}
              style={{ padding: '6px 14px', borderRadius: 6, fontSize: 12, fontWeight: 500, cursor: 'pointer', border: editing ? '1px solid var(--border-c)' : '1px solid var(--accent-c)', background: editing ? 'var(--surface-2)' : 'var(--accent-c)', color: editing ? 'var(--text-2)' : 'var(--accent-fg)' }}
            >
              {editing ? 'İptal' : 'Düzenle'}
            </button>
          </div>
        </div>
        {g.blacklisted && g.blacklistReason && (
          <div style={{ marginTop: 14, padding: '10px 14px', background: 'var(--bad-bg)', borderRadius: 6, color: 'var(--bad)', fontSize: 12 }}>
            <b>Kara liste uyarısı:</b> {g.blacklistReason}
          </div>
        )}
      </div>

      {/* Edit form */}
      {editing && (
        <form onSubmit={handleSave} style={{ background: 'var(--surface)', border: '1px solid var(--accent-c)', borderRadius: 10, padding: 20, marginBottom: 16, boxShadow: 'var(--shadow-sm)' }}>
          <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 16 }}>Misafir bilgilerini düzenle</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
            <Field label="Ad *">
              <input style={inputStyle} value={firstName} onChange={e => setFirstName(e.target.value)} required/>
            </Field>
            <Field label="Soyad *">
              <input style={inputStyle} value={lastName} onChange={e => setLastName(e.target.value)} required/>
            </Field>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
            <Field label="Uyruk">
              <input style={inputStyle} list="country-list-edit" value={nationality} onChange={e => setNationality(e.target.value)} placeholder="Uyruk seçin veya yazın"/>
              <datalist id="country-list-edit">{COUNTRIES.map(c => <option key={c} value={c}/>)}</datalist>
            </Field>
            <Field label="Doğum tarihi">
              <input type="date" style={inputStyle} value={dateOfBirth} onChange={e => setDateOfBirth(e.target.value)}/>
            </Field>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '140px 1fr', gap: 8, marginBottom: 12 }}>
            <Field label="Alan kodu">
              <select style={inputStyle} value={dialCode} onChange={e => setDialCode(e.target.value)}>
                {DIAL_CODES.map(d => <option key={d.code} value={d.code}>{d.label}</option>)}
              </select>
            </Field>
            <Field label="Telefon">
              <input style={inputStyle} value={phoneNumber} onChange={e => setPhoneNumber(e.target.value)} placeholder="5XX XXX XX XX"/>
            </Field>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
            <Field label="E-posta">
              <input type="email" style={inputStyle} value={email} onChange={e => setEmail(e.target.value)} placeholder="ornek@domain.com"/>
            </Field>
            <Field label="Pasaport no">
              <input style={inputStyle} value={passportNo} onChange={e => setPassportNo(e.target.value)} placeholder="Pasaport numarası"/>
            </Field>
          </div>
          <Field label="TC Kimlik no (değiştirmek için girin)">
            <input style={{ ...inputStyle, maxWidth: 240 }} value={tcId} onChange={e => setTcId(e.target.value)} placeholder="11 haneli TC Kimlik No" maxLength={11}/>
          </Field>
          {saveError && <div style={{ marginTop: 10, padding: '8px 12px', background: 'var(--bad-bg)', borderRadius: 6, color: 'var(--bad)', fontSize: 12 }}>{saveError}</div>}
          <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
            <button type="submit" disabled={updateGuest.isPending} style={{ padding: '8px 20px', background: 'var(--accent-c)', color: 'var(--accent-fg)', border: 'none', borderRadius: 6, fontSize: 13, fontWeight: 500, cursor: updateGuest.isPending ? 'not-allowed' : 'pointer', opacity: updateGuest.isPending ? 0.7 : 1 }}>
              {updateGuest.isPending ? 'Kaydediliyor…' : 'Kaydet'}
            </button>
            <button type="button" onClick={cancelEdit} style={{ padding: '8px 16px', background: 'var(--surface-2)', color: 'var(--text-2)', border: '1px solid var(--border-c)', borderRadius: 6, fontSize: 13, cursor: 'pointer' }}>
              İptal
            </button>
          </div>
        </form>
      )}

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
