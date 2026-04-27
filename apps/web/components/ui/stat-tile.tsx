import type { ReactNode } from 'react'

const TONE_MAP: Record<string, { color: string; bg: string }> = {
  good:    { color: 'var(--good)', bg: 'var(--good-bg)' },
  warn:    { color: 'var(--warn)', bg: 'var(--warn-bg)' },
  bad:     { color: 'var(--bad)',  bg: 'var(--bad-bg)'  },
  info:    { color: 'var(--info)', bg: 'var(--info-bg)' },
  neutral: { color: 'var(--text-2)', bg: 'var(--surface-2)' },
}

export function StatTile({ label, value, sub, trend, icon, color, bg, tone }: {
  label: string
  value: string | number
  sub?: string
  trend?: number
  icon?: ReactNode
  color?: string
  bg?: string
  tone?: string
}) {
  const resolved = tone ? (TONE_MAP[tone] ?? TONE_MAP.neutral) : null
  const iconColor = color ?? resolved?.color ?? 'var(--text-2)'
  const iconBg    = bg    ?? resolved?.bg    ?? 'var(--surface-2)'

  return (
    <div style={{ flex: 1, padding: '14px 16px', background: 'var(--surface)', border: '1px solid var(--border-c)', borderRadius: 10, minWidth: 0, boxShadow: 'var(--shadow-sm)' }}>
      {icon ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 36, height: 36, borderRadius: 8, background: iconBg, color: iconColor, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            {icon}
          </div>
          <div>
            <div style={{ fontSize: 11, color: 'var(--text-3)', letterSpacing: '0.03em', fontWeight: 500, textTransform: 'uppercase' }}>{label}</div>
            <div style={{ fontSize: 22, fontWeight: 600, letterSpacing: '-0.02em', color: 'var(--text)' }}>{value}</div>
          </div>
        </div>
      ) : (
        <>
          <div style={{ fontSize: 11, color: 'var(--text-3)', letterSpacing: '0.03em', fontWeight: 500, marginBottom: 6 }}>{label}</div>
          <div style={{ fontSize: 22, fontWeight: 600, letterSpacing: '-0.02em', color: 'var(--text)' }}>{value}</div>
          {(trend != null || sub) && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
              {trend != null && <span style={{ fontSize: 11, fontWeight: 500, color: trend >= 0 ? 'var(--good)' : 'var(--bad)' }}>{trend >= 0 ? '▲' : '▼'} {Math.abs(trend)}%</span>}
              {sub && <span style={{ fontSize: 11, color: 'var(--text-3)' }}>{sub}</span>}
            </div>
          )}
        </>
      )}
    </div>
  )
}
