// Reservation detail — full page with check-in, payments, e-signature, KBS
function ReservationDetail({ rid = "R-24851", onNav, onBack }) {
  const r = RESERVATIONS.find(x => x.id === rid) || RESERVATIONS[0];
  const g = guestById(r.guestId);
  const room = r.roomId ? roomById(r.roomId) : null;
  const ag = agencyById(r.agencyId);
  const rt = room ? roomTypeById(room.typeId) : null;
  const canCheckin = room && (room.status === 'CLEAN' || room.status === 'DIRTY') && room.status !== 'FAULTY';

  return (
    <AppShell active="reservations" title={`${g.firstName} ${g.lastName}`} breadcrumb={<><span onClick={onBack} style={{ cursor: 'pointer' }}>Rezervasyonlar</span> · {r.id}</>} onNav={onNav}
      topbarRight={<>
        <Btn size="md" variant="default">Yazdır</Btn>
        <Btn size="md" variant="default" icon={<Icons.X size={14}/>}>İptal et</Btn>
        {r.status === 'ARRIVAL_TODAY' && <Btn size="md" variant="primary" icon={<Icons.Key size={14}/>} disabled={!canCheckin}>Check-in başlat</Btn>}
      </>}>
      <div style={{ height: '100%', overflowY: 'auto', padding: 24 }}>
        {/* Header card */}
        <div style={{ display: 'flex', gap: 16, alignItems: 'stretch', marginBottom: 16 }}>
          <div style={{ flex: 1, background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: 20, display: 'flex', gap: 16 }}>
            <div style={{ width: 56, height: 56, borderRadius: 999, background: 'var(--accent-weak)', color: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, fontWeight: 600, fontFamily: 'var(--font-display)' }}>{g.firstName[0]}{g.lastName[0]}</div>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                <div style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 600, letterSpacing: '-0.02em' }}>{g.firstName} {g.lastName}</div>
                {g.vip && <Chip tone="warn" dot>VIP</Chip>}
                <ResStatusChip s={r.status}/>
              </div>
              <div style={{ display: 'flex', gap: 18, fontSize: 12, color: 'var(--text-2)', flexWrap: 'wrap' }}>
                <span><Icons.Phone size={11}/> {g.phone}</span>
                <span><Icons.Mail size={11}/> {g.email}</span>
                <span><Icons.Globe size={11}/> {g.nationality}</span>
                <span><Icons.Shield size={11}/> {g.tc || g.passport}</span>
              </div>
              <div style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 6 }}>Önceki konaklamalar: <b style={{ color: 'var(--text-2)' }}>{g.totalStays}</b> · Toplam gelir: <b style={{ color: 'var(--text-2)' }}>{trMoney(g.totalRevenue)}</b></div>
            </div>
            <div style={{ width: 1, background: 'var(--border)' }}/>
            <div style={{ display: 'grid', gridTemplateColumns: 'auto auto', gap: '4px 28px', alignContent: 'center' }}>
              <Meta k="Giriş" v={trDate(r.checkIn)}/>
              <Meta k="Çıkış" v={trDate(r.checkOut)}/>
              <Meta k="Gece" v={`${r.nights}`}/>
              <Meta k="Kişi" v={`${r.adults}${r.children ? `+${r.children}` : ''}`}/>
              <Meta k="Oda" v={room ? room.number : '—'}/>
              <Meta k="Kanal" v={ag.name}/>
            </div>
          </div>
        </div>

        {/* Body grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 16 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* Stay summary */}
            <Card title="Konaklama özeti">
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <KV k="Oda" v={room ? `${room.number} · ${rt.name}` : '—'}/>
                <KV k="Manzara" v={room ? room.view : '—'}/>
                <KV k="Kapasite" v={rt ? `${rt.capacity} kişi` : '—'}/>
                <KV k="Oda durumu" v={room ? <Chip tone={roomStatusMeta(room.status).tone} dot>{roomStatusMeta(room.status).label}</Chip> : '—'}/>
                <KV k="Özel istekler" v={r.notes || <span style={{ color: 'var(--text-3)' }}>Yok</span>} full/>
              </div>
            </Card>

            {/* Price breakdown */}
            <Card title="Fiyat hesabı" right={<Btn size="sm" variant="ghost">Yeniden hesapla</Btn>}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <tbody>
                  <tr><td style={tdp}>Çarpan · {r.adults + r.children} kişi</td><td style={{ ...tdp, textAlign: 'right', fontFamily: 'var(--font-mono)' }}>×{r.adults + r.children === 2 ? '1.0' : '1.5'}</td></tr>
                  <tr><td style={tdp}>Gecelik fiyat · {ag.name}</td><td style={{ ...tdp, textAlign: 'right' }}>{trMoney(Math.round(r.totalPrice / r.nights / (ag.commission ? (1 - ag.commission/100) : 1)))}</td></tr>
                  <tr><td style={tdp}>{r.nights} gece</td><td style={{ ...tdp, textAlign: 'right' }}>×{r.nights}</td></tr>
                  {ag.commission > 0 && <tr><td style={tdp}>Acente komisyonu</td><td style={{ ...tdp, textAlign: 'right', color: 'var(--bad)' }}>−%{ag.commission}</td></tr>}
                  <tr style={{ borderTop: '1px solid var(--border)' }}>
                    <td style={{ ...tdp, fontWeight: 600 }}>Toplam</td>
                    <td style={{ ...tdp, textAlign: 'right', fontWeight: 600, fontFamily: 'var(--font-display)', fontSize: 15 }}>{trMoney(r.totalPrice)}</td>
                  </tr>
                </tbody>
              </table>
            </Card>

            {/* Payments */}
            <Card title="Ödemeler" right={<div style={{ display: 'flex', gap: 8 }}>
              <Btn size="sm" variant="default" icon={<Icons.Mail size={12}/>}>Ödeme linki</Btn>
              <Btn size="sm" variant="primary" icon={<Icons.Plus size={12}/>}>Kaydet</Btn>
            </div>} pad={false}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead><tr>
                  <th style={th}>Tarih</th>
                  <th style={th}>Yöntem</th>
                  <th style={th}>Referans</th>
                  <th style={{ ...th, textAlign: 'right' }}>Tutar</th>
                </tr></thead>
                <tbody>
                  <tr style={{ borderTop: '1px solid var(--border)' }}>
                    <td style={td}>15 Nis 2026</td>
                    <td style={td}><div style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}><Icons.CreditCard size={13} color="var(--text-3)"/>Sanal POS · Garanti</div></td>
                    <td style={{ ...td, fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--text-2)' }}>TX-884201</td>
                    <td style={{ ...td, textAlign: 'right', fontWeight: 500 }}>{trMoney(r.paid)}</td>
                  </tr>
                  {r.balance > 0 && (
                    <tr style={{ borderTop: '1px solid var(--border)', background: 'var(--warn-bg)' }}>
                      <td colSpan={3} style={{ ...td, color: 'var(--warn)', fontWeight: 500 }}>Kalan bakiye</td>
                      <td style={{ ...td, textAlign: 'right', color: 'var(--warn)', fontWeight: 600 }}>{trMoney(r.balance)}</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </Card>

            {/* Timeline */}
            <Card title="Zaman çizgisi">
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, position: 'relative', paddingLeft: 20 }}>
                <div style={{ position: 'absolute', left: 6, top: 8, bottom: 8, width: 1, background: 'var(--border)' }}/>
                <TL time="15 Nis · 10:22" title="Rezervasyon oluşturuldu" body="Direkt kanal · Aylin Kurt" done/>
                <TL time="15 Nis · 10:24" title="KVKK sözleşmesi e-imzaya gönderildi" body="WhatsApp · +90 532 …22 61" done/>
                <TL time="15 Nis · 11:08" title="Sözleşme e-imzalandı" body="IP 85.105.xx · Sertifika no 4421-AB" done/>
                <TL time="16 Nis · 14:30" title="Ön ödeme alındı" body={`${trMoney(r.paid)} · Sanal POS Garanti`} done/>
                <TL time="Bugün · 15:10" title="KBS bildirimi kuyrukta" body="Giriş sonrası 5 dk içinde otomatik"/>
                <TL time="Bugün" title="Check-in bekliyor" body="Oda hazır · Hoş geldin şampanyası ayarlandı" pending/>
              </div>
            </Card>
          </div>

          {/* Right rail */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* KVKK / Signature */}
            <Card title="Sözleşme · E-İmza">
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                <div style={{ width: 36, height: 36, borderRadius: 999, background: 'var(--good-bg)', color: 'var(--good)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Icons.Signature size={18}/></div>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600 }}>KVKK onaylandı</div>
                  <div style={{ fontSize: 11, color: 'var(--text-3)' }}>15 Nis 11:08 · 85.105.xx</div>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 6 }}>
                <Btn size="sm" variant="ghost" icon={<Icons.Download size={12}/>}>PDF</Btn>
                <Btn size="sm" variant="ghost">Tekrar gönder</Btn>
              </div>
            </Card>

            {/* KBS */}
            <Card title="Jandarma KBS">
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                <div style={{ width: 36, height: 36, borderRadius: 999, background: 'var(--warn-bg)', color: 'var(--warn)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Icons.Shield size={18}/></div>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600 }}>Bildirim beklemede</div>
                  <div style={{ fontSize: 11, color: 'var(--text-3)' }}>Giriş sonrası 5 dk gecikmeli</div>
                </div>
              </div>
              <div style={{ fontSize: 11, color: 'var(--text-2)', padding: '8px 10px', background: 'var(--surface-2)', borderRadius: 6, fontFamily: 'var(--font-mono)' }}>
                TC {g.tc} · {g.firstName} {g.lastName}<br/>
                Giriş: 23 Nis 2026 15:00
              </div>
            </Card>

            {/* Room status */}
            {room && (
              <Card title="Oda durumu">
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                  <div style={{ fontFamily: 'var(--font-display)', fontSize: 24, fontWeight: 600, letterSpacing: '-0.02em' }}>{room.number}</div>
                  <Chip tone={roomStatusMeta(room.status).tone} dot>{roomStatusMeta(room.status).label}</Chip>
                </div>
                <div style={{ fontSize: 11, color: 'var(--text-3)' }}>{rt.name} · {room.view} manzara · Kat {room.floor}</div>
                {room.status === 'FAULTY' && (
                  <div style={{ marginTop: 10, padding: '8px 10px', background: 'var(--bad-bg)', color: 'var(--bad)', borderRadius: 6, fontSize: 12 }}>
                    <b>Arıza:</b> {room.faultNote}
                  </div>
                )}
              </Card>
            )}

            {/* Internal notes */}
            <Card title="Dahili notlar">
              <textarea defaultValue="Hoşgeldin şampanyası ve meyve sepeti. Erken check-in talep etti." style={{
                width: '100%', minHeight: 60, resize: 'vertical',
                padding: 10, border: '1px solid var(--border)',
                borderRadius: 'var(--radius)', background: 'var(--bg)',
                fontSize: 12, color: 'var(--text)', outline: 'none', fontFamily: 'inherit',
              }}/>
            </Card>
          </div>
        </div>
      </div>
    </AppShell>
  );
}

function KV({ k, v, full }) {
  return (
    <div style={{ gridColumn: full ? '1 / -1' : 'auto' }}>
      <div style={{ fontSize: 11, color: 'var(--text-3)', marginBottom: 3 }}>{k}</div>
      <div style={{ fontSize: 13, color: 'var(--text)' }}>{v}</div>
    </div>
  );
}
function Meta({ k, v }) {
  return <>
    <div style={{ fontSize: 11, color: 'var(--text-3)' }}>{k}</div>
    <div style={{ fontSize: 13, fontWeight: 500, textAlign: 'right' }}>{v}</div>
  </>;
}
function TL({ time, title, body, done, pending }) {
  return (
    <div style={{ position: 'relative' }}>
      <div style={{
        position: 'absolute', left: -20, top: 3,
        width: 13, height: 13, borderRadius: 999,
        background: done ? 'var(--good)' : pending ? 'var(--warn)' : 'var(--accent)',
        border: '2px solid var(--surface)',
        boxShadow: '0 0 0 1px var(--border)',
      }}/>
      <div style={{ fontSize: 11, color: 'var(--text-3)', fontFamily: 'var(--font-mono)' }}>{time}</div>
      <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text)' }}>{title}</div>
      {body && <div style={{ fontSize: 11, color: 'var(--text-2)', marginTop: 1 }}>{body}</div>}
    </div>
  );
}
const tdp = { padding: '8px 0', fontSize: 13, color: 'var(--text-2)' };

window.ReservationDetail = ReservationDetail;
