// Dashboard — overview, today's arrivals/departures, occupancy, KBS status
const { useMemo: useMemoD } = React;

function StatTile({ label, value, sub, trend, right }) {
  return (
    <div style={{
      flex: 1, padding: '14px 16px',
      background: 'var(--surface)',
      border: '1px solid var(--border)',
      borderRadius: 'var(--radius-lg)',
      minWidth: 0,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
        <div style={{ fontSize: 11, color: 'var(--text-3)', letterSpacing: '0.03em', fontWeight: 500 }}>{label}</div>
        {right}
      </div>
      <div style={{ fontFamily: 'var(--font-display)', fontSize: 26, fontWeight: 600, letterSpacing: '-0.02em', color: 'var(--text)' }}>{value}</div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
        {trend != null && (
          <span style={{ fontSize: 11, fontWeight: 500, color: trend >= 0 ? 'var(--good)' : 'var(--bad)' }}>
            {trend >= 0 ? '▲' : '▼'} {Math.abs(trend)}%
          </span>
        )}
        {sub && <span style={{ fontSize: 11, color: 'var(--text-3)' }}>{sub}</span>}
      </div>
    </div>
  );
}

function Sparkline({ data, height = 40, color = 'var(--accent)' }) {
  const w = 160; const max = Math.max(...data); const min = Math.min(...data);
  const path = data.map((v, i) => {
    const x = (i / (data.length - 1)) * w;
    const y = height - ((v - min) / (max - min || 1)) * (height - 6) - 3;
    return `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`;
  }).join(' ');
  const area = path + ` L${w},${height} L0,${height} Z`;
  return (
    <svg width={w} height={height} style={{ display: 'block' }}>
      <path d={area} fill={color} opacity="0.12"/>
      <path d={path} fill="none" stroke={color} strokeWidth="1.5"/>
    </svg>
  );
}

function ArrivalRow({ r }) {
  const g = guestById(r.guestId);
  const room = roomById(r.roomId);
  const sig = r.signature === 'signed'
    ? <Chip tone="good" dot>İmza tamam</Chip>
    : <Chip tone="warn" dot>İmza bekliyor</Chip>;
  const kbs = r.kbs === 'sent'
    ? <Chip tone="good" dot>KBS bildirildi</Chip>
    : <Chip tone="outline" dot>KBS hazır</Chip>;
  const blocked = room && (room.status === 'FAULTY' || room.status === 'DIRTY');
  return (
    <tr style={{ borderTop: '1px solid var(--border)' }}>
      <td style={td}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 30, height: 30, borderRadius: 999,
            background: 'var(--accent-weak)', color: 'var(--accent)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 11, fontWeight: 600,
          }}>{g.firstName[0]}{g.lastName[0]}</div>
          <div>
            <div style={{ fontWeight: 500, color: 'var(--text)' }}>
              {g.firstName} {g.lastName}
              {g.vip && <span style={{ marginLeft: 6, fontSize: 10, color: 'var(--warn)', fontWeight: 600 }}>VIP</span>}
            </div>
            <div style={{ fontSize: 11, color: 'var(--text-3)' }}>{r.id} · {r.adults} yetişkin{r.children ? ` · ${r.children} çocuk` : ''}</div>
          </div>
        </div>
      </td>
      <td style={td}>
        <div style={{ fontWeight: 500 }}>Oda {room?.number}</div>
        <div style={{ fontSize: 11, color: 'var(--text-3)' }}>{roomTypeById(room?.typeId)?.name}</div>
      </td>
      <td style={td}>
        <div>{trDate(r.checkIn)} → {trDate(r.checkOut)}</div>
        <div style={{ fontSize: 11, color: 'var(--text-3)' }}>{r.nights} gece · {agencyById(r.agencyId).name}</div>
      </td>
      <td style={td}>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>{sig}{kbs}</div>
      </td>
      <td style={td}>
        <div style={{ fontWeight: 500 }}>{trMoney(r.totalPrice)}</div>
        {r.balance > 0
          ? <div style={{ fontSize: 11, color: 'var(--warn)' }}>Bakiye {trMoney(r.balance)}</div>
          : <div style={{ fontSize: 11, color: 'var(--good)' }}>Tamamen ödendi</div>}
      </td>
      <td style={{ ...td, textAlign: 'right' }}>
        {blocked
          ? <Chip tone="bad" dot>Oda hazır değil</Chip>
          : <Btn variant="primary" size="sm" icon={<Icons.Key size={13}/>}>Check-in</Btn>}
      </td>
    </tr>
  );
}

