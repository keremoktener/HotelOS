import type { ReactNode } from 'react'

const TONE_MAP: Record<string, { bg: string; fg: string }> = {
  good:    { bg: 'var(--good-bg)',    fg: 'var(--good)'   },
  warn:    { bg: 'var(--warn-bg)',    fg: 'var(--warn)'   },
  bad:     { bg: 'var(--bad-bg)',     fg: 'var(--bad)'    },
  info:    { bg: 'var(--info-bg)',    fg: 'var(--info)'   },
  neutral: { bg: 'var(--surface-2)', fg: 'var(--text-2)' },
  muted:   { bg: 'transparent',      fg: 'var(--text-3)' },
}

export function Chip({ tone = 'neutral', dot, children }: {
  tone?: string
  dot?: boolean
  children: ReactNode
}) {
  const t = TONE_MAP[tone] ?? TONE_MAP.neutral
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '2px 8px', borderRadius: 999, fontSize: 11, fontWeight: 500, background: t.bg, color: t.fg, whiteSpace: 'nowrap', lineHeight: 1.4 }}>
      {dot && <span style={{ width: 6, height: 6, borderRadius: 999, background: 'currentColor' }}/>}
      {children}
    </span>
  )
}
