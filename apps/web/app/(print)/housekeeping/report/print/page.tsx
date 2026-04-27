import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import dayjs from 'dayjs'
import 'dayjs/locale/tr'
import { getTenantId } from '@/lib/auth'
import { db } from '@/lib/db'

dayjs.locale('tr')

export const dynamic = 'force-dynamic'

interface Props { searchParams: { date?: string } }

export default async function HkReportPrintPage({ searchParams }: Props) {
  const { userId, orgId } = await auth()
  if (!userId) redirect('/sign-in')
  if (!orgId) redirect('/onboarding')
  const tenantId = await getTenantId(orgId)
  if (!tenantId) redirect('/onboarding')

  const targetDate = searchParams.date ? dayjs(searchParams.date) : dayjs().subtract(1, 'day')
  const from = targetDate.startOf('day').toDate()
  const to   = targetDate.endOf('day').toDate()

  const [tasks, caSchedules, lafToday] = await Promise.all([
    db.hKTask.findMany({
      where: { tenantId, createdAt: { gte: from, lte: to } },
      include: { room: { include: { roomType: true } } },
      orderBy: [{ room: { floor: 'asc' } }, { room: { number: 'asc' } }],
    }),
    db.commonAreaSchedule.findMany({
      where: { commonArea: { tenantId }, scheduledDate: { gte: from, lte: to } },
      include: { commonArea: true },
      orderBy: { commonArea: { name: 'asc' } },
    }),
    db.lostAndFound.findMany({
      where: { tenantId, foundAt: { gte: from, lte: to } },
      include: { room: { select: { number: true } } },
    }),
  ])

  const tenant = await db.tenant.findUnique({ where: { id: tenantId }, select: { name: true } })
  const tenantName = tenant?.name ?? 'HotelOS'

  const done = tasks.filter(t => t.status === 'DONE')
  const blocked = tasks.filter(t => t.status === 'PENDING' || t.status === 'IN_PROGRESS')
  const completionPct = tasks.length ? Math.round(done.length / tasks.length * 100) : 100
  const avgMinutes = done.length
    ? Math.round(done.reduce((s, t) => s + (t.durationMinutes ?? 0), 0) / done.length)
    : null

  const floors = Array.from(new Set(tasks.map(t => t.room?.floor ?? 0))).sort((a, b) => a - b)
  const floorSummary = floors.map(f => {
    const inF = tasks.filter(t => (t.room?.floor ?? 0) === f)
    const doneF = inF.filter(t => t.status === 'DONE')
    const blockedF = inF.filter(t => t.status !== 'DONE')
    const avg = doneF.length
      ? Math.round(doneF.reduce((s, t) => s + (t.durationMinutes ?? 0), 0) / doneF.length)
      : null
    const pct = inF.length ? Math.round(doneF.length / inF.length * 100) : 100
    return { floor: f, total: inF.length, done: doneF.length, blocked: blockedF.length, avg, pct }
  })

  const dateLabel = targetDate.format('D MMMM YYYY, dddd')
  const generatedAt = dayjs().format('D MMM YYYY · HH:mm')
  const reportId = `HK-${targetDate.format('YYYY-MMDD')}`

  const TONE = {
    good:    { fg: '#047857', bg: '#ecfdf5' },
    warn:    { fg: '#b45309', bg: '#fef3c7' },
    info:    { fg: '#1d4ed8', bg: '#eff6ff' },
    neutral: { fg: '#57534e', bg: '#f5f5f4' },
  }

  return (
    <html lang="tr">
      <head>
        <meta charSet="utf-8"/>
        <title>{`${reportId} · ${tenantName}`}</title>
        <style>{`
          * { box-sizing: border-box; margin: 0; padding: 0; }
          body { background: white; }
          @page { size: A4 portrait; margin: 0; }
          @media print {
            body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          }
        `}</style>
      </head>
      <body>
        <div style={{
          width: 794, minHeight: 1123,
          background: '#fff', color: '#1c1917',
          padding: '40px 48px',
          fontFamily: "'Inter', system-ui, sans-serif",
          fontSize: 11, lineHeight: 1.45,
        }}>
          {/* Letterhead */}
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16, paddingBottom: 14, borderBottom: '2px solid #1c1917', marginBottom: 18 }}>
            <div style={{ width: 44, height: 44, background: '#111827', color: '#fff', borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 18, flexShrink: 0 }}>H</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 9.5, color: '#78716c', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 600, marginBottom: 2 }}>{tenantName} · Operasyon raporu</div>
              <div style={{ fontSize: 21, fontWeight: 700, letterSpacing: '-0.01em', lineHeight: 1.1 }}>Kat Hizmetleri Günlük Raporu</div>
              <div style={{ fontSize: 13, color: '#57534e', marginTop: 3 }}>{dateLabel}</div>
            </div>
            <div style={{ textAlign: 'right', fontSize: 10, color: '#78716c', fontFamily: 'monospace' }}>
              <div style={{ fontWeight: 600, color: '#1c1917', fontSize: 11 }}>{reportId}</div>
              <div style={{ marginTop: 2 }}>Oluşturma: {generatedAt}</div>
            </div>
          </div>

          {/* KPI band */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', border: '1px solid #d6d3d1', borderRadius: 4, marginBottom: 18 }}>
            {[
              { label: 'Tamamlanan görev', value: `${done.length} / ${tasks.length}`, sub: `%${completionPct} tamamlanma`, tone: completionPct === 100 ? 'good' : completionPct >= 70 ? 'warn' : 'neutral' },
              { label: 'Ort. temizlik süresi', value: avgMinutes ? `${avgMinutes} dk` : '—', sub: 'Tamamlanan odalar', tone: 'info' },
              { label: 'Ortak alan', value: `${caSchedules.filter(s => s.completedAt).length} / ${caSchedules.length}`, sub: `${caSchedules.filter(s => !s.completedAt).length} eksik`, tone: caSchedules.filter(s => !s.completedAt).length === 0 ? 'good' : 'warn' },
              { label: 'Kayıp eşya', value: String(lafToday.length), sub: 'Bugün bulunan', tone: 'neutral' },
            ].map((k, i) => {
              const t = TONE[k.tone as keyof typeof TONE] ?? TONE.neutral
              return (
                <div key={i} style={{ padding: '12px 14px', borderLeft: i === 0 ? 'none' : '1px solid #e7e5e4' }}>
                  <div style={{ fontSize: 9, color: '#78716c', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600, marginBottom: 4 }}>{k.label}</div>
                  <div style={{ fontSize: 22, fontWeight: 700, color: t.fg, letterSpacing: '-0.01em', lineHeight: 1.1 }}>{k.value}</div>
                  <div style={{ fontSize: 10, color: '#57534e', marginTop: 3 }}>{k.sub}</div>
                </div>
              )
            })}
          </div>

          {/* Floor summary */}
          <div style={{ marginBottom: 18 }}>
            <div style={{ fontSize: 10, color: '#78716c', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600, marginBottom: 6 }}>Kat bazında özet</div>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
              <thead>
                <tr style={{ background: '#f5f5f4', borderBottom: '1px solid #d6d3d1' }}>
                  {['KAT', 'GÖREV', 'TAMAM', 'BLOKE', 'ORT. SÜRE', 'TAMAMLANMA'].map(h => (
                    <th key={h} style={{ padding: '6px 10px', textAlign: 'left', fontWeight: 600, fontSize: 10, color: '#57534e' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {floorSummary.map((f, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid #e7e5e4' }}>
                    <td style={{ padding: '7px 10px', fontFamily: 'monospace', fontWeight: 600 }}>K{f.floor}</td>
                    <td style={{ padding: '7px 10px' }}>{f.total}</td>
                    <td style={{ padding: '7px 10px', color: '#047857', fontWeight: 600 }}>{f.done}</td>
                    <td style={{ padding: '7px 10px', color: f.blocked ? '#b91c1c' : '#a8a29e' }}>{f.blocked || '—'}</td>
                    <td style={{ padding: '7px 10px', fontFamily: 'monospace' }}>{f.avg ? `${f.avg} dk` : '—'}</td>
                    <td style={{ padding: '7px 10px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div style={{ flex: 1, height: 5, background: '#f5f5f4', borderRadius: 2, overflow: 'hidden' }}>
                          <div style={{ width: `${f.pct}%`, height: '100%', background: f.pct === 100 ? '#047857' : '#b45309' }}/>
                        </div>
                        <span style={{ fontSize: 10, fontWeight: 600, fontFamily: 'monospace', minWidth: 30, textAlign: 'right' }}>{f.pct}%</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Two columns: common areas + lost & found */}
          <div style={{ display: 'grid', gridTemplateColumns: '1.1fr 1fr', gap: 20, marginBottom: 18 }}>
            <div>
              <div style={{ fontSize: 10, color: '#78716c', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600, marginBottom: 6 }}>Ortak alan temizliği</div>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
                <tbody>
                  {caSchedules.map((s, i) => {
                    const ok = !!s.completedAt
                    return (
                      <tr key={i} style={{ borderBottom: '1px solid #e7e5e4' }}>
                        <td style={{ padding: '7px 0', fontWeight: 500 }}>{s.commonArea.name}</td>
                        <td style={{ padding: '7px 0', textAlign: 'right' }}>
                          <span style={{ fontSize: 10, fontWeight: 600, padding: '2px 7px', borderRadius: 3, background: ok ? '#ecfdf5' : '#fef3c7', color: ok ? '#047857' : '#b45309' }}>
                            {ok ? 'Tamam' : 'Eksik'}
                          </span>
                        </td>
                      </tr>
                    )
                  })}
                  {caSchedules.length === 0 && <tr><td colSpan={2} style={{ padding: '7px 0', color: '#a8a29e', fontSize: 10 }}>Bugün için ortak alan planlanmadı.</td></tr>}
                </tbody>
              </table>
            </div>
            <div>
              <div style={{ fontSize: 10, color: '#78716c', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600, marginBottom: 6 }}>Kayıp eşya bulgular</div>
              {lafToday.length === 0
                ? <div style={{ fontSize: 10, color: '#a8a29e' }}>Bugün kayıp eşya kaydı yok.</div>
                : lafToday.map((l, i) => (
                    <div key={i} style={{ display: 'flex', gap: 8, padding: '6px 0', borderBottom: '1px solid #e7e5e4', fontSize: 11 }}>
                      <span style={{ flexShrink: 0, fontSize: 9, fontWeight: 600, padding: '2px 6px', borderRadius: 3, background: '#f5f5f4', color: '#57534e', height: 18, display: 'inline-flex', alignItems: 'center' }}>
                        {l.room?.number ? `Oda ${l.room.number}` : 'Ortak alan'}
                      </span>
                      <span>{l.description}</span>
                    </div>
                  ))
              }
            </div>
          </div>

          {/* Task table */}
          <div style={{ marginBottom: 18 }}>
            <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 6 }}>
              <div style={{ fontSize: 10, color: '#78716c', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600 }}>Oda görevleri detayı</div>
              <div style={{ fontSize: 10, color: '#78716c', fontFamily: 'monospace' }}>{tasks.length} kayıt · {done.length} tamamlandı · {blocked.length} beklemede</div>
            </div>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 10.5 }}>
              <thead>
                <tr style={{ background: '#f5f5f4', borderBottom: '1px solid #d6d3d1' }}>
                  {['', 'ODA', 'TİP', 'NOTLAR', 'BAŞ.', 'BİT.', 'SÜRE'].map((h, i) => (
                    <th key={i} style={{ padding: '6px 8px', textAlign: i === 6 ? 'right' : 'left', fontWeight: 600, fontSize: 9.5, color: '#57534e' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {tasks.map((t, i) => {
                  const isDone = t.status === 'DONE'
                  const startTime = t.startedAt ? dayjs(t.startedAt).format('HH:mm') : '—'
                  const endTime = t.completedAt ? dayjs(t.completedAt).format('HH:mm') : '—'
                  return (
                    <tr key={i} style={{ borderBottom: '1px solid #f5f5f4' }}>
                      <td style={{ padding: '5px 8px', textAlign: 'center', color: isDone ? '#047857' : '#b45309', fontWeight: 700 }}>{isDone ? '✓' : '○'}</td>
                      <td style={{ padding: '5px 8px', fontFamily: 'monospace', fontWeight: 600 }}>{t.room?.number ?? '—'}</td>
                      <td style={{ padding: '5px 8px', color: '#57534e' }}>{t.room?.roomType.name ?? t.type}</td>
                      <td style={{ padding: '5px 8px', color: '#57534e' }}>{t.notes || <span style={{ color: '#a8a29e' }}>—</span>}</td>
                      <td style={{ padding: '5px 8px', fontFamily: 'monospace', color: '#57534e' }}>{startTime}</td>
                      <td style={{ padding: '5px 8px', fontFamily: 'monospace', color: '#57534e' }}>{endTime}</td>
                      <td style={{ padding: '5px 8px', fontFamily: 'monospace', textAlign: 'right' }}>{t.durationMinutes ? `${t.durationMinutes} dk` : '—'}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {/* Signature */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 40, marginTop: 36 }}>
            <div>
              <div style={{ borderBottom: '1px solid #1c1917', height: 36 }}/>
              <div style={{ fontSize: 9.5, color: '#78716c', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600, marginTop: 6 }}>Hazırlayan</div>
              <div style={{ fontSize: 11 }}>Kat Hizmetleri Şefi</div>
            </div>
            <div>
              <div style={{ borderBottom: '1px solid #1c1917', height: 36 }}/>
              <div style={{ fontSize: 9.5, color: '#78716c', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600, marginTop: 6 }}>Onaylayan</div>
              <div style={{ fontSize: 11 }}>Operasyon Müdürü</div>
            </div>
          </div>

          {/* Footer */}
          <div style={{ marginTop: 32, paddingTop: 10, borderTop: '1px solid #e7e5e4', display: 'flex', justifyContent: 'space-between', fontSize: 9, color: '#a8a29e', fontFamily: 'monospace' }}>
            <span>{tenantName} · HotelOS</span>
            <span>{reportId} · {generatedAt}</span>
            <span>Sayfa 1 / 1</span>
          </div>
        </div>
      </body>
    </html>
  )
}
