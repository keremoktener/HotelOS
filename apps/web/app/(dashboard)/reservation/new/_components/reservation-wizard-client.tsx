'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { AlertTriangle } from 'lucide-react'
import { trpc } from '@/lib/trpc/client'
import { trDate, displayCurrency as formatCurrency } from '@/lib/utils'
import { Chip } from '@/components/ui/chip'
import { Avatar } from '@/components/ui/avatar'

function Check() { return <svg width={11} height={11} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3}><polyline points="20 6 9 17 4 12"/></svg> }

const ROOM_STATUS: Record<string, { label: string; color: string; bg: string; selectable: boolean }> = {
  CLEAN:  { label: 'Müsait',  color: 'var(--good)', bg: 'var(--good-bg)',  selectable: true },
  DIRTY:  { label: 'Kirli',   color: 'var(--warn)', bg: 'var(--warn-bg)',  selectable: false },
  FAULTY: { label: 'Arızalı', color: 'var(--bad)',  bg: 'var(--bad-bg)',   selectable: false },
  DND:    { label: 'DND',     color: 'var(--info)', bg: 'var(--info-bg)',  selectable: false },
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
      <input type={type} value={value} onChange={e => onChange(e.target.value)} min={min}
        style={{ width: '100%', height: 36, padding: '0 10px', background: 'var(--surface)', border: '1px solid var(--border-c)', borderRadius: 6, fontSize: 13, color: 'var(--text)', outline: 'none', boxSizing: 'border-box' }}/>
    </div>
  )
}

interface AvailableRoom {
  id: string; number: string; floor: number | null; status: string
  roomTypeId: string; roomTypeName: string; capacity: number; basePrice: number
}

interface Props { availableRooms: AvailableRoom[]; initialGuestId?: string }

const STEPS = [
  { n: 1, title: 'Misafir' },
  { n: 2, title: 'Tarih & misafir sayısı' },
  { n: 3, title: 'Oda seçimi' },
  { n: 4, title: 'Fiyat & onay' },
]

