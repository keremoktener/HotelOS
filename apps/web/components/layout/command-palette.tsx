'use client'

import { useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Search, Plus, User, Key, Home, Calendar, Bed, Users } from 'lucide-react'

const ACTIONS = [
  {
    group: 'Eylemler',
    items: [
      { icon: Plus,     label: 'Yeni rezervasyon oluştur', href: '/reservation/new', kbd: 'N' },
      { icon: User,     label: 'Yeni misafir ekle',        href: '/guests/new',      kbd: 'G' },
      { icon: Key,      label: 'Check-in başlat',          href: '/reservation',     kbd: 'I' },
    ],
  },
  {
    group: 'Git',
    items: [
      { icon: Home,     label: 'Özet',          href: '/' },
      { icon: Calendar, label: 'Rezervasyonlar', href: '/reservation' },
      { icon: Bed,      label: 'Odalar',         href: '/rooms' },
      { icon: Users,    label: 'Misafirler',     href: '/guests' },
    ],
  },
]

interface Props { open: boolean; onClose: () => void }

export function CommandPalette({ open, onClose }: Props) {
  const router = useRouter()
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (open) inputRef.current?.focus()
  }, [open])

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') { e.preventDefault(); onClose() }
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])

  if (!open) return null

  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 50, background: 'rgba(10,10,10,0.35)', backdropFilter: 'blur(2px)', display: 'flex', alignItems: 'flex-start', justifyContent: 'center', paddingTop: '10%' }}>
      <div onClick={e => e.stopPropagation()} style={{ width: 540, background: 'var(--surface)', border: '1px solid var(--border-c)', borderRadius: 10, boxShadow: '0 20px 60px rgba(0,0,0,0.25)', overflow: 'hidden' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px', borderBottom: '1px solid var(--border-c)' }}>
          <Search size={15} style={{ color: 'var(--text-3)' }}/>
          <input ref={inputRef} placeholder="Rezervasyon, misafir, oda ara…" style={{ flex: 1, border: 0, outline: 'none', background: 'transparent', fontSize: 14, color: 'var(--text)' }}/>
          <kbd style={{ fontFamily: 'var(--font-mono)', fontSize: 10, padding: '2px 5px', borderRadius: 3, background: 'var(--surface-2)', color: 'var(--text-3)' }}>ESC</kbd>
        </div>
        <div style={{ maxHeight: 380, overflowY: 'auto' }}>
          {ACTIONS.map(g => (
            <div key={g.group}>
              <div style={{ padding: '10px 16px 4px', fontSize: 10, fontWeight: 600, letterSpacing: '0.08em', color: 'var(--text-3)', textTransform: 'uppercase' }}>{g.group}</div>
              {g.items.map((item, i) => {
                const Icon = item.icon
                return (
                  <button key={i}
                    onClick={() => { router.push(item.href); onClose() }}
                    style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 10, padding: '9px 16px', background: 'transparent', border: 0, color: 'var(--text)', fontSize: 13, cursor: 'pointer', textAlign: 'left' }}
                    onMouseEnter={e => (e.currentTarget.style.background = 'var(--surface-2)')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                  >
                    <Icon size={14} style={{ color: 'var(--text-3)' }}/>
                    <span style={{ flex: 1 }}>{item.label}</span>
                    {'kbd' in item && item.kbd && <kbd style={{ fontFamily: 'var(--font-mono)', fontSize: 10, padding: '2px 5px', borderRadius: 3, background: 'var(--surface-2)', color: 'var(--text-3)' }}>{item.kbd}</kbd>}
                  </button>
                )
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
