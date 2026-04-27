'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { trpc } from '@/lib/trpc/client'
import { ALLERGENS } from '@/modules/fnb/types'
import { StatTile } from '@/components/ui/stat-tile'
import { Chip } from '@/components/ui/chip'
import { inputStyle } from '@/components/ui/kv'
import { ChevronDown, ChevronRight, Plus, Trash2, Pencil, UtensilsCrossed, Tag, CheckSquare } from 'lucide-react'

function formatPrice(kurus: number) {
  return (kurus / 100).toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' })
}

interface Item {
  id: string; name: string; description: string | null
  priceKurus: number; allergens: string[]; isAvailable: boolean
}
interface Category { id: string; name: string; sortOrder: number; items: Item[] }
interface Stats { categories: number; totalItems: number; availableItems: number }
interface Props { categories: Category[]; stats: Stats }

const ALLERGEN_MAP = Object.fromEntries(ALLERGENS.map(a => [a.code, a.label]))

export function FnbClient({ categories: initial, stats }: Props) {
  const router = useRouter()
  const refresh = () => router.refresh()

  // category form
  const [showCatForm, setShowCatForm] = useState(false)
  const [catName, setCatName] = useState('')
  const [catOrder, setCatOrder] = useState(0)
  const [catError, setCatError] = useState('')

  // item form
  const [itemCatId, setItemCatId] = useState('')
  const [showItemForm, setShowItemForm] = useState(false)
  const [iName, setIName] = useState('')
  const [iDesc, setIDesc] = useState('')
  const [iPrice, setIPrice] = useState('')
  const [iAllergens, setIAllergens] = useState<string[]>([])
  const [iAvail, setIAvail] = useState(true)
  const [iError, setIError] = useState('')

  // edit item
  const [editItem, setEditItem] = useState<Item & { catId: string } | null>(null)

  // expanded cats
  const [expanded, setExpanded] = useState<Record<string, boolean>>({})
  const toggle = (id: string) => setExpanded(p => ({ ...p, [id]: !p[id] }))

  const createCatMut = trpc.fnb.createCategory.useMutation({
    onSuccess: () => { refresh(); setShowCatForm(false); setCatName(''); setCatOrder(0); setCatError('') },
    onError: e => setCatError(e.message),
  })
  const deleteCatMut = trpc.fnb.deleteCategory.useMutation({ onSuccess: refresh })
  const createItemMut = trpc.fnb.createItem.useMutation({
    onSuccess: () => { refresh(); resetItemForm() },
    onError: e => setIError(e.message),
  })
  const updateItemMut = trpc.fnb.updateItem.useMutation({
    onSuccess: () => { refresh(); setEditItem(null) },
    onError: e => setIError(e.message),
  })
  const deleteItemMut = trpc.fnb.deleteItem.useMutation({ onSuccess: refresh })
  const toggleAvailMut = trpc.fnb.updateItem.useMutation({ onSuccess: refresh })

  function resetItemForm() {
    setShowItemForm(false); setItemCatId(''); setIName(''); setIDesc('')
    setIPrice(''); setIAllergens([]); setIAvail(true); setIError('')
  }

  function openItemForm(catId: string) {
    resetItemForm(); setItemCatId(catId); setShowItemForm(true)
    setExpanded(p => ({ ...p, [catId]: true }))
  }

  function openEditItem(item: Item, catId: string) {
    setEditItem({ ...item, catId })
    setIName(item.name); setIDesc(item.description ?? ''); setIPrice(String(item.priceKurus / 100))
    setIAllergens(item.allergens); setIAvail(item.isAvailable); setIError('')
  }

  function toggleAllergen(code: string) {
    setIAllergens(prev => prev.includes(code) ? prev.filter(c => c !== code) : [...prev, code])
  }

  function submitItem() {
    const priceKurus = Math.round(parseFloat(iPrice.replace(',', '.')) * 100)
    if (isNaN(priceKurus)) { setIError('Geçerli bir fiyat girin'); return }
    if (editItem) {
      updateItemMut.mutate({ id: editItem.id, data: { name: iName, description: iDesc || undefined, priceKurus, allergens: iAllergens, isAvailable: iAvail } })
    } else {
      createItemMut.mutate({ categoryId: itemCatId, name: iName, description: iDesc || undefined, priceKurus, allergens: iAllergens, isAvailable: iAvail })
    }
  }

  const isBusy = createItemMut.isPending || updateItemMut.isPending

  return (
    <div style={{ padding: '0 24px 40px' }}>
      {/* Stats */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 24, flexWrap: 'wrap' }}>
        <StatTile label="Kategori" value={stats.categories} icon={<Tag size={16}/>} />
        <StatTile label="Toplam Ürün" value={stats.totalItems} icon={<UtensilsCrossed size={16}/>} />
        <StatTile label="Satışta" value={stats.availableItems} color="var(--green)" icon={<CheckSquare size={16}/>} />
      </div>

      {/* Header row */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)' }}>Menü Kategorileri</span>
        <button
          onClick={() => setShowCatForm(v => !v)}
          style={{ fontSize: 12, display: 'flex', alignItems: 'center', gap: 6, padding: '5px 12px', background: 'var(--accent-c)', color: 'var(--accent-fg)', border: 'none', borderRadius: 6, cursor: 'pointer', fontWeight: 600 }}
        >
          <Plus size={13}/> Kategori Ekle
        </button>
      </div>

      {/* Category form */}
      {showCatForm && (
        <div style={{ background: 'var(--surface-2)', border: '1px solid var(--border-c)', borderRadius: 8, padding: 16, marginBottom: 16, display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'flex-end' }}>
          <div style={{ flex: '1 1 180px' }}>
            <div style={{ fontSize: 11, color: 'var(--text-3)', marginBottom: 4 }}>Kategori Adı</div>
            <input value={catName} onChange={e => setCatName(e.target.value)} placeholder="Örn: Başlangıçlar" style={inputStyle}/>
          </div>
          <div style={{ width: 100 }}>
            <div style={{ fontSize: 11, color: 'var(--text-3)', marginBottom: 4 }}>Sıra</div>
            <input type="number" value={catOrder} onChange={e => setCatOrder(Number(e.target.value))} style={inputStyle}/>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              onClick={() => createCatMut.mutate({ name: catName, sortOrder: catOrder })}
              disabled={!catName.trim() || createCatMut.isPending}
              style={{ padding: '6px 14px', background: 'var(--accent-c)', color: 'var(--accent-fg)', border: 'none', borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: 'pointer' }}
            >Kaydet</button>
            <button onClick={() => { setShowCatForm(false); setCatError('') }} style={{ padding: '6px 12px', background: 'transparent', border: '1px solid var(--border-c)', borderRadius: 6, fontSize: 12, color: 'var(--text-2)', cursor: 'pointer' }}>İptal</button>
          </div>
          {catError && <div style={{ width: '100%', fontSize: 11, color: 'var(--red)' }}>{catError}</div>}
        </div>
      )}

      {/* Category list */}
      {initial.length === 0 && (
        <div style={{ textAlign: 'center', padding: '48px 0', color: 'var(--text-3)', fontSize: 14 }}>Henüz kategori yok.</div>
      )}

      {initial.map(cat => (
        <div key={cat.id} style={{ border: '1px solid var(--border-c)', borderRadius: 8, marginBottom: 10, overflow: 'hidden' }}>
          {/* Category header */}
          <div
            style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', background: 'var(--surface-2)', cursor: 'pointer' }}
            onClick={() => toggle(cat.id)}
          >
            {expanded[cat.id] ? <ChevronDown size={14} style={{ color: 'var(--text-3)', flexShrink: 0 }}/> : <ChevronRight size={14} style={{ color: 'var(--text-3)', flexShrink: 0 }}/>}
            <span style={{ flex: 1, fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>{cat.name}</span>
            <span style={{ fontSize: 11, color: 'var(--text-3)' }}>{cat.items.length} ürün</span>
            <button
              onClick={e => { e.stopPropagation(); openItemForm(cat.id) }}
              style={{ fontSize: 11, padding: '3px 8px', background: 'var(--surface)', border: '1px solid var(--border-c)', borderRadius: 5, cursor: 'pointer', color: 'var(--text-2)', display: 'flex', alignItems: 'center', gap: 4 }}
            >
              <Plus size={11}/> Ürün
            </button>
            <button
              onClick={e => { e.stopPropagation(); if (confirm('Kategoriyi sil?')) deleteCatMut.mutate({ id: cat.id }) }}
              style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-3)', padding: 4, display: 'flex' }}
            >
              <Trash2 size={13}/>
            </button>
          </div>

          {/* Item form for this category */}
          {(showItemForm && itemCatId === cat.id) && (
            <ItemForm
              iName={iName} setIName={setIName}
              iDesc={iDesc} setIDesc={setIDesc}
              iPrice={iPrice} setIPrice={setIPrice}
              iAllergens={iAllergens} toggleAllergen={toggleAllergen}
              iAvail={iAvail} setIAvail={setIAvail}
              iError={iError} isBusy={isBusy}
              onSubmit={submitItem} onCancel={resetItemForm}
              title="Yeni Ürün"
            />
          )}

          {/* Items */}
          {expanded[cat.id] && (
            <div>
              {cat.items.length === 0 && !showItemForm && (
                <div style={{ padding: '12px 16px', fontSize: 12, color: 'var(--text-3)' }}>Henüz ürün yok.</div>
              )}
              {cat.items.map(item => (
                <div key={item.id}>
                  {editItem?.id === item.id ? (
                    <ItemForm
                      iName={iName} setIName={setIName}
                      iDesc={iDesc} setIDesc={setIDesc}
                      iPrice={iPrice} setIPrice={setIPrice}
                      iAllergens={iAllergens} toggleAllergen={toggleAllergen}
                      iAvail={iAvail} setIAvail={setIAvail}
                      iError={iError} isBusy={isBusy}
                      onSubmit={submitItem} onCancel={() => setEditItem(null)}
                      title="Ürünü Düzenle"
                    />
                  ) : (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 16px', borderTop: '1px solid var(--border-c)' }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text)' }}>{item.name}</div>
                        {item.description && <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 1 }}>{item.description}</div>}
                        {item.allergens.length > 0 && (
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 4 }}>
                            {item.allergens.map(a => (
                              <span key={a} style={{ fontSize: 9, padding: '1px 5px', borderRadius: 3, background: 'var(--warn-weak)', color: 'var(--warn)', border: '1px solid var(--warn)', fontWeight: 600 }}>
                                {ALLERGEN_MAP[a] ?? a}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                      <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', whiteSpace: 'nowrap' }}>{formatPrice(item.priceKurus)}</span>
                      <button
                        onClick={() => toggleAvailMut.mutate({ id: item.id, data: { isAvailable: !item.isAvailable } })}
                        style={{ padding: '2px 8px', borderRadius: 4, border: '1px solid var(--border-c)', background: 'transparent', fontSize: 11, cursor: 'pointer', color: item.isAvailable ? 'var(--green)' : 'var(--text-3)' }}
                      >
                        {item.isAvailable ? 'Satışta' : 'Pasif'}
                      </button>
                      <button onClick={() => openEditItem(item, cat.id)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-3)', padding: 4, display: 'flex' }}>
                        <Pencil size={13}/>
                      </button>
                      <button onClick={() => { if (confirm('Ürünü sil?')) deleteItemMut.mutate({ id: item.id }) }} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-3)', padding: 4, display: 'flex' }}>
                        <Trash2 size={13}/>
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  )
}

interface FormProps {
  iName: string; setIName: (v: string) => void
  iDesc: string; setIDesc: (v: string) => void
  iPrice: string; setIPrice: (v: string) => void
  iAllergens: string[]; toggleAllergen: (c: string) => void
  iAvail: boolean; setIAvail: (v: boolean) => void
  iError: string; isBusy: boolean
  onSubmit: () => void; onCancel: () => void
  title: string
}

function ItemForm({ iName, setIName, iDesc, setIDesc, iPrice, setIPrice, iAllergens, toggleAllergen, iAvail, setIAvail, iError, isBusy, onSubmit, onCancel, title }: FormProps) {
  return (
    <div style={{ padding: 14, background: 'var(--surface)', borderTop: '1px solid var(--border-c)' }}>
      <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text)', marginBottom: 10 }}>{title}</div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginBottom: 10 }}>
        <div style={{ flex: '1 1 180px' }}>
          <div style={{ fontSize: 11, color: 'var(--text-3)', marginBottom: 4 }}>Ürün Adı *</div>
          <input value={iName} onChange={e => setIName(e.target.value)} placeholder="Ürün adı" style={inputStyle}/>
        </div>
        <div style={{ flex: '1 1 120px' }}>
          <div style={{ fontSize: 11, color: 'var(--text-3)', marginBottom: 4 }}>Fiyat (TL)</div>
          <input value={iPrice} onChange={e => setIPrice(e.target.value)} placeholder="0.00" style={inputStyle}/>
        </div>
      </div>
      <div style={{ marginBottom: 10 }}>
        <div style={{ fontSize: 11, color: 'var(--text-3)', marginBottom: 4 }}>Açıklama</div>
        <input value={iDesc} onChange={e => setIDesc(e.target.value)} placeholder="İsteğe bağlı" style={{ ...inputStyle, width: '100%' }}/>
      </div>
      <div style={{ marginBottom: 10 }}>
        <div style={{ fontSize: 11, color: 'var(--text-3)', marginBottom: 6 }}>Alerjenler</div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          {ALLERGENS.map(a => (
            <button
              key={a.code}
              onClick={() => toggleAllergen(a.code)}
              style={{
                fontSize: 11, padding: '3px 8px', borderRadius: 4, cursor: 'pointer', fontWeight: 500,
                background: iAllergens.includes(a.code) ? 'var(--warn-weak)' : 'var(--surface-2)',
                color: iAllergens.includes(a.code) ? 'var(--warn)' : 'var(--text-3)',
                border: `1px solid ${iAllergens.includes(a.code) ? 'var(--warn)' : 'var(--border-c)'}`,
              }}
            >
              {a.label}
            </button>
          ))}
        </div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 }}>
        <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--text-2)', cursor: 'pointer' }}>
          <input type="checkbox" checked={iAvail} onChange={e => setIAvail(e.target.checked)}/>
          Satışta
        </label>
      </div>
      {iError && <div style={{ fontSize: 11, color: 'var(--red)', marginBottom: 8 }}>{iError}</div>}
      <div style={{ display: 'flex', gap: 8 }}>
        <button
          onClick={onSubmit}
          disabled={!iName.trim() || isBusy}
          style={{ padding: '6px 14px', background: 'var(--accent-c)', color: 'var(--accent-fg)', border: 'none', borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: 'pointer' }}
        >{isBusy ? 'Kaydediliyor...' : 'Kaydet'}</button>
        <button onClick={onCancel} style={{ padding: '6px 12px', background: 'transparent', border: '1px solid var(--border-c)', borderRadius: 6, fontSize: 12, color: 'var(--text-2)', cursor: 'pointer' }}>İptal</button>
      </div>
    </div>
  )
}
