// Rooms — status grid + floor view
const { useState: useRS } = React;

function Rooms({ onNav }) {
  const [view, setView] = useRS('grid');
  const countBy = {};
  ROOMS.forEach(r => { countBy[r.status] = (countBy[r.status] || 0) + 1; });

  return (
    <AppShell active="rooms" title="Odalar" breadcrumb={`${ROOMS.length} oda · 3 kat · 4 oda tipi`} onNav={onNav}
      topbarRight={<>
        <Btn size="md" variant="default" icon={<Icons.Plus size={14}/>}>Arıza kaydet</Btn>
        <Btn size="md" variant="primary" icon={<Icons.Sparkles size={14}/>}>Kat hizm. görevi</Btn>
      </>}>
      <div style={{ height: '100%', overflowY: 'auto', padding: 24 }}>
        {/* Status strip */}
        <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
          <StatusStat tone="good"   label="Temiz"    count={countBy.CLEAN || 0}  icon={<Icons.CheckCircle size={16}/>}/>
          <StatusStat tone="warn"   label="Kirli"    count={countBy.DIRTY || 0}  icon={<Icons.Sparkles size={16}/>}/>
          <StatusStat tone="bad"    label="Arızalı"  count={countBy.FAULTY || 0} icon={<Icons.AlertTri size={16}/>}/>
          <StatusStat tone="info"   label="DND"      count={countBy.DND || 0}    icon={<Icons.Moon size={16}/>}/>
          <StatusStat tone="neutral"label="Doluluk"  count={`${Math.round((ROOMS.length - 8)/ROOMS.length*100)}%`} suffix icon={<Icons.Bed size={16}/>}/>
        </div>

        {/* Toolbar */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
          <div style={{ display: 'flex', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: 2 }}>
            <button onClick={() => setView('grid')} style={viewBtn(view === 'grid')}>Izgara</button>
            <button onClick={() => setView('floor')} style={viewBtn(view === 'floor')}>Kat planı</button>
            <button onClick={() => setView('list')} style={viewBtn(view === 'list')}>Liste</button>
          </div>
          <FilterPill icon={<Icons.Filter size={12}/>} label="Tüm durumlar"/>
          <FilterPill icon={<Icons.Building size={12}/>} label="Tüm katlar"/>
          <FilterPill icon={<Icons.Bed size={12}/>} label="Tüm tipler"/>
        </div>

        {view === 'grid' && <RoomGrid/>}
        {view === 'floor' && <FloorPlan/>}
        {view === 'list' && <RoomList/>}
      </div>
    </AppShell>
  );
}

function viewBtn(on) {
  return {
    padding: '5px 12px', background: on ? 'var(--surface-2)' : 'transparent',
    color: on ? 'var(--text)' : 'var(--text-2)',
    border: 0, borderRadius: 4, fontSize: 12, fontWeight: on ? 600 : 450, cursor: 'pointer',
  };
}

function StatusStat({ tone, label, count, icon, suffix }) {
  const fg = { good: 'var(--good)', warn: 'var(--warn)', bad: 'var(--bad)', info: 'var(--info)', neutral: 'var(--text)' }[tone];
  return (
    <div style={{
      flex: 1, padding: '14px 16px',
      background: 'var(--surface)', border: '1px solid var(--border)',
      borderRadius: 'var(--radius-lg)',
      display: 'flex', alignItems: 'center', gap: 12,
    }}>
      <div style={{ width: 36, height: 36, borderRadius: 8, background: `var(--${tone === 'neutral' ? 'surface-2' : tone}-bg)`, color: fg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{icon}</div>
      <div>
        <div style={{ fontSize: 11, color: 'var(--text-3)', letterSpacing: '0.03em', fontWeight: 500 }}>{label.toUpperCase()}</div>
        <div style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 600, letterSpacing: '-0.02em' }}>{count}</div>
      </div>
    </div>
  );
}

function RoomGrid() {
  const byFloor = [...new Set(ROOMS.map(r => r.floor))].sort((a,b) => b - a);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {byFloor.map(f => (
        <Card key={f} title={`Kat ${f}`} right={<span style={{ fontSize: 11, color: 'var(--text-3)' }}>{ROOMS.filter(r=>r.floor===f).length} oda</span>}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 10 }}>
            {ROOMS.filter(r => r.floor === f).map(r => <RoomCard key={r.id} r={r}/>)}
          </div>
        </Card>
      ))}
    </div>
  );
}

