// Reservation list — filters, table, bulk actions
const { useState: useSL } = React;

function ResStatusChip({ s }) {
  const m = statusMeta(s);
  return <Chip tone={m.tone} dot>{m.label}</Chip>;
}

function ReservationList({ onNav, onOpen }) {
  const [status, setStatus] = useSL('ALL');
  const filters = ['ALL', 'ARRIVAL_TODAY', 'CHECKEDIN', 'DEPARTURE_TODAY', 'CONFIRMED', 'WAITING'];
  const filterLabel = { ALL: 'Tümü', ARRIVAL_TODAY: 'Bugün giriş', CHECKEDIN: 'İç etti', DEPARTURE_TODAY: 'Bugün çıkış', CONFIRMED: 'Onaylandı', WAITING: 'Beklemede' };
  const list = RESERVATIONS.filter(r => status === 'ALL' || r.status === status);

  return (
    <AppShell active="reservations" title="Rezervasyonlar" breadcrumb={`${RESERVATIONS.length} kayıt · Nisan 2026`} onNav={onNav}
      topbarRight={<>
        <Btn size="md" variant="default" icon={<Icons.Download size={14}/>}>Dışa aktar</Btn>
        <Btn size="md" variant="primary" icon={<Icons.Plus size={14}/>}>Yeni rezervasyon</Btn>
      </>}>
      <div style={{ height: '100%', overflowY: 'auto', padding: 24 }}>
        {/* Filter bar */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14, flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: 2 }}>
            {filters.map(f => (
              <button key={f} onClick={() => setStatus(f)} style={{
                padding: '5px 10px', background: status === f ? 'var(--surface-2)' : 'transparent',
                color: status === f ? 'var(--text)' : 'var(--text-2)',
                border: 0, borderRadius: 4, fontSize: 12, fontWeight: status === f ? 600 : 450,
                cursor: 'pointer',
              }}>{filterLabel[f]}</button>
            ))}
          </div>
          <div style={{ width: 1, height: 20, background: 'var(--border)' }}/>
          <FilterPill icon={<Icons.Calendar size={12}/>} label="Nis 2026"/>
          <FilterPill icon={<Icons.Tag size={12}/>} label="Tüm acenteler"/>
          <FilterPill icon={<Icons.Bed size={12}/>} label="Tüm oda tipleri"/>
          <div style={{ flex: 1 }}/>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, height: 30, padding: '0 10px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', color: 'var(--text-3)', fontSize: 12, minWidth: 220 }}>
            <Icons.Search size={13}/>
            <input placeholder="Misafir adı, oda no, TC…" style={{ flex: 1, border: 0, background: 'transparent', outline: 'none', color: 'var(--text)', fontSize: 12 }}/>
          </div>
        </div>

        <Card pad={false}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead><tr>
                <th style={{ ...th, width: 34 }}><input type="checkbox" style={{ accentColor: 'var(--accent)' }}/></th>
                <th style={th}>ID</th>
                <th style={th}>Misafir</th>
                <th style={th}>Oda</th>
                <th style={th}>Giriş → Çıkış</th>
                <th style={th}>Gece</th>
                <th style={th}>Kanal</th>
                <th style={th}>Durum</th>
                <th style={th}>Bakiye</th>
                <th style={th}>Toplam</th>
                <th style={{ ...th, textAlign: 'right' }}></th>
              </tr></thead>
              <tbody>
                {list.map(r => {
                  const g = guestById(r.guestId);
                  const room = r.roomId ? roomById(r.roomId) : null;
                  const ag = agencyById(r.agencyId);
                  return (
                    <tr key={r.id} onClick={() => onOpen && onOpen(r.id)} style={{ borderTop: '1px solid var(--border)', cursor: 'pointer' }}
                      onMouseEnter={e => e.currentTarget.style.background = 'var(--surface-2)'}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                      <td style={td} onClick={e => e.stopPropagation()}><input type="checkbox" style={{ accentColor: 'var(--accent)' }}/></td>
                      <td style={{ ...td, fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--text-2)' }}>{r.id}</td>
                      <td style={td}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <div style={{ width: 26, height: 26, borderRadius: 999, background: 'var(--accent-weak)', color: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 600 }}>{g.firstName[0]}{g.lastName[0]}</div>
                          <div>
                            <div style={{ fontWeight: 500 }}>{g.firstName} {g.lastName}{g.vip && <span style={{ marginLeft: 6, fontSize: 10, color: 'var(--warn)', fontWeight: 600 }}>VIP</span>}</div>
                            <div style={{ fontSize: 11, color: 'var(--text-3)' }}>{g.nationality} · {r.adults}{r.children ? `+${r.children}` : ''} kişi</div>
                          </div>
                        </div>
                      </td>
                      <td style={td}>
                        {room ? <><div style={{ fontWeight: 500 }}>{room.number}</div>
                        <div style={{ fontSize: 11, color: 'var(--text-3)' }}>{roomTypeById(room.typeId).name}</div></>
                        : <span style={{ color: 'var(--text-3)' }}>—</span>}
                      </td>
                      <td style={td}>
                        <div>{trDate(r.checkIn)} → {trDate(r.checkOut)}</div>
                      </td>
                      <td style={{ ...td, fontFamily: 'var(--font-mono)', fontSize: 12 }}>{r.nights}</td>
                      <td style={td}>
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                          <span style={{ width: 6, height: 6, borderRadius: 999, background: ag.color }}/>
                          {ag.name}
                        </div>
                      </td>
                      <td style={td}><ResStatusChip s={r.status}/></td>
                      <td style={td}>
                        {r.balance > 0
                          ? <span style={{ color: 'var(--warn)', fontWeight: 500 }}>{trMoney(r.balance)}</span>
                          : <span style={{ color: 'var(--text-3)' }}>—</span>}
                      </td>
                      <td style={{ ...td, fontWeight: 500 }}>{trMoney(r.totalPrice)}</td>
                      <td style={{ ...td, textAlign: 'right' }} onClick={e => e.stopPropagation()}>
                        <button style={{ background: 'transparent', border: 0, color: 'var(--text-3)', padding: 4, borderRadius: 4, cursor: 'pointer' }}>
                          <Icons.MoreH size={14}/>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 16px', borderTop: '1px solid var(--border)' }}>
            <div style={{ fontSize: 12, color: 'var(--text-3)' }}>{list.length} kayıt gösteriliyor · 243 toplam</div>
            <div style={{ display: 'flex', gap: 4 }}>
              <Btn size="sm" variant="ghost" icon={<Icons.ChevronLeft size={12}/>}>Önceki</Btn>
              <Btn size="sm" variant="ghost">1</Btn>
              <Btn size="sm" variant="default">2</Btn>
              <Btn size="sm" variant="ghost">3</Btn>
              <Btn size="sm" variant="ghost">Sonraki</Btn>
            </div>
          </div>
        </Card>
      </div>
    </AppShell>
  );
}

function FilterPill({ icon, label }) {
  return (
    <button style={{
      display: 'inline-flex', alignItems: 'center', gap: 6,
      height: 28, padding: '0 10px',
      background: 'var(--surface)', border: '1px solid var(--border)',
      borderRadius: 'var(--radius)', color: 'var(--text-2)', fontSize: 12,
      cursor: 'pointer',
    }}>
      {icon}
      {label}
      <Icons.ChevronDown size={12}/>
    </button>
  );
}

window.ReservationList = ReservationList;
window.FilterPill = FilterPill;
