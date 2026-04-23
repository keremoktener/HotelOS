// Brand mark — "HotelOS" wordmark with a glyph.
// Glyph: a small diamond "key" shape in brand accent.
function BrandMark({ size = 18, mono = false }) {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8, fontFamily: 'var(--font-display)', fontWeight: 600, letterSpacing: '-0.02em', fontSize: size }}>
      <span aria-hidden="true" style={{
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
        width: size * 1.25, height: size * 1.25,
        borderRadius: 'var(--radius)',
        background: mono ? 'var(--text)' : 'var(--accent)',
        color: mono ? 'var(--surface)' : 'var(--accent-fg)',
        position: 'relative',
      }}>
        <svg width={size * 0.85} height={size * 0.85} viewBox="0 0 24 24" fill="none">
          <path d="M4 14 L12 4 L20 14 L12 20 Z" fill="currentColor" opacity="0.95"/>
          <path d="M12 4 L12 20" stroke={mono ? 'var(--text-3)' : 'rgba(255,255,255,0.25)'} strokeWidth="1.2"/>
        </svg>
      </span>
      <span>Hotel<span style={{ opacity: 0.55 }}>OS</span></span>
    </span>
  );
}

window.BrandMark = BrandMark;
