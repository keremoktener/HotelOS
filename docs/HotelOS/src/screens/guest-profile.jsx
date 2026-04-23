// Guest profile — g1 Elif Yıldız
function GuestProfile({ gid = "g1", onNav, onBack }) {
  const g = guestById(gid) || GUESTS[0];
  const history = GUEST_HISTORY_G1;
  const activeRes = RESERVATIONS.find(r => r.guestId === g.id && (r.status === 'ARRIVAL_TODAY' || r.status === 'CHECKEDIN'));
  return (
    <AppShell active="guests" title={`${g.firstName} ${g.lastName}`} breadcrumb={<><span onClick={onBack} style={{cursor:'pointer'}}>Misafirler</span> · {g.segment}</>} onNav={onNav}
      topbarRight={<>
        <Btn size="md" variant="default" icon={<Icons.Mail size={14}/>}>Mesaj</Btn>
        <Btn size="md" variant="primary" icon={<Icons.Plus size={14}/>}>Yeni rezervasyon</Btn>
      </>}>
      <div style={{ height: '100%', overflowY: 'auto', padding: 24 }}>
        {/* Header */}
        <Card style={{ marginBottom: 16 }}>
          <div style={{ display: 'flex', gap: 20, alignItems: 'flex-start' }}>
            <div style={{ width: 72, height: 72, borderRadius: 999, background: 'var(--accent-weak)', color: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 26, fontWeight: 600, fontFamily: 'var(--font-display)' }}>{g.firstName[0]}{g.lastName[0]}</div>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                <div style={{ fontFamily: 'var(--font-display)', fontSize: 24, fontWeight: 600, letterSpacing: '-0.02em' }}>{g.firstName} {g.lastName}</div>
                {g.vip && <Chip tone="warn" dot>VIP</Chip>}
                <Chip tone="info">{g.segment}</Chip>
                {g.blacklisted && <Chip tone="bad" dot>Kara liste</Chip>}
              </div>
              <div style={{ display: 'flex', gap: 24, fontSize: 12, color: 'var(--text-2)', flexWrap: 'wrap' }}>
                <span><Icons.Phone size={11}/> {g.phone}</span>
                <span><Icons.Mail size={11}/> {g.email}</span>
                <span><Icons.Globe size={11}/> {g.nationality === 'TR' ? 'Türkiye' : g.nationality}</span>
                <span><Icons.Shield size={11}/> {g.tc || g.passport}</span>
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, auto)', gap: '2px 32px', textAlign: 'right' }}>
              <Stat v={g.totalStays} k="Konaklama"/>
              <Stat v={trMoney(g.totalRevenue)} k="Toplam gelir"/>
              <Stat v={trMoney(Math.round(g.totalRevenue * 0.42))} k="Tahmini kâr"/>
            </div>
          </div>
          {g.blacklisted && (
            <div style={{ marginTop: 14, padding: '10px 14px', background: 'var(--bad-bg)', borderRadius: 'var(--radius)', color: 'var(--bad)', fontSize: 12 }}>
              <b>Kara liste uyarısı:</b> {g.blacklistReason} · Yeni rezervasyon engellenecektir.
            </div>
          )}
        </Card>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 16 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {activeRes && (
              <Card title="Aktif konaklama" right={<Chip tone={statusMeta(activeRes.status).tone} dot>{statusMeta(activeRes.status).label}</Chip>}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
                  <KV k="Rezervasyon" v={activeRes.id}/>
                  <KV k="Oda" v={roomById(activeRes.roomId)?.number}/>
                  <KV k="Giriş → Çıkış" v={`${trDate(activeRes.checkIn)} → ${trDate(activeRes.checkOut)}`}/>
                  <KV k="Toplam" v={trMoney(activeRes.totalPrice)}/>
                </div>
              </Card>
            )}

            <Card title="Konaklama geçmişi" pad={false} right={<span style={{ fontSize: 11, color: 'var(--text-3)' }}>{history.length} kayıt</span>}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead><tr>
                  <th style={th}>Tarih</th><th style={th}>Oda</th><th style={th}>Gece</th><th style={th}>Kanal</th><th style={{...th, textAlign:'right'}}>Tutar</th>
                </tr></thead>
                <tbody>{history.map(h => (
                  <tr key={h.id} style={{ borderTop: '1px solid var(--border)' }}>
                    <td style={td}><div style={{ fontWeight: 500 }}>{h.when}</div><div style={{ fontSize: 11, color: 'var(--text-3)', fontFamily: 'var(--font-mono)' }}>{h.id}</div></td>
                    <td style={td}>{h.room}</td>
                    <td style={{...td, fontFamily: 'var(--font-mono)'}}>{h.nights}</td>
                    <td style={td}>{h.agency}</td>
                    <td style={{...td, textAlign:'right', fontWeight: 500}}>{trMoney(h.total)}</td>
                  </tr>
                ))}</tbody>
              </table>
            </Card>

            <Card title="Tercihler · notlar">
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <KV k="Tercih edilen oda" v="Deniz manzaralı · Deluxe"/>
                <KV k="Yastık" v="Yumuşak · 2 adet"/>
                <KV k="Kahvaltı" v="Odaya servis · 08:30"/>
                <KV k="Dil" v="Türkçe"/>
                <KV k="Alerji / diyet" v="Glüten hassasiyeti" full/>
              </div>
            </Card>
          </div>

          {/* Right rail */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <Card title="KVKK onayları">
              <Consent label="Rezervasyon iletişimi" on/>
              <Consent label="Pazarlama e-postaları" on/>
              <Consent label="SMS / WhatsApp promosyon" off/>
              <Consent label="Harici platform paylaşımı" off/>
            </Card>
            <Card title="Memnuniyet">
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginBottom: 10 }}>
                <div style={{ fontFamily: 'var(--font-display)', fontSize: 32, fontWeight: 600, letterSpacing: '-0.02em' }}>8.4</div>
                <div style={{ fontSize: 12, color: 'var(--text-3)' }}>/ 10 · 3 anket</div>
              </div>
              <BarRow label="Oda" v={9}/>
              <BarRow label="Temizlik" v={8}/>
              <BarRow label="Kahvaltı" v={7}/>
              <BarRow label="Personel" v={10}/>
            </Card>
            <Card title="Son iletişim">
              <Msg when="2 gün önce" ch="WhatsApp" body="Rezervasyonum için onay yazısı alabilir miyim?"/>
              <Msg when="3 gün önce" ch="E-posta" body="Sözleşme imzalandı · R-24852"/>
            </Card>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
