'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useOrganization, useUser } from '@clerk/nextjs'

const STEPS = [
  { n: 1, title: 'Otel bilgileri' },
  { n: 2, title: 'Oda tipleri' },
  { n: 3, title: 'Odalar & katlar' },
  { n: 4, title: 'Operasyon kuralları', soon: true },
  { n: 5, title: 'Kanal & fiyatlar', soon: true },
  { n: 6, title: 'Ekip & yetkiler', soon: true },
]

interface RoomTypeDraft { id: string; name: string; capacity: number; basePrice: number }
interface RoomDraft { id: string; number: string; floor: number | undefined; typeDraftId: string }

function uid() { return Math.random().toString(36).slice(2) }
function Check() {
  return <svg width={11} height={11} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3}><polyline points="20 6 9 17 4 12"/></svg>
}
function Pencil() {
  return <svg width={12} height={12} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
}

const inp: React.CSSProperties = {
  padding: '7px 10px', border: '1px solid var(--border-c)', borderRadius: 6,
  fontSize: 13, background: 'var(--bg)', color: 'var(--text)', outline: 'none',
  boxSizing: 'border-box', width: '100%',
}
function SL({ children }: { children: React.ReactNode }) {
  return <div style={{ fontSize: 11, color: 'var(--text-3)', marginBottom: 4, fontWeight: 500 }}>{children}</div>
}

