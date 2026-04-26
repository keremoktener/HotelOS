export const dynamic = 'force-dynamic'

import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { getTenantId } from '@/lib/auth'
import { db } from '@/lib/db'
import { PageHeader } from '@/components/layout/page-header'
import type { CSSProperties, ReactNode } from 'react'

function formatCurrency(kurus: number) { return (kurus / 100).toLocaleString('tr-TR') + ' ₺' }

const STATUS_META: Record<string, { label: string; color: string; bg: string }> = {
  CLEAN:  { label: 'Temiz',   color: 'var(--good)', bg: 'var(--good-bg)' },
  DIRTY:  { label: 'Kirli',   color: 'var(--warn)', bg: 'var(--warn-bg)' },
  FAULTY: { label: 'Arızalı', color: 'var(--bad)',  bg: 'var(--bad-bg)'  },
  DND:    { label: 'DND',     color: 'var(--info)', bg: 'var(--info-bg)' },
}
const PLAN_META: Record<string, { label: string; color: string; bg: string }> = {
  starter:    { label: 'Starter',    color: 'var(--text-2)', bg: 'var(--surface-2)' },
  pro:        { label: 'Pro',        color: 'var(--info)',   bg: 'var(--info-bg)'   },
  enterprise: { label: 'Enterprise', color: 'var(--good)',   bg: 'var(--good-bg)'   },
}
const MODULE_LABELS: Record<string, string> = {
  reservation: 'Rezervasyon', housekeeping: 'Housekeeping', maintenance: 'Bakım',
  fnb: 'F&B', accounting: 'Muhasebe', hr: 'İK', sales: 'Satış',
  agency: 'Acente', crm: 'CRM', reporting: 'Raporlama',
}

function Chip({ color, bg, dot, children }: { color: string; bg: string; dot?: boolean; children: ReactNode }) {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '2px 8px', borderRadius: 999, fontSize: 11, fontWeight: 500, background: bg, color }}>
      {dot && <span style={{ width: 6, height: 6, borderRadius: 999, background: 'currentColor' }}/>}
      {children}
    </span>
  )
}

const th: CSSProperties = { textAlign: 'left', padding: '10px 14px', fontSize: 10, fontWeight: 600, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.08em', background: 'var(--surface-2)', whiteSpace: 'nowrap' }
const td: CSSProperties = { padding: '11px 14px', fontSize: 13, color: 'var(--text)', verticalAlign: 'middle' }

function SectionCard({ title, sub, children }: { title: string; sub?: string; children: ReactNode }) {
  return (
    <div style={{ background: 'var(--surface)', border: '1px solid var(--border-c)', borderRadius: 10, overflow: 'hidden', boxShadow: 'var(--shadow-sm)' }}>
      <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--border-c)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ fontWeight: 600, fontSize: 14 }}>{title}</div>
        {sub && <span style={{ fontSize: 11, color: 'var(--text-3)' }}>{sub}</span>}
      </div>
      {children}
    </div>
  )
}

function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', padding: '12px 16px', borderBottom: '1px solid var(--border-c)', gap: 16 }}>
      <div style={{ fontSize: 12, color: 'var(--text-3)', fontWeight: 500, minWidth: 240, flexShrink: 0 }}>{label}</div>
      <div style={{ fontSize: 13, color: 'var(--text)' }}>{children}</div>
    </div>
  )
}

