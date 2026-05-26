import { useEffect, useState } from 'react'
import { Plus, Pencil, Trash2, Tag } from 'lucide-react'
import AdminLayout from '../../components/shared/AdminLayout'
import Modal from '../../components/shared/Modal'
import ConfirmDialog from '../../components/shared/ConfirmDialog'
import { serviceService } from '../../services/serviceService'
import { formatPrice } from '../../utils/formatPrice'
import type { Service } from '../../types'

const DEFAULT_CATS = ['mesin', 'kelistrikan', 'bodi', 'ac']

function buildCategories(services: Service[]): string[] {
  const fromServices = services.map(s => s.category as string)
  return [...new Set([...DEFAULT_CATS, ...fromServices])].sort()
}

// ── Modal tambah kategori ────────────────────────────────────────────────────
function AddCategoryModal({ open, onClose, categories, onAdd }: {
  open: boolean; onClose: () => void
  categories: string[]; onAdd: (cat: string) => void
}) {
  const [value, setValue] = useState('')
  const [error, setError] = useState('')

  function handleClose() { setValue(''); setError(''); onClose() }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const trimmed = value.trim().toLowerCase()
    if (!trimmed) { setError('Nama kategori tidak boleh kosong'); return }
    if (categories.includes(trimmed)) { setError('Kategori ini sudah ada'); return }
    onAdd(trimmed); setValue(''); setError(''); onClose()
  }

  return (
    <Modal open={open} onClose={handleClose} title="Tambah Kategori Baru" width={380}>
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div>
          <label className="label">Nama Kategori</label>
          <input autoFocus className="input" placeholder="Contoh: transmisi, suspensi, rem..."
            value={value} onChange={e => { setValue(e.target.value); setError('') }} />
          {error && <p style={{ fontSize: 11, color: '#DC2626', marginTop: 5 }}>{error}</p>}
        </div>
        <div>
          <p style={{ fontSize: 11, fontWeight: 600, color: '#9CA3AF', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '.06em' }}>Kategori saat ini</p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {categories.map(c => (
              <span key={c} style={{ fontSize: 11, fontWeight: 600, textTransform: 'capitalize', padding: '3px 10px', borderRadius: 999, background: DEFAULT_CATS.includes(c) ? '#F9FAFB' : '#FFFBEB', color: DEFAULT_CATS.includes(c) ? '#6B7280' : '#B8900A', border: `1px solid ${DEFAULT_CATS.includes(c) ? '#E5E7EB' : '#FDE68A'}` }}>
                {c}
              </span>
            ))}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', paddingTop: 8, borderTop: '1px solid #F3F4F6' }}>
          <button type="button" className="btn-secondary" onClick={handleClose}>Batal</button>
          <button type="submit" className="btn-primary" style={{ borderRadius: 7 }}>Tambah Kategori</button>
        </div>
      </form>
    </Modal>
  )
}

// ── Halaman utama ────────────────────────────────────────────────────────────
const emptyForm = { name: '', description: '', price: 0, duration_minutes: 30, category: 'mesin' as Service['category'], status: 'active' as Service['status'] }

