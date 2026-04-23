// Audit Log Viewer — Phase 1 requirement
// Every mutation logged via Prisma middleware: tenantId, userId, action, entity, diff, createdAt.
// This screen surfaces that log with filters.

const { useState: useAL } = React;

const AUDIT_ENTRIES = [
  { t: '14:32:07', user: 'Ayşe Demir', role: 'Resepsiyon', action: 'CHECKED_IN', entity: 'Reservation', ref: 'R-24843', diff: 'status: CONFIRMED → CHECKEDIN · room.status: CLEAN → DIRTY', ip: '185.12.44.7' },
  { t: '14:28:52', user: 'Ayşe Demir', role: 'Resepsiyon', action: 'CREATED',    entity: 'ReservationPayment', ref: 'RP-8821', diff: 'amount: ₺15.200 · method: VIRTUALPOS · ref: grnt_txn_4481', ip: '185.12.44.7' },
  { t: '14:18:04', user: 'Sistem',     role: 'BullMQ',     action: 'TRIGGERED',  entity: 'Job · kbs.notifyGuest', ref: 'R-24842', diff: 'scheduled +5m · status: PENDING', ip: '—', system: true },
  { t: '13:55:19', user: 'Mehmet Can', role: 'Yönetici',   action: 'UPDATED',    entity: 'PriceCalendar', ref: 'PC-112', diff: 'pricePerNight: ₺4.200 → ₺4.600 · period: 01.05 – 15.05', ip: '92.45.1.18', important: true },
  { t: '13:41:33', user: 'Ayşe Demir', role: 'Resepsiyon', action: 'CREATED',    entity: 'Reservation', ref: 'R-24842', diff: 'guest: Sofia Ricci · room: 201 · 3 gece · ₺14.400', ip: '185.12.44.7' },
  { t: '12:07:45', user: 'Deniz Arı',  role: 'Muhasebe',   action: 'UPDATED',    entity: 'Guest', ref: 'g-142', diff: 'blacklisted: false → true · reason: "2× hasar iddiası, ödeme yok"', ip: '85.108.3.201', important: true },
  { t: '11:22:10', user: 'Sistem',     role: 'Cron',       action: 'EXECUTED',   entity: 'Job · hk.dailyReport', ref: '—', diff: 'report generated · 14 oda · PDF S3://...', ip: '—', system: true },
  { t: '10:58:03', user: 'Ayşe Demir', role: 'Resepsiyon', action: 'SIGNED',     entity: 'ElectronicSignature', ref: 'ES-4411', diff: 'type: KVKK · channel: WHATSAPP · signed by Elif Yıldız', ip: '185.12.44.7' },
  { t: '10:44:22', user: 'Ayşe Demir', role: 'Resepsiyon', action: 'UPDATED',    entity: 'Room', ref: '108', diff: 'status: CLEAN → FAULTY · detail: "klima çalışmıyor"', ip: '185.12.44.7' },
  { t: '09:15:00', user: 'Sistem',     role: 'Webhook',    action: 'SYNCED',     entity: 'User', ref: 'u-9', diff: 'from Clerk · role: STAFF · org: hotelos_seahaven', ip: '—', system: true },
  { t: '08:30:45', user: 'Mehmet Can', role: 'Yönetici',   action: 'UPDATED',    entity: 'Tenant.Settings', ref: 'set-1', diff: 'noShowHours: 24 → 18 · hkReportTime: 09:00 → 08:30', ip: '92.45.1.18', important: true },
];

function actionTone(a) {
  if (['CREATED', 'SIGNED'].includes(a)) return 'good';
  if (['DELETED', 'CANCELLED'].includes(a)) return 'bad';
  if (['UPDATED', 'TRIGGERED', 'EXECUTED', 'SYNCED'].includes(a)) return 'info';
  if (a === 'CHECKED_IN') return 'good';
  return 'neutral';
}

