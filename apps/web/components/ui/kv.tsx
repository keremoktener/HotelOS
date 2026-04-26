import type { CSSProperties, ReactNode } from 'react'

export const inputStyle: CSSProperties = {
  padding: '7px 10px', border: '1px solid var(--border-c)', borderRadius: 6,
  fontSize: 13, background: 'var(--bg)', color: 'var(--text)', outline: 'none',
  width: '100%', boxSizing: 'border-box',
}

/** Vertical key-value pair for use inside a CSS grid. `full` spans all columns. */
export function KV({ label, children, full }: { label: string; children: ReactNode; full?: boolean }) {
  return (
    <div style={{ gridColumn: full ? '1 / -1' : 'auto' }}>
      <div style={{ fontSize: 11, color: 'var(--text-3)', marginBottom: 3 }}>{label}</div>
      <div style={{ fontSize: 13, color: 'var(--text)' }}>{children}</div>
    </div>
  )
}

/** Horizontal label–value row for use inside a SectionCard. */
export function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', padding: '12px 16px', borderBottom: '1px solid var(--border-c)', gap: 16 }}>
      <div style={{ fontSize: 12, color: 'var(--text-3)', fontWeight: 500, minWidth: 240, flexShrink: 0 }}>{label}</div>
      <div style={{ fontSize: 13, color: 'var(--text)' }}>{children}</div>
    </div>
  )
}

/** Form field with label above input. */
export function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <label style={{ fontSize: 11, fontWeight: 500, color: 'var(--text-3)' }}>{label}</label>
      {children}
    </div>
  )
}