export default function AdminServices() {
  const [services, setServices]         = useState<Service[]>([])
  const [categories, setCategories]     = useState<string[]>([...DEFAULT_CATS])
  const [isLoading, setIsLoading]       = useState(true)
  const [form, setForm]                 = useState<Partial<Service>>(emptyForm)
  const [editId, setEditId]             = useState<number | null>(null)
  const [formModal, setFormModal]       = useState(false)
  const [addCatModal, setAddCatModal]   = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<Service | null>(null)
  const [submitting, setSubmitting]     = useState(false)
  const [deleting, setDeleting]         = useState(false)

  async function load() {
    setIsLoading(true)
    serviceService.list().then(r => {
      setServices(r.data)
      setCategories(buildCategories(r.data))
    }).finally(() => setIsLoading(false))
  }
  useEffect(() => { load() }, [])

  function handleAddCategory(cat: string) {
    setCategories(prev => [...new Set([...prev, cat])].sort())
    setForm(p => ({ ...p, category: cat as Service['category'] }))
  }

  function openCreate() { setForm({ ...emptyForm, category: categories[0] as Service['category'] }); setEditId(null); setFormModal(true) }
  function openEdit(s: Service) { setForm(s); setEditId(s.id); setFormModal(true) }
  function set(k: string, v: unknown) { setForm(p => ({ ...p, [k]: v })) }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault(); setSubmitting(true)
    try {
      if (editId) await serviceService.adminUpdate(editId, form)
      else await serviceService.adminCreate(form)
      setFormModal(false); load()
    } finally { setSubmitting(false) }
  }

  async function handleDelete() {
    if (!deleteTarget) return; setDeleting(true)
    try { await serviceService.adminDelete(deleteTarget.id); setDeleteTarget(null); load() }
    finally { setDeleting(false) }
  }

  const categoriesInUse = [...new Set(services.map(s => s.category as string))]

  return (
    <AdminLayout>
      <div className="page-header">
        <div>
          <div className="page-eyebrow">Manajemen</div>
          <h1 className="page-title">Layanan</h1>
        </div>
        <div className="header-actions">
          <button className="btn-primary" onClick={openCreate} style={{ borderRadius: 7 }}>
            <Plus size={14} /> Tambah Layanan
          </button>
        </div>
      </div>

      {categoriesInUse.length > 0 && (
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 16 }}>
          {categoriesInUse.map(cat => (
            <span key={cat} style={{ fontSize: 11, fontWeight: 600, letterSpacing: '.05em', textTransform: 'capitalize', padding: '3px 10px', background: '#FFFBEB', color: '#B8900A', border: '1px solid #FDE68A', borderRadius: 999 }}>
              {cat}
            </span>
          ))}
        </div>
      )}

      <div className="card" style={{ overflow: 'hidden' }}>
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Nama</th>
                <th className="col-hide-mobile">Kategori</th>
                <th>Harga</th>
                <th className="col-hide-mobile">Durasi</th>
                <th>Status</th>
                <th>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr><td colSpan={6} style={{ textAlign: 'center', color: '#9CA3AF', padding: '32px 0' }}>Memuat...</td></tr>
              ) : services.length === 0 ? (
                <tr><td colSpan={6} style={{ textAlign: 'center', color: '#9CA3AF', padding: '32px 0' }}>Belum ada layanan</td></tr>
              ) : services.map(s => (
                <tr key={s.id}>
                  <td style={{ fontWeight: 500, color: '#111827' }}>{s.name}</td>
                  <td className="col-hide-mobile">
                    <span style={{ fontSize: 11, fontWeight: 600, textTransform: 'capitalize', padding: '2px 8px', background: '#FFFBEB', color: '#B8900A', border: '1px solid #FDE68A', borderRadius: 999 }}>
                      {s.category}
                    </span>
                  </td>
                  <td style={{ fontWeight: 700, color: '#B8900A', fontSize: 14 }}>{formatPrice(s.price)}</td>
                  <td className="col-hide-mobile">{s.duration_minutes} menit</td>
                  <td><span className={`badge badge-${s.status === 'active' ? 'verified' : 'cancelled'}`}>{s.status === 'active' ? 'Aktif' : 'Nonaktif'}</span></td>
                  <td>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button className="btn-secondary" style={{ padding: '5px 10px' }} onClick={() => openEdit(s)}><Pencil size={13} /></button>
                      <button className="btn-danger" style={{ padding: '5px 10px' }} onClick={() => setDeleteTarget(s)}><Trash2 size={13} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Form */}
      <Modal open={formModal} onClose={() => setFormModal(false)} title={editId ? 'Edit Layanan' : 'Tambah Layanan'}>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <label className="label">Nama Layanan</label>
            <input className="input" placeholder="Contoh: Ganti Oli Mesin" value={form.name || ''} onChange={e => set('name', e.target.value)} required />
          </div>
          <div>
            <label className="label">Deskripsi</label>
            <textarea className="input" style={{ resize: 'none' }} rows={3} value={form.description || ''} onChange={e => set('description', e.target.value)} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div><label className="label">Harga (Rp)</label><input type="number" className="input" value={form.price || ''} onChange={e => set('price', +e.target.value)} required /></div>
            <div><label className="label">Durasi (menit)</label><input type="number" className="input" value={form.duration_minutes || ''} onChange={e => set('duration_minutes', +e.target.value)} required /></div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label className="label">Kategori</label>
              <select className="input" style={{ textTransform: 'capitalize' }} value={form.category} onChange={e => set('category', e.target.value)}>
                {categories.map(c => <option key={c} value={c} style={{ textTransform: 'capitalize' }}>{c}</option>)}
              </select>
              <button type="button" onClick={() => setAddCatModal(true)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 11, fontWeight: 600, color: '#B8900A', marginTop: 5, padding: 0, display: 'flex', alignItems: 'center', gap: 4 }}>
                <Tag size={11} /> Tambah kategori baru
              </button>
            </div>
            <div>
              <label className="label">Status</label>
              <select className="input" value={form.status} onChange={e => set('status', e.target.value)}>
                <option value="active">Aktif</option>
                <option value="inactive">Nonaktif</option>
              </select>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', paddingTop: 8, borderTop: '1px solid #F3F4F6' }}>
            <button type="button" className="btn-secondary" onClick={() => setFormModal(false)}>Batal</button>
            <button type="submit" className="btn-primary" disabled={submitting} style={{ borderRadius: 7 }}>{submitting ? 'Menyimpan...' : 'Simpan'}</button>
          </div>
        </form>
      </Modal>

      {/* Modal Tambah Kategori */}
      <AddCategoryModal open={addCatModal} onClose={() => setAddCatModal(false)} categories={categories} onAdd={handleAddCategory} />

      {/* Confirm hapus */}
      <ConfirmDialog
        open={!!deleteTarget} onClose={() => setDeleteTarget(null)} onConfirm={handleDelete}
        variant="danger" title="Hapus Layanan?"
        description={`Layanan "${deleteTarget?.name}" akan dihapus permanen.`}
        confirmLabel="Ya, Hapus" loading={deleting}
      />
    </AdminLayout>
  )
}
