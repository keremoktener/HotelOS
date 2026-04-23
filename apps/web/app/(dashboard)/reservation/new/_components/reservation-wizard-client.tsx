'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { trpc } from '@/lib/trpc/client'

function formatCurrency(kurus: number) { return (kurus / 100).toLocaleString('tr-TR') + ' ₺' }

function trDate(iso: string) {
  const d = new Date(iso)
  const M = ['Oca','Şub','Mar','Nis','May','Haz','Tem','Ağu','Eyl','Eki','Kas','Ara']
  return `${d.getDate()} ${M[d.getMonth()]} ${d.getFullYear()}`
}

function Check() {
  return <svg width={11} height={11} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3}><polyline points="20 6 9 17 4 12"/></svg>
}

function Chip({ tone, children }: { tone: string; children: React.ReactNode }) {
  const map: Record<string, { bg: string; fg: string }> = {
    good: { bg: 'var(--good-bg)', fg: 'var(--good)' }, warn: { bg: 'var(--warn-bg)', fg: 'var(--warn)' },
    bad: { bg: 'var(--bad-bg)', fg: 'var(--bad)' }, info: { bg: 'var(--info-bg)', fg: 'var(--info)' },
    neutral: { bg: 'var(--surface-2)', fg: 'var(--text-2)' },
  }
  const t = map[tone] ?? map.neutral
  return <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '2px 8px', borderRadius: 999, fontSize: 11, fontWeight: 500, background: t.bg, color: t.fg }}>{children}</span>
}

function SumRow({ k, v, mono, muted }: { k: string; v: string; mono?: boolean; muted?: boolean }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', padding: '3px 0', fontSize: 12 }}>
      <span style={{ color: 'var(--text-3)' }}>{k}</span>
      <span style={{ fontFamily: mono ? 'var(--font-mono)' : 'inherit', color: muted ? 'var(--text-3)' : 'var(--text)', fontWeight: muted ? 400 : 500 }}>{v}</span>
    </div>
  )
}

function Field({ label, value, onChange, type = 'text', min }: { label: string; value: string | number; onChange: (v: string) => void; type?: string; min?: string | number }) {
  return (
    <div>
      <div style={{ fontSize: 11, color: 'var(--text-3)', marginBottom: 5, fontWeight: 500 }}>{label}</div>
      <input
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        min={min}
        style={{ width: '100%', height: 36, padding: '0 10px', background: 'var(--surface)', border: '1px solid var(--border-c)', borderRadius: 6, fontSize: 13, color: 'var(--text)', outline: 'none', boxSizing: 'border-box' }}
      />
    </div>
  )
}

interface AvailableRoom {
  id: string
  number: string
  floor: number | null
  status: string
  roomTypeName: string
  capacity: number
  basePrice: number
}

interface Props { availableRooms: AvailableRoom[]; initialGuestId?: string }

const STEPS = [
  { n: 1, title: 'Tarih & misafir sayısı' },
  { n: 2, title: 'Misafir' },
  { n: 3, title: 'Oda seçimi' },
  { n: 4, title: 'Fiyat & onay' },
]

