// Shared app chrome: Sidebar, Topbar, Command Palette
// All components read theme tokens via CSS vars.

const { useState, useEffect, useRef, useMemo } = React;

// ───────── Primitives ─────────
function Chip({ tone = "neutral", children, dot, style = {} }) {
  const tones = {
    good:    { bg: 'var(--good-bg)',  fg: 'var(--good)',  bd: 'transparent' },
    warn:    { bg: 'var(--warn-bg)',  fg: 'var(--warn)',  bd: 'transparent' },
    bad:     { bg: 'var(--bad-bg)',   fg: 'var(--bad)',   bd: 'transparent' },
    info:    { bg: 'var(--info-bg)',  fg: 'var(--info)',  bd: 'transparent' },
    neutral: { bg: 'var(--surface-2)',fg: 'var(--text-2)',bd: 'transparent' },
    muted:   { bg: 'transparent',     fg: 'var(--text-3)',bd: 'var(--border)' },
    outline: { bg: 'transparent',     fg: 'var(--text-2)',bd: 'var(--border)' },
  }[tone] || { bg: 'var(--surface-2)', fg: 'var(--text-2)', bd: 'transparent' };
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 5,
      padding: '2px 8px', borderRadius: 999, fontSize: 11, fontWeight: 500,
      background: tones.bg, color: tones.fg, border: `1px solid ${tones.bd}`,
      whiteSpace: 'nowrap', lineHeight: 1.4, ...style,
    }}>
      {dot && <span style={{ width: 6, height: 6, borderRadius: 999, background: 'currentColor' }}/>}
      {children}
    </span>
  );
}

function Btn({ variant = "default", size = "md", icon, children, onClick, style = {}, disabled }) {
  const sizes = {
    sm: { padding: '4px 10px', fontSize: 12, height: 26, gap: 5 },
    md: { padding: '6px 12px', fontSize: 13, height: 32, gap: 6 },
    lg: { padding: '8px 16px', fontSize: 14, height: 38, gap: 8 },
  }[size];
  const variants = {
    default: { bg: 'var(--surface)', fg: 'var(--text)', bd: 'var(--border)', hover: 'var(--surface-2)' },
    primary: { bg: 'var(--accent)', fg: 'var(--accent-fg)', bd: 'var(--accent)', hover: 'var(--accent)' },
    ghost:   { bg: 'transparent', fg: 'var(--text-2)', bd: 'transparent', hover: 'var(--surface-2)' },
    danger:  { bg: 'var(--surface)', fg: 'var(--bad)', bd: 'var(--border)', hover: 'var(--bad-bg)' },
  }[variant];
  return (
    <button onClick={onClick} disabled={disabled} style={{
      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
      background: variants.bg, color: variants.fg,
      border: `1px solid ${variants.bd}`,
      borderRadius: 'var(--radius)',
      fontWeight: 500,
      fontFamily: 'inherit',
      boxShadow: variant === 'primary' ? 'var(--shadow-sm)' : 'none',
      cursor: disabled ? 'not-allowed' : 'pointer',
      opacity: disabled ? 0.5 : 1,
      transition: 'background 0.1s',
      ...sizes, ...style,
    }}>
      {icon}
      {children}
    </button>
  );
}

function Card({ children, title, right, style = {}, pad = true }) {
  return (
    <div style={{
      background: 'var(--surface)',
      border: '1px solid var(--border)',
      borderRadius: 'var(--radius-lg)',
      boxShadow: 'var(--shadow-sm)',
      ...style,
    }}>
      {title && (
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '14px 16px', borderBottom: '1px solid var(--border)',
        }}>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 14, fontWeight: 600, letterSpacing: '-0.01em' }}>{title}</div>
          {right}
        </div>
      )}
      <div style={{ padding: pad ? 16 : 0 }}>{children}</div>
    </div>
  );
}

