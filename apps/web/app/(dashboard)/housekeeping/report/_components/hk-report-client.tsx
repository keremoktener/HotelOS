'use client'

import { useRouter } from 'next/navigation'
import { Chip } from '@/components/ui/chip'
import { StatTile } from '@/components/ui/stat-tile'
import { th, td } from '@/components/ui/data-table'
import { trDate } from '@/lib/utils'
import { CheckCircle, Clock, Package, Printer, Sparkles } from 'lucide-react'

interface Summary {
  totalTasks: number; completedTasks: number; pendingTasks: number; avgMinutes: number | null
  caTotal: number; caCompleted: number; lafLogged: number; lafReturned: number
}
interface Task {
  id: string; status: string; type: string; notes: string
  completedAt: string | null; durationMinutes: number | null
  room: { number: string; floor: number | null; typeName: string } | null
}
interface CaSchedule { id: string; areaName: string; completedAt: string | null }
interface LafItem { id: string; description: string; foundBy: string; roomNumber: string | null }

interface Props {
  date: string
  summary: Summary
  tasks: Task[]
  caSchedules: CaSchedule[]
  lafItems: LafItem[]
}

const STATUS_LABEL: Record<string, string> = { PENDING: 'Beklemede', IN_PROGRESS: 'İşlemde', DONE: 'Tamamlandı' }
const STATUS_TONE: Record<string, string>  = { PENDING: 'warn', IN_PROGRESS: 'info', DONE: 'good' }

