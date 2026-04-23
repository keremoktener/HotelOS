'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { trpc } from '@/lib/trpc/client'
import { formatCurrency } from '@/lib/utils'

export default function NewReservationPage() {
  const router = useRouter()
  const [guestQuery, setGuestQuery] = useState('')
  const [selectedGuestId, setSelectedGuestId] = useState<string | null>(null)
  const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null)
  const [checkIn, setCheckIn] = useState('')
  const [checkOut, setCheckOut] = useState('')
  const [adults, setAdults] = useState(1)
  const [children, setChildren] = useState(0)
  const [notes, setNotes] = useState('')
  const [error, setError] = useState<string | null>(null)

  const { data: guests } = trpc.guest.search.useQuery(
    { query: guestQuery },
    { enabled: guestQuery.length >= 2 },
  )

  const { data: rooms } = trpc.room.list.useQuery(
    { status: 'CLEAN' },
  )

  const { data: pricePreview } = trpc.reservation.pricePreview.useQuery(
    {
      guestCount: adults + children,
      checkIn: new Date(checkIn),
      checkOut: new Date(checkOut),
    },
    { enabled: !!(checkIn && checkOut && adults) },
  )

  const createMutation = trpc.reservation.create.useMutation({
    onSuccess: () => router.push('/reservation'),
    onError: (err) => setError(err.message),
  })

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!selectedGuestId || !selectedRoomId) {
      setError('Lütfen misafir ve oda seçin.')
      return
    }
    createMutation.mutate({
      guestId: selectedGuestId,
      roomId: selectedRoomId,
      checkIn: new Date(checkIn),
      checkOut: new Date(checkOut),
      adults,
      children,
      notes,
    })
  }

  const selectedGuest = guests?.find(g => g.id === selectedGuestId)
  const selectedRoom = rooms?.find(r => r.id === selectedRoomId)

  return (
    <div className="max-w-2xl space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Yeni Rezervasyon</h1>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Guest search */}
        <div className="bg-white rounded-xl shadow-sm p-5 space-y-3">
          <h2 className="font-semibold text-gray-800">Misafir</h2>
          <input
            type="text"
            placeholder="Ad, soyad, TC no veya telefon ile ara..."
            value={guestQuery}
            onChange={e => setGuestQuery(e.target.value)}
            className="w-full border rounded-lg px-3 py-2 text-sm"
          />
          {guests && guests.length > 0 && !selectedGuestId && (
            <ul className="border rounded-lg divide-y text-sm">
              {guests.map(g => (
                <li key={g.id}>
                  <button
                    type="button"
                    onClick={() => { setSelectedGuestId(g.id); setGuestQuery('') }}
                    className="w-full text-left px-3 py-2 hover:bg-blue-50"
                  >
                    {g.firstName} {g.lastName} {g.phone ? `— ${g.phone}` : ''}
                    {g.blacklisted && <span className="ml-2 text-red-600 text-xs font-bold">KARALİSTE</span>}
                  </button>
                </li>
              ))}
            </ul>
          )}
          {selectedGuest && (
            <div className="flex items-center justify-between p-2 bg-blue-50 rounded-lg text-sm">
              <span className="font-medium">{selectedGuest.firstName} {selectedGuest.lastName}</span>
              <button type="button" onClick={() => setSelectedGuestId(null)} className="text-gray-400 hover:text-gray-600 text-xs">Değiştir</button>
            </div>
          )}
        </div>

        {/* Dates & guests */}
        <div className="bg-white rounded-xl shadow-sm p-5 space-y-3">
          <h2 className="font-semibold text-gray-800">Tarihler & Kişi Sayısı</h2>
          <div className="grid grid-cols-2 gap-3">
            <label className="space-y-1">
              <span className="text-xs text-gray-500">Giriş</span>
              <input type="date" value={checkIn} onChange={e => setCheckIn(e.target.value)} className="w-full border rounded-lg px-3 py-2 text-sm" required />
            </label>
            <label className="space-y-1">
              <span className="text-xs text-gray-500">Çıkış</span>
              <input type="date" value={checkOut} onChange={e => setCheckOut(e.target.value)} className="w-full border rounded-lg px-3 py-2 text-sm" required />
            </label>
            <label className="space-y-1">
              <span className="text-xs text-gray-500">Yetişkin</span>
              <input type="number" min={1} max={20} value={adults} onChange={e => setAdults(Number(e.target.value))} className="w-full border rounded-lg px-3 py-2 text-sm" />
            </label>
            <label className="space-y-1">
              <span className="text-xs text-gray-500">Çocuk</span>
              <input type="number" min={0} max={10} value={children} onChange={e => setChildren(Number(e.target.value))} className="w-full border rounded-lg px-3 py-2 text-sm" />
            </label>
          </div>
          {pricePreview && (
            <div className="p-3 bg-green-50 rounded-lg text-sm space-y-1">
              <div className="flex justify-between"><span className="text-gray-600">Gece sayısı:</span><span>{pricePreview.nights}</span></div>
              <div className="flex justify-between"><span className="text-gray-600">Gecelik fiyat:</span><span>{formatCurrency(pricePreview.pricePerNight)}</span></div>
              <div className="flex justify-between font-semibold"><span>Toplam:</span><span>{formatCurrency(pricePreview.totalPrice)}</span></div>
            </div>
          )}
        </div>

        {/* Room selection */}
        <div className="bg-white rounded-xl shadow-sm p-5 space-y-3">
          <h2 className="font-semibold text-gray-800">Oda</h2>
          <select
            value={selectedRoomId ?? ''}
            onChange={e => setSelectedRoomId(e.target.value)}
            className="w-full border rounded-lg px-3 py-2 text-sm"
            required
          >
            <option value="">Oda seçin...</option>
            {rooms?.map(r => (
              <option key={r.id} value={r.id}>
                {r.number} — {r.type.name} ({r.status})
              </option>
            ))}
          </select>
        </div>

        {/* Notes */}
        <div className="bg-white rounded-xl shadow-sm p-5 space-y-3">
          <h2 className="font-semibold text-gray-800">Notlar</h2>
          <textarea
            value={notes}
            onChange={e => setNotes(e.target.value)}
            rows={3}
            placeholder="Özel istekler, notlar..."
            className="w-full border rounded-lg px-3 py-2 text-sm resize-none"
          />
        </div>

        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">{error}</div>
        )}

        <div className="flex gap-3">
          <button
            type="submit"
            disabled={createMutation.isPending}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 text-sm font-medium"
          >
            {createMutation.isPending ? 'Kaydediliyor...' : 'Rezervasyon Oluştur'}
          </button>
          <button
            type="button"
            onClick={() => router.back()}
            className="bg-white text-gray-700 px-6 py-2 rounded-lg border hover:bg-gray-50 text-sm font-medium"
          >
            İptal
          </button>
        </div>
      </form>
    </div>
  )
}
