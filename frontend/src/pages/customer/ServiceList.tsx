import { useEffect, useState } from 'react'
import { Clock, ArrowRight, LogIn } from 'lucide-react'
import { Link } from 'react-router-dom'
import Navbar from '../../components/shared/Navbar'
import BookingModal from './BookingModal'
import { serviceService } from '../../services/serviceService'
import { formatPrice } from '../../utils/formatPrice'
import { useAuth } from '../../context/AuthContext'
import type { Service } from '../../types'

const cats = ['semua', 'mesin', 'kelistrikan', 'bodi', 'ac']

export default function ServiceList() {
  const { user } = useAuth()
  const [services, setServices] = useState<Service[]>([])
  const [filtered, setFiltered] = useState<Service[]>([])
  const [active, setActive] = useState('semua')
  const [isLoading, setIsLoading] = useState(true)
  const [bookingModal, setBookingModal] = useState(false)
  const [selectedServiceId, setSelectedServiceId] = useState<string>('')
  const [successBanner, setSuccessBanner] = useState(false)

  useEffect(() => {
    serviceService.list().then(r => { setServices(r.data); setFiltered(r.data) }).finally(() => setIsLoading(false))
  }, [])

  useEffect(() => {
    setFiltered(active === 'semua' ? services : services.filter(s => s.category === active))
  }, [active, services])

  function openBooking(serviceId: string) {
    setSelectedServiceId(serviceId)
    setBookingModal(true)
  }

  function handleBookingSuccess() {
    setBookingModal(false)
    setSuccessBanner(true)
    setTimeout(() => setSuccessBanner(false), 5000)
  }

  return (
    <div style={{ minHeight: '100vh', background: '#F0F2F5' }}>
      <Navbar />
      <div style={{ maxWidth: 1080, margin: '0 auto', padding: '48px 24px' }}>

        <div style={{ marginBottom: 28 }}>
          <div className="tag-label" style={{ marginBottom: 10 }}>Layanan Bengkel</div>
          <h1 className="page-title" style={{ marginBottom: 6 }}>Semua Layanan</h1>
          <p style={{ fontSize: 13, color: '#6B7280' }}>Pilih layanan yang sesuai dengan kebutuhan kendaraan kamu</p>
        </div>

        {/* Banner sukses booking */}
        {successBanner && (
          <div style={{
            background: '#F0FDF4', border: '1px solid #BBF7D0',
            borderLeft: '4px solid #22C55E', borderRadius: 10,
            padding: '14px 20px', marginBottom: 20,
            display: 'flex', alignItems: 'center', gap: 10,
          }}>
            <ArrowRight size={16} color="#16A34A" />
            <p style={{ fontSize: 13, color: '#15803D', fontWeight: 500 }}>
              Booking berhasil dibuat! Cek statusnya di <Link to="/bookings" style={{ color: '#15803D', fontWeight: 700 }}>Booking Saya</Link>.
            </p>
          </div>
        )}

        {/* Filter */}
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 24 }}>
          {cats.map(c => (
            <button key={c} onClick={() => setActive(c)} style={{
              padding: '5px 16px', fontSize: 12, fontWeight: 600, cursor: 'pointer',
              background: active === c ? '#E8B400' : '#fff',
              color: active === c ? '#1A1916' : '#6B7280',
              border: `1px solid ${active === c ? '#E8B400' : '#E5E7EB'}`,
              borderRadius: 6, textTransform: 'capitalize',
            }}>
              {c}
            </button>
          ))}
        </div>

        {/* Banner untuk tamu */}
        {!user && (
          <div style={{
            background: '#FFFBEB', border: '1px solid #FDE68A', borderLeft: '4px solid #E8B400',
            borderRadius: 10, padding: '14px 18px', marginBottom: 20,
            display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16,
          }}>
            <p style={{ fontSize: 13, color: '#92400E', fontWeight: 500 }}>
              Masuk atau daftar untuk mulai booking layanan servis.
            </p>
            <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
              <Link to="/login" className="btn-secondary" style={{ padding: '6px 14px', fontSize: 12, borderRadius: 6 }}>
                <LogIn size={13} /> Masuk
              </Link>
              <Link to="/register" className="btn-primary" style={{ padding: '6px 14px', fontSize: 12, borderRadius: 6 }}>Daftar</Link>
            </div>
          </div>
        )}

        {/* Grid layanan */}
        {isLoading ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 14 }}>
            {[...Array(6)].map((_, i) => <div key={i} className="card" style={{ height: 180 }} />)}
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 14 }}>
            {filtered.map(s => (
              <div key={s.id} className="card" style={{ padding: '20px', display: 'flex', flexDirection: 'column' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                  <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '.1em', textTransform: 'uppercase', color: '#B8900A', background: '#FFFBEB', padding: '3px 8px', borderRadius: 4 }}>
                    {s.category}
                  </span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: '#9CA3AF', fontSize: 12 }}>
                    <Clock size={12} />{s.duration_minutes} mnt
                  </div>
                </div>
                <h3 style={{ fontSize: 15, fontWeight: 700, color: '#111827', marginBottom: 8 }}>{s.name}</h3>
                <p style={{ fontSize: 13, color: '#6B7280', lineHeight: 1.65, flex: 1, marginBottom: 16 }}>{s.description}</p>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid #F3F4F6', paddingTop: 14 }}>
                  <span style={{ fontSize: 17, fontWeight: 800, color: '#111827' }}>{formatPrice(s.price)}</span>
                  {user ? (
                    <button
                      className="btn-primary"
                      style={{ padding: '6px 14px', fontSize: 11, borderRadius: 5 }}
                      onClick={() => openBooking(String(s.id))}
                    >
                      Booking <ArrowRight size={12} />
                    </button>
                  ) : (
                    <Link to="/login" className="btn-secondary" style={{ padding: '6px 14px', fontSize: 11, borderRadius: 5 }}>
                      Masuk dulu
                    </Link>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal booking */}
      <BookingModal
        open={bookingModal}
        onClose={() => setBookingModal(false)}
        onSuccess={handleBookingSuccess}
        initialServiceId={selectedServiceId}
      />
    </div>
  )
}
