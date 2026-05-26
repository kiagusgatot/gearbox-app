import { useEffect, useState } from 'react'
import { Plus, AlertTriangle, RefreshCw, Trash2 } from 'lucide-react'
import AdminLayout from '../../components/shared/AdminLayout'
import Modal from '../../components/shared/Modal'
import ConfirmDialog from '../../components/shared/ConfirmDialog'
import api from '../../services/api'
import { formatPrice } from '../../utils/formatPrice'
import type { Part } from '../../types'

export default function AdminInventory() {
  const [parts, setParts]               = useState<Part[]>([])
  const [lowStock, setLowStock]         = useState<Part[]>([])
  const [isLoading, setIsLoading]       = useState(true)
  const [addModal, setAddModal]         = useState(false)
  const [restockModal, setRestockModal] = useState(false)
  const [restockPart, setRestockPart]   = useState<Part | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Part | null>(null)
  const [form, setForm]                 = useState({ sku: '', name: '', category: 'mesin', unit: 'pcs', price: 0, stock: 0, min_stock: 5 })
  const [restockQty, setRestockQty]     = useState(10)
  const [submitting, setSubmitting]     = useState(false)
  const [deleting, setDeleting]         = useState(false)

  async function load() {
    setIsLoading(true)
    await Promise.all([
      api.get('/admin/parts').then(r => setParts(r.data.data || [])),
      api.get('/admin/parts/low-stock').then(r => setLowStock(r.data.data || [])),
    ])
    setIsLoading(false)
  }
  useEffect(() => { load() }, [])

  function set(k: string, v: unknown) { setForm(p => ({ ...p, [k]: v })) }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    try { await api.post('/admin/parts', form); setAddModal(false); load() }
    finally { setSubmitting(false) }
  }

  async function handleRestock(e: React.FormEvent) {
    e.preventDefault()
    if (!restockPart) return
    setSubmitting(true)
    try { await api.post(`/admin/parts/${restockPart.id}/restock`, { quantity: restockQty }); setRestockModal(false); load() }
    finally { setSubmitting(false) }
  }

  async function handleDelete() {
    if (!deleteTarget) return
    setDeleting(true)
    try { await api.delete(`/admin/parts/${deleteTarget.id}`); setDeleteTarget(null); load() }
    finally { setDeleting(false) }
  }

  return (
    <AdminLayout>
      <div className="page-header">
        <div>
          <div className="page-eyebrow">Manajemen</div>
          <h1 className="page-title">Inventory</h1>
        </div>
        <div className="header-actions">
          <button className="btn-primary" onClick={() => setAddModal(true)} style={{ borderRadius: 7 }}>
            <Plus size={14} /> Tambah Part
          </button>
        </div>
      </div>

      {lowStock.length > 0 && (
        <div style={{ background: '#FFFBEB', border: '1px solid #FDE68A', borderRadius: 8, padding: '11px 18px', marginBottom: 18, display: 'flex', alignItems: 'center', gap: 10 }}>
          <AlertTriangle size={15} color="#92400E" />
          <p style={{ fontSize: 13, color: '#92400E' }}>
            <strong>{lowStock.length} suku cadang</strong> stoknya di bawah batas minimum.
          </p>
        </div>
      )}

      <div className="card" style={{ overflow: 'hidden' }}>
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>SKU</th>
                <th>Nama</th>
                <th className="col-hide-mobile">Kategori</th>
                <th>Harga</th>
                <th>Stok</th>
                <th className="col-hide-mobile">Min.</th>
                <th>Status</th>
                <th>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr><td colSpan={8} style={{ textAlign: 'center', color: '#9CA3AF', padding: '32px 0' }}>Memuat...</td></tr>
              ) : parts.length === 0 ? (
                <tr><td colSpan={8} style={{ textAlign: 'center', color: '#9CA3AF', padding: '32px 0' }}>Belum ada suku cadang</td></tr>
              ) : parts.map(p => (
                <tr key={p.id}>
                  <td style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 11, color: '#9CA3AF' }}>{p.sku}</td>
                  <td style={{ fontWeight: 500, color: '#111827' }}>{p.name}</td>
                  <td className="col-hide-mobile" style={{ textTransform: 'capitalize' }}>{p.category}</td>
                  <td style={{ fontWeight: 700, color: '#B8900A', fontSize: 14 }}>{formatPrice(p.price)}</td>
                  <td style={{ fontWeight: 600, color: p.stock <= p.min_stock ? '#DC2626' : '#111827' }}>
                    {p.stock} <span style={{ fontSize: 11, fontWeight: 400, color: '#9CA3AF' }}>{p.unit}</span>
                  </td>
                  <td className="col-hide-mobile">{p.min_stock}</td>
                  <td>
                    {p.stock <= p.min_stock
                      ? <span className="badge badge-rejected" style={{ gap: 3 }}><AlertTriangle size={10} />Low Stock</span>
                      : <span className="badge badge-verified">Aman</span>
                    }
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button
                        className="btn-secondary"
                        style={{ padding: '5px 10px', fontSize: 11, display: 'flex', alignItems: 'center', gap: 4 }}
                        onClick={() => { setRestockPart(p); setRestockQty(10); setRestockModal(true) }}
                      >
                        <RefreshCw size={12} /> Restock
                      </button>
                      <button className="btn-danger" style={{ padding: '5px 10px' }} onClick={() => setDeleteTarget(p)}>
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Tambah Part */}
      <Modal open={addModal} onClose={() => setAddModal(false)} title="Tambah Suku Cadang">
        <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div><label className="label">SKU</label><input className="input" placeholder="OLI-TOY-001" value={form.sku} onChange={e => set('sku', e.target.value)} required /></div>
            <div><label className="label">Nama</label><input className="input" placeholder="Oli Mesin 1L" value={form.name} onChange={e => set('name', e.target.value)} required /></div>
            <div>
              <label className="label">Kategori</label>
              <select className="input" value={form.category} onChange={e => set('category', e.target.value)}>
                {['mesin', 'kelistrikan', 'bodi', 'ac', 'ban', 'lainnya'].map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div><label className="label">Satuan</label><input className="input" placeholder="pcs / liter" value={form.unit} onChange={e => set('unit', e.target.value)} required /></div>
            <div><label className="label">Harga (Rp)</label><input type="number" className="input" value={form.price} onChange={e => set('price', +e.target.value)} required /></div>
            <div><label className="label">Stok Awal</label><input type="number" className="input" value={form.stock} onChange={e => set('stock', +e.target.value)} /></div>
            <div><label className="label">Min. Stok</label><input type="number" className="input" value={form.min_stock} onChange={e => set('min_stock', +e.target.value)} /></div>
          </div>
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', paddingTop: 8, borderTop: '1px solid #F3F4F6' }}>
            <button type="button" className="btn-secondary" onClick={() => setAddModal(false)}>Batal</button>
            <button type="submit" className="btn-primary" disabled={submitting} style={{ borderRadius: 7 }}>{submitting ? 'Menyimpan...' : 'Simpan'}</button>
          </div>
        </form>
      </Modal>

      {/* Modal Restock */}
      <Modal open={restockModal} onClose={() => setRestockModal(false)} title="Restock Stok" width={400}>
        <form onSubmit={handleRestock} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {restockPart && (
            <div style={{ background: '#F9FAFB', borderRadius: 8, padding: '12px 14px' }}>
              <p style={{ fontSize: 13, fontWeight: 600, color: '#111827', marginBottom: 4 }}>{restockPart.name}</p>
              <div style={{ display: 'flex', gap: 16, fontSize: 12, color: '#6B7280' }}>
                <span>Stok saat ini: <strong style={{ color: restockPart.stock <= restockPart.min_stock ? '#DC2626' : '#111827' }}>{restockPart.stock} {restockPart.unit}</strong></span>
                <span>Min: <strong>{restockPart.min_stock}</strong></span>
              </div>
            </div>
          )}
          <div>
            <label className="label">Jumlah yang Ditambah</label>
            <input type="number" className="input" min={1} value={restockQty} onChange={e => setRestockQty(+e.target.value)} required />
            {restockPart && (
              <p style={{ fontSize: 11, color: '#9CA3AF', marginTop: 5 }}>
                Stok setelah restock: <strong style={{ color: '#065F46' }}>{restockPart.stock + restockQty} {restockPart.unit}</strong>
              </p>
            )}
          </div>
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', paddingTop: 8, borderTop: '1px solid #F3F4F6' }}>
            <button type="button" className="btn-secondary" onClick={() => setRestockModal(false)}>Batal</button>
            <button type="submit" className="btn-primary" disabled={submitting} style={{ borderRadius: 7 }}>{submitting ? 'Memproses...' : 'Tambah Stok'}</button>
          </div>
        </form>
      </Modal>

      {/* Confirm hapus */}
      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        variant="danger"
        title="Hapus Suku Cadang?"
        description={`"${deleteTarget?.name}" akan dihapus dari inventory secara permanen.`}
        confirmLabel="Ya, Hapus"
        loading={deleting}
      />
    </AdminLayout>
  )
}
