// HotelOS — root app. Uses DesignCanvas to present Phase 1 screens as artboards.
// A Tweaks panel (top-right) lets the user switch aesthetic direction.

const { useState: useA, useEffect: useE } = React;

const THEMES = [
  { key: 'light', name: 'Light',  sub: 'Enterprise Quiet · açık tema' },
  { key: 'dark',  name: 'Dark',   sub: 'Aynı dil · koyu tema' },
];

function Frame({ w, h, theme, children }) {
  // A wrapper that sizes its inside to the artboard and applies the theme class.
  return (
    <div className={`app-root theme-${theme}`} style={{ width: w, height: h }}>
      {children}
    </div>
  );
}

// Navigation helper for in-artboard clicks — noop since artboards are static.
const nav = () => {};

function App() {
  // theme + in-panel view via tweak state
  const [theme, setTheme] = useA((window.__TWEAK_DEFAULTS && window.__TWEAK_DEFAULTS.theme) || 'light');
  const [tweaksOpen, setTweaksOpen] = useA(false);

  // Tweaks integration
  useE(() => {
    const handler = (e) => {
      if (!e.data) return;
      if (e.data.type === '__activate_edit_mode') setTweaksOpen(true);
      if (e.data.type === '__deactivate_edit_mode') setTweaksOpen(false);
    };
    window.addEventListener('message', handler);
    window.parent.postMessage({ type: '__edit_mode_available' }, '*');
    return () => window.removeEventListener('message', handler);
  }, []);

  const setThemeAndPersist = (t) => {
    setTheme(t);
    window.parent.postMessage({ type: '__edit_mode_set_keys', edits: { theme: t } }, '*');
  };

  // Artboard sizes — 1440×900 feels true to desktop SaaS
  const W = 1440, H = 900;
  const SMALL_H = 820;

  return (
    <ThemeCtx.Provider value={{ theme, onToggle: () => setThemeAndPersist(theme === 'dark' ? 'light' : 'dark') }}>
      <DesignCanvas>
        <DCSection id="overview" title="HotelOS · Phase 1" subtitle="Multi-tenant otel yönetim SaaS · Faz 1 ekranları · Türkçe · 3 estetik yön (Tweaks)">
          <DCArtboard id="dashboard" label="01 · Özet / Dashboard" width={W} height={H}>
            <Frame w={W} h={H} theme={theme}><Dashboard onNav={nav}/></Frame>
          </DCArtboard>

          <DCArtboard id="reservations" label="02 · Rezervasyonlar · Liste" width={W} height={H}>
            <Frame w={W} h={H} theme={theme}><ReservationList onNav={nav}/></Frame>
          </DCArtboard>

          <DCArtboard id="reservation-detail" label="03 · Rezervasyon · Detay · Check-in" width={W} height={H}>
            <Frame w={W} h={H} theme={theme}><ReservationDetail rid="R-24851" onNav={nav}/></Frame>
          </DCArtboard>

          <DCArtboard id="rooms" label="04 · Odalar · Durum ızgarası" width={W} height={H}>
            <Frame w={W} h={H} theme={theme}><Rooms onNav={nav}/></Frame>
          </DCArtboard>

          <DCArtboard id="guest" label="05 · Misafir profili · Geçmiş" width={W} height={H}>
            <Frame w={W} h={H} theme={theme}><GuestProfile gid="g1" onNav={nav}/></Frame>
          </DCArtboard>

          <DCArtboard id="reservation-create" label="07 · Yeni rezervasyon · Sihirbaz (2/4)" width={W} height={H}>
            <Frame w={W} h={H} theme={theme}><ReservationCreate onNav={nav}/></Frame>
          </DCArtboard>

          <DCArtboard id="onboarding" label="06 · Kurulum sihirbazı · Adım 3/5" width={W} height={SMALL_H}>
            <Frame w={W} h={SMALL_H} theme={theme}><Onboarding onNav={nav}/></Frame>
          </DCArtboard>

          <DCArtboard id="audit-log" label="08 · Denetim kaydı / Audit log" width={W} height={H}>
            <Frame w={W} h={H} theme={theme}><AuditLog onNav={nav}/></Frame>
          </DCArtboard>
        </DCSection>
      </DesignCanvas>

      {/* Tweaks panel */}
      <div className={`tweaks-panel ${tweaksOpen ? 'open' : ''}`}>
        <h4>Tweaks</h4>
        <div className="row">
          <label>Estetik yön</label>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {THEMES.map(t => (
              <button key={t.key}
                onClick={() => setThemeAndPersist(t.key)}
                style={{
                  display: 'flex', flexDirection: 'column', alignItems: 'flex-start',
                  textAlign: 'left', gap: 2,
                  padding: '8px 10px',
                  background: theme === t.key ? '#3f3f46' : '#27272a',
                  color: '#fff', border: theme === t.key ? '1px solid #71717a' : '1px solid transparent',
                  borderRadius: 6, cursor: 'pointer',
                }}>
                <span style={{ fontSize: 12, fontWeight: 600 }}>{t.name}</span>
                <span style={{ fontSize: 10, color: '#a1a1aa' }}>{t.sub}</span>
              </button>
            ))}
          </div>
        </div>
        <div style={{ fontSize: 10, color: '#71717a', marginTop: 10, lineHeight: 1.5 }}>
          Seçim canlı olarak tüm artboard'lara uygulanır · Seçim dosyaya kaydedilir
        </div>
      </div>
    </ThemeCtx.Provider>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App/>);
