'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { trpc } from '@/lib/trpc/client'
import { trDate, displayCurrency } from '@/lib/utils'
import { Chip } from '@/components/ui/chip'
import { Avatar } from '@/components/ui/avatar'
import { KV, Field, inputStyle } from '@/components/ui/kv'
import { th, td } from '@/components/ui/data-table'

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

function toInputDate(iso: string) { return iso.slice(0, 10) }
const formatCurrency = displayCurrency

interface Payment { id: string; amount: number; method: string; reference: string; createdAt: string }
interface Reservation {
  id: string; status: string; totalPrice: number; paidAmount: number
  checkIn: string; checkOut: string; adults: number; children: number; notes: string; specialRequests: string
  guest: { id: string; firstName: string; lastName: string; phone: string; email: string; nationality: string; tcId: string | null; passportNo: string | null }
  room: { id: string; number: string; floor: number | null; status: string; faultNote: string | null; roomType: { name: string; capacity: number } } | null
  payments: Payment[]
}

function parseDiscount(s: string): { pct: number; reason: string } | null {
  const m = s.match(/^\[%(\d+) indirim: ([^\]]+)\]/)
  return m ? { pct: Number(m[1]), reason: m[2] } : null
}
interface AvailableRoom { id: string; number: string; floor: number | null; status: string; roomTypeName: string }