export default async function SettingsPage() {
  const { userId, orgId } = await auth()
  if (!userId) redirect('/sign-in')
  if (!orgId) redirect('/onboarding')
  const tenantId = await getTenantId(orgId)
  if (!tenantId) redirect('/onboarding')

  const [tenant, settings, roomTypes, rooms] = await Promise.all([
    db.tenant.findUnique({ where: { id: tenantId } }),
    db.tenantSettings.findUnique({ where: { tenantId } }),
    db.roomType.findMany({ where: { tenantId }, orderBy: { name: 'asc' } }),
    db.room.findMany({ where: { tenantId }, include: { roomType: true }, orderBy: [{ floor: 'asc' }, { number: 'asc' }] }),
  ])

  const plan = PLAN_META[tenant?.plan ?? ''] ?? PLAN_META.starter

  return (
    <>
      <PageHeader
        title="Ayarlar"
        breadcrumb="Otel yapılandırması"
        right={
          <Link href="/settings/audit-log" style={{ padding: '5px 12px', background: 'var(--surface)', border: '1px solid var(--border-c)', borderRadius: 6, fontSize: 12, color: 'var(--text-2)', textDecoration: 'none', whiteSpace: 'nowrap' }}>
            Denetim kaydı →
          </Link>
        }
      />
      <div style={{ height: 'calc(100% - 56px)', overflowY: 'auto', padding: 24 }}>
        <div style={{ maxWidth: 860, display: 'flex', flexDirection: 'column', gap: 20 }}>

          {/* Hotel info */}
          <SectionCard title="Otel Bilgileri">
            <Row label="Otel Adı">{tenant?.name ?? '—'}</Row>
            <Row label="Plan">
              <Chip color={plan.color} bg={plan.bg}>{plan.label}</Chip>
            </Row>
            <Row label="Aktif Modüller">
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {(tenant?.activeModules ?? []).length === 0
                  ? <span style={{ color: 'var(--text-3)' }}>—</span>
                  : tenant!.activeModules.map(m => (
                    <Chip key={m} color="var(--info)" bg="var(--info-bg)">{MODULE_LABELS[m] ?? m}</Chip>
                  ))}
              </div>
            </Row>
            <Row label="Kayıt tarihi">
              {tenant?.createdAt ? new Date(tenant.createdAt).toLocaleDateString('tr-TR') : '—'}
            </Row>
          </SectionCard>

          {/* Policy & operational settings */}
          <SectionCard title="Politika ve Kurallar">
            <Row label="No-show politikası">
              {settings?.noShowPolicyHours ?? 24} saat
            </Row>
            <Row label="No-show ücreti">
              %{settings?.noShowFeePercent ?? 0}
            </Row>
            <Row label="Housekeeping rapor saati">
              {settings?.hkReportTime ?? '09:00'}
            </Row>
            <Row label="Çıkış anketi kapısı">
              {(settings?.checkoutSurveyGateEnabled ?? true)
                ? <Chip color="var(--good)" bg="var(--good-bg)" dot>Aktif</Chip>
                : <Chip color="var(--text-2)" bg="var(--surface-2)" dot>Pasif</Chip>}
            </Row>
            <Row label="SGK işçi payı">
              %{((settings?.sgkEmployeeRate ?? 1400) / 100).toFixed(2)}
            </Row>
            <Row label="SGK işveren payı">
              %{((settings?.sgkEmployerRate ?? 2050) / 100).toFixed(2)}
            </Row>
          </SectionCard>

          {/* Room types */}
          <SectionCard title="Oda Tipleri" sub={`${roomTypes.length} tip`}>
            {roomTypes.length === 0 ? (
              <div style={{ padding: '24px 16px', color: 'var(--text-3)', fontSize: 13, textAlign: 'center' }}>
                Henüz oda tipi tanımlanmamış.
              </div>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead><tr>
                  <th style={th}>Tip Adı</th>
                  <th style={th}>Kapasite</th>
                  <th style={th}>Taban Fiyat</th>
                  <th style={th}>Min. Fotoğraf</th>
                </tr></thead>
                <tbody>
                  {roomTypes.map(rt => (
                    <tr key={rt.id} style={{ borderTop: '1px solid var(--border-c)' }}>
                      <td style={{ ...td, fontWeight: 600 }}>{rt.name}</td>
                      <td style={td}>{rt.capacity} kişi</td>
                      <td style={{ ...td, fontFamily: 'var(--font-mono)' }}>{formatCurrency(rt.basePrice)}</td>
                      <td style={td}>{rt.minPhotosRequired}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </SectionCard>

          {/* Rooms */}
          <SectionCard title="Odalar" sub={`${rooms.length} oda`}>
            {rooms.length === 0 ? (
              <div style={{ padding: '24px 16px', color: 'var(--text-3)', fontSize: 13, textAlign: 'center' }}>
                Henüz oda tanımlanmamış.
              </div>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead><tr>
                  <th style={th}>No</th>
                  <th style={th}>Tip</th>
                  <th style={th}>Kat</th>
                  <th style={th}>Durum</th>
                </tr></thead>
                <tbody>
                  {rooms.map(r => {
                    const sm = STATUS_META[r.status] ?? { label: r.status, color: 'var(--text-2)', bg: 'var(--surface-2)' }
                    return (
                      <tr key={r.id} style={{ borderTop: '1px solid var(--border-c)' }}>
                        <td style={{ ...td, fontWeight: 600, fontFamily: 'var(--font-mono)' }}>{r.number}</td>
                        <td style={td}>{r.roomType.name}</td>
                        <td style={td}>{r.floor ?? '—'}</td>
                        <td style={td}><Chip color={sm.color} bg={sm.bg} dot>{sm.label}</Chip></td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            )}
          </SectionCard>

          {/* Audit log shortcut */}
          <Link href="/settings/audit-log" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px', background: 'var(--surface)', border: '1px solid var(--border-c)', borderRadius: 10, boxShadow: 'var(--shadow-sm)', textDecoration: 'none', color: 'var(--text)' }}>
            <div>
              <div style={{ fontWeight: 600, fontSize: 14 }}>Denetim Kaydı</div>
              <div style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 3 }}>Tüm sistem ve kullanıcı değişikliklerini görüntüle</div>
            </div>
            <span style={{ color: 'var(--text-3)', fontSize: 18 }}>→</span>
          </Link>

        </div>
      </div>
    </>
  )
}
