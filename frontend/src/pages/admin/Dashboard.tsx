import { useEffect, useState } from 'react'
import { CalendarCheck, Clock, Wrench, CheckCircle, Bell } from 'lucide-react'
import AdminLayout from '../../components/shared/AdminLayout'
import { Toast, useToast } from '../../components/shared/Toast'
import { useAdminBookings } from '../../hooks/useAdminBookings'
import { bookingService } from '../../services/bookingService'
import { formatPrice } from '../../utils/formatPrice'
import type { Booking } from '../../types'

export default function AdminDashboard() {
  const [bookings, setBookings]             = useState<Booking[]>([])
  const [isLoading, setIsLoading]           = useState(true)
  const [newBookingCount, setNewBookingCount] = useState(0)
  const { toasts, addToast, removeToast }   = useToast()

  async function load() {
    setIsLoading(true)
    bookingService.adminList().then(r => setBookings(r.data)).finally(() => setIsLoading(false))
  }
  useEffect(() => { load() }, [])

  useAdminBookings({
    onNewBooking: (payload) => {
      setNewBookingCount(c => c + 1)
      addToast(`Booking baru dari ${payload.user.name}`, 'info')
      load()
    },
    onStatusUpdate: (payload) => {
      setBookings(prev => prev.map(b => b.id === payload.id ? { ...b, status: payload.status as Booking['status'] } : b))
    },
  })

  type B = Booking & { queue_number?: string; user?: { name: string }; service?: { name: string } }

  const stats = [
    { label: 'Total Booking', value: bookings.length,                                        icon: CalendarCheck, accent: false },
    { label: 'Menunggu',      value: bookings.filter(b => b.status === 'pending').length,     icon: Clock,         accent: false },
    { label: 'Diproses',      value: bookings.filter(b => b.status === 'in_progress').length, icon: Wrench,        accent: false },
    { label: 'Selesai',       value: bookings.filter(b => b.status === 'completed').length,   icon: CheckCircle,   accent: true  },
  ]

  return (
    <AdminLayout>
      <div className="page-header">
        <div>
          <div className="page-eyebrow">Overview</div>
          <h1 className="page-title">Dashboard</h1>
        </div>
        <div className="header-actions">
          {newBookingCount > 0 && (
            <button onClick={() => { setNewBookingCount(0); load() }} style={{
              display: 'flex', alignItems: 'center', gap: 8,
              background: '#EFF6FF', border: '1px solid #BFDBFE',
              borderRadius: 8, padding: '8px 14px', cursor: 'pointer',
            }}>
              <Bell size={14} color="#2563EB" />
              <span style={{ fontSize: 13, fontWeight: 600, color: '#1D4ED8' }}>{newBookingCount} booking baru</span>
            </button>
          )}
        </div>
      </div>

      <div className="stat-grid-4" style={{ marginBottom: 24 }}>
        {stats.map(({ label, value, icon: Icon, accent }) => (
          <div key={label} className="card" style={{ padding: '18px 20px', borderTop: accent ? '3px solid #E8B400' : '3px solid transparent' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <span style={{ fontSize: 11, fontWeight: 600, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '.07em' }}>{label}</span>
              <div style={{ width: 32, height: 32, background: accent ? '#FFFBEB' : '#F9FAFB', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Icon size={15} color={accent ? '#B8900A' : '#9CA3AF'} strokeWidth={1.8} />
              </div>
            </div>
            <div style={{ fontSize: 34, fontWeight: 800, color: accent ? '#B8900A' : '#111827', lineHeight: 1 }}>
              {isLoading ? '—' : value}
            </div>
          </div>
        ))}
      </div>

      <div className="card" style={{ overflow: 'hidden' }}>
        <div style={{ padding: '14px 20px', borderBottom: '1px solid #F3F4F6', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span className="section-title">Booking Terbaru</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#22C55E' }} />
            <span style={{ fontSize: 11, color: '#9CA3AF' }}>Real-time</span>
          </div>
        </div>
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Antrian</th>
                <th>Pelanggan</th>
                <th className="col-hide-mobile">Layanan</th>
                <th className="col-hide-sm">Total</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {isLoading
                ? <tr><td colSpan={5} style={{ textAlign: 'center', color: '#9CA3AF', padding: '32px 0' }}>Memuat...</td></tr>
                : (bookings as B[]).slice(0, 10).map(b => (
                  <tr key={b.id}>
                    <td style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 11, fontWeight: 700, color: '#B8900A' }}>
                      {b.queue_number || b.booking_code}
                    </td>
                    <td style={{ fontWeight: 500, color: '#111827', fontSize: 13 }}>{b.user?.name || '—'}</td>
                    <td className="col-hide-mobile" style={{ fontSize: 12, color: '#6B7280' }}>{b.service?.name || '—'}</td>
                    <td className="col-hide-sm" style={{ fontWeight: 700, color: '#B8900A' }}>{formatPrice(b.total_price)}</td>
                    <td><span className={`badge badge-${b.status === 'in_progress' ? 'progress' : b.status}`}>{b.status}</span></td>
                  </tr>
                ))
              }
            </tbody>
          </table>
        </div>
      </div>
      <Toast toasts={toasts} onRemove={removeToast} />
    </AdminLayout>
  )
}
