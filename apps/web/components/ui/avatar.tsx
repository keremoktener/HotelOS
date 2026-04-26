export function Avatar({ initials, size = 32, tone = 'accent' }: {
  initials: string
  size?: number
  tone?: 'accent' | 'muted'
}) {
  const bg    = tone === 'accent' ? 'var(--accent-weak)' : 'var(--surface-2)'
  const color = tone === 'accent' ? 'var(--accent-c)'   : 'var(--text-3)'
  const fontSize = size <= 30 ? 11 : size <= 40 ? 13 : size <= 50 ? 16 : 20
  return (
    <div style={{ width: size, height: size, borderRadius: 999, background: bg, color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize, fontWeight: 600, flexShrink: 0 }}>
      {initials.slice(0, 2).toUpperCase()}
    </div>
  )
}
