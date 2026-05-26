import { useEffect, useState, useCallback } from 'react'
import { Plus, CalendarCheck, Wifi } from 'lucide-react'
import Navbar from '../../components/shared/Navbar'
import BookingModal from './BookingModal'
import ConfirmDialog from '../../components/shared/ConfirmDialog'
import { Toast, useToast } from '../../components/shared/Toast'
import { useBookingStatus } from '../../hooks/useBookingStatus'
import { bookingService } from '../../services/bookingService'
import { formatDate } from '../../utils/formatDate'
import { formatPrice } from '../../utils/formatPrice'
import type { Booking } from '../../types'

const SL: Record<string, string> = {
  pending: 'Menunggu', confirmed: 'Dikonfirmasi',
  in_progress: 'Diproses', completed: 'Selesai', cancelled: 'Dibatalkan',
}

type BookingExt = Booking & {
  booking_services?: { service?: { name: string } }[]
  vehicle?: { brand: string; model: string }
  estimated_start?: string
  estimated_end?: string
  bay_number?: number
  queue_number?: string
}

export default function BookingHistory() {
  const [bookings, setBookings]         = useState<BookingExt[]>([])
  const [isLoading, setIsLoading]       = useState(true)
  const [bookingModal, setBookingModal] = useState(false)
  const [cancelTarget, setCancelTarget] = useState<Booking | null>(null)
  const [cancelling, setCancelling]     = useState(false)
  const [wsConnected, setWsConnected]   = useState(false)
  const { toasts, addToast, removeToast } = useToast()

  async function load() {
    setIsLoading(true)
    bookingService.list().then(r => setBookings(r.data as BookingExt[])).finally(() => setIsLoading(false))
  }
  useEffect(() => { load() }, [])

  // ── WebSocket: update status tanpa reload ────────────────────────────────
  useBookingStatus({
    onUpdate: useCallback((payload) => {
      setBookings(prev => prev.map(b =>
        b.id === payload.id ? { ...b, status: payload.status as Booking['status'] } : b
      ))
      setWsConnected(true)
    }, []),
    showToast: addToast,
  })

  async function handleCancel() {
    if (!cancelTarget) return
    setCancelling(true)
    try { await bookingService.cancel(cancelTarget.id); setCancelTarget(null); load() }
    finally { setCancelling(false) }
  }

  return (
    <div style={{ minHeight: '100vh', background: '#F0F2F5' }}>
      <Navbar />
      <div style={{ maxWidth: 800, margin: '0 auto', padding: '48px 24px' }}>

        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 28 }}>
          <div>
            <div className="tag-label" style={{ marginBottom: 10 }}>Riwayat</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 5 }}>
              <h1 className="page-title">Booking Saya</h1>
              {wsConnected && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 5, background: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: 999, padding: '3px 10px' }}>
                  <Wifi size={11} color="#16A34A" />
                  <span style={{ fontSize: 10, fontWeight: 600, color: '#15803D', letterSpacing: '.04em' }}>LIVE</span>
                </div>
              )}
            </div>
            <p style={{ fontSize: 13, color: '#6B7280' }}>Status update otomatis secara real-time</p>
          </div>
          <button className="btn-primary" style={{ borderRadius: 7 }} onClick={() => setBookingModal(true)}>
            <Plus size={14} /> Booking Baru
          </button>
        </div>

        {isLoading ? (
          <div className="card" style={{ padding: 32, textAlign: 'center', color: '#9CA3AF', fontSize: 13 }}>Memuat...</div>
        ) : bookings.length === 0 ? (
          <div className="card" style={{ padding: '56px 24px', textAlign: 'center' }}>
            <CalendarCheck size={36} color="#E8B400" style={{ margin: '0 auto 14px' }} />
            <p style={{ fontSize: 15, fontWeight: 600, color: '#111827', marginBottom: 6 }}>Belum ada booking</p>
            <p style={{ fontSize: 13, color: '#9CA3AF', marginBottom: 20 }}>Buat booking pertamamu sekarang.</p>
            <button className="btn-primary" style={{ borderRadius: 7 }} onClick={() => setBookingModal(true)}>
              <Plus size={14} /> Booking Sekarang
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {bookings.map(b => (
              <div key={b.id} className="card" style={{ padding: '16px 20px' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6, flexWrap: 'wrap' }}>
                      {/* Queue number — info utama */}
                      {b.queue_number ? (
                        <span style={{
                          fontFamily: "'JetBrains Mono',monospace",
                          fontSize: 12, fontWeight: 700,
                          color: '#B8900A', background: '#FFFBEB',
                          padding: '2px 9px', borderRadius: 5,
                          border: '1px solid #FDE68A',
                        }}>
                          {b.queue_number}
                        </span>
                      ) : (
                        <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 10, color: '#D1D5DB' }}>
                          {b.booking_code}
                        </span>
                      )}
                      <span className={`badge badge-${b.status === 'in_progress' ? 'progress' : b.status}`}>
                        {SL[b.status]}
                      </span>
                      {/* Booking code sebagai ref tersembunyi — hanya muncul jika ada queue_number */}
                      {b.queue_number && (
                        <span style={{ fontSize: 9, color: '#D1D5DB', fontFamily: "'JetBrains Mono',monospace" }}>
                          {b.booking_code}
                        </span>
                      )}
                    </div>
                    <p style={{ fontSize: 14, fontWeight: 600, color: '#111827', marginBottom: 4 }}>
                      {b.booking_services && b.booking_services.length > 0
                        ? b.booking_services.map(bs => bs.service?.name).filter(Boolean).join(' + ')
                        : `Booking #${b.id}`
                      }
                    </p>
                    <p style={{ fontSize: 12, color: '#6B7280' }}>
                      {[
                        b.bay_number && `Bay ${b.bay_number}`,
                        b.estimated_start && `${b.estimated_start.slice(0, 5)} – ${b.estimated_end?.slice(0, 5)}`,
                        b.vehicle && `${b.vehicle.brand} ${b.vehicle.model}`,
                      ].filter(Boolean).join(' · ')}
                    </p>
                  </div>
                  <div style={{ textAlign: 'right', flexShrink: 0, marginLeft: 12 }}>
                    <div style={{ fontSize: 16, fontWeight: 800, color: '#111827' }}>{formatPrice(b.total_price)}</div>
                    <div style={{ fontSize: 11, color: '#9CA3AF', marginTop: 2 }}>{formatDate(b.created_at)}</div>
                  </div>
                </div>
                {(b.status === 'pending' || b.status === 'confirmed') && (
                  <div style={{ marginTop: 10, paddingTop: 10, borderTop: '1px solid #F3F4F6' }}>
                    <button onClick={() => setCancelTarget(b)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 600, color: '#DC2626' }}>
                      Batalkan Booking
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <BookingModal
        open={bookingModal} onClose={() => setBookingModal(false)}
        onSuccess={() => { load(); addToast('Booking berhasil dibuat!', 'success') }}
      />
      <ConfirmDialog
        open={!!cancelTarget} onClose={() => setCancelTarget(null)} onConfirm={handleCancel}
        variant="warning" title="Batalkan Booking?"
        description="Booking akan dibatalkan dan slot antrian dilepas."
        confirmLabel="Ya, Batalkan" loading={cancelling}
      />
      <Toast toasts={toasts} onRemove={removeToast} />
    </div>
  )
}