export function HkReportClient({ date, summary, tasks, caSchedules, lafItems }: Props) {
  const router = useRouter()

  function changeDate(d: string) {
    router.push(`/housekeeping/report?date=${d}`)
  }

  const completionPct = summary.totalTasks > 0
    ? Math.round((summary.completedTasks / summary.totalTasks) * 100)
    : 100

  return (
    <div style={{ height: 'calc(100% - 56px)', overflowY: 'auto', padding: 24 }}>
      {/* Date picker + print */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
        <div style={{ fontSize: 13, color: 'var(--text-2)' }}>Tarih:</div>
        <input
          type="date"
          defaultValue={date}
          onChange={e => changeDate(e.target.value)}
          style={{ padding: '5px 10px', borderRadius: 6, border: '1px solid var(--border-c)', background: 'var(--surface)', color: 'var(--text)', fontSize: 13 }}
        />
        <div style={{ flex: 1 }}/>
        <button
          onClick={() => { const w = window.open(`/housekeeping/report/print?date=${date}`, '_blank'); w?.addEventListener('load', () => w.print()) }}
          style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px', background: 'var(--surface-2)', color: 'var(--text-2)', border: '1px solid var(--border-c)', borderRadius: 6, fontSize: 13, cursor: 'pointer' }}
        >
          <Printer size={14}/> Yazdır / PDF
        </button>
      </div>

      {/* Summary stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 24 }}>
        <StatTile
          icon={<CheckCircle size={18}/>}
          label="Tamamlanan Görev"
          value={`${summary.completedTasks} / ${summary.totalTasks}`}
          color={completionPct === 100 ? 'var(--good)' : 'var(--warn)'}
          bg={completionPct === 100 ? 'var(--good-bg)' : 'var(--warn-bg)'}
        />
        <StatTile
          icon={<Clock size={18}/>}
          label="Ort. Temizlik Süresi"
          value={summary.avgMinutes ? `${summary.avgMinutes} dk` : '—'}
          color="var(--info)"
          bg="var(--info-bg)"
        />
        <StatTile
          icon={<Sparkles size={18}/>}
          label="Ortak Alan"
          value={`${summary.caCompleted} / ${summary.caTotal}`}
          color={summary.caCompleted === summary.caTotal ? 'var(--good)' : 'var(--warn)'}
          bg={summary.caCompleted === summary.caTotal ? 'var(--good-bg)' : 'var(--warn-bg)'}
        />
        <StatTile
          icon={<Package size={18}/>}
          label="Kayıp Eşya"
          value={`${summary.lafLogged} bulundu · ${summary.lafReturned} teslim`}
          color="var(--text-2)"
          bg="var(--surface-2)"
        />
      </div>

      {/* Completion bar */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'var(--text-2)', marginBottom: 6 }}>
          <span>Görev tamamlanma oranı</span>
          <span style={{ fontWeight: 600, color: completionPct === 100 ? 'var(--good)' : 'var(--warn)' }}>{completionPct}%</span>
        </div>
        <div style={{ height: 6, borderRadius: 3, background: 'var(--surface-2)', overflow: 'hidden' }}>
          <div style={{ height: '100%', width: `${completionPct}%`, background: completionPct === 100 ? 'var(--good)' : 'var(--warn)', borderRadius: 3, transition: 'width 0.3s' }}/>
        </div>
      </div>

      {/* Room tasks */}
      <section style={{ marginBottom: 24 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', marginBottom: 10 }}>Oda Görevleri</div>
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border-c)', borderRadius: 10, overflow: 'hidden', boxShadow: 'var(--shadow-sm)' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead><tr>
              <th style={th}>Oda</th>
              <th style={th}>Tip</th>
              <th style={th}>Notlar</th>
              <th style={th}>Durum</th>
              <th style={th}>Tamamlanma</th>
              <th style={th}>Süre</th>
            </tr></thead>
            <tbody>
              {tasks.map(t => (
                <tr key={t.id} style={{ borderTop: '1px solid var(--border-c)' }}>
                  <td style={{ ...td, fontWeight: 500 }}>
                    {t.room
                      ? <><span style={{ fontFamily: 'var(--font-mono)' }}>{t.room.number}</span><div style={{ fontSize: 11, color: 'var(--text-3)' }}>{t.room.typeName}{t.room.floor != null ? ` · Kat ${t.room.floor}` : ''}</div></>
                      : <span style={{ color: 'var(--text-3)' }}>—</span>}
                  </td>
                  <td style={{ ...td, fontSize: 12, color: 'var(--text-2)' }}>{t.type === 'ROOM' ? 'Oda' : 'Ortak Alan'}</td>
                  <td style={{ ...td, color: 'var(--text-2)', maxWidth: 220, fontSize: 12 }}>{t.notes || '—'}</td>
                  <td style={td}><Chip tone={STATUS_TONE[t.status] ?? 'neutral'} dot>{STATUS_LABEL[t.status] ?? t.status}</Chip></td>
                  <td style={{ ...td, fontSize: 12, color: 'var(--text-2)' }}>{t.completedAt ? trDate(t.completedAt) : '—'}</td>
                  <td style={{ ...td, fontSize: 12, color: 'var(--text-2)' }}>{t.durationMinutes ? `${t.durationMinutes} dk` : '—'}</td>
                </tr>
              ))}
              {tasks.length === 0 && (
                <tr><td colSpan={6} style={{ ...td, textAlign: 'center', color: 'var(--text-3)', padding: '24px 0' }}>Bu tarih için görev yok</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* Common area schedules */}
      {caSchedules.length > 0 && (
        <section style={{ marginBottom: 24 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', marginBottom: 10 }}>Ortak Alan Temizlikleri</div>
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border-c)', borderRadius: 10, overflow: 'hidden', boxShadow: 'var(--shadow-sm)' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead><tr>
                <th style={th}>Alan</th>
                <th style={th}>Durum</th>
                <th style={th}>Tamamlanma</th>
              </tr></thead>
              <tbody>
                {caSchedules.map(s => (
                  <tr key={s.id} style={{ borderTop: '1px solid var(--border-c)' }}>
                    <td style={{ ...td, fontWeight: 500 }}>{s.areaName}</td>
                    <td style={td}><Chip tone={s.completedAt ? 'good' : 'warn'} dot>{s.completedAt ? 'Tamamlandı' : 'Tamamlanmadı'}</Chip></td>
                    <td style={{ ...td, fontSize: 12, color: 'var(--text-2)' }}>{s.completedAt ? trDate(s.completedAt) : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* Lost & Found */}
      {lafItems.length > 0 && (
        <section>
          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', marginBottom: 10 }}>Bugün Bulunan Kayıp Eşyalar</div>
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border-c)', borderRadius: 10, overflow: 'hidden', boxShadow: 'var(--shadow-sm)' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead><tr>
                <th style={th}>Eşya</th>
                <th style={th}>Bulan</th>
                <th style={th}>Oda</th>
              </tr></thead>
              <tbody>
                {lafItems.map(i => (
                  <tr key={i.id} style={{ borderTop: '1px solid var(--border-c)' }}>
                    <td style={{ ...td, fontWeight: 500 }}>{i.description}</td>
                    <td style={{ ...td, fontSize: 12, color: 'var(--text-2)' }}>{i.foundBy}</td>
                    <td style={{ ...td, fontSize: 12, color: 'var(--text-2)' }}>{i.roomNumber ?? '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  )
}
