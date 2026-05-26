import { useEffect, useState } from 'react'
import { ArrowRight, CalendarDays, Search, X } from 'lucide-react'
import { format } from 'date-fns'
import { id as localeId } from 'date-fns/locale'
import AdminLayout from '../../components/shared/AdminLayout'
import Modal from '../../components/shared/Modal'
import { Toast, useToast } from '../../components/shared/Toast'
import { useAdminBookings } from '../../hooks/useAdminBookings'
import { bookingService } from '../../services/bookingService'
import { formatPrice } from '../../utils/formatPrice'
import type { Booking } from '../../types'

type BookingExt = Booking & {
  queue_number?: string
  bay_number?: number
  estimated_start?: string
  estimated_end?: string
  total_duration?: number
  booking_services?: { service?: { name: string; duration_minutes: number } }[]
  user?: { name: string; email: string }
  vehicle?: { plate_number: string; brand: string; model: string }
  service?: { name: string }
}

const STATUS_LABEL: Record<string, string> = {
  pending: 'Menunggu', confirmed: 'Dikonfirmasi',
  in_progress: 'Diproses', completed: 'Selesai', cancelled: 'Dibatalkan',
}
const NEXT_STATUS: Record<string, string> = {
  pending: 'confirmed', confirmed: 'in_progress', in_progress: 'completed',
}
const NEXT_LABEL: Record<string, string> = {
  pending: 'Konfirmasi', confirmed: 'Mulai Proses', in_progress: 'Tandai Selesai',
}
const STATUS_COLOR: Record<string, string> = {
  pending: '#92400E', confirmed: '#1E40AF',
  in_progress: '#6D28D9', completed: '#065F46', cancelled: '#6B7280',
}
const STATUS_BADGE: Record<string, string> = {
  pending: 'badge-pending', confirmed: 'badge-confirmed',
  in_progress: 'badge-progress', completed: 'badge-completed', cancelled: 'badge-cancelled',
}

function getServiceInfo(b: BookingExt) {
  if (b.booking_services?.length) {
    const names = b.booking_services.map(bs => bs.service?.name).filter(Boolean) as string[]
    const dur   = b.booking_services.reduce((s, bs) => s + (bs.service?.duration_minutes || 0), 0)
    return { names, count: names.length, duration: dur }
  }
  return { names: [b.service?.name || '—'], count: 1, duration: b.total_duration || 0 }
}

function formatTime(t?: string) { return t ? t.slice(0, 5) : '' }

function formatDur(min: number) {
  if (!min) return ''
  const h = Math.floor(min / 60), m = min % 60
  if (h === 0) return `${m}m`
  if (m === 0) return `${h}j`
  return `${h}j ${m}m`
}

