'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { trpc } from '@/lib/trpc/client'
import { trDate } from '@/lib/utils'
import { Chip } from '@/components/ui/chip'
import { StatTile } from '@/components/ui/stat-tile'
import { th, td } from '@/components/ui/data-table'
import { inputStyle } from '@/components/ui/kv'
import { AlertTriangle, Package, Plus, Wrench } from 'lucide-react'

interface Equipment {
  id: string; name: string; category: string; serialNo: string | null
  purchaseDate: string | null; warrantyExpiry: string | null
  lastServiceDate: string | null; nextServiceDate: string | null
  lastPM: string | null
}
interface Stats { total: number; warrantyExpiringSoon: number; serviceOverdue: number }
interface Props { equipment: Equipment[]; stats: Stats }

export function EquipmentClient({ equipment, stats }: Props) {
  const router = useRouter()
  const [showForm, setShowForm] = useState(false)
  const [fName, setFName] = useState('')
  const [fCategory, setFCategory] = useState('')
  const [fSerial, setFSerial] = useState('')
  const [fPurchase, setFPurchase] = useState('')
  const [fWarranty, setFWarranty] = useState('')
  const [fNextService, setFNextService] = useState('')
  const [formError, setFormError] = useState('')
  const [editId, setEditId] = useState<string | null>(null)
  const [editNextService, setEditNextService] = useState('')

  const refresh = () => router.refresh()

  const createMut = trpc.maintenance.equipment.create.useMutation({
    onSuccess: () => {
      refresh(); setShowForm(false)
      setFName(''); setFCategory(''); setFSerial(''); setFPurchase(''); setFWarranty(''); setFNextService('')
      setFormError('')
    },
    onError: (e) => setFormError(e.message),
  })
  const updateMut = trpc.maintenance.equipment.update.useMutation({
    onSuccess: () => { refresh(); setEditId(null); setEditNextService('') },
  })
  const deleteMut = trpc.maintenance.equipment.delete.useMutation({ onSuccess: refresh })

  function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    if (!fName.trim() || !fCategory.trim()) { setFormError('Ad ve kategori zorunlu'); return }
    createMut.mutate({
      name: fName.trim(),
      category: fCategory.trim(),
      serialNo: fSerial.trim() || undefined,
      purchaseDate: fPurchase ? new Date(fPurchase) : undefined,
      warrantyExpiry: fWarranty ? new Date(fWarranty) : undefined,
      nextServiceDate: fNextService ? new Date(fNextService) : undefined,
    })
  }

  const now = new Date()

  return (
    <div style={{ height: 'calc(100% - 56px)', overflowY: 'auto', padding: 24 }}>
      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 20 }}>
        <StatTile icon={<Package size={18}/>} label="Toplam Ekipman" value={String(stats.total)} color="var(--text-2)" bg="var(--surface-2)"/>
        <StatTile icon={<AlertTriangle size={18}/>} label="Garanti Bitiyor" value={String(stats.warrantyExpiringSoon)} color="var(--warn)" bg="var(--warn-bg)"/>
        <StatTile icon={<Wrench size={18}/>} label="Servis Gecikmiş" value={String(stats.serviceOverdue)} color="var(--bad)" bg="var(--bad-bg)"/>
      </div>

      {/* Actions */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 14 }}>
        <button onClick={() => setShowForm(v => !v)} style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '7px 14px', background: 'var(--accent-c)', color: 'var(--accent-fg)', border: 0, borderRadius: 6, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
          <Plus size={14}/> Ekipman ekle
        </button>
      </div>

      {/* Create form */}
      {showForm && (
        <form onSubmit={handleCreate} style={{ background: 'var(--surface)', border: '1px solid var(--border-c)', borderRadius: 10, padding: 16, marginBottom: 14, boxShadow: 'var(--shadow-sm)' }}>
          <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 12 }}>Yeni ekipman</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 10 }}>
            <div>
              <div style={{ fontSize: 11, color: 'var(--text-3)', fontWeight: 500, marginBottom: 3 }}>Ekipman adı *</div>
              <input value={fName} onChange={e => setFName(e.target.value)} style={inputStyle} placeholder="Klima, Asansör, Jeneratör…"/>
            </div>
            <div>
              <div style={{ fontSize: 11, color: 'var(--text-3)', fontWeight: 500, marginBottom: 3 }}>Kategori *</div>
              <input value={fCategory} onChange={e => setFCategory(e.target.value)} style={inputStyle} placeholder="HVAC, Elektrik, Mekanik…"/>
            </div>
            <div>
              <div style={{ fontSize: 11, color: 'var(--text-3)', fontWeight: 500, marginBottom: 3 }}>Seri no</div>
              <input value={fSerial} onChange={e => setFSerial(e.target.value)} style={inputStyle} placeholder="Opsiyonel"/>
            </div>
            <div>
              <div style={{ fontSize: 11, color: 'var(--text-3)', fontWeight: 500, marginBottom: 3 }}>Alım tarihi</div>
              <input type="date" value={fPurchase} onChange={e => setFPurchase(e.target.value)} style={inputStyle}/>
            </div>
            <div>
              <div style={{ fontSize: 11, color: 'var(--text-3)', fontWeight: 500, marginBottom: 3 }}>Garanti bitiş</div>
              <input type="date" value={fWarranty} onChange={e => setFWarranty(e.target.value)} style={inputStyle}/>
            </div>
            <div>
              <div style={{ fontSize: 11, color: 'var(--text-3)', fontWeight: 500, marginBottom: 3 }}>Sonraki bakım</div>
              <input type="date" value={fNextService} onChange={e => setFNextService(e.target.value)} style={inputStyle}/>
            </div>
          </div>
          {formError && <div style={{ padding: '6px 10px', background: 'var(--bad-bg)', color: 'var(--bad)', borderRadius: 6, fontSize: 12, marginBottom: 10 }}>{formError}</div>}
          <div style={{ display: 'flex', gap: 6 }}>
            <button type="submit" disabled={createMut.isPending} style={{ padding: '7px 18px', background: 'var(--accent-c)', color: 'var(--accent-fg)', border: 0, borderRadius: 6, fontSize: 13, fontWeight: 600, cursor: 'pointer', opacity: createMut.isPending ? 0.6 : 1 }}>
              {createMut.isPending ? 'Kaydediliyor…' : 'Kaydet'}
            </button>
            <button type="button" onClick={() => { setShowForm(false); setFormError('') }} style={{ padding: '7px 12px', background: 'var(--surface-2)', color: 'var(--text-2)', border: '1px solid var(--border-c)', borderRadius: 6, fontSize: 13, cursor: 'pointer' }}>İptal</button>
          </div>
        </form>
      )}

      {/* Table */}
      <div style={{ background: 'var(--surface)', border: '1px solid var(--border-c)', borderRadius: 10, overflow: 'hidden', boxShadow: 'var(--shadow-sm)' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead><tr>
              <th style={th}>Ekipman</th>
              <th style={th}>Kategori</th>
              <th style={th}>Seri No</th>
              <th style={th}>Garanti Bitiş</th>
              <th style={th}>Son Bakım</th>
              <th style={th}>Sonraki Bakım</th>
              <th style={{ ...th, width: 200 }}>İşlem</th>
            </tr></thead>
            <tbody>
              {equipment.map(e => {
                const warrantyExpired = e.warrantyExpiry ? new Date(e.warrantyExpiry) < now : false
                const warrantyExpiringSoon = e.warrantyExpiry
                  ? new Date(e.warrantyExpiry) >= now && new Date(e.warrantyExpiry) < new Date(now.getTime() + 30 * 86_400_000)
                  : false
                const serviceOverdue = e.nextServiceDate ? new Date(e.nextServiceDate) < now : false

                return (
                  <>
                    <tr key={e.id} style={{ borderTop: '1px solid var(--border-c)' }}>
                      <td style={{ ...td, fontWeight: 500 }}>{e.name}</td>
                      <td style={td}><Chip tone="neutral">{e.category}</Chip></td>
                      <td style={{ ...td, fontSize: 12, color: 'var(--text-2)', fontFamily: 'var(--font-mono)' }}>{e.serialNo ?? '—'}</td>
                      <td style={td}>
                        {e.warrantyExpiry ? (
                          <Chip tone={warrantyExpired ? 'bad' : warrantyExpiringSoon ? 'warn' : 'good'}>
                            {trDate(e.warrantyExpiry)}
                          </Chip>
                        ) : <span style={{ color: 'var(--text-3)' }}>—</span>}
                      </td>
                      <td style={{ ...td, fontSize: 12, color: 'var(--text-2)' }}>{e.lastServiceDate ? trDate(e.lastServiceDate) : e.lastPM ? trDate(e.lastPM) : '—'}</td>
                      <td style={td}>
                        {e.nextServiceDate ? (
                          <Chip tone={serviceOverdue ? 'bad' : 'neutral'}>
                            {trDate(e.nextServiceDate)}
                          </Chip>
                        ) : <span style={{ color: 'var(--text-3)' }}>—</span>}
                      </td>
                      <td style={td}>
                        <div style={{ display: 'flex', gap: 5 }}>
                          <button
                            onClick={() => { setEditId(editId === e.id ? null : e.id); setEditNextService(e.nextServiceDate?.slice(0, 10) ?? '') }}
                            style={{ padding: '4px 8px', background: 'var(--surface-2)', color: 'var(--text-2)', border: '1px solid var(--border-c)', borderRadius: 5, fontSize: 11, cursor: 'pointer' }}
                          >
                            Bakım güncelle
                          </button>
                          <button
                            onClick={() => { if (confirm('Ekipmanı silmek istediğinizden emin misiniz?')) deleteMut.mutate({ id: e.id }) }}
                            style={{ padding: '4px 8px', background: 'var(--bad-bg)', color: 'var(--bad)', border: '1px solid var(--bad)', borderRadius: 5, fontSize: 11, cursor: 'pointer' }}
                          >
                            Sil
                          </button>
                        </div>
                      </td>
                    </tr>
                    {editId === e.id && (
                      <tr key={`${e.id}-edit`} style={{ borderTop: '1px solid var(--border-c)', background: 'var(--surface-2)' }}>
                        <td colSpan={7} style={{ padding: '10px 14px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <div style={{ fontSize: 12, color: 'var(--text-2)', whiteSpace: 'nowrap' }}>Sonraki bakım tarihi:</div>
                            <input type="date" value={editNextService} onChange={e => setEditNextService(e.target.value)} style={{ ...inputStyle, maxWidth: 160 }}/>
                            <button
                              onClick={() => updateMut.mutate({ id: e.id, data: { nextServiceDate: editNextService ? new Date(editNextService) : undefined, lastServiceDate: new Date() } })}
                              disabled={!editNextService}
                              style={{ padding: '6px 14px', background: 'var(--accent-c)', color: 'var(--accent-fg)', border: 0, borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: 'pointer', opacity: editNextService ? 1 : 0.5 }}
                            >
                              Kaydet
                            </button>
                            <button onClick={() => setEditId(null)} style={{ padding: '6px 10px', background: 'transparent', color: 'var(--text-2)', border: '1px solid var(--border-c)', borderRadius: 6, fontSize: 12, cursor: 'pointer' }}>İptal</button>
                          </div>
                        </td>
                      </tr>
                    )}
                  </>
                )
              })}
              {equipment.length === 0 && (
                <tr><td colSpan={7} style={{ ...td, textAlign: 'center', color: 'var(--text-3)', padding: '32px 0' }}>Ekipman kaydı yok</td></tr>
              )}
            </tbody>
          </table>
        </div>
        <div style={{ padding: '10px 16px', borderTop: '1px solid var(--border-c)', fontSize: 12, color: 'var(--text-3)' }}>
          {equipment.length} ekipman kayıtlı
        </div>
      </div>
    </div>
  )
}
