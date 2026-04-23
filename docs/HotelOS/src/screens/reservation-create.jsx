// Reservation Create Wizard — Phase 1 gap
// Multi-step: dates → guest → room → price preview → confirm
// Shows guest autocomplete popover pattern inline.

const { useState: useRC } = React;

function ReservationCreate({ onNav }) {
  const [step, setStep] = useRC(2); // show step 2 (guest) — the most interesting

  const steps = [
    { n: 1, title: 'Tarih & misafir sayısı', done: true },
    { n: 2, title: 'Misafir', current: true },
    { n: 3, title: 'Oda seçimi' },
    { n: 4, title: 'Fiyat & onay' },
  ];

  return (
    <AppShell active="reservations" title="Yeni rezervasyon"
      breadcrumb={<><span onClick={() => onNav && onNav('reservations')} style={{cursor:'pointer'}}>Rezervasyonlar</span> · Yeni</>}
      onNav={onNav}
      topbarRight={<>
        <Btn size="md" variant="ghost">İptal</Btn>
        <Btn size="md" variant="default">Taslak olarak kaydet</Btn>
      </>}>

      <div style={{ height: '100%', overflowY: 'auto', padding: 24, display: 'flex', gap: 20 }}>
        {/* Step rail */}
        <div style={{ width: 220, flexShrink: 0 }}>
          <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--text-3)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 10 }}>Adım {step} / 4</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {steps.map(s => (
              <div key={s.n} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 10px', borderRadius: 6, background: s.current ? 'var(--accent-weak)' : 'transparent' }}>
                <div style={{
                  width: 20, height: 20, borderRadius: 999,
                  background: s.done ? 'var(--good)' : s.current ? 'var(--accent)' : 'var(--surface-2)',
                  color: (s.done || s.current) ? 'var(--accent-fg)' : 'var(--text-3)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 10, fontWeight: 600, flexShrink: 0,
                }}>{s.done ? <Icons.Check size={11}/> : s.n}</div>
                <div style={{ fontSize: 12, fontWeight: s.current ? 600 : 450, color: s.current ? 'var(--text)' : s.done ? 'var(--text-2)' : 'var(--text-3)' }}>{s.title}</div>
              </div>
            ))}
          </div>

          {/* Mini summary so far */}
          <div style={{ marginTop: 16, padding: 12, background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8 }}>
            <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--text-3)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 8 }}>Özet</div>
            <SumRow k="Giriş" v="23 Nis 2026" mono/>
            <SumRow k="Çıkış" v="27 Nis 2026" mono/>
            <SumRow k="Gece" v="4" mono/>
            <SumRow k="Yetişkin" v="2"/>
            <SumRow k="Çocuk" v="0"/>
            <div style={{ height: 1, background: 'var(--border)', margin: '8px 0' }}/>
            <SumRow k="Misafir" v="—" muted/>
            <SumRow k="Oda" v="—" muted/>
            <SumRow k="Acente" v="—" muted/>
          </div>
        </div>

        {/* Main panel */}
        <div style={{ flex: 1, maxWidth: 780 }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--accent)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 6 }}>Adım 2 · Misafir</div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 26, fontWeight: 600, letterSpacing: '-0.02em', margin: 0, marginBottom: 4 }}>Misafiri seçin veya ekleyin</h1>
          <p style={{ fontSize: 13, color: 'var(--text-2)', margin: 0, marginBottom: 20 }}>Mevcut misafiri arayın. Kayıtlı değilse yeni misafir oluşturabilirsiniz. KBS bildirimi için TC / pasaport bilgisi zorunludur.</p>

          {/* Search + autocomplete popover (open by default for design) */}
          <div style={{ position: 'relative', marginBottom: 14 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, height: 40, padding: '0 12px', background: 'var(--surface)', border: '1px solid var(--accent)', boxShadow: '0 0 0 3px var(--accent-weak)', borderRadius: 'var(--radius)' }}>
              <Icons.Search size={15} color="var(--text-2)"/>
              <input defaultValue="eli" placeholder="Ad, soyad, TC, telefon veya e-posta" style={{ flex: 1, border: 0, background: 'transparent', outline: 'none', color: 'var(--text)', fontSize: 14 }}/>
              <kbd style={{ fontFamily: 'var(--font-mono)', fontSize: 10, padding: '2px 5px', borderRadius: 3, background: 'var(--surface-2)', border: '1px solid var(--border)', color: 'var(--text-2)' }}>↵</kbd>
            </div>

            {/* Autocomplete popover */}
            <div style={{
              position: 'absolute', top: 46, left: 0, right: 0,
              background: 'var(--surface)', border: '1px solid var(--border)',
              borderRadius: 'var(--radius-lg)',
              boxShadow: '0 12px 40px rgba(0,0,0,0.15)',
              zIndex: 20, overflow: 'hidden',
            }}>
              <div style={{ padding: '8px 14px', fontSize: 10, fontWeight: 600, color: 'var(--text-3)', letterSpacing: '0.08em', textTransform: 'uppercase', background: 'var(--surface-2)' }}>2 eşleşme · "eli"</div>
              {[
                { name: 'Elif Yıldız', meta: '+90 532 418 22 61 · 4 konaklama · VIP', highlight: 'Eli' },
                { name: 'Elise Monet', meta: 'FR · elise.monet@mail.com · 1 konaklama', highlight: 'Eli' },
              ].map((g, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', background: i === 0 ? 'var(--accent-weak)' : 'transparent', borderTop: i ? '1px solid var(--border)' : 0, cursor: 'pointer' }}>
                  <Avatar name={g.name} size={32}/>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 600 }}><mark style={{ background: 'var(--accent)', color: 'var(--accent-fg)', padding: '0 2px', borderRadius: 2 }}>{g.highlight}</mark>{g.name.slice(g.highlight.length)}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-2)' }}>{g.meta}</div>
                  </div>
                  {i === 0 && <Chip tone="neutral">↵ Seç</Chip>}
                  <Icons.ChevronRight size={13} color="var(--text-3)"/>
                </div>
              ))}
              <div style={{ borderTop: '1px solid var(--border)', padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 10, fontSize: 12, color: 'var(--text-2)', cursor: 'pointer' }}>
                <Icons.Plus size={14}/>
                <span>"eli" için yeni misafir oluştur</span>
                <div style={{ flex: 1 }}/>
                <kbd style={{ fontFamily: 'var(--font-mono)', fontSize: 10, padding: '2px 5px', borderRadius: 3, background: 'var(--surface-2)', border: '1px solid var(--border)', color: 'var(--text-2)' }}>⌘N</kbd>
              </div>
            </div>
          </div>

          {/* Selected guest card (placeholder below the popover) */}
          <div style={{ marginTop: 140 /* pushes below the popover visually */ }}>
            <Card title="Seçilen misafir" right={<Btn size="sm" variant="ghost" icon={<Icons.X size={12}/>}>Kaldır</Btn>}>
              <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
                <Avatar name="Elif Yıldız" size={52}/>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ fontSize: 15, fontWeight: 600 }}>Elif Yıldız</div>
                    <Chip tone="warn" dot>VIP</Chip>
                    <Chip tone="good">KVKK ✓</Chip>
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--text-2)', marginTop: 2 }}>TC: •••••••9834 · +90 532 418 22 61 · elif.yildiz@mail.com</div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginTop: 12 }}>
                    <Metric k="Toplam konaklama" v="4"/>
                    <Metric k="Toplam gelir" v="₺38.400"/>
                    <Metric k="Son konaklama" v="Kas 2025"/>
                    <Metric k="Ortalama puan" v="4.8 / 5"/>
                  </div>
                </div>
              </div>
              <div style={{ marginTop: 14, padding: '10px 12px', background: 'var(--good-bg)', color: 'var(--good)', borderRadius: 'var(--radius)', fontSize: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
                <Icons.Shield size={14}/>
                <span style={{ color: 'var(--text)' }}><b>Kara liste kontrolü:</b> misafir kara listede değil.</span>
              </div>
            </Card>
          </div>

          {/* Footer */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 24, paddingTop: 18, borderTop: '1px solid var(--border)' }}>
            <Btn size="lg" variant="ghost" icon={<Icons.ChevronLeft size={14}/>}>Geri</Btn>
            <Btn size="lg" variant="primary">Devam: Oda seç <Icons.ChevronRight size={14}/></Btn>
          </div>
        </div>
      </div>
    </AppShell>
  );
}

function SumRow({ k, v, mono, muted }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', padding: '3px 0', fontSize: 12 }}>
      <span style={{ color: 'var(--text-3)' }}>{k}</span>
      <span style={{ fontFamily: mono ? 'var(--font-mono)' : 'inherit', color: muted ? 'var(--text-3)' : 'var(--text)', fontWeight: muted ? 400 : 500 }}>{v}</span>
    </div>
  );
}

function Metric({ k, v }) {
  return (
    <div>
      <div style={{ fontSize: 10, color: 'var(--text-3)', fontWeight: 600, letterSpacing: '0.04em', textTransform: 'uppercase' }}>{k}</div>
      <div style={{ fontSize: 14, fontWeight: 600, fontFamily: 'var(--font-mono)', marginTop: 2 }}>{v}</div>
    </div>
  );
}

function Avatar({ name, size = 40 }) {
  const i = (name || '?').split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();
  return (
    <div style={{
      width: size, height: size, borderRadius: 999,
      background: 'var(--accent-weak)', color: 'var(--accent)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: size * 0.38, fontWeight: 600, flexShrink: 0,
    }}>{i}</div>
  );
}

window.ReservationCreate = ReservationCreate;