const th = { textAlign: 'left', padding: '10px 14px', fontSize: 11, fontWeight: 600, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.05em', background: 'var(--surface-2)' };
const td = { padding: '11px 14px', fontSize: 13, color: 'var(--text)', verticalAlign: 'middle' };

function OccupancyBoard() {
  // Mini grid of today's status by room
  const byFloor = useMemoD(() => {
    const m = new Map();
    ROOMS.forEach(r => { if (!m.has(r.floor)) m.set(r.floor, []); m.get(r.floor).push(r); });
    return [...m.entries()].sort((a,b) => b[0] - a[0]);
  }, []);
  // Map of occupied rooms today
  const occupiedMap = new Map();
  RESERVATIONS.forEach(r => { if (r.status === 'CHECKEDIN' || r.status === 'ARRIVAL_TODAY' || r.status === 'DEPARTURE_TODAY') occupiedMap.set(r.roomId, r); });
  return (
    <div>
      {byFloor.map(([f, rooms]) => (
        <div key={f} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
          <div style={{ width: 20, fontSize: 11, color: 'var(--text-3)', fontWeight: 600 }}>K{f}</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(8, 1fr)', gap: 5, flex: 1 }}>
            {rooms.map(r => {
              const occ = occupiedMap.get(r.id);
              let bg = 'var(--surface-2)', fg = 'var(--text-3)';
              if (occ) { bg = 'var(--accent)'; fg = 'var(--accent-fg)'; }
              else if (r.status === 'FAULTY') { bg = 'var(--bad-bg)'; fg = 'var(--bad)'; }
              else if (r.status === 'DIRTY') { bg = 'var(--warn-bg)'; fg = 'var(--warn)'; }
              else if (r.status === 'DND') { bg = 'var(--info-bg)'; fg = 'var(--info)'; }
              return (
                <div key={r.id} title={`Oda ${r.number} · ${roomStatusMeta(r.status).label}${occ ? ' · Dolu' : ''}`} style={{
                  height: 30, borderRadius: 6,
                  background: bg, color: fg,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 11, fontWeight: 600, fontFamily: 'var(--font-mono)',
                  cursor: 'pointer',
                }}>{r.number}</div>
              );
            })}
          </div>
        </div>
      ))}
      <div style={{ display: 'flex', gap: 14, marginTop: 14, flexWrap: 'wrap' }}>
        <Legend swatch="var(--accent)" label="Dolu"/>
        <Legend swatch="var(--surface-2)" label="Boş · Temiz"/>
        <Legend swatch="var(--warn-bg)" label="Kirli"/>
        <Legend swatch="var(--bad-bg)" label="Arızalı"/>
        <Legend swatch="var(--info-bg)" label="DND"/>
      </div>
    </div>
  );
}
function Legend({ swatch, label }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: 'var(--text-2)' }}>
      <span style={{ width: 10, height: 10, borderRadius: 3, background: swatch, border: '1px solid var(--border)' }}/>
      {label}
    </div>
  );
}

