'use client'

import { Sun, Moon, Bell, Search } from 'lucide-react'
import { useTheme } from '@/components/providers/theme-provider'
import { useShell } from './dashboard-shell'

interface Props {
  title: string
  breadcrumb?: React.ReactNode
  subtitle?: string
  right?: React.ReactNode
}

export function PageHeader({ title, breadcrumb, subtitle, right }: Props) {
  const { theme, toggle } = useTheme()
  const { setCmdOpen } = useShell()

  return (
    <div style={{
      height: 56, flexShrink: 0,
      borderBottom: '1px solid var(--border-c)',
      background: 'var(--surface)',
      display: 'flex', alignItems: 'center', gap: 10,
      padding: '0 18px',
    }}>
      <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 1, minWidth: 0 }}>
        {breadcrumb && <div style={{ fontSize: 11, lineHeight: 1.2, color: 'var(--text-3)' }}>{breadcrumb}</div>}
        <div style={{ fontSize: 16, lineHeight: 1.2, fontWeight: 600, letterSpacing: '-0.01em', color: 'var(--text)' }}>{title}</div>
        {subtitle && <div style={{ fontSize: 11, lineHeight: 1.2, color: 'var(--text-3)' }}>{subtitle}</div>}
      </div>
      <div style={{ flex: 1 }}/>
      <button onClick={() => setCmdOpen(true)} style={{ height: 32, padding: '0 10px', display: 'inline-flex', alignItems: 'center', gap: 8, background: 'var(--surface-2)', border: '1px solid var(--border-c)', borderRadius: 6, color: 'var(--text-3)', fontSize: 12, minWidth: 240, cursor: 'pointer' }}>
        <Search size={13}/>
        <span style={{ flex: 1, textAlign: 'left' }}>Rezervasyon, misafir, oda ara…</span>
        <kbd style={{ fontFamily: 'var(--font-mono)', fontSize: 10, padding: '2px 5px', borderRadius: 3, background: 'var(--surface)', border: '1px solid var(--border-c)', color: 'var(--text-2)' }}>⌘K</kbd>
      </button>
      {right && <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>{right}</div>}
      <button onClick={toggle} title={theme === 'dark' ? 'Açık tema' : 'Koyu tema'} style={{ width: 32, height: 32, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', background: 'transparent', border: '1px solid var(--border-c)', borderRadius: 6, color: 'var(--text-2)', cursor: 'pointer' }}>
        {theme === 'dark' ? <Sun size={14}/> : <Moon size={14}/>}
      </button>
      <button style={{ width: 32, height: 32, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', background: 'transparent', border: '1px solid var(--border-c)', borderRadius: 6, color: 'var(--text-2)', cursor: 'pointer', position: 'relative' }}>
        <Bell size={14}/>
        <span style={{ position: 'absolute', top: 6, right: 7, width: 6, height: 6, borderRadius: 999, background: 'var(--bad)' }}/>
      </button>
    </div>
  )
}