export function ReservationWizardClient({ availableRooms, initialGuestId }: Props) {
  const router = useRouter()

  // Step state
  const [step, setStep] = useState(initialGuestId ? 2 : 1)

  // Step 1: dates & counts
  const [checkIn, setCheckIn] = useState('')
  const [checkOut, setCheckOut] = useState('')
  const [adults, setAdults] = useState('2')
  const [children, setChildren] = useState('0')

  // Step 2: guest
  const [guestQuery, setGuestQuery] = useState('')
  const [selectedGuestId, setSelectedGuestId] = useState<string | null>(initialGuestId ?? null)
  const [showPopover, setShowPopover] = useState(false)

  // Step 3: room
  const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null)

  // Step 4: notes & submit
  const [notes, setNotes] = useState('')
  const [error, setError] = useState<string | null>(null)

  const nights = checkIn && checkOut
    ? Math.round((new Date(checkOut).getTime() - new Date(checkIn).getTime()) / (1000 * 60 * 60 * 24))
    : 0

  const { data: guests } = trpc.guest.search.useQuery(
    { query: guestQuery },
    { enabled: guestQuery.length >= 2 },
  )

  const { data: selectedGuestData } = trpc.guest.get.useQuery(
    { id: selectedGuestId! },
    { enabled: !!selectedGuestId },
  )

  const { data: pricePreview } = trpc.reservation.pricePreview.useQuery(
    { guestCount: Number(adults) + Number(children), checkIn: new Date(checkIn), checkOut: new Date(checkOut) },
    { enabled: !!(checkIn && checkOut && nights > 0) },
  )

  const createMutation = trpc.reservation.create.useMutation({
    onSuccess: (data) => router.push(`/reservation/${data.id}`),
    onError: (err) => setError(err.message),
  })

  const selectedRoom = availableRooms.find(r => r.id === selectedRoomId)

  function handleCreate() {
    if (!selectedGuestId || !selectedRoomId || !checkIn || !checkOut) {
      setError('Lütfen tüm zorunlu alanları doldurun.')
      return
    }
    createMutation.mutate({
      guestId: selectedGuestId,
      roomId: selectedRoomId,
      checkIn: new Date(checkIn),
      checkOut: new Date(checkOut),
      adults: Number(adults),
      children: Number(children),
      notes,
    })
  }

  function canAdvance() {
    if (step === 1) return !!(checkIn && checkOut && nights > 0 && Number(adults) >= 1)
    if (step === 2) return !!selectedGuestId
    if (step === 3) return !!selectedRoomId
    return true
  }

  return (
    <div style={{ height: 'calc(100% - 56px)', overflowY: 'auto', padding: 24, display: 'flex', gap: 20 }}>
      {/* Step rail */}
      <div style={{ width: 220, flexShrink: 0 }}>
        <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--text-3)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 10 }}>Adım {step} / 4</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {STEPS.map(s => (
            <div key={s.n} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 10px', borderRadius: 6, background: s.n === step ? 'var(--accent-weak)' : 'transparent' }}>
              <div style={{
                width: 20, height: 20, borderRadius: 999, flexShrink: 0,
                background: s.n < step ? 'var(--good)' : s.n === step ? 'var(--accent-c)' : 'var(--surface-2)',
                color: s.n <= step ? 'var(--accent-fg)' : 'var(--text-3)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 600,
              }}>
                {s.n < step ? <Check/> : s.n}
              </div>
              <div style={{ fontSize: 12, fontWeight: s.n === step ? 600 : 450, color: s.n === step ? 'var(--text)' : s.n < step ? 'var(--text-2)' : 'var(--text-3)' }}>{s.title}</div>
            </div>
          ))}
        </div>

        {/* Mini summary */}
        <div style={{ marginTop: 16, padding: 12, background: 'var(--surface)', border: '1px solid var(--border-c)', borderRadius: 8 }}>
          <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--text-3)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 8 }}>Özet</div>
          <SumRow k="Giriş" v={checkIn ? trDate(checkIn + 'T12:00:00') : '—'} mono/>
          <SumRow k="Çıkış" v={checkOut ? trDate(checkOut + 'T12:00:00') : '—'} mono/>
          <SumRow k="Gece" v={nights > 0 ? String(nights) : '—'} mono/>
          <SumRow k="Yetişkin" v={adults}/>
          <SumRow k="Çocuk" v={children}/>
          <div style={{ height: 1, background: 'var(--border-c)', margin: '8px 0' }}/>
          <SumRow k="Misafir" v={selectedGuestData ? `${selectedGuestData.firstName} ${selectedGuestData.lastName}` : '—'} muted={!selectedGuestData}/>
          <SumRow k="Oda" v={selectedRoom ? selectedRoom.number : '—'} muted={!selectedRoom}/>
          {pricePreview && <SumRow k="Toplam" v={formatCurrency(pricePreview.totalPrice)}/>}
        </div>
      </div>

      {/* Main panel */}
      <div style={{ flex: 1, maxWidth: 780 }}>
        {/* Step 1: Dates */}
        {step === 1 && (
          <>
            <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--accent-c)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 6 }}>Adım 1 · Tarih & Kişi</div>
            <h1 style={{ fontSize: 24, fontWeight: 600, letterSpacing: '-0.02em', margin: 0, marginBottom: 4, color: 'var(--text)' }}>Tarih ve kişi sayısını seçin</h1>
            <p style={{ fontSize: 13, color: 'var(--text-2)', margin: 0, marginBottom: 24 }}>Giriş ve çıkış tarihlerini ve misafir sayısını belirleyin.</p>

            <div style={{ background: 'var(--surface)', border: '1px solid var(--border-c)', borderRadius: 10, padding: 20, marginBottom: 16, boxShadow: 'var(--shadow-sm)' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
                <Field label="Giriş tarihi" value={checkIn} onChange={setCheckIn} type="date"/>
                <Field label="Çıkış tarihi" value={checkOut} onChange={v => setCheckOut(v)} type="date" min={checkIn}/>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <Field label="Yetişkin sayısı" value={adults} onChange={setAdults} type="number" min={1}/>
                <Field label="Çocuk sayısı" value={children} onChange={setChildren} type="number" min={0}/>
              </div>
              {nights > 0 && (
                <div style={{ marginTop: 14, padding: '10px 14px', background: 'var(--info-bg)', borderRadius: 6, fontSize: 12, color: 'var(--info)' }}>
                  <b>{nights} gece</b> · {checkIn} → {checkOut}
                </div>
              )}
            </div>
          </>
        )}

        {/* Step 2: Guest */}
        {step === 2 && (
          <>
            <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--accent-c)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 6 }}>Adım 2 · Misafir</div>
            <h1 style={{ fontSize: 24, fontWeight: 600, letterSpacing: '-0.02em', margin: 0, marginBottom: 4, color: 'var(--text)' }}>Misafiri seçin veya ekleyin</h1>
            <p style={{ fontSize: 13, color: 'var(--text-2)', margin: 0, marginBottom: 20 }}>Mevcut misafiri arayın. KBS bildirimi için TC / pasaport bilgisi zorunludur.</p>

            {!selectedGuestId && (
              <div style={{ position: 'relative', marginBottom: 14 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, height: 40, padding: '0 12px', background: 'var(--surface)', border: '1px solid var(--accent-c)', boxShadow: '0 0 0 3px var(--accent-weak)', borderRadius: 6 }}>
                  <svg width={15} height={15} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
                  <input
                    value={guestQuery}
                    onChange={e => { setGuestQuery(e.target.value); setShowPopover(true) }}
                    onFocus={() => setShowPopover(true)}
                    placeholder="Ad, soyad, TC, telefon veya e-posta"
                    style={{ flex: 1, border: 0, background: 'transparent', outline: 'none', color: 'var(--text)', fontSize: 14 }}
                    autoFocus
                  />
                </div>
                {showPopover && guests && guests.length > 0 && (
                  <div style={{ position: 'absolute', top: 46, left: 0, right: 0, background: 'var(--surface)', border: '1px solid var(--border-c)', borderRadius: 10, boxShadow: '0 12px 40px rgba(0,0,0,0.15)', zIndex: 20, overflow: 'hidden' }}>
                    <div style={{ padding: '8px 14px', fontSize: 10, fontWeight: 600, color: 'var(--text-3)', letterSpacing: '0.08em', textTransform: 'uppercase', background: 'var(--surface-2)' }}>
                      {guests.length} eşleşme
                    </div>
                    {guests.map((g, i) => (
                      <div
                        key={g.id}
                        onClick={() => { setSelectedGuestId(g.id); setShowPopover(false); setGuestQuery('') }}
                        style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', borderTop: i ? '1px solid var(--border-c)' : 0, cursor: 'pointer' }}
                        onMouseEnter={e => (e.currentTarget.style.background = 'var(--accent-weak)')}
                        onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                      >
                        <div style={{ width: 32, height: 32, borderRadius: 999, background: 'var(--accent-weak)', color: 'var(--accent-c)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 600 }}>
                          {(g.firstName[0] ?? '').toUpperCase()}{(g.lastName[0] ?? '').toUpperCase()}
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: 13, fontWeight: 600 }}>{g.firstName} {g.lastName}</div>
                          <div style={{ fontSize: 11, color: 'var(--text-2)' }}>{g.phone} {g.blacklisted ? '· ⚠ Kara liste' : ''}</div>
                        </div>
                        {g.blacklisted && <Chip tone="bad">Kara liste</Chip>}
                      </div>
                    ))}
                    <div
                      onClick={() => router.push(`/guests/new?return=/reservation/new`)}
                      style={{ borderTop: '1px solid var(--border-c)', padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 10, fontSize: 12, color: 'var(--text-2)', cursor: 'pointer' }}
                      onMouseEnter={e => (e.currentTarget.style.background = 'var(--surface-2)')}
                      onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                    >
                      <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                      <span>Yeni misafir oluştur</span>
                    </div>
                  </div>
                )}
              </div>
            )}

            {selectedGuestId && selectedGuestData && (
              <div style={{ background: 'var(--surface)', border: '1px solid var(--border-c)', borderRadius: 10, padding: 16, boxShadow: 'var(--shadow-sm)' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                  <div style={{ fontWeight: 600, fontSize: 14 }}>Seçilen misafir</div>
                  <button onClick={() => setSelectedGuestId(null)} style={{ padding: '4px 10px', background: 'transparent', border: '1px solid var(--border-c)', borderRadius: 6, fontSize: 12, color: 'var(--text-2)', cursor: 'pointer' }}>Değiştir</button>
                </div>
                <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
                  <div style={{ width: 52, height: 52, borderRadius: 999, background: 'var(--accent-weak)', color: 'var(--accent-c)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, fontWeight: 600, flexShrink: 0 }}>
                    {(selectedGuestData.firstName[0] ?? '').toUpperCase()}{(selectedGuestData.lastName[0] ?? '').toUpperCase()}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                      <div style={{ fontSize: 16, fontWeight: 600 }}>{selectedGuestData.firstName} {selectedGuestData.lastName}</div>
                      {selectedGuestData.blacklisted && <Chip tone="bad">Kara liste</Chip>}
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--text-2)' }}>{selectedGuestData.phone} · {selectedGuestData.email}</div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginTop: 14 }}>
                      {[
                        { k: 'Uyruk', v: selectedGuestData.nationality ?? 'TR' },
                        { k: 'TC / Pasaport', v: selectedGuestData.tcId ?? selectedGuestData.passportNo ?? '—' },
                      ].map(({ k, v }) => (
                        <div key={k}>
                          <div style={{ fontSize: 10, color: 'var(--text-3)', fontWeight: 600, letterSpacing: '0.04em', textTransform: 'uppercase' }}>{k}</div>
                          <div style={{ fontSize: 13, fontWeight: 600, marginTop: 2, fontFamily: 'var(--font-mono)' }}>{v}</div>
                        </div>
                      ))}
                    </div>
                    {selectedGuestData.blacklisted ? (
                      <div style={{ marginTop: 14, padding: '10px 12px', background: 'var(--bad-bg)', color: 'var(--bad)', borderRadius: 6, fontSize: 12 }}>
                        ⚠ Bu misafir kara listede. {selectedGuestData.blacklistReason && `Neden: ${selectedGuestData.blacklistReason}`}
                      </div>
                    ) : (
                      <div style={{ marginTop: 14, padding: '10px 12px', background: 'var(--good-bg)', color: 'var(--good)', borderRadius: 6, fontSize: 12 }}>
                        ✓ Kara liste kontrolü: misafir kara listede değil.
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </>
        )}

        {/* Step 3: Room */}
        {step === 3 && (
          <>
            <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--accent-c)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 6 }}>Adım 3 · Oda</div>
            <h1 style={{ fontSize: 24, fontWeight: 600, letterSpacing: '-0.02em', margin: 0, marginBottom: 4, color: 'var(--text)' }}>Oda seçin</h1>
            <p style={{ fontSize: 13, color: 'var(--text-2)', margin: 0, marginBottom: 20 }}>Müsait temiz odalar listeleniyor. Seçilen tarihlere göre filtreleme ilerleyen sürümlerde aktif olacak.</p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {availableRooms.map(r => (
                <div
                  key={r.id}
                  onClick={() => setSelectedRoomId(r.id)}
                  style={{
                    background: selectedRoomId === r.id ? 'var(--accent-weak)' : 'var(--surface)',
                    border: `1px solid ${selectedRoomId === r.id ? 'var(--accent-c)' : 'var(--border-c)'}`,
                    borderRadius: 10, padding: '14px 16px', cursor: 'pointer', boxShadow: 'var(--shadow-sm)',
                    display: 'flex', alignItems: 'center', gap: 16,
                  }}
                >
                  <div style={{ width: 48, height: 48, borderRadius: 8, background: selectedRoomId === r.id ? 'var(--accent-c)' : 'var(--surface-2)', color: selectedRoomId === r.id ? 'var(--accent-fg)' : 'var(--text)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, fontWeight: 700, fontFamily: 'var(--font-mono)', flexShrink: 0 }}>
                    {r.number}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, fontSize: 14 }}>{r.roomTypeName}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-2)', marginTop: 2 }}>{r.capacity} kişi · {r.floor ? `Kat ${r.floor}` : '—'}</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontWeight: 600, fontSize: 15, fontFamily: 'var(--font-mono)' }}>{formatCurrency(r.basePrice)}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-3)' }}>/ gece</div>
                  </div>
                  {selectedRoomId === r.id && (
                    <div style={{ width: 20, height: 20, borderRadius: 999, background: 'var(--good)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><Check/></div>
                  )}
                </div>
              ))}
              {availableRooms.length === 0 && (
                <div style={{ padding: 24, textAlign: 'center', color: 'var(--text-3)', fontSize: 13, background: 'var(--surface)', border: '1px solid var(--border-c)', borderRadius: 10 }}>
                  Müsait oda bulunamadı. Farklı tarih seçmeyi deneyin.
                </div>
              )}
            </div>
          </>
        )}

        {/* Step 4: Confirm */}
        {step === 4 && (
          <>
            <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--accent-c)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 6 }}>Adım 4 · Onay</div>
            <h1 style={{ fontSize: 24, fontWeight: 600, letterSpacing: '-0.02em', margin: 0, marginBottom: 4, color: 'var(--text)' }}>Rezervasyonu onayla</h1>
            <p style={{ fontSize: 13, color: 'var(--text-2)', margin: 0, marginBottom: 20 }}>Bilgileri kontrol edin ve rezervasyonu oluşturun.</p>

            {/* Summary card */}
            <div style={{ background: 'var(--surface)', border: '1px solid var(--border-c)', borderRadius: 10, padding: 20, marginBottom: 16, boxShadow: 'var(--shadow-sm)' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
                {[
                  { k: 'Misafir', v: selectedGuestData ? `${selectedGuestData.firstName} ${selectedGuestData.lastName}` : '—' },
                  { k: 'Oda', v: selectedRoom ? `${selectedRoom.number} · ${selectedRoom.roomTypeName}` : '—' },
                  { k: 'Giriş', v: checkIn ? trDate(checkIn + 'T12:00:00') : '—' },
                  { k: 'Çıkış', v: checkOut ? trDate(checkOut + 'T12:00:00') : '—' },
                  { k: 'Gece', v: String(nights) },
                  { k: 'Kişi', v: `${adults} yetişkin${Number(children) ? ` + ${children} çocuk` : ''}` },
                ].map(({ k, v }) => (
                  <div key={k}>
                    <div style={{ fontSize: 11, color: 'var(--text-3)', marginBottom: 3 }}>{k}</div>
                    <div style={{ fontSize: 13, fontWeight: 500 }}>{v}</div>
                  </div>
                ))}
              </div>
              {pricePreview && (
                <div style={{ borderTop: '1px solid var(--border-c)', paddingTop: 14, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: 13, color: 'var(--text-2)' }}>{nights} gece toplam</span>
                  <span style={{ fontSize: 18, fontWeight: 600, fontFamily: 'var(--font-mono)' }}>{formatCurrency(pricePreview.totalPrice)}</span>
                </div>
              )}
            </div>

            {/* Notes */}
            <div style={{ background: 'var(--surface)', border: '1px solid var(--border-c)', borderRadius: 10, padding: 16, marginBottom: 16, boxShadow: 'var(--shadow-sm)' }}>
              <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 10 }}>Özel istekler / notlar</div>
              <textarea
                value={notes}
                onChange={e => setNotes(e.target.value)}
                rows={3}
                placeholder="Özel istekler, notlar…"
                style={{ width: '100%', padding: 10, border: '1px solid var(--border-c)', borderRadius: 6, background: 'var(--bg)', fontSize: 13, color: 'var(--text)', outline: 'none', fontFamily: 'inherit', resize: 'vertical', boxSizing: 'border-box' }}
              />
            </div>

            {error && (
              <div style={{ padding: '10px 14px', background: 'var(--bad-bg)', border: '1px solid var(--bad)', borderRadius: 6, color: 'var(--bad)', fontSize: 13, marginBottom: 16 }}>{error}</div>
            )}
          </>
        )}

        {/* Footer navigation */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 24, paddingTop: 18, borderTop: '1px solid var(--border-c)' }}>
          <button
            onClick={() => step > 1 ? setStep(s => s - 1) : router.back()}
            style={{ padding: '9px 20px', background: 'transparent', border: '1px solid var(--border-c)', borderRadius: 6, fontSize: 13, color: 'var(--text-2)', cursor: 'pointer' }}
          >
            ← Geri
          </button>
          <div style={{ display: 'flex', gap: 8 }}>
            {step < 4 ? (
              <button
                onClick={() => setStep(s => s + 1)}
                disabled={!canAdvance()}
                style={{ padding: '9px 24px', background: 'var(--accent-c)', color: 'var(--accent-fg)', border: 0, borderRadius: 6, fontSize: 13, fontWeight: 600, cursor: canAdvance() ? 'pointer' : 'not-allowed', opacity: canAdvance() ? 1 : 0.5 }}
              >
                Devam →
              </button>
            ) : (
              <button
                onClick={handleCreate}
                disabled={createMutation.isPending}
                style={{ padding: '9px 24px', background: 'var(--accent-c)', color: 'var(--accent-fg)', border: 0, borderRadius: 6, fontSize: 13, fontWeight: 600, cursor: createMutation.isPending ? 'not-allowed' : 'pointer', opacity: createMutation.isPending ? 0.6 : 1 }}
              >
                {createMutation.isPending ? 'Kaydediliyor…' : 'Rezervasyon Oluştur'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