export default function OnboardingPage() {
  const { user } = useUser()
  const { organization } = useOrganization()
  const router = useRouter()

  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Step 1
  const [hotelName, setHotelName] = useState(organization?.name ?? '')

  // Step 2 — room types
  const [roomTypes, setRoomTypes] = useState<RoomTypeDraft[]>([])
  const [typeName, setTypeName] = useState('')
  const [typeCap, setTypeCap] = useState('2')
  const [typePrice, setTypePrice] = useState('')
  // Inline edit state
  const [editingTypeId, setEditingTypeId] = useState<string | null>(null)
  const [editName, setEditName] = useState('')
  const [editCap, setEditCap] = useState('')
  const [editPrice, setEditPrice] = useState('')

  // Step 3 — rooms
  const [rooms, setRooms] = useState<RoomDraft[]>([])
  const [bulkFrom, setBulkFrom] = useState('')
  const [bulkTo, setBulkTo] = useState('')
  const [bulkFloor, setBulkFloor] = useState('')
  const [bulkType, setBulkType] = useState('')
  const [singleNum, setSingleNum] = useState('')
  const [singleFloor, setSingleFloor] = useState('')
  const [singleType, setSingleType] = useState('')
  const [bulkSkipped, setBulkSkipped] = useState(0)
  // Bulk edit selection
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [beFloor, setBeFloor] = useState('')
  const [beType, setBeType] = useState('')

  // ── Room type handlers ──────────────────────────────────────────────────────
  const isDuplicate = typeName.trim() !== '' &&
    roomTypes.some(rt => rt.name.toLowerCase() === typeName.trim().toLowerCase())

  function addRoomType() {
    if (!typeName.trim() || !typePrice || isDuplicate) return
    setRoomTypes(p => [...p, { id: uid(), name: typeName.trim(), capacity: Number(typeCap), basePrice: Math.round(Number(typePrice) * 100) }])
    setTypeName(''); setTypeCap('2'); setTypePrice('')
  }

  function startEdit(rt: RoomTypeDraft) {
    setEditingTypeId(rt.id)
    setEditName(rt.name)
    setEditCap(String(rt.capacity))
    setEditPrice(String(rt.basePrice / 100))
  }

  function saveEdit() {
    if (!editName.trim() || !editPrice) return
    setRoomTypes(p => p.map(rt => rt.id === editingTypeId
      ? { ...rt, name: editName.trim(), capacity: Number(editCap), basePrice: Math.round(Number(editPrice) * 100) }
      : rt
    ))
    setEditingTypeId(null)
  }

  // ── Room handlers ───────────────────────────────────────────────────────────
  function bulkGenerate() {
    const from = parseInt(bulkFrom), to = parseInt(bulkTo)
    if (isNaN(from) || isNaN(to) || from > to || !bulkType) return
    const pad = bulkFrom.length
    const added: RoomDraft[] = []
    for (let i = from; i <= to; i++) {
      const num = String(i).padStart(pad, '0')
      if (!rooms.find(r => r.number === num))
        added.push({ id: uid(), number: num, floor: bulkFloor ? Number(bulkFloor) : undefined, typeDraftId: bulkType })
    }
    setRooms(p => [...p, ...added])
    setBulkSkipped(to - from + 1 - added.length)
    setBulkFrom(''); setBulkTo(''); setBulkFloor('')
  }

  function addSingleRoom() {
    if (!singleNum.trim() || !singleType || rooms.find(r => r.number === singleNum.trim())) return
    setRooms(p => [...p, { id: uid(), number: singleNum.trim(), floor: singleFloor ? Number(singleFloor) : undefined, typeDraftId: singleType }])
    setSingleNum(''); setSingleFloor('')
  }

  function toggleSelect(id: string) {
    setSelected(prev => { const s = new Set(prev); s.has(id) ? s.delete(id) : s.add(id); return s })
  }

  function applyBulkEdit() {
    setRooms(p => p.map(r => {
      if (!selected.has(r.id)) return r
      return {
        ...r,
        floor: beFloor !== '' ? Number(beFloor) : r.floor,
        typeDraftId: beType || r.typeDraftId,
      }
    }))
    setSelected(new Set()); setBeFloor(''); setBeType('')
  }

  // ── Complete ────────────────────────────────────────────────────────────────
  async function handleComplete() {
    setLoading(true); setError('')
    try {
      const res = await fetch('/api/onboarding/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          roomTypes: roomTypes.map(rt => ({ name: rt.name, capacity: rt.capacity, basePrice: rt.basePrice })),
          rooms: rooms.map(r => ({
            number: r.number,
            floor: r.floor,
            typeName: roomTypes.find(t => t.id === r.typeDraftId)?.name ?? '',
          })),
        }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error((data as { error?: string }).error ?? `HTTP ${res.status}`)
      }
      router.push('/')
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Bir hata oluştu')
      setLoading(false)
    }
  }

  // ── Sidebar ─────────────────────────────────────────────────────────────────
  const sidebar = (
    <div style={{ width: 260, borderRight: '1px solid var(--border-c)', background: 'var(--surface)', padding: 20, flexShrink: 0, overflowY: 'auto' }}>
      <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--text-3)', letterSpacing: '0.08em', marginBottom: 12, textTransform: 'uppercase' }}>Adım {Math.min(step, 3)} / 3</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        {STEPS.map(s => {
          const done = s.n < step && !s.soon
          const active = s.n === step
          return (
            <div key={s.n} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 8px', borderRadius: 6, background: active ? 'var(--accent-weak)' : 'transparent', opacity: s.soon ? 0.45 : 1 }}>
              <div style={{ width: 22, height: 22, borderRadius: 999, flexShrink: 0, background: done ? 'var(--good)' : active ? 'var(--accent-c)' : 'var(--surface-2)', color: done ? '#fff' : active ? 'var(--accent-fg)' : 'var(--text-3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 600 }}>
                {done ? <Check/> : s.n}
              </div>
              <div style={{ flex: 1, fontSize: 13, fontWeight: active ? 600 : 450, color: active ? 'var(--text)' : done ? 'var(--text-2)' : 'var(--text-3)' }}>{s.title}</div>
              {s.soon && <span style={{ fontSize: 10, color: 'var(--text-3)' }}>Yakında</span>}
            </div>
          )
        })}
      </div>
    </div>
  )

  const nav = (onNext: () => void, nextLabel = 'İleri →', canNext = true) => (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 20, borderTop: '1px solid var(--border-c)', marginTop: 8 }}>
      {step > 1 ? <button onClick={() => setStep(s => s - 1)} style={{ padding: '8px 16px', background: 'var(--surface-2)', border: '1px solid var(--border-c)', borderRadius: 6, fontSize: 13, color: 'var(--text-2)', cursor: 'pointer' }}>← Geri</button> : <span/>}
      <button onClick={onNext} disabled={!canNext} style={{ padding: '10px 24px', background: 'var(--accent-c)', color: 'var(--accent-fg)', border: 0, borderRadius: 6, fontSize: 13, fontWeight: 600, cursor: canNext ? 'pointer' : 'not-allowed', opacity: canNext ? 1 : 0.5 }}>{nextLabel}</button>
    </div>
  )

  let panel: React.ReactNode

  // ── Step 1 ──────────────────────────────────────────────────────────────────
  if (step === 1) panel = (
    <>
      <h1 style={{ fontSize: 26, fontWeight: 700, letterSpacing: '-0.02em', margin: '0 0 6px', color: 'var(--text)' }}>Otele Hoş Geldiniz</h1>
      <p style={{ fontSize: 14, color: 'var(--text-2)', margin: '0 0 28px', lineHeight: 1.6 }}>Birkaç adımda HotelOS'i yapılandırın.</p>
      <div style={{ background: 'var(--surface)', border: '1px solid var(--border-c)', borderRadius: 10, padding: 20, marginBottom: 28 }}>
        <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 14 }}>Otel bilgileri</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div><SL>Otel adı</SL><input value={hotelName} onChange={e => setHotelName(e.target.value)} style={inp} placeholder="Otel adı"/></div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div><SL>Organizasyon</SL><div style={{ height: 34, padding: '0 10px', background: 'var(--surface-2)', border: '1px solid var(--border-c)', borderRadius: 6, fontSize: 13, color: 'var(--text-2)', display: 'flex', alignItems: 'center' }}>{organization?.name ?? '—'}</div></div>
            <div><SL>Yönetici</SL><div style={{ height: 34, padding: '0 10px', background: 'var(--surface-2)', border: '1px solid var(--border-c)', borderRadius: 6, fontSize: 13, color: 'var(--text-2)', display: 'flex', alignItems: 'center' }}>{user?.fullName ?? '—'}</div></div>
          </div>
        </div>
      </div>
      {nav(() => setStep(2))}
    </>
  )

  // ── Step 2 ──────────────────────────────────────────────────────────────────
  if (step === 2) panel = (
    <>
      <h1 style={{ fontSize: 26, fontWeight: 700, letterSpacing: '-0.02em', margin: '0 0 6px', color: 'var(--text)' }}>Oda Tipleri</h1>
      <p style={{ fontSize: 14, color: 'var(--text-2)', margin: '0 0 24px', lineHeight: 1.6 }}>Otelinizde bulunan oda kategorilerini tanımlayın.</p>

      <div style={{ background: 'var(--surface)', border: '1px solid var(--border-c)', borderRadius: 10, padding: 16, marginBottom: 12 }}>
        <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 12 }}>Yeni tip ekle</div>
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 80px 110px auto', gap: 8, alignItems: 'end' }}>
          <div>
            <SL>Tip adı</SL>
            <input value={typeName} onChange={e => setTypeName(e.target.value)} style={{ ...inp, borderColor: isDuplicate ? 'var(--warn)' : 'var(--border-c)' }} placeholder="Standart, Deluxe, Suite…" onKeyDown={e => e.key === 'Enter' && addRoomType()}/>
            {isDuplicate && <div style={{ fontSize: 11, color: 'var(--warn)', marginTop: 3 }}>Bu isimde bir tip zaten mevcut</div>}
          </div>
          <div><SL>Kapasite</SL><input value={typeCap} onChange={e => setTypeCap(e.target.value)} style={inp} type="number" min="1" max="20"/></div>
          <div><SL>Gecelik (₺)</SL><input value={typePrice} onChange={e => setTypePrice(e.target.value)} style={inp} type="number" min="0" placeholder="2500" onKeyDown={e => e.key === 'Enter' && addRoomType()}/></div>
          <button onClick={addRoomType} disabled={!typeName.trim() || !typePrice || isDuplicate} style={{ padding: '7px 14px', background: 'var(--accent-c)', color: 'var(--accent-fg)', border: 0, borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: 'pointer', opacity: (!typeName.trim() || !typePrice || isDuplicate) ? 0.5 : 1 }}>Ekle</button>
        </div>
      </div>

      {roomTypes.length > 0 && (
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border-c)', borderRadius: 10, overflow: 'hidden', marginBottom: 24 }}>
          {roomTypes.map((rt, i) => editingTypeId === rt.id ? (
            <div key={rt.id} style={{ display: 'grid', gridTemplateColumns: '2fr 80px 110px auto', gap: 8, padding: '10px 14px', borderTop: i > 0 ? '1px solid var(--border-c)' : 'none', alignItems: 'center', background: 'var(--accent-weak)' }}>
              <input value={editName} onChange={e => setEditName(e.target.value)} style={inp} autoFocus onKeyDown={e => e.key === 'Enter' && saveEdit()}/>
              <input value={editCap} onChange={e => setEditCap(e.target.value)} style={inp} type="number" min="1" max="20"/>
              <input value={editPrice} onChange={e => setEditPrice(e.target.value)} style={inp} type="number" min="0" onKeyDown={e => e.key === 'Enter' && saveEdit()}/>
              <div style={{ display: 'flex', gap: 4 }}>
                <button onClick={saveEdit} style={{ padding: '5px 10px', background: 'var(--good)', color: '#fff', border: 0, borderRadius: 4, fontSize: 11, fontWeight: 600, cursor: 'pointer' }}>✓</button>
                <button onClick={() => setEditingTypeId(null)} style={{ padding: '5px 10px', background: 'var(--surface-2)', border: '1px solid var(--border-c)', borderRadius: 4, fontSize: 11, cursor: 'pointer', color: 'var(--text-2)' }}>✕</button>
              </div>
            </div>
          ) : (
            <div key={rt.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', borderTop: i > 0 ? '1px solid var(--border-c)' : 'none', fontSize: 13 }}>
              <span style={{ flex: 1, fontWeight: 500 }}>{rt.name}</span>
              <span style={{ color: 'var(--text-3)', fontSize: 12 }}>{rt.capacity} kişi</span>
              <span style={{ color: 'var(--text-2)', fontSize: 12, fontWeight: 500, minWidth: 70, textAlign: 'right' }}>{(rt.basePrice / 100).toLocaleString('tr-TR')} ₺</span>
              <button onClick={() => startEdit(rt)} title="Düzenle" style={{ background: 'none', border: 'none', color: 'var(--text-3)', cursor: 'pointer', padding: '2px 4px', display: 'flex' }}><Pencil/></button>
              <button onClick={() => setRoomTypes(p => p.filter(x => x.id !== rt.id))} style={{ background: 'none', border: 'none', color: 'var(--bad)', fontSize: 14, cursor: 'pointer', padding: '2px 4px' }}>×</button>
            </div>
          ))}
        </div>
      )}

      {roomTypes.length === 0 && <div style={{ marginBottom: 24, padding: '10px 14px', background: 'var(--warn-bg)', borderRadius: 8, fontSize: 12, color: 'var(--text-2)' }}>En az bir oda tipi eklemeniz önerilir. Atlayabilirsiniz ama odaları ekleyemezsiniz.</div>}
      {nav(() => setStep(3))}
    </>
  )

  // ── Step 3 ──────────────────────────────────────────────────────────────────
  if (step === 3) {
    const allSelected = rooms.length > 0 && selected.size === rooms.length
    panel = (
      <>
        <h1 style={{ fontSize: 26, fontWeight: 700, letterSpacing: '-0.02em', margin: '0 0 6px', color: 'var(--text)' }}>Odalar & Katlar</h1>
        <p style={{ fontSize: 14, color: 'var(--text-2)', margin: '0 0 20px', lineHeight: 1.6 }}>Oda numaralarını toplu oluşturun veya tek tek ekleyin.</p>

        {roomTypes.length === 0 && <div style={{ marginBottom: 16, padding: '10px 14px', background: 'var(--warn-bg)', borderRadius: 8, fontSize: 12, color: 'var(--text-2)' }}>Oda tipi tanımlamadınız — geri dönüp önce oda tipi ekleyin.</div>}

        <div style={{ background: 'var(--surface)', border: '1px solid var(--border-c)', borderRadius: 10, padding: 16, marginBottom: 10 }}>
          <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 12 }}>Toplu oluştur</div>
          <div style={{ display: 'grid', gridTemplateColumns: '90px 90px 70px 1fr auto', gap: 8, alignItems: 'end' }}>
            <div><SL>Başlangıç no</SL><input value={bulkFrom} onChange={e => { setBulkFrom(e.target.value); setBulkSkipped(0) }} style={inp} placeholder="101"/></div>
            <div><SL>Bitiş no</SL><input value={bulkTo} onChange={e => { setBulkTo(e.target.value); setBulkSkipped(0) }} style={inp} placeholder="120"/></div>
            <div><SL>Kat</SL><input value={bulkFloor} onChange={e => setBulkFloor(e.target.value)} style={inp} type="number" placeholder="1"/></div>
            <div><SL>Oda tipi</SL><select value={bulkType} onChange={e => setBulkType(e.target.value)} style={inp} disabled={roomTypes.length === 0}><option value="">Seçin…</option>{roomTypes.map(rt => <option key={rt.id} value={rt.id}>{rt.name}</option>)}</select></div>
            <button onClick={bulkGenerate} disabled={!bulkFrom || !bulkTo || !bulkType} style={{ padding: '7px 14px', background: 'var(--accent-c)', color: 'var(--accent-fg)', border: 0, borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: 'pointer', opacity: (!bulkFrom || !bulkTo || !bulkType) ? 0.5 : 1 }}>Oluştur</button>
          </div>
          {bulkSkipped > 0 && <div style={{ marginTop: 8, fontSize: 11, color: 'var(--warn)' }}>⚠ {bulkSkipped} oda numarası zaten mevcut olduğu için atlandı.</div>}
        </div>

        <div style={{ background: 'var(--surface)', border: '1px solid var(--border-c)', borderRadius: 10, padding: 16, marginBottom: 12 }}>
          <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 12 }}>Tek oda ekle</div>
          <div style={{ display: 'grid', gridTemplateColumns: '100px 70px 1fr auto', gap: 8, alignItems: 'end' }}>
            <div>
              <SL>Oda no</SL>
              <input value={singleNum} onChange={e => setSingleNum(e.target.value)} style={{ ...inp, borderColor: (singleNum.trim() && rooms.find(r => r.number === singleNum.trim())) ? 'var(--warn)' : 'var(--border-c)' }} placeholder="101A" onKeyDown={e => e.key === 'Enter' && addSingleRoom()}/>
              {singleNum.trim() && rooms.find(r => r.number === singleNum.trim()) && <div style={{ fontSize: 11, color: 'var(--warn)', marginTop: 3 }}>Bu numara zaten mevcut</div>}
            </div>
            <div><SL>Kat</SL><input value={singleFloor} onChange={e => setSingleFloor(e.target.value)} style={inp} type="number" placeholder="1"/></div>
            <div><SL>Oda tipi</SL><select value={singleType} onChange={e => setSingleType(e.target.value)} style={inp} disabled={roomTypes.length === 0}><option value="">Seçin…</option>{roomTypes.map(rt => <option key={rt.id} value={rt.id}>{rt.name}</option>)}</select></div>
            <button onClick={addSingleRoom} disabled={!singleNum.trim() || !singleType || !!rooms.find(r => r.number === singleNum.trim())} style={{ padding: '7px 14px', background: 'var(--surface-2)', color: 'var(--text)', border: '1px solid var(--border-c)', borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: 'pointer', opacity: (!singleNum.trim() || !singleType || rooms.find(r => r.number === singleNum.trim())) ? 0.5 : 1 }}>Ekle</button>
          </div>
        </div>

        {rooms.length > 0 && (
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border-c)', borderRadius: 10, overflow: 'hidden', marginBottom: selected.size > 0 ? 0 : 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 14px', background: 'var(--surface-2)', borderBottom: '1px solid var(--border-c)' }}>
              <input type="checkbox" checked={allSelected} onChange={() => setSelected(allSelected ? new Set() : new Set(rooms.map(r => r.id)))} style={{ cursor: 'pointer' }}/>
              <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-2)', flex: 1 }}>{rooms.length} oda{selected.size > 0 ? ` — ${selected.size} seçili` : ''}</span>
              <button onClick={() => setRooms([])} style={{ background: 'none', border: 'none', color: 'var(--bad)', fontSize: 11, cursor: 'pointer' }}>Tümünü sil</button>
            </div>
            <div style={{ maxHeight: 200, overflowY: 'auto' }}>
              {rooms.map((r, i) => (
                <div key={r.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '7px 14px', borderTop: i > 0 ? '1px solid var(--border-c)' : 'none', fontSize: 12, background: selected.has(r.id) ? 'var(--accent-weak)' : 'transparent' }}>
                  <input type="checkbox" checked={selected.has(r.id)} onChange={() => toggleSelect(r.id)} style={{ cursor: 'pointer' }}/>
                  <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 600, minWidth: 44 }}>{r.number}</span>
                  <span style={{ color: 'var(--text-3)', minWidth: 44 }}>{r.floor != null ? `Kat ${r.floor}` : '—'}</span>
                  <span style={{ color: 'var(--text-2)' }}>{roomTypes.find(t => t.id === r.typeDraftId)?.name ?? '—'}</span>
                  <button onClick={() => setRooms(p => p.filter(x => x.id !== r.id))} style={{ marginLeft: 'auto', background: 'none', border: 'none', color: 'var(--text-3)', fontSize: 13, cursor: 'pointer' }}>×</button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Bulk edit panel — shown when rooms are selected */}
        {selected.size > 0 && (
          <div style={{ background: 'var(--info-bg)', border: '1px solid var(--border-c)', borderTop: 'none', borderRadius: '0 0 10px 10px', padding: '10px 14px', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 12, color: 'var(--text-2)', fontWeight: 500, marginRight: 4 }}>{selected.size} oda için:</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <span style={{ fontSize: 11, color: 'var(--text-3)' }}>Kat</span>
              <input value={beFloor} onChange={e => setBeFloor(e.target.value)} style={{ ...inp, width: 60 }} type="number" placeholder="—"/>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <span style={{ fontSize: 11, color: 'var(--text-3)' }}>Tip</span>
              <select value={beType} onChange={e => setBeType(e.target.value)} style={{ ...inp, width: 'auto' }}>
                <option value="">Değiştirme</option>
                {roomTypes.map(rt => <option key={rt.id} value={rt.id}>{rt.name}</option>)}
              </select>
            </div>
            <button onClick={applyBulkEdit} disabled={beFloor === '' && !beType} style={{ padding: '6px 12px', background: 'var(--accent-c)', color: 'var(--accent-fg)', border: 0, borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: 'pointer', opacity: (beFloor === '' && !beType) ? 0.5 : 1 }}>Uygula</button>
            <button onClick={() => setSelected(new Set())} style={{ padding: '6px 8px', background: 'none', border: 'none', color: 'var(--text-3)', fontSize: 11, cursor: 'pointer' }}>İptal</button>
          </div>
        )}

        {rooms.length === 0 && roomTypes.length > 0 && <div style={{ marginBottom: 16, padding: '10px 14px', background: 'var(--surface-2)', borderRadius: 8, fontSize: 12, color: 'var(--text-3)' }}>Henüz oda eklenmedi. Odaları daha sonra Ayarlar'dan da ekleyebilirsiniz.</div>}

        {error && <div style={{ marginBottom: 12, padding: '8px 12px', background: 'var(--bad-bg)', color: 'var(--bad)', borderRadius: 6, fontSize: 12 }}>{error}</div>}
        {nav(handleComplete, loading ? 'Kaydediliyor…' : 'Panele Git →', !loading)}
      </>
    )
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: 'var(--bg)' }}>
      <div style={{ height: 56, borderBottom: '1px solid var(--border-c)', background: 'var(--surface)', display: 'flex', alignItems: 'center', padding: '0 24px', gap: 16, flexShrink: 0 }}>
        <div style={{ fontWeight: 700, fontSize: 16, letterSpacing: '-0.02em', color: 'var(--accent-c)' }}>HotelOS</div>
        <div style={{ width: 1, height: 20, background: 'var(--border-c)' }}/>
        <div style={{ fontSize: 13, color: 'var(--text-2)' }}>Kurulum sihirbazı</div>
        <div style={{ flex: 1 }}/>
        <button onClick={() => router.push('/')} style={{ padding: '5px 12px', background: 'transparent', border: '1px solid var(--border-c)', borderRadius: 6, fontSize: 12, color: 'var(--text-2)', cursor: 'pointer' }}>Çıkış</button>
      </div>
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        {sidebar}
        <div style={{ flex: 1, padding: 48, overflowY: 'auto', maxWidth: 700 }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--accent-c)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 8 }}>Adım {step}</div>
          {panel}
        </div>
      </div>
    </div>
  )
}