export function ReservationDetailClient({ reservation: r, availableRooms }: { reservation: Reservation; availableRooms: AvailableRoom[] }) {
  const router = useRouter()
  const nights = Math.round((new Date(r.checkOut).getTime() - new Date(r.checkIn).getTime()) / (1000 * 60 * 60 * 24))
  const balance = r.totalPrice - r.paidAmount
  const statusMeta = STATUS_META[r.status] ?? { label: r.status, tone: 'neutral' }

  const [cancelReason, setCancelReason] = useState('')
  const [showCancelInput, setShowCancelInput] = useState(false)
  const [actionError, setActionError] = useState<string | null>(null)

  // Edit state
  const [editing, setEditing] = useState(false)
  const [editCheckIn, setEditCheckIn] = useState(toInputDate(r.checkIn))
  const [editCheckOut, setEditCheckOut] = useState(toInputDate(r.checkOut))
  const [editAdults, setEditAdults] = useState(String(r.adults))
  const [editChildren, setEditChildren] = useState(String(r.children))
  const [editNotes, setEditNotes] = useState(r.notes)
  const [editRoomId, setEditRoomId] = useState(r.room?.id ?? '')
  const [editDiscountPct, setEditDiscountPct] = useState('')
  const [editDiscountReason, setEditDiscountReason] = useState('')
  const [editError, setEditError] = useState('')
  const [showEarlyCheckIn, setShowEarlyCheckIn] = useState(false)

  const discountPctNum = Math.min(100, Math.max(0, Number(editDiscountPct) || 0))
  const discountedTotal = discountPctNum > 0 ? Math.round(r.totalPrice * (1 - discountPctNum / 100)) : r.totalPrice

  function onSuccess() { router.refresh() }
  function onError(err: { message: string }) { setActionError(err.message) }

  const checkInMut = trpc.reservation.checkIn.useMutation({ onSuccess, onError })
  const checkOutMut = trpc.reservation.checkOut.useMutation({ onSuccess, onError })
  const cancelMut = trpc.reservation.cancel.useMutation({
    onSuccess: () => { setShowCancelInput(false); setCancelReason(''); onSuccess() },
    onError,
  })
  const updateMut = trpc.reservation.update.useMutation({
    onSuccess: () => { router.refresh(); setEditing(false); setEditError('') },
    onError: (err) => setEditError(err.message),
  })

  function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setEditError('')
    const cin = new Date(editCheckIn)
    const cout = new Date(editCheckOut)
    if (cout <= cin) { setEditError('Çıkış tarihi girişten sonra olmalıdır.'); return }
    if (discountPctNum > 0 && !editDiscountReason.trim()) { setEditError('İndirim nedeni zorunludur.'); return }
    updateMut.mutate({
      id: r.id,
      data: {
        checkIn: cin,
        checkOut: cout,
        adults: Number(editAdults),
        children: Number(editChildren),
        notes: editNotes.trim() || undefined,
        roomId: editRoomId || undefined,
        discountPct: discountPctNum > 0 ? discountPctNum : undefined,
        discountReason: discountPctNum > 0 ? editDiscountReason.trim() : undefined,
      },
    })
  }

  function cancelEdit() {
    setEditCheckIn(toInputDate(r.checkIn)); setEditCheckOut(toInputDate(r.checkOut))
    setEditAdults(String(r.adults)); setEditChildren(String(r.children))
    setEditNotes(r.notes); setEditRoomId(r.room?.id ?? '')
    setEditDiscountPct(''); setEditDiscountReason(''); setEditError(''); setEditing(false)
  }

  const busy = checkInMut.isPending || checkOutMut.isPending || cancelMut.isPending
  const canCheckIn = r.status === 'WAITING' || r.status === 'CONFIRMED'
  const canCheckOut = r.status === 'CHECKEDIN'
  const canCancel = r.status === 'WAITING' || r.status === 'CONFIRMED'
  const canEdit = r.status === 'WAITING' || r.status === 'CONFIRMED'

  const btnBase: React.CSSProperties = {
    width: '100%', padding: '9px 14px', borderRadius: 6, fontSize: 13, fontWeight: 600,
    cursor: busy ? 'not-allowed' : 'pointer', opacity: busy ? 0.6 : 1, border: 0,
  }

  return (
    <div style={{ height: 'calc(100% - 56px)', overflowY: 'auto', padding: 24 }}>
      {/* Early check-in confirmation modal */}
      {showEarlyCheckIn && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border-c)', borderRadius: 12, padding: 24, width: 360, boxShadow: '0 8px 32px rgba(0,0,0,0.18)' }}>
            <div style={{ width: 40, height: 40, borderRadius: 999, background: 'var(--warn-bg)', color: 'var(--warn)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, marginBottom: 14 }}>!</div>
            <div style={{ fontWeight: 600, fontSize: 15, color: 'var(--text)', marginBottom: 8 }}>Erken giriş onayı</div>
            <div style={{ fontSize: 13, color: 'var(--text-2)', lineHeight: 1.5, marginBottom: 20 }}>
              Planlanan giriş tarihi <b>{trDate(r.checkIn)}</b> henüz gelmedi. Bu misafiri şimdi giriş yapmak istiyor musunuz?
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                onClick={() => { setShowEarlyCheckIn(false); checkInMut.mutate({ id: r.id }) }}
                style={{ flex: 1, padding: '9px', background: 'var(--good)', color: '#fff', border: 0, borderRadius: 6, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}
              >
                Evet, giriş yap
              </button>
              <button
                onClick={() => setShowEarlyCheckIn(false)}
                style={{ flex: 1, padding: '9px', background: 'var(--surface-2)', color: 'var(--text-2)', border: '1px solid var(--border-c)', borderRadius: 6, fontSize: 13, cursor: 'pointer' }}
              >
                Vazgeç
              </button>
            </div>
          </div>
        </div>
      )}

      <button
        onClick={() => { router.refresh(); router.push('/reservation') }}
        style={{ background: 'none', border: '1px solid var(--border-c)', borderRadius: 6, padding: '5px 10px', fontSize: 12, color: 'var(--text-2)', cursor: 'pointer', marginBottom: 16 }}
      >
        ← Rezervasyonlar
      </button>

      {/* Guest header */}
      <div style={{ background: 'var(--surface)', border: '1px solid var(--border-c)', borderRadius: 10, padding: 20, marginBottom: 16, display: 'flex', gap: 16, boxShadow: 'var(--shadow-sm)' }}>
        <Avatar initials={`${r.guest.firstName[0] ?? ''}${r.guest.lastName[0] ?? ''}`} size={56}/>
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

      {/* Edit form */}
      {editing && (
        <form onSubmit={handleSave} style={{ background: 'var(--surface)', border: '1px solid var(--accent-c)', borderRadius: 10, padding: 20, marginBottom: 16, boxShadow: 'var(--shadow-sm)' }}>
          <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 16 }}>Rezervasyon düzenle</div>
          <div style={{ marginBottom: 12 }}>
            <Field label="Oda">
              <select style={inputStyle} value={editRoomId} onChange={e => setEditRoomId(e.target.value)}>
                <option value="">— Oda seçin —</option>
                {availableRooms.map(room => {
                  const isCurrent = room.id === r.room?.id
                  const selectable = room.status === 'CLEAN' || isCurrent
                  return (
                    <option key={room.id} value={room.id} disabled={!selectable}>
                      {room.number} · {room.roomTypeName}{room.floor != null ? ` (Kat ${room.floor})` : ''}{isCurrent ? ' — Mevcut' : !selectable ? ` — ${room.status === 'DIRTY' ? 'Kirli' : room.status === 'FAULTY' ? 'Arızalı' : 'DND'}` : ''}
                    </option>
                  )
                })}
              </select>
            </Field>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
            <Field label="Giriş tarihi">
              <input type="date" style={inputStyle} value={editCheckIn} onChange={e => setEditCheckIn(e.target.value)} required/>
            </Field>
            <Field label="Çıkış tarihi">
              <input type="date" style={inputStyle} value={editCheckOut} onChange={e => setEditCheckOut(e.target.value)} required/>
            </Field>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
            <Field label="Yetişkin">
              <input type="number" min={1} max={20} style={inputStyle} value={editAdults} onChange={e => setEditAdults(e.target.value)}/>
            </Field>
            <Field label="Çocuk">
              <input type="number" min={0} max={10} style={inputStyle} value={editChildren} onChange={e => setEditChildren(e.target.value)}/>
            </Field>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr', gap: 12, marginBottom: discountPctNum > 0 ? 12 : 0 }}>
            <Field label="İndirim (%)">
              <input type="number" min={0} max={100} style={inputStyle} value={editDiscountPct} onChange={e => { const v = Math.min(100, Math.max(0, Number(e.target.value) || 0)); setEditDiscountPct(v === 0 ? '' : String(v)) }} placeholder="0"/>
            </Field>
            {discountPctNum > 0 && (
              <div style={{ display: 'flex', alignItems: 'flex-end', paddingBottom: 1 }}>
                <div style={{ fontSize: 12, color: 'var(--text-2)' }}>
                  {formatCurrency(r.totalPrice)} → <b style={{ color: 'var(--good)' }}>{formatCurrency(discountedTotal)}</b>
                  <span style={{ fontSize: 11, color: 'var(--text-3)', marginLeft: 6 }}>({formatCurrency(r.totalPrice - discountedTotal)} indirim)</span>
                </div>
              </div>
            )}
          </div>
          {discountPctNum > 0 && (
            <div style={{ marginBottom: 12 }}>
              <Field label="İndirim nedeni *">
                <input style={inputStyle} value={editDiscountReason} onChange={e => setEditDiscountReason(e.target.value)} placeholder="Nedeni girin"/>
              </Field>
            </div>
          )}
          <Field label="Dahili notlar">
            <textarea style={{ ...inputStyle, minHeight: 60, resize: 'vertical', fontFamily: 'inherit' }} value={editNotes} onChange={e => setEditNotes(e.target.value)}/>
          </Field>
          {editError && <div style={{ marginTop: 10, padding: '8px 12px', background: 'var(--bad-bg)', borderRadius: 6, color: 'var(--bad)', fontSize: 12 }}>{editError}</div>}
          <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
            <button type="submit" disabled={updateMut.isPending} style={{ padding: '8px 20px', background: 'var(--accent-c)', color: 'var(--accent-fg)', border: 'none', borderRadius: 6, fontSize: 13, fontWeight: 500, cursor: updateMut.isPending ? 'not-allowed' : 'pointer', opacity: updateMut.isPending ? 0.7 : 1 }}>
              {updateMut.isPending ? 'Kaydediliyor…' : 'Kaydet'}
            </button>
            <button type="button" onClick={cancelEdit} style={{ padding: '8px 16px', background: 'var(--surface-2)', color: 'var(--text-2)', border: '1px solid var(--border-c)', borderRadius: 6, fontSize: 13, cursor: 'pointer' }}>
              İptal
            </button>
          </div>
        </form>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 16 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Stay summary */}
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border-c)', borderRadius: 10, boxShadow: 'var(--shadow-sm)' }}>
            <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--border-c)', fontWeight: 600, fontSize: 14 }}>Konaklama özeti</div>
            <div style={{ padding: 16, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <KV label="Oda">{r.room ? `${r.room.number} · ${r.room.roomType.name}` : '—'}</KV>
              <KV label="Kapasite">{r.room ? `${r.room.roomType.capacity} kişi` : '—'}</KV>
              <KV label="Oda durumu">{r.room ? <Chip tone={ROOM_STATUS_META[r.room.status]?.tone ?? 'neutral'} dot>{ROOM_STATUS_META[r.room.status]?.label ?? r.room.status}</Chip> : '—'}</KV>
              <KV label="Kat">{r.room ? (r.room.floor != null ? `Kat ${r.room.floor}` : '—') : '—'}</KV>
              <KV label="Özel istekler" full>{r.notes || <span style={{ color: 'var(--text-3)' }}>Yok</span>}</KV>
            </div>
          </div>

          {/* Price */}
          {(() => {
            const disc = parseDiscount(r.specialRequests)
            const originalPrice = disc ? Math.round(r.totalPrice * 100 / (100 - disc.pct)) : null
            const discountAmount = originalPrice ? originalPrice - r.totalPrice : 0
            return (
              <div style={{ background: 'var(--surface)', border: '1px solid var(--border-c)', borderRadius: 10, boxShadow: 'var(--shadow-sm)' }}>
                <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--border-c)', fontWeight: 600, fontSize: 14 }}>Fiyat</div>
                <div style={{ padding: 16 }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <tbody>
                      <tr>
                        <td style={{ padding: '7px 0', fontSize: 13, color: 'var(--text-2)' }}>{nights} gece</td>
                        <td style={{ padding: '7px 0', textAlign: 'right', fontSize: 13, color: 'var(--text-2)' }}>{disc ? <s style={{ color: 'var(--text-3)' }}>{formatCurrency(originalPrice!)}</s> : ''}</td>
                      </tr>
                      {disc && (
                        <tr>
                          <td style={{ padding: '5px 0', fontSize: 12 }}>
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '2px 8px', borderRadius: 999, background: 'var(--good-bg)', color: 'var(--good)', fontWeight: 500 }}>
                              %{disc.pct} indirim
                            </span>
                            <span style={{ marginLeft: 8, fontSize: 11, color: 'var(--text-3)' }}>{disc.reason}</span>
                          </td>
                          <td style={{ padding: '5px 0', textAlign: 'right', fontSize: 13, color: 'var(--good)', fontWeight: 500 }}>−{formatCurrency(discountAmount)}</td>
                        </tr>
                      )}
                      <tr style={{ borderTop: '1px solid var(--border-c)' }}>
                        <td style={{ padding: '10px 0 0', fontWeight: 600, fontSize: 13 }}>Toplam</td>
                        <td style={{ padding: '10px 0 0', textAlign: 'right', fontWeight: 600, fontSize: 15, color: 'var(--text)' }}>{formatCurrency(r.totalPrice)}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            )
          })()}

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
          {/* Actions */}
          {(canCheckIn || canCheckOut || canCancel || canEdit) && (
            <div style={{ background: 'var(--surface)', border: '1px solid var(--border-c)', borderRadius: 10, padding: 16, boxShadow: 'var(--shadow-sm)' }}>
              <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 12 }}>İşlemler</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {canEdit && (
                  <button
                    onClick={() => editing ? cancelEdit() : setEditing(true)}
                    style={{ ...btnBase, background: editing ? 'var(--surface-2)' : 'var(--info-bg)', color: editing ? 'var(--text-2)' : 'var(--info)', border: `1px solid ${editing ? 'var(--border-c)' : 'var(--info)'}` }}
                  >
                    {editing ? '✕ Düzenlemeyi iptal et' : '✎ Düzenle'}
                  </button>
                )}
                {canCheckIn && (
                  <button
                    onClick={() => {
                      const today = new Date(); today.setHours(0, 0, 0, 0)
                      const arrival = new Date(r.checkIn); arrival.setHours(0, 0, 0, 0)
                      if (arrival > today) { setShowEarlyCheckIn(true); return }
                      checkInMut.mutate({ id: r.id })
                    }}
                    disabled={busy} style={{ ...btnBase, background: 'var(--good)', color: '#fff' }}>
                    {checkInMut.isPending ? 'İşleniyor…' : '✓ Giriş yap'}
                  </button>
                )}
                {canCheckOut && (
                  <button onClick={() => checkOutMut.mutate({ id: r.id })} disabled={busy} style={{ ...btnBase, background: 'var(--accent-c)', color: 'var(--accent-fg)' }}>
                    {checkOutMut.isPending ? 'İşleniyor…' : '→ Çıkış yap'}
                  </button>
                )}
                {canCancel && !showCancelInput && (
                  <button onClick={() => setShowCancelInput(true)} disabled={busy} style={{ ...btnBase, background: 'var(--surface-2)', color: 'var(--bad)', border: '1px solid var(--border-c)' }}>
                    İptal et
                  </button>
                )}
                {showCancelInput && (
                  <div>
                    <input
                      value={cancelReason} onChange={e => setCancelReason(e.target.value)}
                      placeholder="İptal nedeni (zorunlu)"
                      style={{ width: '100%', padding: '8px 10px', border: '1px solid var(--border-c)', borderRadius: 6, background: 'var(--bg)', fontSize: 12, color: 'var(--text)', outline: 'none', marginBottom: 8, boxSizing: 'border-box' }}
                    />
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button onClick={() => cancelMut.mutate({ id: r.id, reason: cancelReason })} disabled={busy || !cancelReason.trim()}
                        style={{ flex: 1, padding: '7px', background: 'var(--bad)', color: '#fff', border: 0, borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: cancelReason.trim() ? 'pointer' : 'not-allowed', opacity: cancelReason.trim() ? 1 : 0.5 }}>
                        Onayla
                      </button>
                      <button onClick={() => { setShowCancelInput(false); setCancelReason('') }}
                        style={{ padding: '7px 12px', background: 'var(--surface-2)', color: 'var(--text-2)', border: '1px solid var(--border-c)', borderRadius: 6, fontSize: 12, cursor: 'pointer' }}>
                        Vazgeç
                      </button>
                    </div>
                  </div>
                )}
              </div>
              {actionError && (
                <div style={{ marginTop: 10, padding: '8px 10px', background: 'var(--bad-bg)', color: 'var(--bad)', borderRadius: 6, fontSize: 12 }}>{actionError}</div>
              )}
            </div>
          )}

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
        </div>
      </div>
    </div>
  )
}
