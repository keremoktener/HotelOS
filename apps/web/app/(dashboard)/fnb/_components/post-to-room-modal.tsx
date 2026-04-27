'use client'

import { useState } from 'react'
import { X, Plus, Minus, ShoppingCart } from 'lucide-react'
import { trpc } from '@/lib/trpc/client'
import { inputStyle } from '@/components/ui/kv'

function formatPrice(kurus: number) {
  return (kurus / 100).toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' })
}

interface MenuItem { id: string; name: string; priceKurus: number; isAvailable: boolean }
interface Category { id: string; name: string; items: MenuItem[] }
interface Reservation { id: string; guestName: string; roomNumber: string }
interface CartEntry { itemId: string; name: string; priceKurus: number; qty: number }

interface Props {
  categories: Category[]
  reservations: Reservation[]
  onClose: () => void
}

export function PostToRoomModal({ categories, reservations, onClose }: Props) {
  const [reservationId, setReservationId] = useState('')
  const [activeCat, setActiveCat] = useState(categories[0]?.id ?? '')
  const [cart, setCart] = useState<CartEntry[]>([])
  const [error, setError] = useState('')

  const postMut = trpc.folio.postFnB.useMutation({
    onSuccess: () => onClose(),
    onError: e => setError(e.message),
  })

  function addItem(item: MenuItem) {
    setCart(prev => {
      const existing = prev.find(e => e.itemId === item.id)
      if (existing) return prev.map(e => e.itemId === item.id ? { ...e, qty: e.qty + 1 } : e)
      return [...prev, { itemId: item.id, name: item.name, priceKurus: item.priceKurus, qty: 1 }]
    })
  }

  function removeItem(itemId: string) {
    setCart(prev => {
      const existing = prev.find(e => e.itemId === itemId)
      if (!existing) return prev
      if (existing.qty <= 1) return prev.filter(e => e.itemId !== itemId)
      return prev.map(e => e.itemId === itemId ? { ...e, qty: e.qty - 1 } : e)
    })
  }

  function getQty(itemId: string) {
    return cart.find(e => e.itemId === itemId)?.qty ?? 0
  }

  const total = cart.reduce((s, e) => s + e.priceKurus * e.qty, 0)
  const canSubmit = reservationId !== '' && cart.length > 0 && !postMut.isPending
  const activeItems = categories.find(c => c.id === activeCat)?.items.filter(i => i.isAvailable) ?? []

  return (
    <div
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div style={{ background: 'var(--surface)', borderRadius: 12, width: 740, maxWidth: '95vw', maxHeight: '85vh', display: 'flex', flexDirection: 'column', boxShadow: '0 20px 60px rgba(0,0,0,0.3)' }}>

        {/* Header */}
        <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--border-c)', display: 'flex', alignItems: 'center', gap: 12 }}>
          <ShoppingCart size={15} style={{ color: 'var(--text-3)', flexShrink: 0 }}/>
          <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)' }}>Odaya İşle</span>
          <select
            value={reservationId}
            onChange={e => setReservationId(e.target.value)}
            style={{ ...inputStyle, flex: 1, minWidth: 0 }}
          >
            <option value="">Rezervasyon seçin...</option>
            {reservations.map(r => (
              <option key={r.id} value={r.id}>Oda {r.roomNumber} — {r.guestName}</option>
            ))}
          </select>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-3)', display: 'flex', padding: 4 }}>
            <X size={15}/>
          </button>
        </div>

        {/* Body */}
        <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>

          {/* Menu panel */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', borderRight: '1px solid var(--border-c)', overflow: 'hidden' }}>
            {/* Category pills */}
            <div style={{ display: 'flex', gap: 6, padding: '10px 14px', borderBottom: '1px solid var(--border-c)', overflowX: 'auto', flexShrink: 0 }}>
              {categories.map(c => (
                <button
                  key={c.id}
                  onClick={() => setActiveCat(c.id)}
                  style={{
                    padding: '4px 12px', borderRadius: 20, border: 'none', cursor: 'pointer', whiteSpace: 'nowrap',
                    fontSize: 12, fontWeight: 500,
                    background: activeCat === c.id ? 'var(--accent-c)' : 'var(--surface-2)',
                    color: activeCat === c.id ? 'var(--accent-fg)' : 'var(--text-2)',
                  }}
                >
                  {c.name}
                </button>
              ))}
            </div>

            {/* Item list */}
            <div style={{ flex: 1, overflowY: 'auto' }}>
              {activeItems.length === 0 && (
                <div style={{ padding: '32px 16px', textAlign: 'center', fontSize: 12, color: 'var(--text-3)' }}>Bu kategoride satışta ürün yok.</div>
              )}
              {activeItems.map(item => {
                const qty = getQty(item.id)
                return (
                  <div key={item.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 16px', borderBottom: '1px solid var(--border-c)' }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text)' }}>{item.name}</div>
                      <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 1 }}>{formatPrice(item.priceKurus)}</div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      {qty > 0 && (
                        <>
                          <button
                            onClick={() => removeItem(item.id)}
                            style={{ width: 26, height: 26, borderRadius: 6, border: '1px solid var(--border-c)', background: 'var(--surface-2)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                          >
                            <Minus size={11}/>
                          </button>
                          <span style={{ width: 22, textAlign: 'center', fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>{qty}</span>
                        </>
                      )}
                      <button
                        onClick={() => addItem(item)}
                        style={{ width: 26, height: 26, borderRadius: 6, border: 'none', background: 'var(--accent-c)', color: 'var(--accent-fg)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                      >
                        <Plus size={11}/>
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Cart panel */}
          <div style={{ width: 220, display: 'flex', flexDirection: 'column' }}>
            <div style={{ padding: '12px 14px 8px', fontSize: 12, fontWeight: 700, color: 'var(--text)', borderBottom: '1px solid var(--border-c)' }}>Sepet</div>
            <div style={{ flex: 1, overflowY: 'auto', padding: '10px 14px' }}>
              {cart.length === 0 ? (
                <div style={{ fontSize: 12, color: 'var(--text-3)' }}>Henüz ürün eklenmedi.</div>
              ) : (
                cart.map(e => (
                  <div key={e.itemId} style={{ marginBottom: 10 }}>
                    <div style={{ fontSize: 12, fontWeight: 500, color: 'var(--text)', lineHeight: 1.3 }}>{e.name}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 1 }}>×{e.qty} · {formatPrice(e.priceKurus * e.qty)}</div>
                  </div>
                ))
              )}
            </div>
            {cart.length > 0 && (
              <div style={{ padding: '10px 14px', borderTop: '1px solid var(--border-c)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, fontWeight: 700, color: 'var(--text)' }}>
                  <span>Toplam</span>
                  <span>{formatPrice(total)}</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div style={{ padding: '12px 20px', borderTop: '1px solid var(--border-c)', display: 'flex', alignItems: 'center', gap: 10 }}>
          {error
            ? <span style={{ flex: 1, fontSize: 12, color: 'var(--red)' }}>{error}</span>
            : <span style={{ flex: 1 }}/>
          }
          <button
            onClick={onClose}
            style={{ padding: '7px 14px', border: '1px solid var(--border-c)', borderRadius: 6, background: 'transparent', fontSize: 12, color: 'var(--text-2)', cursor: 'pointer' }}
          >
            İptal
          </button>
          <button
            disabled={!canSubmit}
            onClick={() => {
              setError('')
              postMut.mutate({
                reservationId,
                items: cart.map(e => ({ name: e.name, priceKurus: e.priceKurus, qty: e.qty })),
              })
            }}
            style={{
              padding: '7px 16px', border: 'none', borderRadius: 6, fontSize: 12, fontWeight: 600,
              background: canSubmit ? 'var(--accent-c)' : 'var(--border-c)',
              color: canSubmit ? 'var(--accent-fg)' : 'var(--text-3)',
              cursor: canSubmit ? 'pointer' : 'not-allowed',
            }}
          >
            {postMut.isPending ? 'İşleniyor...' : 'Odaya İşle'}
          </button>
        </div>
      </div>
    </div>
  )
}