// ───────── Sidebar ─────────
function Sidebar({ active, onNav, collapsed, onToggle }) {
  const groups = useMemo(() => {
    const m = new Map();
    TR.nav.forEach(n => { if (!m.has(n.group)) m.set(n.group, []); m.get(n.group).push(n); });
    return [...m.entries()];
  }, []);
  const w = collapsed ? 58 : 228;
  return (
    <aside style={{
      width: w, flex: `0 0 ${w}px`,
      borderRight: '1px solid var(--border)',
      background: 'var(--surface)',
      display: 'flex', flexDirection: 'column',
      transition: 'width 0.2s ease',
      height: '100%',
      overflow: 'hidden',
    }}>
      <div style={{
        padding: collapsed ? '14px 8px' : '14px 16px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        height: 56, borderBottom: '1px solid var(--border)',
      }}>
        {collapsed
          ? <BrandMark size={16}/>
          : <BrandMark size={15}/>}
        {!collapsed && (
          <button onClick={onToggle} style={{
            background: 'transparent', border: 0, color: 'var(--text-3)',
            padding: 4, borderRadius: 4, display: 'inline-flex',
          }}><Icons.ChevronLeft size={14}/></button>
        )}
      </div>
      <div style={{ flex: 1, overflowY: 'auto', padding: collapsed ? '8px 6px' : '10px 10px' }}>
        {groups.map(([g, items]) => (
          <div key={g} style={{ marginBottom: 14 }}>
            {!collapsed && (
              <div style={{
                fontSize: 10, fontWeight: 600, letterSpacing: '0.08em',
                color: 'var(--text-3)', textTransform: 'uppercase',
                padding: '6px 8px 4px',
              }}>{g}</div>
            )}
            {items.map(n => {
              const isActive = n.key === active;
              const iconEl = iconFor(n.key);
              return (
                <button
                  key={n.key}
                  onClick={() => !n.soon && onNav(n.key)}
                  title={n.label}
                  style={{
                    display: 'flex', alignItems: 'center',
                    justifyContent: collapsed ? 'center' : 'flex-start',
                    gap: 10,
                    width: '100%',
                    padding: collapsed ? '8px 0' : '7px 10px',
                    background: isActive ? 'var(--surface-2)' : 'transparent',
                    color: isActive ? 'var(--text)' : (n.soon ? 'var(--text-3)' : 'var(--text-2)'),
                    border: 0, borderRadius: 'var(--radius)',
                    fontSize: 13, fontWeight: isActive ? 600 : 450,
                    cursor: n.soon ? 'not-allowed' : 'pointer',
                    marginBottom: 1,
                    position: 'relative',
                    textAlign: 'left',
                  }}>
                  <span style={{ display: 'inline-flex', color: isActive ? 'var(--accent)' : 'currentColor', flexShrink: 0 }}>{iconEl}</span>
                  {!collapsed && <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{n.label}</span>}
                  {!collapsed && n.badge && (
                    <span style={{ fontSize: 10, padding: '1px 6px', borderRadius: 999, background: 'var(--accent)', color: 'var(--accent-fg)', fontWeight: 600 }}>{n.badge}</span>
                  )}
                  {!collapsed && n.soon && (
                    <span style={{ fontSize: 9, padding: '1px 5px', borderRadius: 3, color: 'var(--text-3)', border: '1px solid var(--border)', fontWeight: 500 }}>YAKINDA</span>
                  )}
                </button>
              );
            })}
          </div>
        ))}
      </div>
      {!collapsed && (
        <div style={{
          padding: 12, borderTop: '1px solid var(--border)',
          display: 'flex', alignItems: 'center', gap: 10,
        }}>
          <div style={{
            width: 28, height: 28, borderRadius: 999,
            background: 'var(--accent-weak)', color: 'var(--accent)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 12, fontWeight: 600,
          }}>AK</div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis' }}>Aylin Kurt</div>
            <div style={{ fontSize: 11, color: 'var(--text-3)', overflow: 'hidden', textOverflow: 'ellipsis' }}>Genel Müdür · {TR.hotel}</div>
          </div>
          <Icons.Settings size={14} color="var(--text-3)"/>
        </div>
      )}
    </aside>
  );
}
function iconFor(k) {
  const s = 15;
  const map = {
    dashboard: <Icons.Home size={s}/>,
    reservations: <Icons.Calendar size={s}/>,
    rooms: <Icons.Bed size={s}/>,
    guests: <Icons.Users size={s}/>,
    housekeeping: <Icons.Sparkles size={s}/>,
    maintenance: <Icons.Tool size={s}/>,
    agency: <Icons.Tag size={s}/>,
    accounting: <Icons.Receipt size={s}/>,
    hr: <Icons.Briefcase size={s}/>,
    reports: <Icons.BarChart size={s}/>,
    settings: <Icons.Settings size={s}/>,
  };
  return map[k] || <Icons.Dot size={s}/>;
}

