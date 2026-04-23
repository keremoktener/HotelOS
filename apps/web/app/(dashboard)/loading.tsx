export default function Loading() {
  return (
    <div style={{ height: 'calc(100% - 56px)', padding: 24 }}>
      <div style={{ height: 40, width: 200, background: 'var(--surface-2)', borderRadius: 6, marginBottom: 24, animation: 'pulse 1.5s ease-in-out infinite' }}/>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 16 }}>
        {[...Array(4)].map((_, i) => (
          <div key={i} style={{ height: 80, background: 'var(--surface-2)', borderRadius: 10, animation: 'pulse 1.5s ease-in-out infinite', animationDelay: `${i * 0.1}s` }}/>
        ))}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 16 }}>
        <div style={{ background: 'var(--surface-2)', borderRadius: 10, height: 400, animation: 'pulse 1.5s ease-in-out infinite', animationDelay: '0.2s' }}/>
        <div style={{ background: 'var(--surface-2)', borderRadius: 10, height: 240, animation: 'pulse 1.5s ease-in-out infinite', animationDelay: '0.3s' }}/>
      </div>
      <style>{`@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.4} }`}</style>
    </div>
  )
}
