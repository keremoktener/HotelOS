'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { trpc } from '@/lib/trpc/client'

const DIAL_CODES = [
  { code: '+90',  label: '🇹🇷 +90'  },
  { code: '+49',  label: '🇩🇪 +49'  },
  { code: '+44',  label: '🇬🇧 +44'  },
  { code: '+1',   label: '🇺🇸 +1'   },
  { code: '+33',  label: '🇫🇷 +33'  },
  { code: '+7',   label: '🇷🇺 +7'   },
  { code: '+31',  label: '🇳🇱 +31'  },
  { code: '+32',  label: '🇧🇪 +32'  },
  { code: '+43',  label: '🇦🇹 +43'  },
  { code: '+41',  label: '🇨🇭 +41'  },
  { code: '+39',  label: '🇮🇹 +39'  },
  { code: '+34',  label: '🇪🇸 +34'  },
  { code: '+30',  label: '🇬🇷 +30'  },
  { code: '+359', label: '🇧🇬 +359' },
  { code: '+995', label: '🇬🇪 +995' },
  { code: '+994', label: '🇦🇿 +994' },
  { code: '+98',  label: '🇮🇷 +98'  },
  { code: '+966', label: '🇸🇦 +966' },
  { code: '+971', label: '🇦🇪 +971' },
  { code: '+965', label: '🇰🇼 +965' },
  { code: '+974', label: '🇶🇦 +974' },
  { code: '+972', label: '🇮🇱 +972' },
  { code: '+962', label: '🇯🇴 +962' },
  { code: '+20',  label: '🇪🇬 +20'  },
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

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
      <label style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-2)' }}>
        {label}{required && <span style={{ color: 'var(--bad)', marginLeft: 2 }}>*</span>}
      </label>
      {children}
    </div>
  )
}

const inputStyle: React.CSSProperties = {
  padding: '8px 10px', border: '1px solid var(--border-c)', borderRadius: 6,
  fontSize: 13, background: 'var(--bg)', color: 'var(--text)', outline: 'none', width: '100%', boxSizing: 'border-box',
}

export default function GuestNewPage() {
  const router = useRouter()
  const [firstName, setFirstName]   = useState('')
  const [lastName, setLastName]     = useState('')
  const [tcId, setTcId]             = useState('')
  const [passportNo, setPassportNo] = useState('')
  const [dialCode, setDialCode]     = useState('+90')
  const [phoneNumber, setPhoneNumber] = useState('')
  const [email, setEmail]           = useState('')
  const [nationality, setNationality] = useState('')
  const [dateOfBirth, setDateOfBirth] = useState('')
  const [error, setError]           = useState('')

  const createGuest = trpc.guest.create.useMutation({
    onSuccess: (data) => { router.refresh(); router.push(`/guests/${data.id}`) },
    onError: (err) => { setError(err.message) },
  })

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    const phone = phoneNumber.trim() ? `${dialCode}${phoneNumber.trim()}` : undefined
    createGuest.mutate({
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      tcId: tcId.trim() || undefined,
      passportNo: passportNo.trim() || undefined,
      phone,
      email: email.trim() || undefined,
      nationality: nationality.trim() || undefined,
      dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : undefined,
    })
  }

  return (
    <div style={{ height: 'calc(100% - 56px)', overflowY: 'auto', padding: 24 }}>
      <div style={{ maxWidth: 600 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
          <button
            onClick={() => router.push('/guests')}
            style={{ background: 'none', border: '1px solid var(--border-c)', borderRadius: 6, padding: '5px 10px', fontSize: 12, color: 'var(--text-2)', cursor: 'pointer' }}
          >
            ← Misafirler
          </button>
          <h1 style={{ fontSize: 18, fontWeight: 600, color: 'var(--text)', margin: 0 }}>Yeni Misafir</h1>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border-c)', borderRadius: 10, padding: 20, display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.05em', paddingBottom: 8, borderBottom: '1px solid var(--border-c)' }}>
              Kimlik Bilgileri
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <Field label="Ad" required>
                <input style={inputStyle} value={firstName} onChange={e => setFirstName(e.target.value)} required placeholder="Ad"/>
              </Field>
              <Field label="Soyad" required>
                <input style={inputStyle} value={lastName} onChange={e => setLastName(e.target.value)} required placeholder="Soyad"/>
              </Field>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <Field label="TC Kimlik No">
                <input style={inputStyle} value={tcId} onChange={e => setTcId(e.target.value)} placeholder="11 haneli" maxLength={11}/>
              </Field>
              <Field label="Pasaport No">
                <input style={inputStyle} value={passportNo} onChange={e => setPassportNo(e.target.value)} placeholder="Pasaport numarası"/>
              </Field>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <Field label="Uyruk">
                <input
                  list="country-list"
                  style={inputStyle}
                  value={nationality}
                  onChange={e => setNationality(e.target.value)}
                  placeholder="Ülke yazın veya seçin"
                  autoComplete="off"
                />
                <datalist id="country-list">
                  {COUNTRIES.map(c => <option key={c} value={c}/>)}
                </datalist>
              </Field>
              <Field label="Doğum Tarihi">
                <input style={inputStyle} type="date" value={dateOfBirth} onChange={e => setDateOfBirth(e.target.value)}/>
              </Field>
            </div>

            <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.05em', paddingBottom: 8, paddingTop: 4, borderBottom: '1px solid var(--border-c)' }}>
              İletişim
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <Field label="Telefon">
                <div style={{ display: 'flex', gap: 6 }}>
                  <select
                    value={dialCode}
                    onChange={e => setDialCode(e.target.value)}
                    style={{ ...inputStyle, width: 'auto', flexShrink: 0, paddingRight: 6 }}
                  >
                    {DIAL_CODES.map(d => <option key={d.code} value={d.code}>{d.label}</option>)}
                  </select>
                  <input
                    style={inputStyle}
                    value={phoneNumber}
                    onChange={e => setPhoneNumber(e.target.value)}
                    placeholder="5xx xxx xx xx"
                    type="tel"
                  />
                </div>
              </Field>
              <Field label="E-posta">
                <input style={inputStyle} value={email} onChange={e => setEmail(e.target.value)} placeholder="ornek@email.com" type="email"/>
              </Field>
            </div>

            {error && (
              <div style={{ padding: '8px 12px', background: 'var(--bad-bg)', color: 'var(--bad)', borderRadius: 6, fontSize: 12 }}>
                {error}
              </div>
            )}

            <div style={{ display: 'flex', gap: 8, paddingTop: 4 }}>
              <button
                type="button"
                onClick={() => router.push('/guests')}
                style={{ flex: 1, padding: '9px', border: '1px solid var(--border-c)', borderRadius: 6, fontSize: 13, background: 'var(--surface-2)', color: 'var(--text-2)', cursor: 'pointer' }}
              >
                Vazgeç
              </button>
              <button
                type="submit"
                disabled={createGuest.isPending || !firstName.trim() || !lastName.trim()}
                style={{ flex: 2, padding: '9px', border: 'none', borderRadius: 6, fontSize: 13, fontWeight: 600, background: 'var(--accent-c)', color: 'var(--accent-fg)', cursor: 'pointer', opacity: (createGuest.isPending || !firstName.trim() || !lastName.trim()) ? 0.6 : 1 }}
              >
                {createGuest.isPending ? 'Kaydediliyor…' : 'Misafiri Kaydet'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}