function Stat({ v, k }) {
  return <>
    <div style={{ fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 600, letterSpacing: '-0.01em' }}>{v}</div>
    <div style={{ fontSize: 10, color: 'var(--text-3)', letterSpacing: '0.05em', textTransform: 'uppercase' }}>{k}</div>
  </>;
}
function Consent({ label, on }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 0' }}>
      <span style={{ width: 24, height: 14, borderRadius: 999, background: on ? 'var(--good)' : 'var(--border)', position: 'relative', flexShrink: 0 }}>
        <span style={{ position: 'absolute', top: 2, left: on ? 12 : 2, width: 10, height: 10, borderRadius: 999, background: 'white', transition: 'left 0.15s' }}/>
      </span>
      <span style={{ fontSize: 12, color: 'var(--text-2)', flex: 1 }}>{label}</span>
    </div>
  );
}
function BarRow({ label, v }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '3px 0' }}>
      <span style={{ width: 70, fontSize: 11, color: 'var(--text-3)' }}>{label}</span>
      <div style={{ flex: 1, height: 4, background: 'var(--surface-2)', borderRadius: 999 }}>
        <div style={{ width: `${v*10}%`, height: '100%', background: 'var(--accent)', borderRadius: 999 }}/>
      </div>
      <span style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--text-2)', width: 20, textAlign: 'right' }}>{v}</span>
    </div>
  );
}
function Msg({ when, ch, body }) {
  return (
    <div style={{ padding: '8px 0', borderTop: '1px solid var(--border)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--text-3)', marginBottom: 2 }}>
        <span>{ch}</span><span>{when}</span>
      </div>
      <div style={{ fontSize: 12, color: 'var(--text)' }}>{body}</div>
    </div>
  );
}
window.GuestProfile = GuestProfile;