export default function AdminBookings() {
  const [bookings, setBookings]         = useState<BookingExt[]>([])
  const [isLoading, setIsLoading]       = useState(true)
  const [filterStatus, setFilterStatus] = useState('')
  const [filterDate, setFilterDate]     = useState('')
  const [modalOpen, setModalOpen]       = useState(false)
  const [selected, setSelected]         = useState<BookingExt | null>(null)
  const [notes, setNotes]               = useState('')
  const [submitting, setSubmitting]     = useState(false)
  const [todayCount, setTodayCount]     = useState<number | null>(null)
  const { toasts, addToast, removeToast } = useToast()

  async function load() {
    setIsLoading(true)
    try {
      const [res, todayRes] = await Promise.all([
        bookingService.adminList(1, filterStatus || undefined, filterDate || undefined),
        bookingService.adminList(1, undefined, format(new Date(), 'yyyy-MM-dd')),
      ])
      setBookings(res.data as BookingExt[])
      setTodayCount(todayRes.total ?? todayRes.data?.length ?? 0)
    } finally { setIsLoading(false) }
  }
  useEffect(() => { load() }, [filterStatus, filterDate])

  useAdminBookings({
    onNewBooking: (payload) => { addToast(`Booking baru dari ${payload.user.name}`, 'info'); load() },
    onStatusUpdate: (payload) => {
      setBookings(prev => prev.map(b =>
        b.id === payload.id ? { ...b, status: payload.status as Booking['status'] } : b
      ))
    },
  })

  function openModal(b: BookingExt) { setSelected(b); setNotes(''); setModalOpen(true) }
  function closeModal() { setModalOpen(false); setSelected(null) }

  async function handleUpdate(e: React.FormEvent) {
    e.preventDefault()
    if (!selected) return
    setSubmitting(true)
    try {
      await bookingService.adminUpdateStatus(selected.id, NEXT_STATUS[selected.status], notes)
      setBookings(prev => prev.map(b =>
        b.id === selected.id ? { ...b, status: NEXT_STATUS[selected.status] as Booking['status'] } : b
      ))
      addToast(`Status booking ${selected.booking_code} diperbarui`, 'success')
      closeModal()
    } catch { addToast('Gagal update status', 'warning') }
    finally { setSubmitting(false) }
  }

  const hasFilter = !!filterStatus || !!filterDate
  const counts = Object.keys(STATUS_LABEL).reduce((acc, s) => {
    acc[s] = bookings.filter(b => b.status === s).length; return acc
  }, {} as Record<string, number>)

  return (
    <AdminLayout>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 24 }}>
          <div>
            <div className="page-eyebrow">Manajemen</div>
            <h1 className="page-title">Booking</h1>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            {/* Counter booking hari ini */}
            <div style={{
              background: '#fff', border: '1px solid #E5E7EB', borderRadius: 10,
              padding: '14px 20px', minWidth: 150, textAlign: 'center',
            }}>
              <div style={{ fontSize: 28, fontWeight: 800, color: '#111827', lineHeight: 1 }}>
                {isLoading || todayCount === null ? '—' : todayCount}
              </div>
              <div style={{ fontSize: 12, fontWeight: 500, color: '#6B7280', marginTop: 4 }}>
                Booking Hari Ini
              </div>
              <div style={{ fontSize: 10, color: '#9CA3AF', marginTop: 2 }}>
                {format(new Date(), 'd MMMM yyyy', { locale: localeId })}
              </div>
            </div>

            {/* Real-time indicator */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#22C55E' }} />
              <span style={{ fontSize: 11, color: '#9CA3AF' }}>Real-time aktif</span>
            </div>
          </div>
        </div>

        {/* Status summary cards — klik untuk filter */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: 8, marginBottom: 20 }}>
          {Object.entries(STATUS_LABEL).map(([s, l]) => (
            <button key={s} onClick={() => setFilterStatus(filterStatus === s ? '' : s)} style={{
              padding: '12px 14px', borderRadius: 8, cursor: 'pointer', textAlign: 'left',
              background: '#fff',
              border: `2px solid ${filterStatus === s ? STATUS_COLOR[s] : '#E5E7EB'}`,
              transition: 'all .15s',
            }}>
              <div style={{ fontSize: 22, fontWeight: 800, color: filterStatus === s ? STATUS_COLOR[s] : '#111827', lineHeight: 1 }}>
                {isLoading ? '—' : counts[s] ?? 0}
              </div>
              <div style={{ fontSize: 11, color: '#9CA3AF', marginTop: 4, fontWeight: 500 }}>{l}</div>
            </button>
          ))}
        </div>

        {/* Filter bar */}
        <div style={{ display: 'flex', gap: 10, marginBottom: 16, alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
            <CalendarDays size={14} color="#9CA3AF" style={{ position: 'absolute', left: 10, pointerEvents: 'none' }} />
            <input type="date" value={filterDate} onChange={e => setFilterDate(e.target.value)} style={{
              paddingLeft: 32, paddingRight: 12, paddingTop: 7, paddingBottom: 7,
              borderRadius: 7, border: `1px solid ${filterDate ? '#E8B400' : '#E5E7EB'}`,
              fontSize: 13, color: filterDate ? '#111827' : '#9CA3AF',
              background: filterDate ? '#FFFBEB' : '#fff', cursor: 'pointer',
              fontFamily: "'Plus Jakarta Sans',sans-serif",
            }} />
          </div>
          {hasFilter && (
            <>
              <button onClick={() => { setFilterStatus(''); setFilterDate('') }} style={{
                display: 'flex', alignItems: 'center', gap: 5, padding: '7px 12px', borderRadius: 7,
                fontSize: 12, fontWeight: 600, background: '#FEF2F2', border: '1px solid #FECACA',
                color: '#DC2626', cursor: 'pointer',
              }}>
                <X size={12} /> Reset Filter
              </button>
              <span style={{ fontSize: 12, color: '#9CA3AF' }}>
                {isLoading ? '...' : `${bookings.length} hasil`}
                {filterStatus && ` · ${STATUS_LABEL[filterStatus]}`}
                {filterDate && ` · ${format(new Date(filterDate), 'd MMM yyyy', { locale: localeId })}`}
              </span>
            </>
          )}
        </div>

        {/* Tabel */}
        <div className="card" style={{ overflow: 'hidden' }}>
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>No. Antrian</th><th>Pelanggan</th><th>Layanan</th>
                  <th>Jadwal</th><th>Kendaraan</th><th>Total</th>
                  <th>Status</th><th>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr><td colSpan={8} style={{ textAlign: 'center', color: '#9CA3AF', padding: '32px 0' }}>Memuat...</td></tr>
                ) : bookings.length === 0 ? (
                  <tr>
                    <td colSpan={8} style={{ textAlign: 'center', padding: '48px 24px' }}>
                      <Search size={28} color="#D1D5DB" style={{ margin: '0 auto 10px' }} />
                      <p style={{ fontSize: 14, fontWeight: 600, color: '#374151', marginBottom: 4 }}>
                        {hasFilter ? 'Tidak ada hasil' : 'Belum ada booking'}
                      </p>
                      <p style={{ fontSize: 13, color: '#9CA3AF' }}>
                        {hasFilter
                          ? `Tidak ada booking${filterStatus ? ' ' + STATUS_LABEL[filterStatus].toLowerCase() : ''}${filterDate ? ` pada ${format(new Date(filterDate), 'd MMMM yyyy', { locale: localeId })}` : ''}`
                          : 'Booking yang masuk akan tampil di sini'
                        }
                      </p>
                      {hasFilter && (
                        <button onClick={() => { setFilterStatus(''); setFilterDate('') }}
                          style={{ marginTop: 12, background: 'none', border: 'none', cursor: 'pointer', fontSize: 13, color: '#B8900A', fontWeight: 600 }}>
                          Reset filter
                        </button>
                      )}
                    </td>
                  </tr>
                ) : bookings.map(b => {
                  const { names, count, duration } = getServiceInfo(b)
                  return (
                    <tr key={b.id}>
                      {/* Antrian */}
                      <td>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                          {/* Queue number — prominent */}
                          {b.queue_number ? (
                            <span style={{
                              fontFamily: "'JetBrains Mono',monospace",
                              fontSize: 12, fontWeight: 700,
                              color: '#B8900A', background: '#FFFBEB',
                              padding: '2px 8px', borderRadius: 5,
                              width: 'fit-content', letterSpacing: '.03em',
                            }}>
                              {b.queue_number}
                            </span>
                          ) : (
                            <span style={{ fontSize: 11, color: '#D1D5DB' }}>—</span>
                          )}
                          {/* Booking code — secondary, tooltip on hover */}
                          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                            <span style={{
                              fontSize: 9, fontWeight: 600,
                              color: '#D1D5DB', letterSpacing: '.06em',
                              textTransform: 'uppercase',
                            }}>ID</span>
                            <span style={{
                              fontFamily: "'JetBrains Mono',monospace",
                              fontSize: 10, color: '#D1D5DB',
                            }}>
                              {b.booking_code}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Pelanggan */}
                      <td>
                        <div style={{ fontWeight: 600, color: '#111827', fontSize: 13 }}>{b.user?.name || '—'}</div>
                        <div style={{ fontSize: 11, color: '#9CA3AF', marginTop: 1 }}>{b.user?.email}</div>
                      </td>

                      {/* Layanan multi */}
                      <td style={{ maxWidth: 200 }}>
                        <div style={{ fontSize: 12, color: '#374151', lineHeight: 1.5 }}>
                          {count <= 2
                            ? names.join(', ')
                            : <>{names.slice(0, 2).join(', ')} <span style={{ color: '#9CA3AF', fontWeight: 600 }}>+{count - 2} lainnya</span></>
                          }
                        </div>
                        {duration > 0 && (
                          <div style={{ fontSize: 10, color: '#9CA3AF', marginTop: 2 }}>⏱ {formatDur(duration)}</div>
                        )}
                      </td>

                      {/* Jadwal — tanggal + bay + jam */}
                      <td>
                        {b.bay_number ? (
                          <div>
                            <div style={{ fontSize: 11, color: '#9CA3AF', marginBottom: 2 }}>
                              {format(new Date(b.created_at), 'd MMM yyyy', { locale: localeId })}
                            </div>
                            <div style={{ fontSize: 12, fontWeight: 600, color: '#111827' }}>Bay {b.bay_number}</div>
                            <div style={{ fontSize: 11, color: '#6B7280', marginTop: 1 }}>
                              {formatTime(b.estimated_start)} – {formatTime(b.estimated_end)}
                            </div>
                          </div>
                        ) : <span style={{ color: '#D1D5DB', fontSize: 12 }}>—</span>}
                      </td>

                      {/* Kendaraan */}
                      <td>
                        <div style={{ fontSize: 12, color: '#374151' }}>
                          {b.vehicle ? `${b.vehicle.brand} ${b.vehicle.model}` : '—'}
                        </div>
                        {b.vehicle?.plate_number && (
                          <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 10, color: '#9CA3AF', marginTop: 1 }}>
                            {b.vehicle.plate_number}
                          </div>
                        )}
                      </td>

                      {/* Total */}
                      <td style={{ fontWeight: 700, color: '#B8900A', fontSize: 14, whiteSpace: 'nowrap' }}>
                        {formatPrice(b.total_price)}
                      </td>

                      {/* Status */}
                      <td>
                        <span className={`badge ${STATUS_BADGE[b.status] || 'badge-cancelled'}`}>
                          {STATUS_LABEL[b.status]}
                        </span>
                      </td>

                      {/* Aksi */}
                      <td>
                        {NEXT_STATUS[b.status] && (
                          <button className="btn-primary"
                            style={{ padding: '5px 12px', fontSize: 11, borderRadius: 6, whiteSpace: 'nowrap' }}
                            onClick={() => openModal(b)}>
                            {NEXT_LABEL[b.status]}
                          </button>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>

      {/* Modal update status */}
      <Modal open={modalOpen} onClose={closeModal} title="Update Status Booking" width={480}>
        {selected && (
          <form onSubmit={handleUpdate} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ background: '#F9FAFB', borderRadius: 8, padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 6 }}>
              {/* Queue number + detail jadwal */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                {selected.queue_number ? (
                  <span style={{
                    fontFamily: "'JetBrains Mono',monospace",
                    fontSize: 13, fontWeight: 700,
                    color: '#B8900A', background: '#FFFBEB',
                    padding: '3px 10px', borderRadius: 6,
                    border: '1px solid #FDE68A',
                  }}>
                    {selected.queue_number}
                  </span>
                ) : null}
                {selected.bay_number && (
                  <span style={{ fontSize: 12, color: '#6B7280', fontWeight: 500 }}>Bay {selected.bay_number}</span>
                )}
                {selected.estimated_start && (
                  <span style={{ fontSize: 12, color: '#6B7280' }}>
                    {formatTime(selected.estimated_start)} – {formatTime(selected.estimated_end)}
                  </span>
                )}
              </div>

              {/* Nama layanan */}
              <p style={{ fontSize: 14, fontWeight: 600, color: '#111827' }}>
                {getServiceInfo(selected).names.join(' + ')}
              </p>

              {/* Pelanggan + booking code sebagai referensi */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <p style={{ fontSize: 12, color: '#6B7280' }}>{selected.user?.name}</p>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <span style={{ fontSize: 9, fontWeight: 600, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '.06em' }}>Ref</span>
                  <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 10, color: '#9CA3AF' }}>
                    {selected.booking_code}
                  </span>
                </div>
              </div>

              {/* Kendaraan */}
              {selected.vehicle && (
                <p style={{ fontSize: 12, color: '#9CA3AF' }}>
                  {selected.vehicle.brand} {selected.vehicle.model} ·{' '}
                  <span style={{ fontFamily: "'JetBrains Mono',monospace" }}>{selected.vehicle.plate_number}</span>
                </p>
              )}

              {/* Total */}
              <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: 6, borderTop: '1px solid #F3F4F6' }}>
                <span style={{ fontSize: 12, color: '#9CA3AF' }}>Total</span>
                <span style={{ fontSize: 14, fontWeight: 700, color: '#B8900A' }}>{formatPrice(selected.total_price)}</span>
              </div>
            </div>

            <div>
              <p style={{ fontSize: 12, fontWeight: 500, color: '#6B7280', marginBottom: 10 }}>Perubahan status:</p>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ padding: '7px 16px', borderRadius: 999, fontSize: 12, fontWeight: 600, background: `${STATUS_COLOR[selected.status]}18`, color: STATUS_COLOR[selected.status], border: `1px solid ${STATUS_COLOR[selected.status]}30` }}>
                  {STATUS_LABEL[selected.status]}
                </div>
                <ArrowRight size={16} color="#9CA3AF" style={{ flexShrink: 0 }} />
                <div style={{ padding: '7px 16px', borderRadius: 999, fontSize: 12, fontWeight: 600, background: `${STATUS_COLOR[NEXT_STATUS[selected.status]]}18`, color: STATUS_COLOR[NEXT_STATUS[selected.status]], border: `1px solid ${STATUS_COLOR[NEXT_STATUS[selected.status]]}30` }}>
                  {STATUS_LABEL[NEXT_STATUS[selected.status]]}
                </div>
              </div>
            </div>

            <div>
              <label className="label">Catatan <span style={{ color: '#9CA3AF', fontWeight: 400, textTransform: 'none', letterSpacing: 0 }}>(opsional)</span></label>
              <textarea className="input" style={{ resize: 'none' }} rows={3}
                placeholder="Catatan untuk pelanggan atau mekanik..."
                value={notes} onChange={e => setNotes(e.target.value)} />
            </div>

            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', paddingTop: 8, borderTop: '1px solid #F3F4F6' }}>
              <button type="button" className="btn-secondary" onClick={closeModal}>Batal</button>
              <button type="submit" className="btn-primary" disabled={submitting} style={{ borderRadius: 7 }}>
                {submitting ? 'Memproses...' : NEXT_LABEL[selected.status]}
              </button>
            </div>
          </form>
        )}
      </Modal>

      <Toast toasts={toasts} onRemove={removeToast} />
    </AdminLayout>
  )
}
