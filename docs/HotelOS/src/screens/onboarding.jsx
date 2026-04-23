// Onboarding / setup wizard — step 3/5 shown
const { useState: useOS } = React;

function Onboarding({ onNav }) {
  const [step, setStep] = useOS(4);
  const steps = [
    { n: 1, title: 'Otel bilgileri',      done: true },
    { n: 2, title: 'Oda tipleri',         done: true },
    { n: 3, title: 'Odalar & katlar',     done: true },
    { n: 4, title: 'Operasyon kuralları', done: false, current: true },
    { n: 5, title: 'Kanal & fiyatlar',    done: false },
    { n: 6, title: 'Ekip & yetkiler',     done: false },
  ];
  if (step === 4) return <OnboardingSettings onNav={onNav} steps={steps}/>;
  return (
    <div className="app-root" style={{ background: 'var(--bg)' }}>
      <div style={{ height: 56, borderBottom: '1px solid var(--border)', background: 'var(--surface)', display: 'flex', alignItems: 'center', padding: '0 24px', gap: 16 }}>
        <BrandMark size={15}/>
        <div style={{ width: 1, height: 20, background: 'var(--border)' }}/>
        <div style={{ fontSize: 13, color: 'var(--text-2)' }}>Kurulum sihirbazı · {TR.hotel}</div>
        <div style={{ flex: 1 }}/>
        <Btn size="sm" variant="ghost">Çıkış</Btn>
      </div>

      <div style={{ flex: 1, overflow: 'auto', display: 'flex' }}>
        {/* Left rail: steps */}
        <div style={{ width: 260, borderRight: '1px solid var(--border)', background: 'var(--surface)', padding: 20 }}>
          <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--text-3)', letterSpacing: '0.08em', marginBottom: 12, textTransform: 'uppercase' }}>Adım {step} / {steps.length}</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2, position: 'relative' }}>
            {steps.map((s, i) => (
              <div key={s.n} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 8px', borderRadius: 6, background: s.current ? 'var(--accent-weak)' : 'transparent' }}>
                <div style={{
                  width: 22, height: 22, borderRadius: 999,
                  background: s.done ? 'var(--good)' : s.current ? 'var(--accent)' : 'var(--surface-2)',
                  color: s.done || s.current ? 'var(--accent-fg)' : 'var(--text-3)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 11, fontWeight: 600, flexShrink: 0,
                }}>
                  {s.done ? <Icons.Check size={12}/> : s.n}
                </div>
                <div style={{ fontSize: 13, fontWeight: s.current ? 600 : 450, color: s.current ? 'var(--text)' : s.done ? 'var(--text-2)' : 'var(--text-3)' }}>{s.title}</div>
              </div>
            ))}
          </div>
          <div style={{ marginTop: 20, padding: 12, background: 'var(--surface-2)', borderRadius: 8 }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-2)', marginBottom: 4 }}>💡 İpucu</div>
            <div style={{ fontSize: 11, color: 'var(--text-2)', lineHeight: 1.5 }}>Oda numaralarını kat-sıra formatında girin (101, 102…). Toplu içe aktarma için Excel şablonunu kullanabilirsiniz.</div>
          </div>
        </div>

        {/* Main panel */}
        <div style={{ flex: 1, padding: '32px 48px', maxWidth: 920 }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--accent)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 8 }}>Adım 3</div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 30, fontWeight: 600, letterSpacing: '-0.02em', margin: 0, marginBottom: 6 }}>Odalarınızı ekleyin</h1>
          <p style={{ fontSize: 14, color: 'var(--text-2)', margin: 0, marginBottom: 24 }}>Her katı ayrı ayrı yapılandırabilirsiniz. Oda numaralarını aralık halinde girmek için tire kullanın (ör. 101-108).</p>

          {/* Floor editor */}
          <Card title="Kat 1 · Standart odalar" right={<Btn size="sm" variant="ghost" icon={<Icons.X size={12}/>}>Kaldır</Btn>}>
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr auto', gap: 12, marginBottom: 10 }}>
              <Field label="Oda numaraları" value="101 – 108" hint="8 oda"/>
              <Field label="Varsayılan oda tipi" value="Standart Deniz" dropdown/>
              <Field label="Kapasite" value="2" hint="kişi" mono/>
              <div style={{ display: 'flex', alignItems: 'flex-end' }}>
                <Btn size="md" variant="ghost" icon={<Icons.Pencil size={12}/>}>Düzenle</Btn>
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(8, 1fr)', gap: 6 }}>
              {[101,102,103,104,105,106,107,108].map(n => (
                <div key={n} style={{ height: 36, background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 600, fontFamily: 'var(--font-mono)' }}>{n}</div>
              ))}
            </div>
          </Card>

          <div style={{ height: 12 }}/>
          <Card title="Kat 2 · Deluxe odalar" right={<Btn size="sm" variant="ghost">Kaldır</Btn>}>
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr auto', gap: 12, marginBottom: 10 }}>
              <Field label="Oda numaraları" value="201 – 208"/>
              <Field label="Varsayılan oda tipi" value="Deluxe Balkon" dropdown/>
              <Field label="Kapasite" value="2" mono/>
              <div style={{ display: 'flex', alignItems: 'flex-end' }}>
                <Btn size="md" variant="ghost" icon={<Icons.Pencil size={12}/>}>Düzenle</Btn>
              </div>
            </div>
          </Card>

          <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
            <Btn size="md" variant="default" icon={<Icons.Plus size={14}/>}>Kat ekle</Btn>
            <Btn size="md" variant="ghost" icon={<Icons.Download size={14}/>}>Excel'den içe aktar</Btn>
          </div>

          {/* Summary */}
          <div style={{ marginTop: 28, padding: '14px 18px', background: 'var(--accent-weak)', borderRadius: 'var(--radius-lg)', display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 28, fontWeight: 600, color: 'var(--accent)' }}>24</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>24 oda · 3 kat · 4 oda tipi</div>
              <div style={{ fontSize: 12, color: 'var(--text-2)' }}>Toplam kapasite 58 kişi · Ortalama gecelik 5.850 ₺</div>
            </div>
          </div>

          {/* Footer */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 32, paddingTop: 20, borderTop: '1px solid var(--border)' }}>
            <Btn size="lg" variant="ghost" icon={<Icons.ChevronLeft size={14}/>}>Geri</Btn>
            <div style={{ display: 'flex', gap: 8 }}>
              <Btn size="lg" variant="ghost">Daha sonra</Btn>
              <Btn size="lg" variant="primary">Devam et<Icons.ChevronRight size={14}/></Btn>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Field({ label, value, hint, dropdown, mono }) {
  return (
    <div>
      <div style={{ fontSize: 11, color: 'var(--text-3)', marginBottom: 5, fontWeight: 500 }}>{label}</div>
      <div style={{
        display: 'flex', alignItems: 'center',
        height: 36, padding: '0 10px',
        background: 'var(--surface)', border: '1px solid var(--border)',
        borderRadius: 'var(--radius)', fontSize: 13,
        fontFamily: mono ? 'var(--font-mono)' : 'inherit',
      }}>
        <span style={{ flex: 1 }}>{value}</span>
        {hint && <span style={{ fontSize: 11, color: 'var(--text-3)' }}>{hint}</span>}
        {dropdown && <Icons.ChevronDown size={13} color="var(--text-3)"/>}
      </div>
    </div>
  );
}