function Dashboard({ onNav }) {
  const arrivalsToday = RESERVATIONS.filter(r => r.status === 'ARRIVAL_TODAY');
  const departuresToday = RESERVATIONS.filter(r => r.status === 'DEPARTURE_TODAY');
  const occupied = ROOMS.length - 8; // fake: 16 of 24
  const occPct = Math.round(occupied / ROOMS.length * 100);

  return (
    <AppShell active="dashboard" title="Özet" breadcrumb="23 Nisan 2026 · Perşembe" onNav={onNav}
      topbarRight={<Btn variant="primary" size="md" icon={<Icons.Plus size={14}/>}>Yeni rezervasyon</Btn>}>
      <div style={{ height: '100%', overflowY: 'auto', padding: 24 }}>
        {/* KPI row */}
        <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
          <StatTile label="DOLULUK" value={`${occPct}%`} sub={`${occupied} / ${ROOMS.length} oda`} trend={+6}
            right={<Sparkline data={OCCUPANCY_14D} height={32}/>}/>
          <StatTile label="BUGÜN KASA" value={trMoney(47200)} sub="12 işlem" trend={+12}
            right={<Icons.Coin size={16} color="var(--text-3)"/>}/>
          <StatTile label="BUGÜN GİRİŞ" value="7" sub="3 beklemede"
            right={<Icons.Arrow size={16} color="var(--text-3)"/>}/>
          <StatTile label="BUGÜN ÇIKIŞ" value="4" sub="1 anket bekliyor"
            right={<Icons.ArrowLeft size={16} color="var(--text-3)"/>}/>
          <StatTile label="ADR" value={trMoney(5840)} sub="14 günlük ortalama" trend={+3}
            right={<Icons.Percent size={16} color="var(--text-3)"/>}/>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 16, marginBottom: 16 }}>
          {/* Arrivals table */}
          <Card pad={false} title={`Bugün giriş (${arrivalsToday.length})`}
            right={<div style={{ display: 'flex', gap: 8 }}>
              <Btn variant="ghost" size="sm" icon={<Icons.Filter size={12}/>}>Filtre</Btn>
              <Btn variant="default" size="sm" onClick={() => onNav('reservations')}>Tümü</Btn>
            </div>}>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead><tr>
                  <th style={th}>Misafir</th>
                  <th style={th}>Oda</th>
                  <th style={th}>Konaklama</th>
                  <th style={th}>Durum</th>
                  <th style={th}>Bedel</th>
                  <th style={{ ...th, textAlign: 'right' }}></th>
                </tr></thead>
                <tbody>{arrivalsToday.map(r => <ArrivalRow key={r.id} r={r}/>)}</tbody>
              </table>
            </div>
          </Card>

          {/* Occupancy + right rail */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <Card title="Oda durumu · Canlı">
              <OccupancyBoard/>
            </Card>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
          {/* Departures */}
          <Card title={`Bugün çıkış (${departuresToday.length})`} pad={false}>
            <div>
              {departuresToday.map(r => {
                const g = guestById(r.guestId);
                const room = roomById(r.roomId);
                return (
                  <div key={r.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px', borderTop: '1px solid var(--border)' }}>
                    <div style={{ width: 30, height: 30, borderRadius: 999, background: 'var(--surface-2)', color: 'var(--text-2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 600 }}>{g.firstName[0]}{g.lastName[0]}</div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 500, fontSize: 13 }}>{g.firstName} {g.lastName}</div>
                      <div style={{ fontSize: 11, color: 'var(--text-3)' }}>Oda {room.number} · {r.nights} gece</div>
                    </div>
                    <Chip tone="warn" dot>Anket bekliyor</Chip>
                  </div>
                );
              })}
            </div>
          </Card>

          {/* KBS / Jandarma status */}
          <Card title="Jandarma KBS">
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 12 }}>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: 32, fontWeight: 600, letterSpacing: '-0.02em' }}>4<span style={{ color: 'var(--text-3)', fontSize: 16 }}>/7</span></div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 12, color: 'var(--text-2)' }}>Bugünkü girişler bildirildi</div>
                <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 2 }}>3 bildirim 5 dk içinde otomatik kuyrukta</div>
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {[
                { label: 'Sofia Ricci · R-24853', state: 'queued', time: '14:32' },
                { label: 'Ahmet Kaya · R-24851',  state: 'queued', time: '15:10' },
                { label: 'Mert Aksoy · R-24854',  state: 'sent',   time: '11:04' },
              ].map((x, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: 'var(--text-2)' }}>
                  {x.state === 'sent'
                    ? <Icons.CheckCircle size={14} color="var(--good)"/>
                    : <Icons.Clock size={14} color="var(--warn)"/>}
                  <span style={{ flex: 1 }}>{x.label}</span>
                  <span style={{ color: 'var(--text-3)', fontFamily: 'var(--font-mono)', fontSize: 11 }}>{x.time}</span>
                </div>
              ))}
            </div>
          </Card>

          {/* Action queue */}
          <Card title="Dikkat gereken">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <Alert tone="bad" title="Oda 304 arızalı — klima" body="Bugün 17:00'de giriş planlandı. Arıza kaydı açıldı."/>
              <Alert tone="warn" title="3 imza bekleyen sözleşme" body="Link WhatsApp üzerinden tekrar gönderilebilir."/>
              <Alert tone="info" title="R-24859 bakiye" body={`${trMoney(9400)} · Ödeme linki oluşturulmadı.`}/>
            </div>
          </Card>
        </div>
      </div>
    </AppShell>
  );
}

function Alert({ tone, title, body }) {
  const t = { bad: 'var(--bad)', warn: 'var(--warn)', info: 'var(--info)', good: 'var(--good)' }[tone];
  return (
    <div style={{
      display: 'flex', gap: 10,
      padding: '10px 12px', borderRadius: 'var(--radius)',
      background: `var(--${tone}-bg)`,
      border: '1px solid var(--border)',
    }}>
      <div style={{ width: 3, borderRadius: 2, background: t, flexShrink: 0 }}/>
      <div>
        <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text)' }}>{title}</div>
        <div style={{ fontSize: 11, color: 'var(--text-2)', marginTop: 2 }}>{body}</div>
      </div>
    </div>
  );
}

window.Dashboard = Dashboard;
