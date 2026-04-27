'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { trpc } from '@/lib/trpc/client'
import { trDate } from '@/lib/utils'
import { Chip } from '@/components/ui/chip'
import { th, td } from '@/components/ui/data-table'
import { inputStyle } from '@/components/ui/kv'
import { Building2, ClipboardList, Phone, Plus } from 'lucide-react'

interface Firm {
  id: string; name: string; phone: string; specialty: string | null
  visitCount: number; lastVisit: string | null
}
interface Visit {
  id: string; firmId: string; firmName: string; visitDate: string
  description: string; invoiceId: string | null
}
interface Props { firms: Firm[]; visits: Visit[] }

type Tab = 'firms' | 'visits'

export function ServiceFirmsClient({ firms, visits }: Props) {
  const router = useRouter()
  const [tab, setTab] = useState<Tab>('firms')
  const [showFirmForm, setShowFirmForm] = useState(false)
  const [showVisitForm, setShowVisitForm] = useState(false)
  const [fName, setFName] = useState('')
  const [fPhone, setFPhone] = useState('')
  const [fSpecialty, setFSpecialty] = useState('')
  const [vFirmId, setVFirmId] = useState('')
  const [vDate, setVDate] = useState(new Date().toISOString().slice(0, 10))
  const [vDesc, setVDesc] = useState('')
  const [vInvoice, setVInvoice] = useState('')
  const [formError, setFormError] = useState('')

  const refresh = () => router.refresh()

  const firmCreateMut = trpc.maintenance.firms.create.useMutation({
    onSuccess: () => { refresh(); setShowFirmForm(false); setFName(''); setFPhone(''); setFSpecialty(''); setFormError('') },
    onError: (e) => setFormError(e.message),
  })
  const firmDeleteMut = trpc.maintenance.firms.delete.useMutation({ onSuccess: refresh })
  const visitCreateMut = trpc.maintenance.firms.createVisit.useMutation({
    onSuccess: () => { refresh(); setShowVisitForm(false); setVFirmId(''); setVDesc(''); setVInvoice(''); setFormError('') },
    onError: (e) => setFormError(e.message),
  })

  function handleCreateFirm(e: React.FormEvent) {
    e.preventDefault()
    if (!fName.trim() || !fPhone.trim()) { setFormError('Ad ve telefon zorunlu'); return }
    firmCreateMut.mutate({ name: fName.trim(), phone: fPhone.trim(), specialty: fSpecialty.trim() || undefined })
  }

  function handleCreateVisit(e: React.FormEvent) {
    e.preventDefault()
    if (!vFirmId || !vDesc.trim()) { setFormError('Firma ve açıklama zorunlu'); return }
    visitCreateMut.mutate({ firmId: vFirmId, visitDate: new Date(vDate), description: vDesc.trim(), invoiceId: vInvoice.trim() || undefined })
  }

  return (
    <div style={{ height: 'calc(100% - 56px)', overflowY: 'auto', padding: 24 }}>
      {/* Tabs */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
        <div style={{ display: 'flex', background: 'var(--surface)', border: '1px solid var(--border-c)', borderRadius: 6, padding: 2 }}>
          {(['firms', 'visits'] as Tab[]).map(t => (
            <button key={t} onClick={() => setTab(t)} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '5px 12px', background: tab === t ? 'var(--surface-2)' : 'transparent', color: tab === t ? 'var(--text)' : 'var(--text-2)', border: 0, borderRadius: 4, fontSize: 12, fontWeight: tab === t ? 600 : 450, cursor: 'pointer' }}>
              {t === 'firms' ? <><Building2 size={13}/> Firmalar ({firms.length})</> : <><ClipboardList size={13}/> Ziyaret Geçmişi ({visits.length})</>}
            </button>
          ))}
        </div>
        <div style={{ flex: 1 }}/>
        {tab === 'firms' && (
          <button onClick={() => { setShowFirmForm(v => !v); setFormError('') }} style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '7px 14px', background: 'var(--accent-c)', color: 'var(--accent-fg)', border: 0, borderRadius: 6, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
            <Plus size={14}/> Firma ekle
          </button>
        )}
        {tab === 'visits' && (
          <button onClick={() => { setShowVisitForm(v => !v); setFormError('') }} style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '7px 14px', background: 'var(--accent-c)', color: 'var(--accent-fg)', border: 0, borderRadius: 6, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
            <Plus size={14}/> Ziyaret ekle
          </button>
        )}
      </div>

      {/* Firm create form */}
      {tab === 'firms' && showFirmForm && (
        <form onSubmit={handleCreateFirm} style={{ background: 'var(--surface)', border: '1px solid var(--border-c)', borderRadius: 10, padding: 16, marginBottom: 14, boxShadow: 'var(--shadow-sm)' }}>
          <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 12 }}>Yeni servis firması</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, marginBottom: 10 }}>
            <div>
              <div style={{ fontSize: 11, color: 'var(--text-3)', fontWeight: 500, marginBottom: 3 }}>Firma adı *</div>
              <input value={fName} onChange={e => setFName(e.target.value)} style={inputStyle} placeholder="ABC Teknik Servis"/>
            </div>
            <div>
              <div style={{ fontSize: 11, color: 'var(--text-3)', fontWeight: 500, marginBottom: 3 }}>Telefon *</div>
              <input value={fPhone} onChange={e => setFPhone(e.target.value)} style={inputStyle} placeholder="0212 000 00 00"/>
            </div>
            <div>
              <div style={{ fontSize: 11, color: 'var(--text-3)', fontWeight: 500, marginBottom: 3 }}>Uzmanlık alanı</div>
              <input value={fSpecialty} onChange={e => setFSpecialty(e.target.value)} style={inputStyle} placeholder="Asansör, Klima, Elektrik…"/>
            </div>
          </div>
          {formError && <div style={{ padding: '6px 10px', background: 'var(--bad-bg)', color: 'var(--bad)', borderRadius: 6, fontSize: 12, marginBottom: 10 }}>{formError}</div>}
          <div style={{ display: 'flex', gap: 6 }}>
            <button type="submit" disabled={firmCreateMut.isPending} style={{ padding: '7px 18px', background: 'var(--accent-c)', color: 'var(--accent-fg)', border: 0, borderRadius: 6, fontSize: 13, fontWeight: 600, cursor: 'pointer', opacity: firmCreateMut.isPending ? 0.6 : 1 }}>
              {firmCreateMut.isPending ? 'Kaydediliyor…' : 'Kaydet'}
            </button>
            <button type="button" onClick={() => { setShowFirmForm(false); setFormError('') }} style={{ padding: '7px 12px', background: 'var(--surface-2)', color: 'var(--text-2)', border: '1px solid var(--border-c)', borderRadius: 6, fontSize: 13, cursor: 'pointer' }}>İptal</button>
          </div>
        </form>
      )}

      {/* Visit create form */}
      {tab === 'visits' && showVisitForm && (
        <form onSubmit={handleCreateVisit} style={{ background: 'var(--surface)', border: '1px solid var(--border-c)', borderRadius: 10, padding: 16, marginBottom: 14, boxShadow: 'var(--shadow-sm)' }}>
          <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 12 }}>Yeni ziyaret kaydı</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, marginBottom: 10 }}>
            <div>
              <div style={{ fontSize: 11, color: 'var(--text-3)', fontWeight: 500, marginBottom: 3 }}>Firma *</div>
              <select value={vFirmId} onChange={e => setVFirmId(e.target.value)} style={inputStyle}>
                <option value="">Firma seçin…</option>
                {firms.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
              </select>
            </div>
            <div>
              <div style={{ fontSize: 11, color: 'var(--text-3)', fontWeight: 500, marginBottom: 3 }}>Ziyaret tarihi</div>
              <input type="date" value={vDate} onChange={e => setVDate(e.target.value)} style={inputStyle}/>
            </div>
            <div>
              <div style={{ fontSize: 11, color: 'var(--text-3)', fontWeight: 500, marginBottom: 3 }}>Fatura / İş emri no</div>
              <input value={vInvoice} onChange={e => setVInvoice(e.target.value)} style={inputStyle} placeholder="Opsiyonel"/>
            </div>
          </div>
          <div style={{ marginBottom: 10 }}>
            <div style={{ fontSize: 11, color: 'var(--text-3)', fontWeight: 500, marginBottom: 3 }}>Yapılan iş *</div>
            <textarea value={vDesc} onChange={e => setVDesc(e.target.value)} style={{ ...inputStyle, minHeight: 64, resize: 'vertical', fontFamily: 'inherit' }} placeholder="Yapılan işin açıklaması…"/>
          </div>
          {formError && <div style={{ padding: '6px 10px', background: 'var(--bad-bg)', color: 'var(--bad)', borderRadius: 6, fontSize: 12, marginBottom: 10 }}>{formError}</div>}
          <div style={{ display: 'flex', gap: 6 }}>
            <button type="submit" disabled={visitCreateMut.isPending} style={{ padding: '7px 18px', background: 'var(--accent-c)', color: 'var(--accent-fg)', border: 0, borderRadius: 6, fontSize: 13, fontWeight: 600, cursor: 'pointer', opacity: visitCreateMut.isPending ? 0.6 : 1 }}>
              {visitCreateMut.isPending ? 'Kaydediliyor…' : 'Kaydet'}
            </button>
            <button type="button" onClick={() => { setShowVisitForm(false); setFormError('') }} style={{ padding: '7px 12px', background: 'var(--surface-2)', color: 'var(--text-2)', border: '1px solid var(--border-c)', borderRadius: 6, fontSize: 13, cursor: 'pointer' }}>İptal</button>
          </div>
        </form>
      )}

      {/* Firms table */}
      {tab === 'firms' && (
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border-c)', borderRadius: 10, overflow: 'hidden', boxShadow: 'var(--shadow-sm)' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead><tr>
              <th style={th}>Firma</th>
              <th style={th}>Telefon</th>
              <th style={th}>Uzmanlık</th>
              <th style={th}>Ziyaret Sayısı</th>
              <th style={th}>Son Ziyaret</th>
              <th style={{ ...th, width: 100 }}>İşlem</th>
            </tr></thead>
            <tbody>
              {firms.map(f => (
                <tr key={f.id} style={{ borderTop: '1px solid var(--border-c)' }}>
                  <td style={{ ...td, fontWeight: 500 }}>{f.name}</td>
                  <td style={td}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, color: 'var(--text-2)' }}>
                      <Phone size={12} style={{ color: 'var(--text-3)' }}/>{f.phone}
                    </div>
                  </td>
                  <td style={td}>{f.specialty ? <Chip tone="neutral">{f.specialty}</Chip> : <span style={{ color: 'var(--text-3)' }}>—</span>}</td>
                  <td style={{ ...td, fontSize: 12, color: 'var(--text-2)' }}>{f.visitCount}</td>
                  <td style={{ ...td, fontSize: 12, color: 'var(--text-2)' }}>{f.lastVisit ? trDate(f.lastVisit) : '—'}</td>
                  <td style={td}>
                    <button
                      onClick={() => { if (confirm('Firmayı silmek istediğinizden emin misiniz?')) firmDeleteMut.mutate({ id: f.id }) }}
                      style={{ padding: '4px 8px', background: 'var(--bad-bg)', color: 'var(--bad)', border: '1px solid var(--bad)', borderRadius: 5, fontSize: 11, cursor: 'pointer' }}
                    >
                      Sil
                    </button>
                  </td>
                </tr>
              ))}
              {firms.length === 0 && (
                <tr><td colSpan={6} style={{ ...td, textAlign: 'center', color: 'var(--text-3)', padding: '32px 0' }}>Kayıtlı firma yok</td></tr>
              )}
            </tbody>
          </table>
          <div style={{ padding: '10px 16px', borderTop: '1px solid var(--border-c)', fontSize: 12, color: 'var(--text-3)' }}>
            {firms.length} firma kayıtlı
          </div>
        </div>
      )}

      {/* Visits table */}
      {tab === 'visits' && (
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border-c)', borderRadius: 10, overflow: 'hidden', boxShadow: 'var(--shadow-sm)' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead><tr>
              <th style={th}>Firma</th>
              <th style={th}>Tarih</th>
              <th style={th}>Yapılan İş</th>
              <th style={th}>Fatura / İş Emri</th>
            </tr></thead>
            <tbody>
              {visits.map(v => (
                <tr key={v.id} style={{ borderTop: '1px solid var(--border-c)' }}>
                  <td style={{ ...td, fontWeight: 500 }}>{v.firmName}</td>
                  <td style={{ ...td, fontSize: 12, color: 'var(--text-2)' }}>{trDate(v.visitDate)}</td>
                  <td style={{ ...td, color: 'var(--text-2)', maxWidth: 320 }}>{v.description}</td>
                  <td style={{ ...td, fontSize: 12, color: 'var(--text-2)', fontFamily: 'var(--font-mono)' }}>{v.invoiceId ?? '—'}</td>
                </tr>
              ))}
              {visits.length === 0 && (
                <tr><td colSpan={4} style={{ ...td, textAlign: 'center', color: 'var(--text-3)', padding: '32px 0' }}>Ziyaret kaydı yok</td></tr>
              )}
            </tbody>
          </table>
          <div style={{ padding: '10px 16px', borderTop: '1px solid var(--border-c)', fontSize: 12, color: 'var(--text-3)' }}>
            {visits.length} ziyaret kaydı
          </div>
        </div>
      )}
    </div>
  )
}
