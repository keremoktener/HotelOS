import type { ReactNode, CSSProperties, ButtonHTMLAttributes } from 'react'

interface BtnProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children'> {
  variant?: 'primary' | 'secondary' | 'ghost'
  size?: 'md' | 'sm'
  icon?: ReactNode
  iconRight?: ReactNode
  destructive?: boolean
  children?: ReactNode
  style?: CSSProperties
}

export function Btn({ variant = 'secondary', size = 'md', icon, iconRight, destructive, children, disabled, style: extra, ...rest }: BtnProps) {
  const h = size === 'sm' ? 24 : 28
  const padX = size === 'sm' ? 10 : 12
  const fontSize = size === 'sm' ? 11.5 : 12.5

  const base: CSSProperties = {
    display: 'inline-flex', alignItems: 'center', gap: 6,
    height: h, padding: `0 ${padX}px`,
    fontSize, fontWeight: variant === 'primary' ? 600 : 500,
    borderRadius: 6, border: '1px solid transparent',
    cursor: disabled ? 'default' : 'pointer',
    opacity: disabled ? 0.55 : 1,
    whiteSpace: 'nowrap', lineHeight: 1,
    transition: 'background 0.08s ease',
    background: 'transparent', color: 'inherit',
  }

  let look: CSSProperties
  if (variant === 'primary') {
    look = { background: destructive ? 'var(--bad)' : 'var(--accent-c)', color: 'var(--accent-fg)', borderColor: 'transparent' }
  } else if (variant === 'ghost') {
    look = { background: 'transparent', color: destructive ? 'var(--bad)' : 'var(--text-2)', borderColor: 'transparent' }
  } else {
    look = { background: 'var(--surface)', color: destructive ? 'var(--bad)' : 'var(--text-2)', borderColor: 'var(--border-c)' }
  }

  return (
    <button disabled={disabled} style={{ ...base, ...look, ...extra }} {...rest}>
      {icon}
      {children}
      {iconRight}
    </button>
  )
}
