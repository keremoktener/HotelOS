import type { ReactNode } from 'react'

export function SectionCard({ title, right, children }: {
  title: string
  right?: ReactNode
  children: ReactNode
}) {
  return (
    <div style={{ background: 'var(--surface)', border: '1px solid var(--border-c)', borderRadius: 10, overflow: 'hidden', boxShadow: 'var(--shadow-sm)' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px', borderBottom: '1px solid var(--border-c)' }}>
        <div style={{ fontWeight: 600, fontSize: 14, color: 'var(--text)' }}>{title}</div>
        {right && <div style={{ fontSize: 12, color: 'var(--text-3)' }}>{right}</div>}
      </div>
      {children}
    </div>
  )
}