function AuditLog({ onNav }) {
  const [filter, setFilter] = useAL('ALL');
  const [expanded, setExpanded] = useAL(3);

  const tabs = [
    { k: 'ALL', label: 'Tümü', count: AUDIT_ENTRIES.length },
    { k: 'USER', label: 'Sadece kullanıcı', count: AUDIT_ENTRIES.filter(e => !e.system).length },
    { k: 'IMPORTANT', label: 'Önemli', count: AUDIT_ENTRIES.filter(e => e.important).length, tone: 'warn' },
    { k: 'SYSTEM', label: 'Sistem', count: AUDIT_ENTRIES.filter(e => e.system).length },
  ];

  const filtered = AUDIT_ENTRIES.filter(e => {
    if (filter === 'USER') return !e.system;
    if (filter === 'IMPORTANT') return e.important;
    if (filter === 'SYSTEM') return e.system;
    return true;
  });

  return (
    <AppShell active="settings" title="Denetim kaydı"
      breadcrumb="Ayarlar · 24 Nis 2026 · Tüm değişiklikler"
      onNav={onNav}
      topbarRight={<>
        <Btn size="md" variant="default" icon={<Icons.Download size={14}/>}>CSV indir</Btn>
      </>}>

      <div style={{ height: '100%', overflowY: 'auto', padding: 24 }}>

        {/* Filter bar */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14, flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: 2 }}>
            {tabs.map(t => (
              <button key={t.k} onClick={() => setFilter(t.k)} style={{
                padding: '5px 10px', display: 'inline-flex', alignItems: 'center', gap: 6,
                background: filter === t.k ? 'var(--surface-2)' : 'transparent',
                color: filter === t.k ? 'var(--text)' : 'var(--text-2)',
                border: 0, borderRadius: 4, fontSize: 12, fontWeight: filter === t.k ? 600 : 450,
                cursor: 'pointer',
              }}>
                {t.label}
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-3)' }}>{t.count}</span>
              </button>
            ))}
          </div>
          <div style={{ width: 1, height: 20, background: 'var(--border)' }}/>
          <FilterPill icon={<Icons.Calendar size={12}/>} label="Bugün"/>
          <FilterPill icon={<Icons.User size={12}/>} label="Tüm kullanıcılar"/>
          <FilterPill icon={<Icons.Tag size={12}/>} label="Tüm varlıklar"/>
          <div style={{ flex: 1 }}/>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, height: 30, padding: '0 10px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', color: 'var(--text-3)', fontSize: 12, minWidth: 240 }}>
            <Icons.Search size={13}/>
            <input placeholder="Varlık ID, referans veya alan adı…" style={{ flex: 1, border: 0, background: 'transparent', outline: 'none', color: 'var(--text)', fontSize: 12 }}/>
          </div>
        </div>

        {/* KPI strip */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 16 }}>
          <KPI label="Bugünkü işlem" value="184" sub="son 24 saat"/>
          <KPI label="Aktif kullanıcı" value="7" sub="4 resepsiyon · 2 muhasebe · 1 yönetici"/>
          <KPI label="Önemli değişiklik" value="3" sub="fiyat · kara liste · ayar" tone="warn"/>
          <KPI label="Başarısız iş" value="0" sub="son 24 saatte KBS / GIB hatası yok" tone="good"/>
        </div>

        {/* Log table */}
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', overflow: 'hidden' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '90px 200px 130px 170px 1fr 90px', padding: '10px 16px', fontSize: 10, fontWeight: 600, color: 'var(--text-3)', letterSpacing: '0.08em', textTransform: 'uppercase', borderBottom: '1px solid var(--border)', background: 'var(--surface-2)' }}>
            <div>Saat</div>
            <div>Kullanıcı</div>
            <div>Eylem</div>
            <div>Varlık</div>
            <div>Değişiklik</div>
            <div style={{ textAlign: 'right' }}>IP</div>
          </div>

          {filtered.map((e, i) => {
            const isOpen = expanded === i;
            return (
              <div key={i} onClick={() => setExpanded(isOpen ? -1 : i)}
                style={{ borderBottom: i < filtered.length - 1 ? '1px solid var(--border)' : 0, cursor: 'pointer', background: isOpen ? 'var(--accent-weak)' : 'transparent' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '90px 200px 130px 170px 1fr 90px', padding: '12px 16px', fontSize: 12, alignItems: 'center', gap: 12 }}>
                  <div style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-2)' }}>{e.t}</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
                    {e.system ? (
                      <div style={{ width: 22, height: 22, borderRadius: 999, background: 'var(--surface-2)', color: 'var(--text-3)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <Icons.Settings size={11}/>
                      </div>
                    ) : (
                      <div style={{ width: 22, height: 22, borderRadius: 999, background: 'var(--accent-weak)', color: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 600, flexShrink: 0 }}>
                        {e.user.split(' ').map(w => w[0]).slice(0,2).join('')}
                      </div>
                    )}
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{e.user}</div>
                      <div style={{ fontSize: 10, color: 'var(--text-3)' }}>{e.role}</div>
                    </div>
                  </div>
                  <div>
                    <Chip tone={actionTone(e.action)} dot>{e.action}</Chip>
                  </div>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-2)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    <div style={{ color: 'var(--text)' }}>{e.entity}</div>
                    <div style={{ color: 'var(--text-3)' }}>{e.ref}</div>
                  </div>
                  <div style={{ color: 'var(--text-2)', fontSize: 12, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis' }}>{e.diff}</span>
                    {e.important && <Chip tone="warn">önemli</Chip>}
                  </div>
                  <div style={{ textAlign: 'right', fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-3)' }}>{e.ip}</div>
                </div>

                {isOpen && (
                  <div style={{ padding: '0 16px 14px 108px', fontSize: 12 }}>
                    <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: 12 }}>
                      <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--text-3)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 8 }}>Diff · JSON Patch</div>
                      <pre style={{ margin: 0, fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-2)', whiteSpace: 'pre-wrap' }}>{`{
  "op": "replace",
  "path": "/status",
  "from": "CONFIRMED",
  "to":   "CHECKEDIN",
  "tenantId": "t_seahaven",
  "userId":   "u_ayse",
  "requestId": "req_8f2c…",
  "createdAt": "2026-04-24T14:32:07.341Z"
}`}</pre>
                    </div>
                    <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
                      <Btn size="sm" variant="ghost" icon={<Icons.ChevronRight size={12}/>}>Varlığa git</Btn>
                      <Btn size="sm" variant="ghost" icon={<Icons.User size={12}/>}>Bu kullanıcının kaydı</Btn>
                      <Btn size="sm" variant="ghost">Önceki duruma döndür</Btn>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 12, fontSize: 11, color: 'var(--text-3)' }}>
          <div>Son 24 saat · {filtered.length} kayıt gösteriliyor</div>
          <div style={{ display: 'flex', gap: 8 }}>
            <Btn size="sm" variant="ghost" icon={<Icons.ChevronLeft size={12}/>}>Önceki gün</Btn>
            <Btn size="sm" variant="ghost">Sonraki gün<Icons.ChevronRight size={12}/></Btn>
          </div>
        </div>
      </div>
    </AppShell>
  );
}

function KPI({ label, value, sub, tone }) {
  const color = tone === 'warn' ? 'var(--warn)' : tone === 'good' ? 'var(--good)' : 'var(--text)';
  return (
    <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '12px 16px' }}>
      <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--text-3)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>{label}</div>
      <div style={{ fontSize: 22, fontWeight: 600, fontFamily: 'var(--font-display)', letterSpacing: '-0.01em', marginTop: 4, color }}>{value}</div>
      <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 2 }}>{sub}</div>
    </div>
  );
}

window.AuditLog = AuditLog;
