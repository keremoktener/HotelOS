import type { CSSProperties, ReactNode } from 'react'

export const th: CSSProperties = {
  textAlign: 'left', padding: '10px 14px', fontSize: 11, fontWeight: 600,
  color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.05em',
  background: 'var(--surface-2)', whiteSpace: 'nowrap',
}

export const td: CSSProperties = {
  padding: '11px 14px', fontSize: 13, color: 'var(--text)', verticalAlign: 'middle',
}

export function DataTable({ children, scrollX }: { children: ReactNode; scrollX?: boolean }) {
  return (
    <div style={{ background: 'var(--surface)', border: '1px solid var(--border-c)', borderRadius: 10, overflow: 'hidden', boxShadow: 'var(--shadow-sm)' }}>
      <div style={scrollX ? { overflowX: 'auto' } : undefined}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          {children}
        </table>
      </div>
    </div>
  )
}
