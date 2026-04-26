export const dynamic = 'force-dynamic'

import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { getTenantId } from '@/lib/auth'
import { db } from '@/lib/db'
import { displayCurrency } from '@/lib/utils'
import { PageHeader } from '@/components/layout/page-header'
import { Chip } from '@/components/ui/chip'
import { SectionCard } from '@/components/ui/section-card'
import { Row } from '@/components/ui/kv'
import { th, td } from '@/components/ui/data-table'

const STATUS_META: Record<string, { label: string; tone: string }> = {
  CLEAN:  { label: 'Temiz',   tone: 'good'    },
  DIRTY:  { label: 'Kirli',   tone: 'warn'    },
  FAULTY: { label: 'Arızalı', tone: 'bad'     },
  DND:    { label: 'DND',     tone: 'info'    },
}
const PLAN_TONE: Record<string, string> = {
  starter: 'neutral', pro: 'info', enterprise: 'good',
}
const PLAN_LABEL: Record<string, string> = {
  starter: 'Starter', pro: 'Pro', enterprise: 'Enterprise',
}
const MODULE_LABELS: Record<string, string> = {
  reservation: 'Rezervasyon', housekeeping: 'Housekeeping', maintenance: 'Bakım',
  fnb: 'F&B', accounting: 'Muhasebe', hr: 'İK', sales: 'Satış',
  agency: 'Acente', crm: 'CRM', reporting: 'Raporlama',
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

          <SectionCard title="Otel Bilgileri">
            <Row label="Otel Adı">{tenant?.name ?? '—'}</Row>
            <Row label="Plan">
              <Chip tone={PLAN_TONE[tenant?.plan ?? ''] ?? 'neutral'}>{PLAN_LABEL[tenant?.plan ?? ''] ?? tenant?.plan ?? '—'}</Chip>
            </Row>
            <Row label="Aktif Modüller">
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {(tenant?.activeModules ?? []).length === 0
                  ? <span style={{ color: 'var(--text-3)' }}>—</span>
                  : tenant!.activeModules.map(m => (
                    <Chip key={m} tone="info">{MODULE_LABELS[m] ?? m}</Chip>
                  ))}
              </div>
            </Row>
            <Row label="Kayıt tarihi">
              {tenant?.createdAt ? new Date(tenant.createdAt).toLocaleDateString('tr-TR') : '—'}
            </Row>
          </SectionCard>

          <SectionCard title="Politika ve Kurallar">
            <Row label="No-show politikası">{settings?.noShowPolicyHours ?? 24} saat</Row>
            <Row label="No-show ücreti">%{settings?.noShowFeePercent ?? 0}</Row>
            <Row label="Housekeeping rapor saati">{settings?.hkReportTime ?? '09:00'}</Row>
            <Row label="Çıkış anketi kapısı">
              <Chip tone={(settings?.checkoutSurveyGateEnabled ?? true) ? 'good' : 'neutral'} dot>
                {(settings?.checkoutSurveyGateEnabled ?? true) ? 'Aktif' : 'Pasif'}
              </Chip>
            </Row>
            <Row label="SGK işçi payı">%{((settings?.sgkEmployeeRate ?? 1400) / 100).toFixed(2)}</Row>
            <Row label="SGK işveren payı">%{((settings?.sgkEmployerRate ?? 2050) / 100).toFixed(2)}</Row>
          </SectionCard>

          <SectionCard title="Oda Tipleri" right={`${roomTypes.length} tip`}>
            {roomTypes.length === 0 ? (
              <div style={{ padding: '24px 16px', color: 'var(--text-3)', fontSize: 13, textAlign: 'center' }}>Henüz oda tipi tanımlanmamış.</div>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead><tr>
                  <th style={th}>Tip Adı</th><th style={th}>Kapasite</th>
                  <th style={th}>Taban Fiyat</th><th style={th}>Min. Fotoğraf</th>
                </tr></thead>
                <tbody>
                  {roomTypes.map(rt => (
                    <tr key={rt.id} style={{ borderTop: '1px solid var(--border-c)' }}>
                      <td style={{ ...td, fontWeight: 600 }}>{rt.name}</td>
                      <td style={td}>{rt.capacity} kişi</td>
                      <td style={{ ...td, fontFamily: 'var(--font-mono)' }}>{displayCurrency(rt.basePrice)}</td>
                      <td style={td}>{rt.minPhotosRequired}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </SectionCard>

          <SectionCard title="Odalar" right={`${rooms.length} oda`}>
            {rooms.length === 0 ? (
              <div style={{ padding: '24px 16px', color: 'var(--text-3)', fontSize: 13, textAlign: 'center' }}>Henüz oda tanımlanmamış.</div>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead><tr>
                  <th style={th}>No</th><th style={th}>Tip</th><th style={th}>Kat</th><th style={th}>Durum</th>
                </tr></thead>
                <tbody>
                  {rooms.map(r => {
                    const sm = STATUS_META[r.status] ?? { label: r.status, tone: 'neutral' }
                    return (
                      <tr key={r.id} style={{ borderTop: '1px solid var(--border-c)' }}>
                        <td style={{ ...td, fontWeight: 600, fontFamily: 'var(--font-mono)' }}>{r.number}</td>
                        <td style={td}>{r.roomType.name}</td>
                        <td style={td}>{r.floor ?? '—'}</td>
                        <td style={td}><Chip tone={sm.tone} dot>{sm.label}</Chip></td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            )}
          </SectionCard>

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
