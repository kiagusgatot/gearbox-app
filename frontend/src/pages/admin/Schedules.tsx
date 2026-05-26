import { useEffect, useState, useCallback } from 'react'
import { ChevronLeft, ChevronRight, Clock, Car, CheckCircle, Wrench, AlertCircle, RefreshCw } from 'lucide-react'
import { format, addDays, subDays, parseISO, isToday } from 'date-fns'
import { id as localeId } from 'date-fns/locale'
import AdminLayout from '../../components/shared/AdminLayout'
import { useAdminBookings } from '../../hooks/useAdminBookings'
import api from '../../services/api'
import { formatPrice } from '../../utils/formatPrice'
import type { Booking } from '../../types'

// ── Types ────────────────────────────────────────────────────────────────────
type BookingExt = Booking & {
  queue_number?: string
  bay_number?: number
  estimated_start?: string
  estimated_end?: string
  total_duration?: number
  booking_services?: { service?: { name: string; duration_minutes: number } }[]
  user?: { name: string }
  vehicle?: { brand: string; model: string; plate_number: string }
}

interface BayData {
  bay_number: number
  bookings: BookingExt[]
  current_booking: BookingExt | null
  is_busy: boolean
  total_today: number
}

interface QueueStats {
  total_queue: number
  pending: number
  in_progress: number
  completed: number
  last_estimated: string | null
  capacity: { queue_count: number; is_available: boolean }
}

interface QueueData {
  date: string
  bays: BayData[]
  stats: QueueStats
  bookings: BookingExt[]
}

// ── Helpers ──────────────────────────────────────────────────────────────────
const STATUS_LABEL: Record<string, string> = {
  pending: 'Menunggu', confirmed: 'Dikonfirmasi',
  in_progress: 'Sedang Diproses', completed: 'Selesai', cancelled: 'Dibatalkan',
}
const STATUS_COLOR: Record<string, { bg: string; text: string }> = {
  pending:     { bg: '#FEF3C7', text: '#92400E' },
  confirmed:   { bg: '#DBEAFE', text: '#1E40AF' },
  in_progress: { bg: '#EDE9FE', text: '#6D28D9' },
  completed:   { bg: '#D1FAE5', text: '#065F46' },
  cancelled:   { bg: '#F3F4F6', text: '#6B7280' },
}

function formatTime(t?: string) { return t ? t.slice(0, 5) : '—' }

function getServiceNames(b: BookingExt) {
  if (b.booking_services?.length) {
    return b.booking_services.map(bs => bs.service?.name).filter(Boolean).join(' + ')
  }
  return '—'
}

// Hitung progress % booking berdasarkan waktu sekarang
function getProgress(b: BookingExt): number {
  if (!b.estimated_start || !b.estimated_end) return 0
  const now   = new Date()
  const start = new Date(`${format(now, 'yyyy-MM-dd')}T${b.estimated_start}`)
  const end   = new Date(`${format(now, 'yyyy-MM-dd')}T${b.estimated_end}`)
  const total = end.getTime() - start.getTime()
  const elapsed = Math.max(0, now.getTime() - start.getTime())
  return Math.min(100, Math.round((elapsed / total) * 100))
}

