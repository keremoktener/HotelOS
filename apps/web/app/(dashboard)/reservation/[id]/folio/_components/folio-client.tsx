'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { trpc } from '@/lib/trpc/client'
import { Chip } from '@/components/ui/chip'
import { Btn } from '@/components/ui/btn'
import { StatTile } from '@/components/ui/stat-tile'
import { th, td } from '@/components/ui/data-table'
import { inputStyle } from '@/components/ui/kv'
import { DollarSign, CreditCard, Scale, Plus, Trash2 } from 'lucide-react'

function fmt(kurus: number) {
  return (kurus / 100).toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' })
}

const SOURCE_TONE: Record<string, string> = { LODGING: 'neutral', FNB: 'info', MANUAL: 'muted' }
const SOURCE_LABEL: Record<string, string> = { LODGING: 'Konaklama', FNB: 'F&B', MANUAL: 'Manuel' }
const METHOD_LABEL: Record<string, string> = {
  CASH: 'Nakit', BANK_TRANSFER: 'Havale', PHYSICAL_POS: 'Fiziki POS',
  ONLINE_POS: 'Online POS', OTHER: 'Diğer',
}

interface Line { id: string; description: string; source: string; amountKurus: number; lineDate: string }
interface Payment { id: string; method: string; amount: number; paidAt: string; reference: string | null }
interface Summary { totalCharges: number; totalPaid: number; balance: number }

interface Props {
  reservationId: string
  summary: Summary
  lines: Line[]
  payments: Payment[]
}

