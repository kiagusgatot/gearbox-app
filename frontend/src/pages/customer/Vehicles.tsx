import { useEffect, useState } from 'react'
import { Plus, Upload, CheckCircle, Clock, XCircle, Trash2, Car, ArrowRight } from 'lucide-react'
import { Link, useSearchParams } from 'react-router-dom'
import Navbar from '../../components/shared/Navbar'
import Modal from '../../components/shared/Modal'
import ConfirmDialog from '../../components/shared/ConfirmDialog'
import { vehicleService } from '../../services/vehicleService'
import type { Vehicle } from '../../types'

const emptyForm = { plate_number: '', brand: '', model: '', year: new Date().getFullYear(), type: 'mobil' }

export default function Vehicles() {
  const [searchParams] = useSearchParams()
  const isNew = searchParams.get('new') === '1'

  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // Modal states
  const [addModal, setAddModal] = useState(isNew)
  const [uploadModal, setUploadModal] = useState(false)
  const [uploadVehicleId, setUploadVehicleId] = useState<number | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Vehicle | null>(null)
  const [successMsg, setSuccessMsg] = useState('')

  // Form states
  const [form, setForm] = useState(emptyForm)
  const [uploadType, setUploadType] = useState('plat_nomor')
  const [uploadFile, setUploadFile] = useState<File | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [deleting, setDeleting] = useState(false)

  async function load() {
    setIsLoading(true)
    vehicleService.list().then(r => setVehicles(r.data)).finally(() => setIsLoading(false))
  }
  useEffect(() => { load() }, [])

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    try {
      await vehicleService.create({
        plate_number: form.plate_number,
        brand: form.brand,
        model: form.model,
        year: form.year,
        type: form.type as 'motor' | 'mobil',
      })
      setAddModal(false)
      setForm(emptyForm)
      setSuccessMsg(`${form.brand} ${form.model} ${form.year} berhasil didaftarkan!`)
      load()
    } finally { setSubmitting(false) }
  }

  async function handleDelete() {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      await vehicleService.remove(deleteTarget.id)
      setDeleteTarget(null)
      load()
    } finally { setDeleting(false) }
  }

  async function handleUpload(e: React.FormEvent) {
    e.preventDefault()
    if (!uploadVehicleId || !uploadFile) return
    setSubmitting(true)
    try {
      await vehicleService.uploadDocument(uploadVehicleId, uploadType, uploadFile)
      setUploadModal(false)
      setUploadVehicleId(null)
      setUploadFile(null)
      load()
    } finally { setSubmitting(false) }
  }

  function openUpload(vehicleId: number) {
    setUploadVehicleId(vehicleId)
    setUploadType('plat_nomor')
    setUploadFile(null)
    setUploadModal(true)
  }

  function docBadge(status: string) {
    if (status === 'verified') return <span className="badge badge-verified" style={{ gap: 3 }}><CheckCircle size={10} />Verified</span>
    if (status === 'rejected') return <span className="badge badge-rejected" style={{ gap: 3 }}><XCircle size={10} />Ditolak</span>
    return <span className="badge badge-pending" style={{ gap: 3 }}><Clock size={10} />Pending</span>
  }

  return (
    <div style={{ minHeight: '100vh', background: '#F0F2F5' }}>
      <Navbar />
      <div style={{ maxWidth: 800, margin: '0 auto', padding: '48px 24px' }}>

        {/* Banner onboarding */}
        {isNew && (
          <div style={{
            background: '#FFFBEB', border: '1px solid #FDE68A',
            borderLeft: '4px solid #E8B400', borderRadius: 10,
            padding: '16px 20px', marginBottom: 20,
            display: 'flex', alignItems: 'flex-start', gap: 14,
          }}>
            <div style={{ width: 32, height: 32, background: '#E8B400', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Car size={16} color="#1A1916" strokeWidth={2} />
            </div>
            <div>
              <p style={{ fontWeight: 600, color: '#92400E', fontSize: 14, marginBottom: 3 }}>Daftarkan kendaraan kamu dulu.</p>
              <p style={{ fontSize: 13, color: '#B45309', lineHeight: 1.6 }}>Kamu perlu mendaftarkan minimal satu kendaraan sebelum bisa melakukan booking servis.</p>
            </div>
          </div>
        )}

        {/* Banner sukses */}
        {successMsg && (
          <div style={{
            background: '#F0FDF4', border: '1px solid #BBF7D0',
            borderLeft: '4px solid #22C55E', borderRadius: 10,
            padding: '14px 20px', marginBottom: 20,
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <CheckCircle size={18} color="#16A34A" />
              <p style={{ fontSize: 13, color: '#15803D', fontWeight: 500 }}>{successMsg}</p>
            </div>
            <Link to="/services" className="btn-primary" style={{ padding: '7px 16px', fontSize: 12, borderRadius: 6 }}>
              Lihat Layanan <ArrowRight size={13} />
            </Link>
          </div>
        )}

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 24 }}>
          <div>
            <div className="tag-label" style={{ marginBottom: 10 }}>Garage</div>
            <h1 className="page-title" style={{ marginBottom: 5 }}>Kendaraan Saya</h1>
            <p style={{ fontSize: 13, color: '#6B7280' }}>Kelola kendaraan dan dokumen verifikasi</p>
          </div>
          <button className="btn-primary" style={{ borderRadius: 7 }} onClick={() => setAddModal(true)}>
            <Plus size={14} /> Tambah Kendaraan
          </button>
        </div>

        {/* List kendaraan */}
        {isLoading ? (
          <div className="card" style={{ padding: 32, textAlign: 'center', color: '#9CA3AF', fontSize: 13 }}>Memuat...</div>
        ) : vehicles.length === 0 ? (
          <div className="card" style={{ padding: '56px 24px', textAlign: 'center' }}>
            <Car size={36} color="#E8B400" style={{ margin: '0 auto 14px' }} />
            <p style={{ fontSize: 15, fontWeight: 600, color: '#111827', marginBottom: 6 }}>Belum ada kendaraan</p>
            <p style={{ fontSize: 13, color: '#9CA3AF', marginBottom: 20 }}>Tambahkan kendaraan untuk mulai booking servis.</p>
            <button className="btn-primary" style={{ borderRadius: 7 }} onClick={() => setAddModal(true)}>
              <Plus size={14} /> Tambah Kendaraan
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {vehicles.map(v => (
              <div key={v.id} className="card" style={{ padding: '16px 20px' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                      <h3 style={{ fontSize: 15, fontWeight: 700, color: '#111827' }}>
                        {v.brand} {v.model} {v.year}
                      </h3>
                      {v.is_verified
                        ? <span className="badge badge-verified" style={{ gap: 3 }}><CheckCircle size={10} />Terverifikasi</span>
                        : <span className="badge badge-pending" style={{ gap: 3 }}><Clock size={10} />Belum Verifikasi</span>
                      }
                    </div>
                    <p style={{ fontSize: 12, color: '#9CA3AF' }}>{v.plate_number} · {v.type}</p>
                  </div>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button className="btn-secondary" style={{ padding: '6px 12px', fontSize: 11, borderRadius: 6 }} onClick={() => openUpload(v.id)}>
                      <Upload size={13} /> Upload Dokumen
                    </button>
                    <button className="btn-danger" style={{ padding: '6px 10px', borderRadius: 6 }} onClick={() => setDeleteTarget(v)}>
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
                {v.documents && v.documents.length > 0 && (
                  <div style={{ marginTop: 10, paddingTop: 10, borderTop: '1px solid #F3F4F6', display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                    {v.documents.map(doc => (
                      <div key={doc.id} style={{ display: 'flex', alignItems: 'center', gap: 7, background: '#F9FAFB', padding: '4px 10px', borderRadius: 6, fontSize: 12 }}>
                        <span style={{ fontSize: 11, fontWeight: 500, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '.04em' }}>{doc.type.replace('_', ' ')}</span>
                        {docBadge(doc.status)}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal Tambah Kendaraan */}
      <Modal open={addModal} onClose={() => setAddModal(false)} title="Tambah Kendaraan">
        <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <label className="label">Plat Nomor</label>
            <input className="input" placeholder="B 1234 ABC" value={form.plate_number} onChange={e => setForm(p => ({ ...p, plate_number: e.target.value }))} required />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label className="label">Merek</label>
              <input className="input" placeholder="Toyota" value={form.brand} onChange={e => setForm(p => ({ ...p, brand: e.target.value }))} required />
            </div>
            <div>
              <label className="label">Model</label>
              <input className="input" placeholder="Avanza" value={form.model} onChange={e => setForm(p => ({ ...p, model: e.target.value }))} required />
            </div>
            <div>
              <label className="label">Tahun</label>
              <input type="number" className="input" min={1990} max={new Date().getFullYear()} value={form.year} onChange={e => setForm(p => ({ ...p, year: +e.target.value }))} required />
            </div>
            <div>
              <label className="label">Jenis</label>
              <select className="input" value={form.type} onChange={e => setForm(p => ({ ...p, type: e.target.value }))}>
                <option value="mobil">Mobil</option>
                <option value="motor">Motor</option>
              </select>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', paddingTop: 8, borderTop: '1px solid #F3F4F6' }}>
            <button type="button" className="btn-secondary" onClick={() => setAddModal(false)}>Batal</button>
            <button type="submit" className="btn-primary" disabled={submitting}>{submitting ? 'Menyimpan...' : 'Simpan Kendaraan'}</button>
          </div>
        </form>
      </Modal>

      {/* Modal Upload Dokumen */}
      <Modal open={uploadModal} onClose={() => setUploadModal(false)} title="Upload Dokumen Kendaraan" width={420}>
        <form onSubmit={handleUpload} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <label className="label">Jenis Dokumen</label>
            <select className="input" value={uploadType} onChange={e => setUploadType(e.target.value)}>
              <option value="plat_nomor">Foto Plat Nomor</option>
              <option value="stnk">STNK</option>
              <option value="kir">KIR</option>
            </select>
          </div>
          <div>
            <label className="label">File <span style={{ color: '#9CA3AF', fontWeight: 400 }}>(JPG/PNG/PDF, maks 2MB)</span></label>
            <input type="file" className="input" style={{ paddingTop: 8 }} accept=".jpg,.jpeg,.png,.pdf" onChange={e => setUploadFile(e.target.files?.[0] || null)} required />
          </div>
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', paddingTop: 8, borderTop: '1px solid #F3F4F6' }}>
            <button type="button" className="btn-secondary" onClick={() => setUploadModal(false)}>Batal</button>
            <button type="submit" className="btn-primary" disabled={submitting || !uploadFile}>{submitting ? 'Mengupload...' : 'Upload'}</button>
          </div>
        </form>
      </Modal>

      {/* Confirm hapus kendaraan */}
      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        variant="danger"
        title="Hapus Kendaraan?"
        description={`${deleteTarget?.brand} ${deleteTarget?.model} ${deleteTarget?.year} (${deleteTarget?.plate_number}) akan dihapus permanen. Riwayat booking tidak terpengaruh.`}
        confirmLabel="Ya, Hapus"
        loading={deleting}
      />
    </div>
  )
}
