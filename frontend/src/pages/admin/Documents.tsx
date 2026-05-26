import { useEffect, useState } from 'react'
import { CheckCircle, XCircle, Clock } from 'lucide-react'
import AdminLayout from '../../components/shared/AdminLayout'
import Modal from '../../components/shared/Modal'
import { vehicleService } from '../../services/vehicleService'
import { formatDate } from '../../utils/formatDate'
import type { VehicleDocument } from '../../types'

export default function AdminDocuments() {
  const [documents, setDocuments]   = useState<VehicleDocument[]>([])
  const [isLoading, setIsLoading]   = useState(true)
  const [filterStatus, setFilterStatus] = useState('pending')
  const [modalOpen, setModalOpen]   = useState(false)
  const [selected, setSelected]     = useState<VehicleDocument | null>(null)
  const [action, setAction]         = useState<'verified' | 'rejected'>('verified')
  const [notes, setNotes]           = useState('')
  const [processing, setProcessing] = useState(false)

  const [previewOpen, setPreviewOpen] = useState(false)
  const [previewDoc, setPreviewDoc]   = useState<VehicleDocument | null>(null)
  const [previewLoading, setPreviewLoading] = useState(true)
  const [previewError, setPreviewError]     = useState(false)

  function openPreview(doc: VehicleDocument) {
    setPreviewDoc(doc)
    setPreviewLoading(true)
    setPreviewError(false)
    setPreviewOpen(true)
  }
  function closePreview() {
    setPreviewOpen(false)
    setPreviewDoc(null)
  }

  async function load() {
    setIsLoading(true)
    vehicleService.adminListDocuments(filterStatus).then(r => setDocuments(r.data)).finally(() => setIsLoading(false))
  }
  useEffect(() => { load() }, [filterStatus])

  function openModal(doc: VehicleDocument, act: 'verified' | 'rejected') {
    setSelected(doc); setAction(act); setNotes(''); setModalOpen(true)
  }
  function closeModal() { setModalOpen(false); setSelected(null) }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!selected) return
    if (action === 'rejected' && !notes) { alert('Catatan wajib untuk dokumen yang ditolak'); return }
    setProcessing(true)
    try { await vehicleService.adminVerifyDocument(selected.id, { status: action, notes }); closeModal(); load() }
    finally { setProcessing(false) }
  }

  const TL: Record<string, string> = { plat_nomor: 'Plat Nomor', stnk: 'STNK', kir: 'KIR' }

  const fBtn = (s: string, label: string) => (
    <button key={s} onClick={() => setFilterStatus(s)} style={{
      padding: '5px 14px', fontSize: 12, fontWeight: 600, cursor: 'pointer',
      background: filterStatus === s ? '#E8B400' : '#fff',
      color: filterStatus === s ? '#1A1916' : '#6B7280',
      border: `1px solid ${filterStatus === s ? '#E8B400' : '#E5E7EB'}`, borderRadius: 6,
    }}>
      {label}
    </button>
  )

  return (
    <AdminLayout>
      <div className="page-header">
        <div>
          <div className="page-eyebrow">Verifikasi</div>
          <h1 className="page-title">Dokumen Kendaraan</h1>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 6, marginBottom: 16, flexWrap: 'wrap' }}>
        {fBtn('pending', 'Menunggu')}
        {fBtn('verified', 'Terverifikasi')}
        {fBtn('rejected', 'Ditolak')}
      </div>

      {isLoading ? (
        <div className="card" style={{ padding: 32, textAlign: 'center', color: '#9CA3AF', fontSize: 13 }}>Memuat...</div>
      ) : documents.length === 0 ? (
        <div className="card" style={{ padding: '48px 24px', textAlign: 'center' }}>
          <p style={{ color: '#9CA3AF', fontSize: 13 }}>Tidak ada dokumen.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {documents.map(doc => {
            const vehicle = (doc as unknown as { vehicle?: { plate_number: string; brand: string; model: string; user?: { name: string } } }).vehicle
            return (
              <div key={doc.id} className="card" style={{ padding: '18px 22px' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 5, flexWrap: 'wrap' }}>
                      <span style={{ fontWeight: 600, color: '#111827', fontSize: 15 }}>{TL[doc.type]}</span>
                      {doc.status === 'pending'   && <span className="badge badge-pending"  style={{ gap: 3 }}><Clock size={10} />Menunggu</span>}
                      {doc.status === 'verified'  && <span className="badge badge-verified" style={{ gap: 3 }}><CheckCircle size={10} />Terverifikasi</span>}
                      {doc.status === 'rejected'  && <span className="badge badge-rejected" style={{ gap: 3 }}><XCircle size={10} />Ditolak</span>}
                    </div>
                    {vehicle && (
                      <p style={{ fontSize: 13, color: '#6B7280' }}>
                        {vehicle.brand} {vehicle.model} · {vehicle.plate_number}
                        {vehicle.user && ` · ${vehicle.user.name}`}
                      </p>
                    )}
                    <p style={{ fontSize: 11, color: '#9CA3AF', marginTop: 3 }}>
                      Upload: {formatDate(doc.created_at)} · {doc.file_name}
                    </p>
                    {doc.notes && <p style={{ fontSize: 11, color: '#9CA3AF', marginTop: 3, fontStyle: 'italic' }}>Catatan: {doc.notes}</p>}
                  </div>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexShrink: 0, flexWrap: 'wrap' }}>
                    <button
                      type="button"
                      className="btn-secondary"
                      style={{ padding: '6px 14px', fontSize: 11 }}
                      onClick={() => openPreview(doc)}
                    >
                      Lihat File
                    </button>
                    {doc.status === 'pending' && (
                      <>
                        <button className="btn-primary" style={{ padding: '6px 14px', fontSize: 11 }} onClick={() => openModal(doc, 'verified')}>
                          <CheckCircle size={13} /> Approve
                        </button>
                        <button className="btn-danger" style={{ padding: '6px 14px', fontSize: 11 }} onClick={() => openModal(doc, 'rejected')}>
                          <XCircle size={13} /> Tolak
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      <Modal open={modalOpen} onClose={closeModal} title={action === 'verified' ? 'Approve Dokumen' : 'Tolak Dokumen'} width={440}>
        {selected && (
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ background: '#F9FAFB', borderRadius: 8, padding: '12px 14px' }}>
              <p style={{ fontSize: 13, fontWeight: 600, color: '#111827', marginBottom: 3 }}>{TL[selected.type]}</p>
              <p style={{ fontSize: 12, color: '#6B7280' }}>{selected.file_name}</p>
            </div>
            <div>
              <label className="label">
                Catatan {action === 'rejected'
                  ? <span style={{ color: '#DC2626' }}>*wajib</span>
                  : <span style={{ color: '#9CA3AF', fontWeight: 400 }}>(opsional)</span>
                }
              </label>
              <textarea className="input" style={{ resize: 'none' }} rows={3}
                placeholder={action === 'rejected' ? 'Alasan penolakan dokumen...' : 'Catatan tambahan untuk pelanggan...'}
                value={notes} onChange={e => setNotes(e.target.value)}
                required={action === 'rejected'}
              />
            </div>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', paddingTop: 8, borderTop: '1px solid #F3F4F6' }}>
              <button type="button" className="btn-secondary" onClick={closeModal}>Batal</button>
              <button type="submit" disabled={processing}
                className={action === 'verified' ? 'btn-primary' : 'btn-danger'}
                style={{ padding: '8px 18px' }}
              >
                {processing ? 'Memproses...' : action === 'verified'
                  ? <><CheckCircle size={14} /> Approve</>
                  : <><XCircle size={14} /> Tolak</>
                }
              </button>
            </div>
          </form>
        )}
      </Modal>

      <Modal open={previewOpen} onClose={closePreview} title={previewDoc ? `Preview Dokumen: ${TL[previewDoc.type]} - ${previewDoc.file_name}` : 'Preview Dokumen'} width={800}>
        {previewDoc && (() => {
          const BASE_URL =
            (import.meta.env.VITE_API_URL as string | undefined)?.replace('/api', '') ??
            'http://localhost:8000'
          const fileUrl = `${BASE_URL}/storage/${previewDoc.file_path}`
          const isPdf = previewDoc.file_path.toLowerCase().endsWith('.pdf') || previewDoc.file_name.toLowerCase().endsWith('.pdf')

          return (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={{
                background: '#F9FAFB', borderRadius: 8, padding: '12px 14px',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                border: '1px solid #E5E7EB', flexWrap: 'wrap', gap: 8
              }}>
                <div>
                  <p style={{ fontSize: 13, fontWeight: 600, color: '#111827', marginBottom: 3 }}>
                    Tipe Dokumen: {TL[previewDoc.type]}
                  </p>
                  <p style={{ fontSize: 11, color: '#6B7280' }}>
                    Nama File: {previewDoc.file_name}
                  </p>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  {previewDoc.status === 'pending' && (
                    <>
                      <button className="btn-primary" style={{ padding: '6px 14px', fontSize: 11 }} onClick={() => { closePreview(); openModal(previewDoc, 'verified') }}>
                        <CheckCircle size={13} /> Approve
                      </button>
                      <button className="btn-danger" style={{ padding: '6px 14px', fontSize: 11 }} onClick={() => { closePreview(); openModal(previewDoc, 'rejected') }}>
                        <XCircle size={13} /> Tolak
                      </button>
                    </>
                  )}
                </div>
              </div>

              <div style={{
                background: '#F3F4F6', borderRadius: 10, padding: 8,
                border: '1px solid #E5E7EB', display: 'flex', flexDirection: 'column', alignItems: 'center',
                justifyContent: 'center', minHeight: 350, overflow: 'hidden', position: 'relative'
              }}>
                <style>{`
                  @keyframes doc-preview-spin {
                    to { transform: rotate(360deg); }
                  }
                `}</style>
                {previewLoading && (
                  <div style={{
                    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10,
                    padding: '40px 20px', color: '#9CA3AF', fontSize: 13, fontWeight: 500
                  }}>
                    <div style={{
                      width: 24, height: 24, border: '2px solid #E5E7EB',
                      borderTop: '2px solid #E8B400', borderRadius: '50%',
                      animation: 'doc-preview-spin 0.8s linear infinite'
                    }} />
                    <span>Memuat dokumen...</span>
                  </div>
                )}
                {previewError && (
                  <div style={{ padding: '40px 20px', color: '#DC2626', fontSize: 13, fontWeight: 500, textAlign: 'center' }}>
                    Gagal memuat dokumen. Silakan coba buka di tab baru.
                  </div>
                )}
                {isPdf ? (
                  <iframe
                    src={fileUrl}
                    onLoad={() => setPreviewLoading(false)}
                    style={{
                      display: previewLoading ? 'none' : 'block',
                      width: '100%', height: '550px', borderRadius: 6, border: 'none'
                    }}
                    title="PDF Document Preview"
                  />
                ) : (
                  <img
                    src={fileUrl}
                    alt={previewDoc.file_name}
                    onLoad={() => setPreviewLoading(false)}
                    onError={() => { setPreviewLoading(false); setPreviewError(true); }}
                    style={{
                      display: previewLoading || previewError ? 'none' : 'block',
                      maxWidth: '100%', maxHeight: '65vh', objectFit: 'contain',
                      borderRadius: 6, boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                    }}
                  />
                )}
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 12, borderTop: '1px solid #F3F4F6' }}>
                <a
                  href={fileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-secondary"
                  style={{ padding: '8px 16px', fontSize: 12, textDecoration: 'none' }}
                >
                  Buka di Tab Baru
                </a>
                <button type="button" className="btn-secondary" onClick={closePreview} style={{ padding: '8px 18px' }}>
                  Tutup
                </button>
              </div>
            </div>
          )
        })()}
      </Modal>
    </AdminLayout>
  )
}
