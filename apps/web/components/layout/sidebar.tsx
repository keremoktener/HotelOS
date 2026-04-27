'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  Home, Calendar, Bed, Users, Sparkles, Wrench, Tag,
  Receipt, Briefcase, BarChart2, Settings, ChevronLeft, ChevronRight, FileText, PackageSearch, UtensilsCrossed, Shield,
  type LucideIcon,
} from 'lucide-react'

interface NavItem { key: string; label: string; href: string; icon: LucideIcon; badge?: number; soon?: boolean }

const NAV: { group: string; items: NavItem[] }[] = [
  {
    group: 'Operasyon',
    items: [
      { key: 'dashboard',     label: 'Özet',            href: '/',              icon: Home },
      { key: 'reservations',  label: 'Rezervasyonlar',  href: '/reservation',   icon: Calendar, badge: 4 },
      { key: 'rooms',         label: 'Odalar',          href: '/rooms',         icon: Bed },
      { key: 'guests',        label: 'Misafirler',      href: '/guests',        icon: Users },
      { key: 'housekeeping',  label: 'Kat Hizmetleri',  href: '/housekeeping',  icon: Sparkles },
      { key: 'lost-found',    label: 'Kayıp & Bulunan', href: '/lost-found',    icon: PackageSearch },
      { key: 'maintenance',   label: 'Teknik Servis',   href: '/maintenance',   icon: Wrench },
      { key: 'fnb',           label: 'Yiyecek & İçecek', href: '/fnb',           icon: UtensilsCrossed },
      { key: 'kbs',           label: 'KBS / Jandarma',   href: '/kbs',           icon: Shield },
    ],
  },
  {
    group: 'Ticari',
    items: [
      { key: 'agency',      label: 'Acente & Fiyat', href: '/agency',      icon: Tag,      soon: true },
      { key: 'accounting',  label: 'Muhasebe',       href: '/accounting',  icon: Receipt,  soon: true },
      { key: 'hr',          label: 'İnsan Kaynakları',href: '/hr',          icon: Briefcase,soon: true },
      { key: 'reports',     label: 'Raporlar',       href: '/reports',     icon: BarChart2,soon: true },
    ],
  },
  {
    group: 'Sistem',
    items: [
      { key: 'settings',   label: 'Ayarlar',         href: '/settings',            icon: Settings },
      { key: 'audit-log',  label: 'Denetim kaydı',   href: '/settings/audit-log',  icon: FileText },
    ],
  },
]

interface Props {
  collapsed: boolean
  onToggle: () => void
  userName?: string
  orgName?: string
}