function RoomCard({ r }) {
  const rt = roomTypeById(r.typeId);
  const m = roomStatusMeta(r.status);
  const occupied = RESERVATIONS.find(x => x.roomId === r.id && (x.status === 'CHECKEDIN' || x.status === 'ARRIVAL_TODAY' || x.status === 'DEPARTURE_TODAY'));
  const accentBar = {
    CLEAN: 'var(--good)', DIRTY: 'var(--warn)', FAULTY: 'var(--bad)', DND: 'var(--info)',
  }[r.status];
  return (
    <div style={{
      position: 'relative',
      background: 'var(--surface)', border: '1px solid var(--border)',
      borderRadius: 'var(--radius-lg)', padding: '14px 14px 12px 16px',
      overflow: 'hidden', cursor: 'pointer',
    }}>
      <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 3, background: accentBar }}/>
      <div style={{ display: 'flex', alignItems: 'start', justifyContent: 'space-between', marginBottom: 8 }}>
        <div>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 600, letterSpacing: '-0.02em' }}>{r.number}</div>
          <div style={{ fontSize: 11, color: 'var(--text-3)' }}>{rt.name}</div>
        </div>
        <Chip tone={m.tone} dot>{m.label}</Chip>
      </div>
      <div style={{ display: 'flex', gap: 14, fontSize: 11, color: 'var(--text-2)', marginBottom: 8 }}>
        <span>{rt.capacity} kişi</span>
        <span>{r.view}</span>
        <span>{trMoney(rt.basePrice)}</span>
      </div>
      {occupied ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 8px', background: 'var(--surface-2)', borderRadius: 6, fontSize: 11, color: 'var(--text-2)' }}>
          <Icons.User size={12}/>
          <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{guestById(occupied.guestId).firstName} {guestById(occupied.guestId).lastName}</span>
          <span style={{ color: 'var(--text-3)', fontFamily: 'var(--font-mono)' }}>→{trDate(occupied.checkOut)}</span>
        </div>
      ) : (
        <div style={{ fontSize: 11, color: 'var(--text-3)', padding: '6px 8px' }}>Boş</div>
      )}
      {r.faultNote && (
        <div style={{ marginTop: 6, fontSize: 11, color: 'var(--bad)', padding: '6px 8px', background: 'var(--bad-bg)', borderRadius: 6 }}>
          ⚠ {r.faultNote}
        </div>
      )}
    </div>
  );
}

function FloorPlan() {
  // Simplified plan: for each floor, a corridor with rooms.
  const byFloor = [...new Set(ROOMS.map(r => r.floor))].sort((a,b) => b - a);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {byFloor.map(f => {
        const floorRooms = ROOMS.filter(r => r.floor === f);
        return (
          <Card key={f} title={`Kat ${f} · plan`}>
            <div style={{ background: 'var(--bg)', borderRadius: 8, padding: 18, position: 'relative' }}>
              {/* Corridor */}
              <div style={{ height: 24, background: 'var(--surface-2)', border: '1px dashed var(--border)', borderRadius: 4, margin: '50px 0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, color: 'var(--text-3)', letterSpacing: '0.2em' }}>KORİDOR</div>
              {/* Rooms above */}
              <div style={{ position: 'absolute', top: 18, left: 18, right: 18, display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 6 }}>
                {floorRooms.slice(0,4).map(r => <PlanRoom key={r.id} r={r}/>)}
              </div>
              {/* Rooms below */}
              <div style={{ position: 'absolute', bottom: 18, left: 18, right: 18, display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 6 }}>
                {floorRooms.slice(4).map(r => <PlanRoom key={r.id} r={r}/>)}
              </div>
            </div>
          </Card>
        );
      })}
    </div>
  );
}
function PlanRoom({ r }) {
  const m = roomStatusMeta(r.status);
  const occupied = RESERVATIONS.find(x => x.roomId === r.id && (x.status === 'CHECKEDIN' || x.status === 'ARRIVAL_TODAY'));
  const bg = occupied ? 'var(--accent)' : { CLEAN: 'var(--good-bg)', DIRTY: 'var(--warn-bg)', FAULTY: 'var(--bad-bg)', DND: 'var(--info-bg)' }[r.status];
  const fg = occupied ? 'var(--accent-fg)' : { CLEAN: 'var(--good)', DIRTY: 'var(--warn)', FAULTY: 'var(--bad)', DND: 'var(--info)' }[r.status];
  return (
    <div style={{
      height: 52, background: bg, color: fg,
      borderRadius: 4, padding: '6px 10px',
      display: 'flex', flexDirection: 'column', justifyContent: 'center',
      cursor: 'pointer',
    }}>
      <div style={{ fontSize: 14, fontWeight: 600, fontFamily: 'var(--font-mono)' }}>{r.number}</div>
      <div style={{ fontSize: 10, opacity: 0.85 }}>{occupied ? 'Dolu' : m.label}</div>
    </div>
  );
}

function RoomList() {
  return (
    <Card pad={false}>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead><tr>
          <th style={th}>Oda</th><th style={th}>Tip</th><th style={th}>Kat</th><th style={th}>Manzara</th>
          <th style={th}>Durum</th><th style={th}>Misafir</th><th style={{ ...th, textAlign: 'right' }}>Gecelik</th>
        </tr></thead>
        <tbody>
          {ROOMS.map(r => {
            const rt = roomTypeById(r.typeId);
            const occ = RESERVATIONS.find(x => x.roomId === r.id && (x.status === 'CHECKEDIN' || x.status === 'ARRIVAL_TODAY'));
            const m = roomStatusMeta(r.status);
            return (
              <tr key={r.id} style={{ borderTop: '1px solid var(--border)' }}>
                <td style={{ ...td, fontWeight: 600, fontFamily: 'var(--font-mono)' }}>{r.number}</td>
                <td style={td}>{rt.name}</td>
                <td style={td}>{r.floor}</td>
                <td style={td}>{r.view}</td>
                <td style={td}><Chip tone={m.tone} dot>{m.label}</Chip></td>
                <td style={td}>{occ ? `${guestById(occ.guestId).firstName} ${guestById(occ.guestId).lastName}` : <span style={{ color: 'var(--text-3)' }}>—</span>}</td>
                <td style={{ ...td, textAlign: 'right', fontWeight: 500 }}>{trMoney(rt.basePrice)}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </Card>
  );
}

window.Rooms = Rooms;
