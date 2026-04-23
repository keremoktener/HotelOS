'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useOrganization, useUser } from '@clerk/nextjs'

const STEPS = [
  { n: 1, title: 'Otel bilgileri' },
  { n: 2, title: 'Oda tipleri' },
  { n: 3, title: 'Odalar & katlar' },
  { n: 4, title: 'Operasyon kuralları' },
  { n: 5, title: 'Kanal & fiyatlar' },
  { n: 6, title: 'Ekip & yetkiler' },
]

function Check() {
  return (
    <svg width={12} height={12} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3}><polyline points="20 6 9 17 4 12"/></svg>
  )
}

export default function OnboardingPage() {
  const { user } = useUser()
  const { organization } = useOrganization()
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [hotelName, setHotelName] = useState(organization?.name ?? '')

  async function handleComplete() {
    setLoading(true)
    try {
      await fetch('/api/onboarding/complete', { method: 'POST' })
      router.push('/')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: 'var(--bg)' }}>
      {/* Topbar */}
      <div style={{ height: 56, borderBottom: '1px solid var(--border-c)', background: 'var(--surface)', display: 'flex', alignItems: 'center', padding: '0 24px', gap: 16, flexShrink: 0 }}>
        <div style={{ fontWeight: 700, fontSize: 16, letterSpacing: '-0.02em', color: 'var(--accent-c)' }}>HotelOS</div>
        <div style={{ width: 1, height: 20, background: 'var(--border-c)' }}/>
        <div style={{ fontSize: 13, color: 'var(--text-2)' }}>Kurulum sihirbazı</div>
        <div style={{ flex: 1 }}/>
        <button onClick={() => router.push('/')} style={{ padding: '5px 12px', background: 'transparent', border: '1px solid var(--border-c)', borderRadius: 6, fontSize: 12, color: 'var(--text-2)', cursor: 'pointer' }}>
          Çıkış
        </button>
      </div>

      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        {/* Left rail: steps */}
        <div style={{ width: 260, borderRight: '1px solid var(--border-c)', background: 'var(--surface)', padding: 20, flexShrink: 0, overflowY: 'auto' }}>
          <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--text-3)', letterSpacing: '0.08em', marginBottom: 12, textTransform: 'uppercase' }}>Adım 1 / {STEPS.length}</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {STEPS.map(s => (
              <div key={s.n} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 8px', borderRadius: 6, background: s.n === 1 ? 'var(--accent-weak)' : 'transparent' }}>
                <div style={{
                  width: 22, height: 22, borderRadius: 999, flexShrink: 0,
                  background: s.n === 1 ? 'var(--accent-c)' : 'var(--surface-2)',
                  color: s.n === 1 ? 'var(--accent-fg)' : 'var(--text-3)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 11, fontWeight: 600,
                }}>
                  {s.n}
                </div>
                <div style={{ fontSize: 13, fontWeight: s.n === 1 ? 600 : 450, color: s.n === 1 ? 'var(--text)' : 'var(--text-3)' }}>{s.title}</div>
              </div>
            ))}
          </div>
          <div style={{ marginTop: 20, padding: 12, background: 'var(--surface-2)', borderRadius: 8 }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-2)', marginBottom: 4 }}>ℹ Bilgi</div>
            <div style={{ fontSize: 11, color: 'var(--text-2)', lineHeight: 1.6 }}>
              Kurulumu tamamlayarak panele erişin. Oda ve ekip bilgilerini Ayarlar menüsünden de düzenleyebilirsiniz.
            </div>
          </div>
        </div>

        {/* Main panel */}
        <div style={{ flex: 1, padding: '48px', overflowY: 'auto', maxWidth: 680 }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--accent-c)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 8 }}>Adım 1</div>
          <h1 style={{ fontFamily: 'var(--font-mono)', fontSize: 28, fontWeight: 700, letterSpacing: '-0.02em', margin: 0, marginBottom: 6, color: 'var(--text)' }}>
            Otele Hoş Geldiniz
          </h1>
          <p style={{ fontSize: 14, color: 'var(--text-2)', margin: 0, marginBottom: 32, lineHeight: 1.6 }}>
            HotelOS'i yapılandırmak için birkaç adım tamamlayın. Bu süreci istediğiniz zaman bırakabilir ve Ayarlar menüsünden devam edebilirsiniz.
          </p>

          {/* Hotel info card */}
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border-c)', borderRadius: 10, padding: 20, marginBottom: 16, boxShadow: 'var(--shadow-sm)' }}>
            <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 16 }}>Otel bilgileri</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div>
                <div style={{ fontSize: 11, color: 'var(--text-3)', marginBottom: 5, fontWeight: 500 }}>Otel adı</div>
                <input
                  value={hotelName}
                  onChange={e => setHotelName(e.target.value)}
                  style={{ width: '100%', height: 36, padding: '0 10px', background: 'var(--bg)', border: '1px solid var(--border-c)', borderRadius: 6, fontSize: 13, color: 'var(--text)', outline: 'none', boxSizing: 'border-box' }}
                  placeholder="Otel adı"
                />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <div style={{ fontSize: 11, color: 'var(--text-3)', marginBottom: 5, fontWeight: 500 }}>Organizasyon</div>
                  <div style={{ height: 36, padding: '0 10px', background: 'var(--surface-2)', border: '1px solid var(--border-c)', borderRadius: 6, fontSize: 13, color: 'var(--text-2)', display: 'flex', alignItems: 'center' }}>
                    {organization?.name ?? 'Yükleniyor…'}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: 11, color: 'var(--text-3)', marginBottom: 5, fontWeight: 500 }}>Yönetici</div>
                  <div style={{ height: 36, padding: '0 10px', background: 'var(--surface-2)', border: '1px solid var(--border-c)', borderRadius: 6, fontSize: 13, color: 'var(--text-2)', display: 'flex', alignItems: 'center' }}>
                    {user?.fullName ?? '—'}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Info box */}
          <div style={{ padding: '12px 14px', background: 'var(--info-bg)', borderRadius: 8, fontSize: 12, color: 'var(--text-2)', marginBottom: 32 }}>
            <b style={{ color: 'var(--info)' }}>Kurulum hakkında:</b> Oda tipleri, odalar, ekip üyeleri ve operasyon kuralları kurulum sihirbazı tamamlandıktan sonra Ayarlar menüsünden düzenlenebilir.
          </div>

          {/* Footer */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', paddingTop: 20, borderTop: '1px solid var(--border-c)' }}>
            <button
              onClick={handleComplete}
              disabled={loading}
              style={{
                padding: '10px 28px', background: 'var(--accent-c)', color: 'var(--accent-fg)',
                border: 0, borderRadius: 6, fontSize: 14, fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer',
                opacity: loading ? 0.6 : 1,
              }}
            >
              {loading ? 'Yükleniyor…' : 'Panele Git →'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