// ───────── Topbar ─────────
function Topbar({ title, breadcrumb, onOpenCmd, sidebarCollapsed, onExpandSidebar, right, theme, onToggleTheme }) {
  return (
    <div style={{
      height: 56, flex: '0 0 56px',
      borderBottom: '1px solid var(--border)',
      background: 'var(--surface)',
      display: 'flex', alignItems: 'center', gap: 10,
      padding: '0 18px',
    }}>
      {sidebarCollapsed && (
        <button onClick={onExpandSidebar} style={{ background: 'transparent', border: 0, color: 'var(--text-3)', padding: 4, display: 'inline-flex' }}>
          <Icons.ChevronRight size={14}/>
        </button>
      )}
      <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 2, minWidth: 0 }}>
        {breadcrumb && <div style={{ fontSize: 11, lineHeight: 1.2, color: 'var(--text-3)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{breadcrumb}</div>}
        <div style={{ fontFamily: 'var(--font-display)', fontSize: 16, lineHeight: 1.2, fontWeight: 600, letterSpacing: '-0.01em' }}>{title}</div>
      </div>
      <div style={{ flex: 1 }}/>
      <button onClick={onOpenCmd} style={{
        height: 32, padding: '0 10px 0 10px',
        display: 'inline-flex', alignItems: 'center', gap: 8,
        background: 'var(--surface-2)', border: '1px solid var(--border)',
        borderRadius: 'var(--radius)', color: 'var(--text-3)', fontSize: 12,
        minWidth: 280, cursor: 'pointer',
      }}>
        <Icons.Search size={14}/>
        <span style={{ flex: 1, textAlign: 'left' }}>{TR.searchPlaceholder}</span>
        <kbd style={{
          fontFamily: 'var(--font-mono)', fontSize: 10,
          padding: '2px 5px', borderRadius: 3,
          background: 'var(--surface)', border: '1px solid var(--border)',
          color: 'var(--text-2)',
        }}>⌘K</kbd>
      </button>
      {right}
      {onToggleTheme && (
        <button onClick={onToggleTheme}
          title={theme === 'dark' ? 'Açık temaya geç' : 'Koyu temaya geç'}
          style={{ width: 32, height: 32, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', background: 'transparent', border: '1px solid var(--border)', borderRadius: 'var(--radius)', color: 'var(--text-2)' }}>
          {theme === 'dark' ? <Icons.Sun size={15}/> : <Icons.Moon size={15}/>}
        </button>
      )}
      <button style={{ width: 32, height: 32, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', background: 'transparent', border: '1px solid var(--border)', borderRadius: 'var(--radius)', color: 'var(--text-2)', position: 'relative' }}>
        <Icons.Bell size={15}/>
        <span style={{ position: 'absolute', top: 6, right: 7, width: 6, height: 6, borderRadius: 999, background: 'var(--bad)' }}/>
      </button>
    </div>
  );
}

// ───────── Command Palette (visual; not functional) ─────────
function CommandPalette({ open, onClose, onNav }) {
  if (!open) return null;
  const actions = [
    { group: 'Eylemler', items: [
      { icon: <Icons.Plus size={14}/>, label: 'Yeni rezervasyon oluştur', kbd: 'N' },
      { icon: <Icons.User size={14}/>, label: 'Yeni misafir ekle', kbd: 'G' },
      { icon: <Icons.Key size={14}/>, label: 'Check-in başlat', kbd: 'I' },
      { icon: <Icons.CreditCard size={14}/>, label: 'Ödeme linki gönder', kbd: 'P' },
    ]},
    { group: 'Git', items: [
      { icon: <Icons.Home size={14}/>, label: 'Özet', key: 'dashboard' },
      { icon: <Icons.Calendar size={14}/>, label: 'Rezervasyonlar', key: 'reservations' },
      { icon: <Icons.Bed size={14}/>, label: 'Odalar', key: 'rooms' },
      { icon: <Icons.Users size={14}/>, label: 'Misafirler', key: 'guests' },
    ]},
    { group: 'Misafirler', items: [
      { icon: <Icons.User size={14}/>, label: 'Elif Yıldız · VIP · 4 konaklama', key: 'guest:g1' },
      { icon: <Icons.User size={14}/>, label: 'Ahmet Kaya · VIP · 7 konaklama', key: 'guest:g4' },
      { icon: <Icons.User size={14}/>, label: 'Sofia Ricci · IT · Booking.com', key: 'guest:g3' },
    ]},
  ];
  return (
    <div onClick={onClose} style={{
      position: 'absolute', inset: 0, zIndex: 50,
      background: 'rgba(10,10,10,0.35)', backdropFilter: 'blur(2px)',
      display: 'flex', alignItems: 'flex-start', justifyContent: 'center',
      paddingTop: '10%',
    }}>
      <div onClick={e => e.stopPropagation()} style={{
        width: 540, background: 'var(--surface)', border: '1px solid var(--border)',
        borderRadius: 'var(--radius-lg)', boxShadow: '0 20px 60px rgba(0,0,0,0.25)',
        overflow: 'hidden',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px', borderBottom: '1px solid var(--border)' }}>
          <Icons.Search size={15} color="var(--text-3)"/>
          <input autoFocus placeholder={TR.searchPlaceholder} style={{
            flex: 1, border: 0, outline: 'none', background: 'transparent',
            fontSize: 14, color: 'var(--text)',
          }}/>
          <kbd style={{ fontFamily: 'var(--font-mono)', fontSize: 10, padding: '2px 5px', borderRadius: 3, background: 'var(--surface-2)', color: 'var(--text-3)' }}>ESC</kbd>
        </div>
        <div style={{ maxHeight: 380, overflowY: 'auto' }}>
          {actions.map(g => (
            <div key={g.group}>
              <div style={{ padding: '10px 16px 4px', fontSize: 10, fontWeight: 600, letterSpacing: '0.08em', color: 'var(--text-3)', textTransform: 'uppercase' }}>{g.group}</div>
              {g.items.map((it, i) => (
                <button key={i} onClick={() => { it.key?.startsWith?.('guest:') ? onNav('guests') : it.key && onNav(it.key); onClose(); }}
                  style={{
                    width: '100%', display: 'flex', alignItems: 'center', gap: 10,
                    padding: '9px 16px', background: 'transparent', border: 0,
                    color: 'var(--text)', fontSize: 13, cursor: 'pointer', textAlign: 'left',
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = 'var(--surface-2)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                >
                  <span style={{ color: 'var(--text-3)', display: 'inline-flex' }}>{it.icon}</span>
                  <span style={{ flex: 1 }}>{it.label}</span>
                  {it.kbd && <kbd style={{ fontFamily: 'var(--font-mono)', fontSize: 10, padding: '2px 5px', borderRadius: 3, background: 'var(--surface-2)', color: 'var(--text-3)' }}>{it.kbd}</kbd>}
                </button>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ───────── AppShell wrapper — for any screen ─────────
const ThemeCtx = React.createContext({ theme: 'light', onToggle: null });

function AppShell({ active, title, breadcrumb, topbarRight, children, onNav }) {
  const [collapsed, setCollapsed] = useState(false);
  const [cmd, setCmd] = useState(false);
  const { theme, onToggle } = React.useContext(ThemeCtx);
  return (
    <div style={{ display: 'flex', height: '100%', width: '100%', position: 'relative' }}>
      <Sidebar active={active} onNav={onNav || (() => {})} collapsed={collapsed} onToggle={() => setCollapsed(true)}/>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        <Topbar title={title} breadcrumb={breadcrumb} onOpenCmd={() => setCmd(true)}
          sidebarCollapsed={collapsed} onExpandSidebar={() => setCollapsed(false)}
          right={topbarRight}
          theme={theme} onToggleTheme={onToggle}/>
        <div style={{ flex: 1, overflow: 'hidden', background: 'var(--bg)' }}>
          {children}
        </div>
      </div>
      <CommandPalette open={cmd} onClose={() => setCmd(false)} onNav={onNav || (() => {})}/>
    </div>
  );
}

Object.assign(window, { Chip, Btn, Card, Sidebar, Topbar, CommandPalette, AppShell, ThemeCtx });