// ───────── Step 4: Operasyon kuralları (Settings) ─────────
function OnboardingSettings({ onNav, steps }) {
  return (
    <div className="app-root" style={{ background: 'var(--bg)' }}>
      <div style={{ height: 56, borderBottom: '1px solid var(--border)', background: 'var(--surface)', display: 'flex', alignItems: 'center', padding: '0 24px', gap: 16 }}>
        <BrandMark size={15}/>
        <div style={{ width: 1, height: 20, background: 'var(--border)' }}/>
        <div style={{ fontSize: 13, color: 'var(--text-2)' }}>Kurulum sihirbazı · {TR.hotel}</div>
        <div style={{ flex: 1 }}/>
        <Btn size="sm" variant="ghost">Çıkış</Btn>
      </div>

      <div style={{ flex: 1, overflow: 'auto', display: 'flex' }}>
        <div style={{ width: 260, borderRight: '1px solid var(--border)', background: 'var(--surface)', padding: 20 }}>
          <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--text-3)', letterSpacing: '0.08em', marginBottom: 12, textTransform: 'uppercase' }}>Adım 4 / {steps.length}</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {steps.map(s => (
              <div key={s.n} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 8px', borderRadius: 6, background: s.current ? 'var(--accent-weak)' : 'transparent' }}>
                <div style={{ width: 22, height: 22, borderRadius: 999, background: s.done ? 'var(--good)' : s.current ? 'var(--accent)' : 'var(--surface-2)', color: s.done || s.current ? 'var(--accent-fg)' : 'var(--text-3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 600, flexShrink: 0 }}>{s.done ? <Icons.Check size={12}/> : s.n}</div>
                <div style={{ fontSize: 13, fontWeight: s.current ? 600 : 450, color: s.current ? 'var(--text)' : s.done ? 'var(--text-2)' : 'var(--text-3)' }}>{s.title}</div>
              </div>
            ))}
          </div>
          <div style={{ marginTop: 20, padding: 12, background: 'var(--surface-2)', borderRadius: 8 }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-2)', marginBottom: 4 }}>ℹ Bu değerler sonradan Ayarlar'dan değiştirilebilir</div>
            <div style={{ fontSize: 11, color: 'var(--text-2)', lineHeight: 1.5 }}>SGK oranları 2026 için öntanımlı. Güncel mevzuatı takip ediniz.</div>
          </div>
        </div>

        <div style={{ flex: 1, padding: '32px 48px', maxWidth: 960 }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--accent)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 8 }}>Adım 4</div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 30, fontWeight: 600, letterSpacing: '-0.02em', margin: 0, marginBottom: 6 }}>Operasyon kuralları</h1>
          <p style={{ fontSize: 14, color: 'var(--text-2)', margin: 0, marginBottom: 24 }}>Günlük operasyonu yöneten kuralları tanımlayın. Bu değerler otomatik işleri ve maliyet hesaplarını etkiler.</p>

          <Card title="No-show / iptal politikası" right={<Chip tone="info">Ödeme otomasyonu</Chip>}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
              <Field label="No-show eşiği" value="18 saat" hint="giriş sonrası"/>
              <Field label="No-show ücreti" value="İlk gece %100" dropdown/>
              <Field label="İptal penceresi" value="48 saat" hint="ücretsiz" mono/>
            </div>
            <div style={{ marginTop: 12, padding: '10px 12px', background: 'var(--info-bg)', borderRadius: 'var(--radius)', fontSize: 12, color: 'var(--text-2)', display: 'flex', gap: 8, alignItems: 'flex-start' }}>
              <Icons.Clock size={14} color="var(--info)"/>
              <span>Eşik dolduğunda <b>reservation.noShowFee</b> iş kuyruğu otomatik ücret tahakkuk eder ve Transactions tablosuna yazar.</span>
            </div>
          </Card>

          <div style={{ height: 12 }}/>

          <Card title="Kat hizmetleri günlük raporu" right={<Chip tone="neutral">BullMQ cron</Chip>}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 2fr', gap: 12 }}>
              <Field label="Rapor saati" value="08:30" mono/>
              <Field label="Minimum foto / oda" value="3" mono/>
              <Field label="Alıcılar" value="yonetim@, kat@ + 2 kişi" dropdown/>
            </div>
          </Card>

          <div style={{ height: 12 }}/>

          <Card title="Bordro & SGK oranları" right={<Chip tone="warn">Finansal hesap</Chip>}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 10 }}>
              <Field label="SGK çalışan" value="%14,00" mono/>
              <Field label="SGK işveren" value="%20,50" mono/>
              <Field label="İşsizlik çalışan" value="%1,00" mono/>
              <Field label="İşsizlik işveren" value="%2,00" mono/>
            </div>
            <div style={{ fontSize: 11, color: 'var(--text-3)', marginBottom: 6, fontWeight: 500 }}>Gelir vergisi dilimleri (2026)</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr 1fr', gap: 6 }}>
              {[{r:'%15', u:'110.000 ₺'},{r:'%20', u:'230.000 ₺'},{r:'%27', u:'870.000 ₺'},{r:'%35', u:'3.000.000 ₺'},{r:'%40', u:'üzeri'}].map((b,i)=>(
                <div key={i} style={{ padding: '8px 10px', background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', textAlign: 'center' }}>
                  <div style={{ fontSize: 13, fontWeight: 600, fontFamily: 'var(--font-mono)' }}>{b.r}</div>
                  <div style={{ fontSize: 10, color: 'var(--text-3)', marginTop: 2 }}>{b.u}</div>
                </div>
              ))}
            </div>
          </Card>

          <div style={{ height: 12 }}/>

          <Card title="Misafir deneyimi & uyum">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <ToggleRow on label="Çıkış anketi zorunlu" hint="Çıkış işlemi ancak anket dolduktan sonra tamamlanır."/>
              <ToggleRow on label="KBS bildirimi otomatik" hint="Check-in sonrası 5 dakika gecikmeli iş olarak tetiklenir."/>
              <ToggleRow on label="KVKK onay zorunlu" hint="Rezervasyon oluşturulurken imza linki üretilir."/>
              <ToggleRow label="Doğum günü mesajı" hint="WhatsApp / SMS ile otomatik tebrik gönderilsin mi?"/>
            </div>
          </Card>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 32, paddingTop: 20, borderTop: '1px solid var(--border)' }}>
            <Btn size="lg" variant="ghost" icon={<Icons.ChevronLeft size={14}/>}>Geri</Btn>
            <div style={{ display: 'flex', gap: 8 }}>
              <Btn size="lg" variant="ghost">Daha sonra</Btn>
              <Btn size="lg" variant="primary">Devam et<Icons.ChevronRight size={14}/></Btn>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ToggleRow({ label, hint, on }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '10px 2px' }}>
      <div style={{ width: 34, height: 20, borderRadius: 999, background: on ? 'var(--accent)' : 'var(--surface-2)', border: '1px solid ' + (on ? 'var(--accent)' : 'var(--border)'), position: 'relative', flexShrink: 0 }}>
        <div style={{ position: 'absolute', top: 2, left: on ? 16 : 2, width: 14, height: 14, borderRadius: 999, background: on ? 'var(--accent-fg)' : 'var(--text-3)', transition: 'left .15s' }}/>
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 13, fontWeight: 500 }}>{label}</div>
        <div style={{ fontSize: 11, color: 'var(--text-3)' }}>{hint}</div>
      </div>
    </div>
  );
}

window.Onboarding = Onboarding;