export function ReservationWizardClient({ availableRooms, initialGuestId }: Props) {
  const router = useRouter()

  const [step, setStep] = useState(initialGuestId ? 2 : 1)

  // Step 1
  const [checkIn, setCheckIn]   = useState('')
  const [checkOut, setCheckOut] = useState('')
  const [adults, setAdults]     = useState('2')
  const [children, setChildren] = useState('0')

  // Step 2
  const [guestQuery, setGuestQuery]         = useState('')
  const [selectedGuestId, setSelectedGuestId] = useState<string | null>(initialGuestId ?? null)
  const [showPopover, setShowPopover]       = useState(false)

  // Step 3 — room picking with type+floor filter
  const [filterTypeId, setFilterTypeId]   = useState('')
  const [filterFloor, setFilterFloor]     = useState<number | null>(null)
  const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null)

  // Step 4
  const [notes, setNotes]               = useState('')
  const [discountPct, setDiscountPct]   = useState('0')
  const [discountReason, setDiscountReason] = useState('')
  const [error, setError]               = useState<string | null>(null)

  const nights = checkIn && checkOut
    ? Math.round((new Date(checkOut).getTime() - new Date(checkIn).getTime()) / 86400000)
    : 0

  // Derived room type list
  const roomTypes = Array.from(
    new Map(availableRooms.map(r => [r.roomTypeId, { id: r.roomTypeId, name: r.roomTypeName }])).values()
  )

  // Derived floors for selected type
  const floorsForType = filterTypeId
    ? Array.from(new Set(
        availableRooms
          .filter(r => r.roomTypeId === filterTypeId && r.floor != null)
          .map(r => r.floor as number)
      )).sort((a, b) => a - b)
    : []

  // Auto-select floor when only one exists for this type
  useEffect(() => {
    if (floorsForType.length === 1) setFilterFloor(floorsForType[0])
    else if (floorsForType.length === 0) setFilterFloor(null)
  }, [filterTypeId])

  // Rooms to display in grid
  const filteredRooms = availableRooms.filter(r => {
    if (!filterTypeId) return false
    if (r.roomTypeId !== filterTypeId) return false
    if (filterFloor !== null && r.floor !== filterFloor) return false
    return true
  })

  const { data: guests } = trpc.guest.search.useQuery(
    { query: guestQuery },
    { enabled: guestQuery.length >= 2 },
  )
  const { data: selectedGuestData } = trpc.guest.get.useQuery(
    { id: selectedGuestId! },
    { enabled: !!selectedGuestId },
  )
  const { data: pricePreview } = trpc.reservation.pricePreview.useQuery(
    { guestCount: Number(adults) + Number(children), checkIn: new Date(checkIn), checkOut: new Date(checkOut), roomId: selectedRoomId ?? undefined },
    { enabled: !!(checkIn && checkOut && nights > 0) },
  )

  const selectedRoom = availableRooms.find(r => r.id === selectedRoomId)

  // Price: prefer server preview, fall back to room basePrice × nights
  const baseTotal = (pricePreview?.totalPrice ?? 0) > 0
    ? pricePreview!.totalPrice
    : (selectedRoom ? selectedRoom.basePrice * nights : 0)
  const discountAmount = Math.round(baseTotal * Number(discountPct) / 100)
  const finalTotal = baseTotal - discountAmount

  const createMutation = trpc.reservation.create.useMutation({
    onSuccess: (data) => router.push(`/reservation/${data.id}`),
    onError: (err) => setError(err.message),
  })

  function handleCreate() {
    if (!selectedGuestId || !selectedRoomId || !checkIn || !checkOut) {
      setError('Lütfen tüm zorunlu alanları doldurun.')
      return
    }
    if (Number(discountPct) > 0 && !discountReason.trim()) {
      setError('İndirim nedeni zorunludur.')
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
      discountPct: Number(discountPct),
      discountReason: discountReason.trim() || undefined,
    })
  }

  function canAdvance() {
    if (step === 1) return !!selectedGuestId
    if (step === 2) return !!(checkIn && checkOut && nights > 0 && Number(adults) >= 1)
    if (step === 3) return !!selectedRoomId
    return true
  }

  const sel: React.CSSProperties = { width: '100%', height: 36, padding: '0 10px', background: 'var(--surface)', border: '1px solid var(--border-c)', borderRadius: 6, fontSize: 13, color: 'var(--text)', outline: 'none', boxSizing: 'border-box' }

  return (
    <div style={{ height: 'calc(100% - 56px)', display: 'flex', flexDirection: 'column' }}>
      <div style={{ flex: 1, overflowY: 'auto', padding: 24, display: 'flex', gap: 20 }}>
      {/* Step rail */}
      <div style={{ width: 220, flexShrink: 0 }}>
        <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--text-3)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 10 }}>Adım {step} / 4</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {STEPS.map(s => (
            <div key={s.n} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 10px', borderRadius: 6, background: s.n === step ? 'var(--accent-weak)' : 'transparent' }}>
              <div style={{ width: 20, height: 20, borderRadius: 999, flexShrink: 0, background: s.n < step ? 'var(--good)' : s.n === step ? 'var(--accent-c)' : 'var(--surface-2)', color: s.n <= step ? 'var(--accent-fg)' : 'var(--text-3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 600 }}>
                {s.n < step ? <Check/> : s.n}
              </div>
              <div style={{ fontSize: 12, fontWeight: s.n === step ? 600 : 450, color: s.n === step ? 'var(--text)' : s.n < step ? 'var(--text-2)' : 'var(--text-3)' }}>{s.title}</div>
            </div>
          ))}
        </div>
        <div style={{ marginTop: 16, padding: 12, background: 'var(--surface)', border: '1px solid var(--border-c)', borderRadius: 8 }}>
          <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--text-3)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 8 }}>Özet</div>
          <SumRow k="Giriş"  v={checkIn  ? trDate(checkIn  + 'T12:00:00') : '—'} mono/>
          <SumRow k="Çıkış"  v={checkOut ? trDate(checkOut + 'T12:00:00') : '—'} mono/>
          <SumRow k="Gece"   v={nights > 0 ? String(nights) : '—'} mono/>
          <SumRow k="Yetişkin" v={adults}/>
          <SumRow k="Çocuk" v={children}/>
          <div style={{ height: 1, background: 'var(--border-c)', margin: '8px 0' }}/>
          <SumRow k="Misafir" v={selectedGuestData ? `${selectedGuestData.firstName} ${selectedGuestData.lastName}` : '—'} muted={!selectedGuestData}/>
          <SumRow k="Oda" v={selectedRoom ? selectedRoom.number : '—'} muted={!selectedRoom}/>
          {baseTotal > 0 && <SumRow k="Toplam" v={formatCurrency(finalTotal)}/>}
        </div>
      </div>

      {/* Main panel */}
      <div style={{ flex: 1, maxWidth: 780 }}>

        {/* ── Step 1: Guest ── */}
        {step === 1 && (
          <>
            <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--accent-c)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 6 }}>Adım 1 · Misafir</div>
            <h1 style={{ fontSize: 24, fontWeight: 600, letterSpacing: '-0.02em', margin: '0 0 4px', color: 'var(--text)' }}>Misafiri seçin veya ekleyin</h1>
            <p style={{ fontSize: 13, color: 'var(--text-2)', margin: '0 0 20px' }}>Mevcut misafiri arayın. KBS bildirimi için TC / pasaport bilgisi zorunludur.</p>

            {!selectedGuestId && (
              <div style={{ position: 'relative', marginBottom: 14 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, height: 40, padding: '0 12px', background: 'var(--surface)', border: '1px solid var(--accent-c)', boxShadow: '0 0 0 3px var(--accent-weak)', borderRadius: 6 }}>
                  <svg width={15} height={15} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
                  <input value={guestQuery} onChange={e => { setGuestQuery(e.target.value); setShowPopover(true) }} onFocus={() => setShowPopover(true)} placeholder="Ad, soyad, TC, telefon veya e-posta" style={{ flex: 1, border: 0, background: 'transparent', outline: 'none', color: 'var(--text)', fontSize: 14 }} autoFocus/>
                </div>
                {showPopover && guests && guests.length > 0 && (
                  <div style={{ position: 'absolute', top: 46, left: 0, right: 0, background: 'var(--surface)', border: '1px solid var(--border-c)', borderRadius: 10, boxShadow: '0 12px 40px rgba(0,0,0,0.15)', zIndex: 20, overflow: 'hidden' }}>
                    <div style={{ padding: '8px 14px', fontSize: 10, fontWeight: 600, color: 'var(--text-3)', letterSpacing: '0.08em', textTransform: 'uppercase', background: 'var(--surface-2)' }}>{guests.length} eşleşme</div>
                    {guests.map((g, i) => (
                      <div key={g.id} onClick={() => { setSelectedGuestId(g.id); setShowPopover(false); setGuestQuery('') }}
                        style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', borderTop: i ? '1px solid var(--border-c)' : '0', cursor: 'pointer' }}
                        onMouseEnter={e => (e.currentTarget.style.background = 'var(--accent-weak)')}
                        onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                        <Avatar initials={`${g.firstName[0] ?? ''}${g.lastName[0] ?? ''}`}/>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: 13, fontWeight: 600 }}>{g.firstName} {g.lastName}</div>
                          <div style={{ fontSize: 11, color: 'var(--text-2)' }}>{g.phone}</div>
                        </div>
                        {g.blacklisted && <Chip tone="bad">Kara liste</Chip>}
                      </div>
                    ))}
                    <div onClick={() => router.push(`/guests/new?return=/reservation/new`)}
                      style={{ borderTop: '1px solid var(--border-c)', padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 10, fontSize: 12, color: 'var(--text-2)', cursor: 'pointer' }}
                      onMouseEnter={e => (e.currentTarget.style.background = 'var(--surface-2)')}
                      onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
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
                  <Avatar initials={`${selectedGuestData.firstName[0] ?? ''}${selectedGuestData.lastName[0] ?? ''}`} size={52}/>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                      <div style={{ fontSize: 16, fontWeight: 600 }}>{selectedGuestData.firstName} {selectedGuestData.lastName}</div>
                      {selectedGuestData.blacklisted && <Chip tone="bad">Kara liste</Chip>}
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--text-2)' }}>{selectedGuestData.phone} · {selectedGuestData.email}</div>
                    {selectedGuestData.blacklisted ? (
                      <div style={{ marginTop: 12, padding: '8px 12px', background: 'var(--bad-bg)', color: 'var(--bad)', borderRadius: 6, fontSize: 12, display: 'flex', alignItems: 'center', gap: 6 }}><AlertTriangle size={13} style={{ flexShrink: 0 }}/>Kara liste{selectedGuestData.blacklistReason ? `: ${selectedGuestData.blacklistReason}` : ''}</div>
                    ) : (
                      <div style={{ marginTop: 12, padding: '8px 12px', background: 'var(--good-bg)', color: 'var(--good)', borderRadius: 6, fontSize: 12 }}>✓ Kara liste kontrolü temiz</div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </>
        )}

        {/* ── Step 2: Dates ── */}
        {step === 2 && (
          <>
            <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--accent-c)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 6 }}>Adım 2 · Tarih & Kişi</div>
            <h1 style={{ fontSize: 24, fontWeight: 600, letterSpacing: '-0.02em', margin: '0 0 4px', color: 'var(--text)' }}>Tarih ve kişi sayısını seçin</h1>
            <p style={{ fontSize: 13, color: 'var(--text-2)', margin: '0 0 24px' }}>Giriş ve çıkış tarihlerini ve misafir sayısını belirleyin.</p>
            <div style={{ background: 'var(--surface)', border: '1px solid var(--border-c)', borderRadius: 10, padding: 20, marginBottom: 16, boxShadow: 'var(--shadow-sm)' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
                <Field label="Giriş tarihi"  value={checkIn}  onChange={setCheckIn}  type="date"/>
                <Field label="Çıkış tarihi"  value={checkOut} onChange={setCheckOut} type="date" min={checkIn}/>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <Field label="Yetişkin sayısı" value={adults}   onChange={setAdults}   type="number" min={1}/>
                <Field label="Çocuk sayısı"    value={children} onChange={setChildren} type="number" min={0}/>
              </div>
              {nights > 0 && <div style={{ marginTop: 14, padding: '10px 14px', background: 'var(--info-bg)', borderRadius: 6, fontSize: 12, color: 'var(--info)' }}><b>{nights} gece</b> · {checkIn} → {checkOut}</div>}
            </div>
          </>
        )}

        {/* ── Step 3: Room ── */}
        {step === 3 && (
          <>
            <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--accent-c)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 6 }}>Adım 3 · Oda</div>
            <h1 style={{ fontSize: 24, fontWeight: 600, letterSpacing: '-0.02em', margin: '0 0 4px', color: 'var(--text)' }}>Oda seçin</h1>
            <p style={{ fontSize: 13, color: 'var(--text-2)', margin: '0 0 20px' }}>Önce oda tipini seçin, ardından kat ve oda numarasını belirleyin.</p>

            {/* Type + Floor filters */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
              <div>
                <div style={{ fontSize: 11, color: 'var(--text-3)', fontWeight: 500, marginBottom: 5 }}>Oda tipi</div>
                <select value={filterTypeId} onChange={e => { setFilterTypeId(e.target.value); setSelectedRoomId(null) }} style={sel}>
                  <option value="">Seçin…</option>
                  {roomTypes.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                </select>
              </div>
              <div>
                <div style={{ fontSize: 11, color: 'var(--text-3)', fontWeight: 500, marginBottom: 5 }}>Kat</div>
                <select
                  value={filterFloor ?? ''}
                  onChange={e => { setFilterFloor(e.target.value === '' ? null : Number(e.target.value)); setSelectedRoomId(null) }}
                  style={{ ...sel, opacity: !filterTypeId ? 0.5 : 1 }}
                  disabled={!filterTypeId}
                >
                  <option value="">{floorsForType.length === 0 ? '—' : 'Tüm katlar'}</option>
                  {floorsForType.map(f => <option key={f} value={f}>Kat {f}</option>)}
                </select>
              </div>
            </div>

            {/* Room grid */}
            {!filterTypeId && (
              <div style={{ padding: 24, textAlign: 'center', color: 'var(--text-3)', fontSize: 13, background: 'var(--surface)', border: '1px solid var(--border-c)', borderRadius: 10 }}>
                Oda tipini seçerek odaları görüntüleyin.
              </div>
            )}

            {filterTypeId && filteredRooms.length === 0 && (
              <div style={{ padding: 24, textAlign: 'center', color: 'var(--text-3)', fontSize: 13, background: 'var(--surface)', border: '1px solid var(--border-c)', borderRadius: 10 }}>
                Bu filtre için oda bulunamadı.
              </div>
            )}

            {filterTypeId && filteredRooms.length > 0 && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', gap: 10 }}>
                {filteredRooms.map(r => {
                  const meta = ROOM_STATUS[r.status] ?? ROOM_STATUS.CLEAN
                  const isSelected = selectedRoomId === r.id
                  return (
                    <div
                      key={r.id}
                      onClick={() => meta.selectable && setSelectedRoomId(r.id)}
                      style={{
                        position: 'relative', borderRadius: 10, padding: '12px 10px 10px',
                        border: `1px solid ${isSelected ? 'var(--accent-c)' : 'var(--border-c)'}`,
                        background: isSelected ? 'var(--accent-weak)' : 'var(--surface)',
                        cursor: meta.selectable ? 'pointer' : 'not-allowed',
                        opacity: meta.selectable ? 1 : 0.55,
                        textAlign: 'center',
                      }}
                    >
                      {isSelected && <div style={{ position: 'absolute', top: 6, right: 6, width: 16, height: 16, borderRadius: 999, background: 'var(--good)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Check/></div>}
                      <div style={{ fontSize: 20, fontWeight: 700, fontFamily: 'var(--font-mono)', color: isSelected ? 'var(--accent-c)' : 'var(--text)', marginBottom: 6 }}>{r.number}</div>
                      <div style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '2px 6px', borderRadius: 999, fontSize: 10, fontWeight: 500, background: meta.bg, color: meta.color }}>{meta.label}</div>
                      <div style={{ fontSize: 10, color: 'var(--text-3)', marginTop: 5 }}>{formatCurrency(r.basePrice)}</div>
                    </div>
                  )
                })}
              </div>
            )}
          </>
        )}

        {/* ── Step 4: Confirm ── */}
        {step === 4 && (
          <>
            <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--accent-c)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 6 }}>Adım 4 · Onay</div>
            <h1 style={{ fontSize: 24, fontWeight: 600, letterSpacing: '-0.02em', margin: '0 0 4px', color: 'var(--text)' }}>Rezervasyonu onayla</h1>
            <p style={{ fontSize: 13, color: 'var(--text-2)', margin: '0 0 20px' }}>Bilgileri kontrol edin ve rezervasyonu oluşturun.</p>

            <div style={{ background: 'var(--surface)', border: '1px solid var(--border-c)', borderRadius: 10, padding: 20, marginBottom: 14, boxShadow: 'var(--shadow-sm)' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 16 }}>
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
              <div style={{ borderTop: '1px solid var(--border-c)', paddingTop: 14 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                  <span style={{ fontSize: 12, color: 'var(--text-3)' }}>{nights} gece × {formatCurrency(selectedRoom?.basePrice ?? 0)}</span>
                  <span style={{ fontSize: 14, fontWeight: 500 }}>{formatCurrency(baseTotal)}</span>
                </div>
                {Number(discountPct) > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                    <span style={{ fontSize: 12, color: 'var(--warn)' }}>İndirim (%{discountPct})</span>
                    <span style={{ fontSize: 14, color: 'var(--warn)' }}>−{formatCurrency(discountAmount)}</span>
                  </div>
                )}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 8, borderTop: '1px solid var(--border-c)' }}>
                  <span style={{ fontSize: 13, fontWeight: 600 }}>Toplam</span>
                  <span style={{ fontSize: 20, fontWeight: 700, fontFamily: 'var(--font-mono)' }}>{formatCurrency(finalTotal)}</span>
                </div>
              </div>
            </div>

            {/* Discount */}
            <div style={{ background: 'var(--surface)', border: '1px solid var(--border-c)', borderRadius: 10, padding: 16, marginBottom: 14, boxShadow: 'var(--shadow-sm)' }}>
              <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 12 }}>İndirim</div>
              <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr', gap: 12, alignItems: 'start' }}>
                <div>
                  <div style={{ fontSize: 11, color: 'var(--text-3)', marginBottom: 5, fontWeight: 500 }}>İndirim oranı (%)</div>
                  <input type="number" min="0" max="100" value={discountPct} onChange={e => setDiscountPct(e.target.value)}
                    style={{ width: '100%', height: 36, padding: '0 10px', background: 'var(--bg)', border: '1px solid var(--border-c)', borderRadius: 6, fontSize: 13, color: 'var(--text)', outline: 'none', boxSizing: 'border-box' }}/>
                </div>
                <div>
                  <div style={{ fontSize: 11, color: 'var(--text-3)', marginBottom: 5, fontWeight: 500 }}>
                    İndirim nedeni{Number(discountPct) > 0 ? <span style={{ color: 'var(--bad)', marginLeft: 2 }}>*</span> : ''}
                  </div>
                  <input value={discountReason} onChange={e => setDiscountReason(e.target.value)}
                    placeholder={Number(discountPct) > 0 ? 'Zorunlu — indirim gerekçesini yazın' : 'İndirim uygulanırsa doldurulur'}
                    style={{ width: '100%', height: 36, padding: '0 10px', background: 'var(--bg)', border: `1px solid ${Number(discountPct) > 0 && !discountReason.trim() ? 'var(--warn)' : 'var(--border-c)'}`, borderRadius: 6, fontSize: 13, color: 'var(--text)', outline: 'none', boxSizing: 'border-box' }}/>
                </div>
              </div>
            </div>

            {/* Notes */}
            <div style={{ background: 'var(--surface)', border: '1px solid var(--border-c)', borderRadius: 10, padding: 16, marginBottom: 14, boxShadow: 'var(--shadow-sm)' }}>
              <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 10 }}>Özel istekler / notlar</div>
              <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={3} placeholder="Özel istekler, notlar…"
                style={{ width: '100%', padding: 10, border: '1px solid var(--border-c)', borderRadius: 6, background: 'var(--bg)', fontSize: 13, color: 'var(--text)', outline: 'none', fontFamily: 'inherit', resize: 'vertical', boxSizing: 'border-box' }}/>
            </div>

            {error && <div style={{ padding: '10px 14px', background: 'var(--bad-bg)', border: '1px solid var(--bad)', borderRadius: 6, color: 'var(--bad)', fontSize: 13, marginBottom: 16 }}>{error}</div>}
          </>
        )}

      </div>
      </div>

      {/* Footer bar — outside scroll area, always visible */}
      <div style={{ flexShrink: 0, display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 24px', borderTop: '1px solid var(--border-c)', background: 'var(--surface)' }}>
        <button onClick={() => step > 1 ? setStep(s => s - 1) : router.back()} style={{ padding: '9px 20px', background: 'transparent', border: '1px solid var(--border-c)', borderRadius: 6, fontSize: 13, color: 'var(--text-2)', cursor: 'pointer' }}>
          ← Geri
        </button>
        {step < 4 ? (
          <button onClick={() => setStep(s => s + 1)} disabled={!canAdvance()} style={{ padding: '9px 24px', background: 'var(--accent-c)', color: 'var(--accent-fg)', border: 0, borderRadius: 6, fontSize: 13, fontWeight: 600, cursor: canAdvance() ? 'pointer' : 'not-allowed', opacity: canAdvance() ? 1 : 0.5 }}>
            Devam →
          </button>
        ) : (
          <button onClick={handleCreate} disabled={createMutation.isPending} style={{ padding: '9px 24px', background: 'var(--accent-c)', color: 'var(--accent-fg)', border: 0, borderRadius: 6, fontSize: 13, fontWeight: 600, cursor: createMutation.isPending ? 'not-allowed' : 'pointer', opacity: createMutation.isPending ? 0.6 : 1 }}>
            {createMutation.isPending ? 'Kaydediliyor…' : 'Rezervasyon Oluştur'}
          </button>
        )}
      </div>
    </div>
  )
}
