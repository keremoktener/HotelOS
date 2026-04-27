'use client'

import { useState } from 'react'
import { Printer } from 'lucide-react'

interface Guest {
  reservationId: string
  guestName: string
  roomNumber: string
  roomType: string
  checkIn: string
  checkOut: string
}

interface Props { guests: Guest[] }

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('tr-TR', { day: '2-digit', month: 'short', year: 'numeric' })
}

export function NametagsClient({ guests }: Props) {
  const [selected, setSelected] = useState<Set<string>>(new Set(guests.map(g => g.reservationId)))

  const toggleAll = () => {
    if (selected.size === guests.length) setSelected(new Set())
    else setSelected(new Set(guests.map(g => g.reservationId)))
  }

  const toggle = (id: string) => setSelected(prev => {
    const next = new Set(prev)
    next.has(id) ? next.delete(id) : next.add(id)
    return next
  })

  const toPrint = guests.filter(g => selected.has(g.reservationId))

  return (
    <>
      {/* Controls — hidden on print */}
      <div className="no-print" style={{ padding: '0 24px 24px', display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
        <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: 'var(--text-2)', cursor: 'pointer' }}>
          <input type="checkbox" checked={selected.size === guests.length} onChange={toggleAll}/>
          Tümünü seç ({guests.length} misafir)
        </label>
        <button
          onClick={() => window.print()}
          disabled={toPrint.length === 0}
          style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 6, padding: '6px 14px', background: 'var(--accent-c)', color: 'var(--accent-fg)', border: 'none', borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: 'pointer' }}
        >
          <Printer size={13}/> Yazdır ({toPrint.length})
        </button>
      </div>

      {/* Selection list — hidden on print */}
      {guests.length === 0 ? (
        <div className="no-print" style={{ textAlign: 'center', padding: '48px 0', color: 'var(--text-3)', fontSize: 14 }}>
          Şu anda konaklamakta misafir bulunmuyor.
        </div>
      ) : (
        <div className="no-print" style={{ padding: '0 24px', display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 32 }}>
          {guests.map(g => (
            <label key={g.reservationId} style={{
              display: 'flex', alignItems: 'center', gap: 8, padding: '6px 12px',
              border: `1px solid ${selected.has(g.reservationId) ? 'var(--accent-c)' : 'var(--border-c)'}`,
              borderRadius: 6, cursor: 'pointer', fontSize: 12, color: 'var(--text-2)',
              background: selected.has(g.reservationId) ? 'var(--accent-weak)' : 'var(--surface)',
            }}>
              <input type="checkbox" checked={selected.has(g.reservationId)} onChange={() => toggle(g.reservationId)} style={{ flexShrink: 0 }}/>
              <span><strong style={{ color: 'var(--text)' }}>{g.guestName}</strong> — Oda {g.roomNumber}</span>
            </label>
          ))}
        </div>
      )}

      {/* Print area */}
      <div id="print-area">
        {toPrint.map(g => (
          <div key={g.reservationId} className="nametag-card">
            <div className="nametag-hotel">HotelOS</div>
            <div className="nametag-name">{g.guestName}</div>
            <div className="nametag-room">Oda {g.roomNumber}{g.roomType ? ` · ${g.roomType}` : ''}</div>
            <div className="nametag-dates">{formatDate(g.checkIn)} – {formatDate(g.checkOut)}</div>
          </div>
        ))}
      </div>

      <style>{`
        .nametag-card {
          display: none;
        }
        @media print {
          .no-print { display: none !important; }
          .nametag-card {
            display: block;
            width: 85mm;
            height: 54mm;
            padding: 10mm 8mm;
            border: 1px solid #ccc;
            border-radius: 4mm;
            page-break-inside: avoid;
            margin: 4mm;
            float: left;
            box-sizing: border-box;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
          }
          .nametag-hotel {
            font-size: 8pt;
            color: #888;
            font-weight: 500;
            letter-spacing: 0.1em;
            text-transform: uppercase;
            margin-bottom: 3mm;
          }
          .nametag-name {
            font-size: 18pt;
            font-weight: 700;
            color: #111;
            margin-bottom: 2mm;
            line-height: 1.1;
          }
          .nametag-room {
            font-size: 11pt;
            font-weight: 600;
            color: #444;
            margin-bottom: 2mm;
          }
          .nametag-dates {
            font-size: 8pt;
            color: #888;
          }
        }
      `}</style>
    </>
  )
}