export function FolioClient({ reservationId, summary, lines, payments }: Props) {
  const router = useRouter()
  const refresh = () => router.refresh()

  const [showLineForm, setShowLineForm] = useState(false)
  const [lDesc, setLDesc] = useState('')
  const [lAmount, setLAmount] = useState('')
  const [lSource, setLSource] = useState<'LODGING' | 'FNB' | 'MANUAL'>('MANUAL')
  const [lError, setLError] = useState('')

  const addMut = trpc.folio.addLine.useMutation({
    onSuccess: () => { refresh(); setShowLineForm(false); setLDesc(''); setLAmount(''); setLError('') },
    onError: e => setLError(e.message),
  })
  const removeMut = trpc.folio.removeLine.useMutation({ onSuccess: refresh })

  function submitLine() {
    const kurus = Math.round(parseFloat(lAmount.replace(',', '.')) * 100)
    if (isNaN(kurus)) { setLError('Geçerli bir tutar girin'); return }
    addMut.mutate({ reservationId, description: lDesc, source: lSource, amountKurus: kurus })
  }

  const balanceTone = summary.balance > 0 ? 'warn' : 'good'

  return (
    <div style={{ height: 'calc(100% - 56px)', overflowY: 'auto', padding: 24 }}>
      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 24 }}>
        <StatTile label="Toplam Tutar" value={fmt(summary.totalCharges)} icon={<DollarSign size={16}/>}/>
        <StatTile label="Ödenen" value={fmt(summary.totalPaid)} color="var(--good)" icon={<CreditCard size={16}/>}/>
        <StatTile
          label="Bakiye"
          value={fmt(summary.balance)}
          color={summary.balance > 0 ? 'var(--warn)' : 'var(--good)'}
          bg={summary.balance > 0 ? 'var(--warn-bg)' : 'var(--good-bg)'}
          icon={<Scale size={16}/>}
        />
      </div>

      {/* Charge lines */}
      <div style={{ background: 'var(--surface)', border: '1px solid var(--border-c)', borderRadius: 10, marginBottom: 14, overflow: 'hidden', boxShadow: 'var(--shadow-sm)' }}>
        <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border-c)', display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ flex: 1, fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>Hesap kalemleri</div>
          <Btn size="sm" icon={<Plus size={12}/>} onClick={() => setShowLineForm(v => !v)}>Manuel kalem</Btn>
        </div>

        {showLineForm && (
          <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border-c)', background: 'var(--surface-2)', display: 'flex', flexWrap: 'wrap', gap: 10, alignItems: 'flex-end' }}>
            <div style={{ flex: '1 1 200px' }}>
              <div style={{ fontSize: 11, color: 'var(--text-3)', marginBottom: 4 }}>Açıklama *</div>
              <input value={lDesc} onChange={e => setLDesc(e.target.value)} placeholder="Kalem açıklaması" style={inputStyle}/>
            </div>
            <div style={{ width: 120 }}>
              <div style={{ fontSize: 11, color: 'var(--text-3)', marginBottom: 4 }}>Tutar (TL)</div>
              <input value={lAmount} onChange={e => setLAmount(e.target.value)} placeholder="0,00" style={inputStyle}/>
            </div>
            <div style={{ width: 130 }}>
              <div style={{ fontSize: 11, color: 'var(--text-3)', marginBottom: 4 }}>Kaynak</div>
              <select value={lSource} onChange={e => setLSource(e.target.value as 'LODGING'|'FNB'|'MANUAL')} style={{ ...inputStyle, height: 28 }}>
                <option value="MANUAL">Manuel</option>
                <option value="LODGING">Konaklama</option>
                <option value="FNB">F&B</option>
              </select>
            </div>
            <div style={{ display: 'flex', gap: 6 }}>
              <Btn variant="primary" onClick={submitLine} disabled={!lDesc.trim() || addMut.isPending}>Ekle</Btn>
              <Btn onClick={() => { setShowLineForm(false); setLError('') }}>İptal</Btn>
            </div>
            {lError && <div style={{ width: '100%', fontSize: 11, color: 'var(--bad)' }}>{lError}</div>}
          </div>
        )}

        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th style={th}>Tarih</th>
              <th style={th}>Açıklama</th>
              <th style={th}>Kaynak</th>
              <th style={{ ...th, textAlign: 'right' }}>Tutar</th>
              <th style={{ ...th, width: 48 }}></th>
            </tr>
          </thead>
          <tbody>
            {lines.map((l, i) => (
              <tr key={l.id} style={{ borderTop: i === 0 ? 'none' : '1px solid var(--border-c)' }}>
                <td style={{ ...td, color: 'var(--text-2)', fontSize: 12, fontFamily: 'var(--font-mono)' }}>{l.lineDate}</td>
                <td style={{ ...td, fontWeight: 500 }}>{l.description}</td>
                <td style={td}><Chip tone={SOURCE_TONE[l.source] ?? 'neutral'}>{SOURCE_LABEL[l.source] ?? l.source}</Chip></td>
                <td style={{ ...td, fontFamily: 'var(--font-mono)', textAlign: 'right', fontWeight: 600 }}>{fmt(l.amountKurus)}</td>
                <td style={td}>
                  <Btn size="sm" variant="ghost" destructive onClick={() => { if (confirm('Kalemi sil?')) removeMut.mutate({ id: l.id }) }}>
                    <Trash2 size={12}/>
                  </Btn>
                </td>
              </tr>
            ))}
            {lines.length === 0 && (
              <tr><td colSpan={5} style={{ ...td, textAlign: 'center', color: 'var(--text-3)' }}>Henüz kalem yok.</td></tr>
            )}
            <tr style={{ borderTop: '2px solid var(--border-strong)' }}>
              <td colSpan={3} style={{ ...td, textAlign: 'right', fontWeight: 600 }}>Toplam</td>
              <td style={{ ...td, fontFamily: 'var(--font-mono)', textAlign: 'right', fontWeight: 700, fontSize: 14 }}>{fmt(summary.totalCharges)}</td>
              <td/>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Payments */}
      <div style={{ background: 'var(--surface)', border: '1px solid var(--border-c)', borderRadius: 10, overflow: 'hidden', boxShadow: 'var(--shadow-sm)' }}>
        <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border-c)', display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ flex: 1, fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>Ödemeler</div>
        </div>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th style={th}>Tarih</th>
              <th style={th}>Yöntem</th>
              <th style={th}>Referans</th>
              <th style={{ ...th, textAlign: 'right' }}>Tutar</th>
            </tr>
          </thead>
          <tbody>
            {payments.map((p, i) => (
              <tr key={p.id} style={{ borderTop: i === 0 ? 'none' : '1px solid var(--border-c)' }}>
                <td style={{ ...td, color: 'var(--text-2)', fontSize: 12, fontFamily: 'var(--font-mono)' }}>{p.paidAt}</td>
                <td style={td}><Chip tone="good" dot>{METHOD_LABEL[p.method] ?? p.method}</Chip></td>
                <td style={{ ...td, fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--text-2)' }}>{p.reference ?? '—'}</td>
                <td style={{ ...td, fontFamily: 'var(--font-mono)', textAlign: 'right', fontWeight: 600, color: 'var(--good)' }}>{fmt(p.amount)}</td>
              </tr>
            ))}
            {payments.length === 0 && (
              <tr><td colSpan={4} style={{ ...td, textAlign: 'center', color: 'var(--text-3)' }}>Henüz ödeme yok.</td></tr>
            )}
            <tr style={{
              borderTop: '2px solid var(--border-strong)',
              background: summary.balance > 0 ? 'var(--warn-bg)' : 'var(--good-bg)',
            }}>
              <td colSpan={3} style={{ ...td, textAlign: 'right', fontWeight: 600 }}>Bakiye</td>
              <td style={{ ...td, fontFamily: 'var(--font-mono)', textAlign: 'right', fontWeight: 700, fontSize: 14, color: summary.balance > 0 ? 'var(--warn)' : 'var(--good)' }}>
                {fmt(summary.balance)}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  )
}