export function Sidebar({ collapsed, onToggle, userName = 'Kullanıcı', orgName = '' }: Props) {
  const pathname = usePathname()
  const w = collapsed ? 58 : 228

  function isActive(href: string) {
    if (href === '/') return pathname === '/'
    return pathname.startsWith(href)
  }

  const initials = userName.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()

  return (
    <aside style={{
      width: w, flexShrink: 0,
      borderRight: '1px solid var(--border-c)',
      background: 'var(--surface)',
      display: 'flex', flexDirection: 'column',
      transition: 'width 0.2s ease',
      height: '100%', overflow: 'hidden',
    }}>
      {/* Logo row */}
      <div style={{
        padding: collapsed ? '14px 10px' : '14px 16px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        height: 56, borderBottom: '1px solid var(--border-c)', flexShrink: 0,
      }}>
        {!collapsed ? (
          <>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8, fontWeight: 600, letterSpacing: '-0.02em', fontSize: 16 }}>
              <span style={{ width: 22, height: 22, borderRadius: 5, background: 'var(--accent-c)', color: 'var(--accent-fg)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M4 14 L12 4 L20 14 L12 20 Z" opacity="0.95"/>
                </svg>
              </span>
              <span style={{ color: 'var(--text)' }}>Hotel<span style={{ opacity: 0.45 }}>OS</span></span>
            </span>
            <button onClick={onToggle} style={{ background: 'transparent', border: 0, color: 'var(--text-3)', padding: 4, borderRadius: 4, cursor: 'pointer', display: 'inline-flex' }}>
              <ChevronLeft size={14}/>
            </button>
          </>
        ) : (
          <div style={{ width: '100%', display: 'flex', justifyContent: 'center' }}>
            <span style={{ width: 22, height: 22, borderRadius: 5, background: 'var(--accent-c)', color: 'var(--accent-fg)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
                <path d="M4 14 L12 4 L20 14 L12 20 Z" opacity="0.95"/>
              </svg>
            </span>
          </div>
        )}
      </div>

      {/* Nav */}
      <div style={{ flex: 1, overflowY: 'auto', padding: collapsed ? '8px 6px' : '10px 10px' }}>
        {NAV.map(({ group, items }) => (
          <div key={group} style={{ marginBottom: 14 }}>
            {!collapsed && (
              <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.08em', color: 'var(--text-3)', textTransform: 'uppercase', padding: '6px 8px 4px' }}>{group}</div>
            )}
            {items.map(({ key, label, href, icon: Icon, badge, soon }) => {
              const active = isActive(href)
              return (
                <Link key={key} href={soon ? '#' : href}
                  style={{
                    display: 'flex', alignItems: 'center',
                    justifyContent: collapsed ? 'center' : 'flex-start',
                    gap: 10, width: '100%',
                    padding: collapsed ? '8px 0' : '7px 10px',
                    background: active ? 'var(--surface-2)' : 'transparent',
                    color: active ? 'var(--text)' : soon ? 'var(--text-3)' : 'var(--text-2)',
                    borderRadius: 6, fontSize: 13, fontWeight: active ? 600 : 450,
                    marginBottom: 1, textDecoration: 'none',
                    cursor: soon ? 'not-allowed' : 'pointer',
                    opacity: soon ? 0.6 : 1,
                  }}
                  title={label}
                >
                  <Icon size={15} style={{ color: active ? 'var(--accent-c)' : 'currentColor', flexShrink: 0 }}/>
                  {!collapsed && (
                    <>
                      <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{label}</span>
                      {badge && <span style={{ fontSize: 10, padding: '1px 6px', borderRadius: 999, background: 'var(--accent-c)', color: 'var(--accent-fg)', fontWeight: 600 }}>{badge}</span>}
                      {soon && <span style={{ fontSize: 9, padding: '1px 5px', borderRadius: 3, color: 'var(--text-3)', border: '1px solid var(--border-c)', fontWeight: 500 }}>YAKINDA</span>}
                    </>
                  )}
                </Link>
              )
            })}
          </div>
        ))}
      </div>

      {/* User footer */}
      {!collapsed && (
        <div style={{ padding: 12, borderTop: '1px solid var(--border-c)', display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
          <div style={{ width: 28, height: 28, borderRadius: 999, background: 'var(--accent-weak)', color: 'var(--accent-c)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 600, flexShrink: 0 }}>{initials}</div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{userName}</div>
            {orgName && <div style={{ fontSize: 11, color: 'var(--text-3)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{orgName}</div>}
          </div>
          <Settings size={14} style={{ color: 'var(--text-3)', flexShrink: 0 }}/>
        </div>
      )}

      {/* Expand button when collapsed */}
      {collapsed && (
        <div style={{ padding: '12px 6px', borderTop: '1px solid var(--border-c)', display: 'flex', justifyContent: 'center', flexShrink: 0 }}>
          <button onClick={onToggle} style={{ background: 'transparent', border: 0, color: 'var(--text-3)', padding: 4, borderRadius: 4, cursor: 'pointer', display: 'inline-flex' }}>
            <ChevronRight size={14}/>
          </button>
        </div>
      )}
    </aside>
  )
}