// ── Bay Card ─────────────────────────────────────────────────────────────────
function BayCard({ bay }: { bay: BayData }) {
  const { bay_number, current_booking, bookings, is_busy, total_today } = bay
  const progress = current_booking ? getProgress(current_booking) : 0
  const completed = bookings.filter(b => b.status === 'completed').length

  return (
    <div className="card" style={{
      padding: 0, overflow: 'hidden',
      borderTop: `3px solid ${is_busy ? '#E8B400' : '#E5E7EB'}`,
      transition: 'all .2s',
    }}>
      {/* Bay header */}
      <div style={{
        padding: '14px 18px',
        background: is_busy ? '#FFFBEB' : '#F9FAFB',
        borderBottom: '1px solid #F3F4F6',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 36, height: 36, borderRadius: 8,
            background: is_busy ? '#E8B400' : '#E5E7EB',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Wrench size={16} color={is_busy ? '#1A1916' : '#9CA3AF'} strokeWidth={2} />
          </div>
          <div>
            <p style={{ fontSize: 14, fontWeight: 700, color: '#111827' }}>Bay {bay_number}</p>
            <p style={{ fontSize: 11, color: '#9CA3AF' }}>{total_today} booking hari ini</p>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          <div style={{
            width: 8, height: 8, borderRadius: '50%',
            background: is_busy ? '#E8B400' : '#D1FAE5',
          }} />
          <span style={{ fontSize: 11, fontWeight: 600, color: is_busy ? '#B8900A' : '#065F46' }}>
            {is_busy ? 'Sedang Digunakan' : total_today === 0 ? 'Kosong' : 'Tersedia'}
          </span>
        </div>
      </div>

      {/* Current booking */}
      <div style={{ padding: '14px 18px', minHeight: 120 }}>
        {current_booking ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {/* Nama & plat */}
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
              <div>
                <p style={{ fontSize: 13, fontWeight: 700, color: '#111827', marginBottom: 2 }}>
                  {current_booking.user?.name || '—'}
                </p>
                <p style={{ fontSize: 11, color: '#9CA3AF' }}>
                  {current_booking.vehicle?.brand} {current_booking.vehicle?.model} ·{' '}
                  <span style={{ fontFamily: "'JetBrains Mono',monospace" }}>
                    {current_booking.vehicle?.plate_number}
                  </span>
                </p>
              </div>
              <span style={{
                fontSize: 10, fontWeight: 600, padding: '2px 8px', borderRadius: 999,
                background: STATUS_COLOR[current_booking.status]?.bg,
                color: STATUS_COLOR[current_booking.status]?.text,
              }}>
                {STATUS_LABEL[current_booking.status]}
              </span>
            </div>

            {/* Layanan */}
            <p style={{ fontSize: 12, color: '#374151', fontWeight: 500 }}>
              {getServiceNames(current_booking)}
            </p>

            {/* Jam */}
            <div style={{ display: 'flex', gap: 12 }}>
              <div>
                <p style={{ fontSize: 10, color: '#9CA3AF', marginBottom: 1 }}>Masuk</p>
                <p style={{ fontSize: 13, fontWeight: 700, color: '#111827' }}>
                  {formatTime(current_booking.estimated_start)}
                </p>
              </div>
              <div>
                <p style={{ fontSize: 10, color: '#9CA3AF', marginBottom: 1 }}>Est. Selesai</p>
                <p style={{ fontSize: 13, fontWeight: 700, color: '#111827' }}>
                  {formatTime(current_booking.estimated_end)}
                </p>
              </div>
              <div>
                <p style={{ fontSize: 10, color: '#9CA3AF', marginBottom: 1 }}>Antrian</p>
                <p style={{ fontSize: 11, fontFamily: "'JetBrains Mono',monospace", fontWeight: 700, color: '#B8900A' }}>
                  {current_booking.queue_number || '—'}
                </p>
              </div>
            </div>

            {/* Progress bar */}
            {current_booking.status === 'in_progress' && (
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <span style={{ fontSize: 10, color: '#9CA3AF' }}>Progress</span>
                  <span style={{ fontSize: 10, fontWeight: 600, color: '#B8900A' }}>{progress}%</span>
                </div>
                <div style={{ height: 4, background: '#F3F4F6', borderRadius: 2, overflow: 'hidden' }}>
                  <div style={{
                    height: '100%', width: `${progress}%`,
                    background: progress > 80 ? '#DC2626' : '#E8B400',
                    borderRadius: 2, transition: 'width .5s',
                  }} />
                </div>
              </div>
            )}
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: 90, gap: 6 }}>
            {completed > 0 ? (
              <>
                <CheckCircle size={24} color="#16A34A" strokeWidth={1.5} />
                <p style={{ fontSize: 12, color: '#6B7280' }}>{completed} booking selesai hari ini</p>
              </>
            ) : (
              <>
                <Car size={24} color="#D1D5DB" strokeWidth={1.5} />
                <p style={{ fontSize: 12, color: '#9CA3AF' }}>Bay kosong</p>
              </>
            )}
          </div>
        )}
      </div>

      {/* Upcoming bookings */}
      {bookings.filter(b => b.status === 'pending').length > 0 && (
        <div style={{ borderTop: '1px solid #F3F4F6', padding: '10px 18px', background: '#FAFAFA' }}>
          <p style={{ fontSize: 10, fontWeight: 600, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 6 }}>
            Menunggu ({bookings.filter(b => b.status === 'pending').length})
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {bookings.filter(b => b.status === 'pending').slice(0, 2).map(b => (
              <div key={b.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 11 }}>
                <span style={{ color: '#374151', fontWeight: 500 }}>{b.user?.name}</span>
                <span style={{ color: '#9CA3AF' }}>{formatTime(b.estimated_start)}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function AdminSchedules() {
  const [date, setDate]         = useState(format(new Date(), 'yyyy-MM-dd'))
  const [data, setData]         = useState<QueueData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [autoRefresh, setAutoRefresh] = useState(true)

  const load = useCallback(async () => {
    setIsLoading(true)
    try {
      const res = await api.get('/admin/queue', { params: { date } })
      setData(res.data)
    } finally { setIsLoading(false) }
  }, [date])

  useEffect(() => { load() }, [load])

  // Auto-refresh setiap 30 detik jika hari ini
  useEffect(() => {
    if (!autoRefresh || !isToday(parseISO(date))) return
    const interval = setInterval(load, 30000)
    return () => clearInterval(interval)
  }, [autoRefresh, date, load])

  // WebSocket: refresh saat ada update booking
  useAdminBookings({
    onNewBooking: () => load(),
    onStatusUpdate: () => load(),
  })

  const stats = data?.stats
  const bays  = data?.bays || []
  const allBookings = data?.bookings || []

  const statCards = [
    { label: 'Total Antrian', value: stats?.total_queue ?? 0, color: '#111827' },
    { label: 'Menunggu',      value: stats?.pending     ?? 0, color: '#92400E' },
    { label: 'Sedang Proses', value: stats?.in_progress ?? 0, color: '#6D28D9' },
    { label: 'Selesai',       value: stats?.completed   ?? 0, color: '#065F46' },
  ]

  return (
    <AdminLayout>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 24 }}>
          <div>
            <div className="page-eyebrow">Operasional</div>
            <h1 className="page-title">Monitor Antrian</h1>
            <p style={{ fontSize: 13, color: '#6B7280', marginTop: 4 }}>
              Jam operasional 09:00 – 18:00 · Batas booking 14:00 · {bays.length} Bay
            </p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {/* Auto refresh toggle */}
            {isToday(parseISO(date)) && (
              <button
                onClick={() => setAutoRefresh(p => !p)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  padding: '7px 12px', borderRadius: 7, fontSize: 11, fontWeight: 600, cursor: 'pointer',
                  background: autoRefresh ? '#F0FDF4' : '#F9FAFB',
                  border: `1px solid ${autoRefresh ? '#BBF7D0' : '#E5E7EB'}`,
                  color: autoRefresh ? '#15803D' : '#9CA3AF',
                }}
              >
                <div style={{ width: 6, height: 6, borderRadius: '50%', background: autoRefresh ? '#22C55E' : '#D1D5DB' }} />
                {autoRefresh ? 'Live' : 'Paused'}
              </button>
            )}
            <button onClick={load} style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '7px 12px', borderRadius: 7, fontSize: 11, fontWeight: 600,
              background: '#fff', border: '1px solid #E5E7EB', cursor: 'pointer', color: '#6B7280',
            }}>
              <RefreshCw size={13} style={{ animation: isLoading ? 'spin 1s linear infinite' : 'none' }} />
              Refresh
            </button>
          </div>
        </div>

        {/* Date navigation */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
          <button onClick={() => setDate(d => format(subDays(parseISO(d), 1), 'yyyy-MM-dd'))}
            style={{ width: 32, height: 32, borderRadius: 7, background: '#fff', border: '1px solid #E5E7EB', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#6B7280' }}>
            <ChevronLeft size={16} />
          </button>

          <div style={{ background: '#fff', border: '1px solid #E5E7EB', borderRadius: 8, padding: '8px 16px', display: 'flex', alignItems: 'center', gap: 10 }}>
            <Clock size={14} color="#B8900A" />
            <span style={{ fontSize: 14, fontWeight: 600, color: '#111827' }}>
              {format(parseISO(date), 'EEEE, d MMMM yyyy', { locale: localeId })}
            </span>
            {isToday(parseISO(date)) && (
              <span style={{ fontSize: 10, fontWeight: 700, color: '#15803D', background: '#D1FAE5', padding: '2px 8px', borderRadius: 999 }}>HARI INI</span>
            )}
          </div>

          <button onClick={() => setDate(d => format(addDays(parseISO(d), 1), 'yyyy-MM-dd'))}
            style={{ width: 32, height: 32, borderRadius: 7, background: '#fff', border: '1px solid #E5E7EB', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#6B7280' }}>
            <ChevronRight size={16} />
          </button>

          <input type="date" value={date} onChange={e => setDate(e.target.value)}
            style={{ padding: '7px 12px', borderRadius: 7, border: '1px solid #E5E7EB', fontSize: 13, color: '#6B7280', background: '#fff', cursor: 'pointer' }} />
        </div>

        {/* Stat strip */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12, marginBottom: 24 }}>
          {statCards.map(({ label, value, color }) => (
            <div key={label} className="card" style={{ padding: '14px 18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: 12, color: '#9CA3AF', fontWeight: 500 }}>{label}</span>
              <span style={{ fontSize: 24, fontWeight: 800, color }}>{isLoading ? '—' : value}</span>
            </div>
          ))}
        </div>

        {/* Last estimated */}
        {stats?.last_estimated && (
          <div style={{ background: '#FFFBEB', border: '1px solid #FDE68A', borderRadius: 8, padding: '10px 16px', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Clock size={14} color="#B8900A" />
            <span style={{ fontSize: 13, color: '#92400E', fontWeight: 500 }}>
              Estimasi bengkel selesai hari ini: <strong>{formatTime(stats.last_estimated)}</strong>
            </span>
          </div>
        )}

        {/* Bay cards grid */}
        {isLoading ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 14, marginBottom: 28 }}>
            {[...Array(6)].map((_, i) => (
              <div key={i} className="card" style={{ height: 200, background: '#F9FAFB' }} />
            ))}
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 14, marginBottom: 28 }}>
            {bays.map(bay => <BayCard key={bay.bay_number} bay={bay} />)}
          </div>
        )}

        {/* Tabel semua antrian */}
        <div className="card" style={{ overflow: 'hidden' }}>
          <div style={{ padding: '14px 20px', borderBottom: '1px solid #F3F4F6', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span className="section-title">Semua Antrian</span>
            <span style={{ fontSize: 12, color: '#9CA3AF' }}>{allBookings.length} booking</span>
          </div>
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>No. Antrian</th><th>Pelanggan</th><th>Kendaraan</th>
                  <th>Layanan</th><th>Bay</th><th>Jam Masuk</th>
                  <th>Est. Selesai</th><th>Total</th><th>Status</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr><td colSpan={9} style={{ textAlign: 'center', color: '#9CA3AF', padding: '32px 0' }}>Memuat...</td></tr>
                ) : allBookings.length === 0 ? (
                  <tr>
                    <td colSpan={9} style={{ textAlign: 'center', padding: '48px 0' }}>
                      <AlertCircle size={28} color="#D1D5DB" style={{ margin: '0 auto 10px' }} />
                      <p style={{ fontSize: 13, color: '#9CA3AF' }}>Tidak ada antrian pada tanggal ini</p>
                    </td>
                  </tr>
                ) : allBookings.map(b => (
                  <tr key={b.id}>
                    <td>
                      <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 11, fontWeight: 700, color: '#B8900A', background: '#FFFBEB', padding: '2px 8px', borderRadius: 4 }}>
                        {b.queue_number || '—'}
                      </span>
                    </td>
                    <td style={{ fontWeight: 500, color: '#111827' }}>{b.user?.name || '—'}</td>
                    <td>
                      <div style={{ fontSize: 12, color: '#374151' }}>{b.vehicle?.brand} {b.vehicle?.model}</div>
                      <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 10, color: '#9CA3AF' }}>{b.vehicle?.plate_number}</div>
                    </td>
                    <td style={{ fontSize: 12, maxWidth: 180 }}>{getServiceNames(b)}</td>
                    <td style={{ fontWeight: 600, color: '#111827' }}>Bay {b.bay_number}</td>
                    <td style={{ fontWeight: 600, color: '#111827' }}>{formatTime(b.estimated_start)}</td>
                    <td style={{ color: '#6B7280' }}>{formatTime(b.estimated_end)}</td>
                    <td style={{ fontWeight: 700, color: '#B8900A' }}>{formatPrice(b.total_price)}</td>
                    <td>
                      <span style={{
                        fontSize: 11, fontWeight: 600, padding: '3px 10px', borderRadius: 999,
                        background: STATUS_COLOR[b.status]?.bg,
                        color: STATUS_COLOR[b.status]?.text,
                      }}>
                        {STATUS_LABEL[b.status]}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
    </AdminLayout>
  )
}
