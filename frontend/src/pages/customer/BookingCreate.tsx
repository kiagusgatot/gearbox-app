import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams, Link } from 'react-router-dom'
import { CheckCircle, Car, ArrowRight } from 'lucide-react'
import Navbar from '../../components/shared/Navbar'
import { serviceService } from '../../services/serviceService'
import { vehicleService } from '../../services/vehicleService'
import { bookingService } from '../../services/bookingService'
import { formatPrice } from '../../utils/formatPrice'
import { formatDate } from '../../utils/formatDate'
import type { Service, ServiceSchedule, Vehicle } from '../../types'

export default function BookingCreate() {
  const [params] = useSearchParams()
  const navigate = useNavigate()

  const [services, setServices] = useState<Service[]>([])
  const [schedules, setSchedules] = useState<ServiceSchedule[]>([])
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [vehiclesLoading, setVehiclesLoading] = useState(true)
  const [hasVehicles, setHasVehicles] = useState<boolean | null>(null)

  const [selService, setSelService] = useState(params.get('service') || '')
  const [selSchedule, setSelSchedule] = useState('')
  const [selVehicle, setSelVehicle] = useState('')
  const [notes, setNotes] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    // Cek kendaraan dulu sebelum load yang lain
    vehicleService.list().then(r => {
      setVehicles(r.data)
      setHasVehicles(r.data.length > 0)
    }).finally(() => setVehiclesLoading(false))

    serviceService.list().then(r => setServices(r.data))
  }, [])

  useEffect(() => {
    if (!selService) { setSchedules([]); return }
    serviceService.getSchedules(+selService).then(r => setSchedules(r.data))
  }, [selService])

  const cSvc = services.find(s => s.id === +selService)
  const cSch = schedules.find(s => s.id === +selSchedule)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    try {
      await bookingService.create({
        vehicle_id: +selVehicle,
        service_ids: [+selService],
        date: cSch?.date || '',
        notes
      })
      setSuccess(true)
    } finally { setSubmitting(false) }
  }

  // Loading state
  if (vehiclesLoading) {
    return (
      <div style={{ minHeight: '100vh', background: '#F0F2F5' }}>
        <Navbar />
        <div style={{ maxWidth: 680, margin: '0 auto', padding: '80px 24px', textAlign: 'center' }}>
          <p style={{ fontSize: 13, color: '#9CA3AF' }}>Memuat...</p>
        </div>
      </div>
    )
  }

  // Guard: belum punya kendaraan
  if (hasVehicles === false) {
    return (
      <div style={{ minHeight: '100vh', background: '#F0F2F5' }}>
        <Navbar />
        <div style={{ maxWidth: 520, margin: '0 auto', padding: '80px 24px', textAlign: 'center' }}>
          <div style={{
            width: 56, height: 56, background: '#FFFBEB', borderRadius: 14,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 20px', border: '1px solid #FDE68A',
          }}>
            <Car size={26} color="#B8900A" strokeWidth={1.8} />
          </div>
          <h2 style={{ fontFamily: "'Barlow Condensed',sans-serif", fontSize: 26, fontWeight: 800, textTransform: 'uppercase', color: '#111827', marginBottom: 10 }}>
            Daftarkan Kendaraan Dulu
          </h2>
          <p style={{ fontSize: 14, color: '#6B7280', lineHeight: 1.7, marginBottom: 28, maxWidth: 380, margin: '0 auto 28px' }}>
            Kamu perlu mendaftarkan minimal satu kendaraan sebelum bisa melakukan booking servis.
          </p>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
            <Link to="/vehicles?new=1" className="btn-primary" style={{ padding: '10px 24px', borderRadius: 7 }}>
              <Car size={15} /> Daftarkan Kendaraan <ArrowRight size={14} />
            </Link>
            <button onClick={() => navigate(-1)} className="btn-secondary" style={{ padding: '9px 20px', borderRadius: 7 }}>
              Kembali
            </button>
          </div>
        </div>
      </div>
    )
  }

  // Success state
  if (success) return (
    <div style={{ minHeight: '100vh', background: '#F0F2F5' }}>
      <Navbar />
      <div style={{ maxWidth: 480, margin: '0 auto', padding: '80px 24px', textAlign: 'center' }}>
        <div style={{ width: 52, height: 52, background: '#D1FAE5', borderRadius: 999, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
          <CheckCircle size={26} color="#065F46" />
        </div>
        <h2 style={{ fontFamily: "'Barlow Condensed',sans-serif", fontSize: 30, fontWeight: 800, textTransform: 'uppercase', color: '#111827', marginBottom: 8 }}>
          Booking Berhasil
        </h2>
        <p style={{ fontSize: 14, color: '#6B7280', marginBottom: 24, lineHeight: 1.7 }}>
          Booking kamu sudah diterima dan menunggu konfirmasi dari admin.
        </p>
        <button className="btn-primary" style={{ padding: '10px 24px', borderRadius: 7 }} onClick={() => navigate('/bookings')}>
          Lihat Booking Saya
        </button>
      </div>
    </div>
  )

  const sel = { background: '#FFFBEB', border: '1px solid #FDE68A', cursor: 'pointer', transition: 'all .15s' as const }
  const def = { background: '#fff', border: '1px solid #E5E7EB', cursor: 'pointer', transition: 'all .15s' as const }
  const stepN = { display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 20, height: 20, background: '#E8B400', color: '#1A1916', fontSize: 11, fontWeight: 700, borderRadius: 5, marginRight: 8, flexShrink: 0 as const }
  const stepT = { fontSize: 11, fontWeight: 600, color: '#9CA3AF', textTransform: 'uppercase' as const, letterSpacing: '.08em', marginBottom: 14, display: 'flex', alignItems: 'center' }

  return (
    <div style={{ minHeight: '100vh', background: '#F0F2F5' }}>
      <Navbar />
      <div style={{ maxWidth: 680, margin: '0 auto', padding: '48px 24px' }}>
        <div style={{ marginBottom: 28 }}>
          <div className="tag-label" style={{ marginBottom: 10 }}>Buat Booking</div>
          <h1 className="page-title" style={{ marginBottom: 5 }}>Jadwalkan Servis</h1>
          <p style={{ fontSize: 13, color: '#6B7280' }}>Pilih layanan, jadwal, dan kendaraan untuk lanjut</p>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {/* Step 1: Layanan */}
          <div className="card" style={{ padding: 22 }}>
            <div style={stepT}><span style={stepN}>1</span>Pilih Layanan</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              {services.map(s => (
                <button key={s.id} type="button"
                  onClick={() => { setSelService(String(s.id)); setSelSchedule('') }}
                  style={{ ...(selService === String(s.id) ? sel : def), padding: '12px 14px', textAlign: 'left', borderRadius: 8 }}>
                  <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontSize: 15, fontWeight: 700, textTransform: 'uppercase', color: '#111827', marginBottom: 3 }}>{s.name}</div>
                  <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontSize: 15, fontWeight: 800, color: '#B8900A' }}>{formatPrice(s.price)}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Step 2: Jadwal */}
          {selService && (
            <div className="card" style={{ padding: 22 }}>
              <div style={stepT}><span style={stepN}>2</span>Pilih Jadwal</div>
              {schedules.length === 0
                ? <p style={{ fontSize: 13, color: '#9CA3AF' }}>Tidak ada jadwal tersedia untuk layanan ini.</p>
                : <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {schedules.map(s => (
                    <button key={s.id} type="button"
                      onClick={() => setSelSchedule(String(s.id))}
                      style={{ ...(selSchedule === String(s.id) ? sel : def), padding: '11px 14px', textAlign: 'left', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderRadius: 8 }}>
                      <span style={{ fontFamily: "'Barlow Condensed',sans-serif", fontSize: 14, fontWeight: 700, textTransform: 'uppercase', color: '#111827' }}>{formatDate(s.date)}</span>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 12, color: '#6B7280' }}>{s.start_time} – {s.end_time}</div>
                        <div style={{ fontSize: 11, color: '#9CA3AF', marginTop: 1 }}>Sisa: {s.capacity - s.booked_count} slot</div>
                      </div>
                    </button>
                  ))}
                </div>
              }
            </div>
          )}

          {/* Step 3: Kendaraan */}
          {selSchedule && (
            <div className="card" style={{ padding: 22 }}>
              <div style={stepT}><span style={stepN}>3</span>Pilih Kendaraan</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {vehicles.map(v => (
                  <button key={v.id} type="button"
                    onClick={() => setSelVehicle(String(v.id))}
                    style={{ ...(selVehicle === String(v.id) ? sel : def), padding: '11px 14px', textAlign: 'left', borderRadius: 8 }}>
                    <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontSize: 14, fontWeight: 700, textTransform: 'uppercase', color: '#111827' }}>{v.brand} {v.model} {v.year}</div>
                    <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 11, color: '#9CA3AF', marginTop: 2 }}>{v.plate_number}</div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Step 4: Catatan */}
          {selVehicle && (
            <div className="card" style={{ padding: 22 }}>
              <div style={stepT}><span style={stepN}>4</span>Catatan (opsional)</div>
              <textarea className="input" style={{ resize: 'none' }} rows={3}
                placeholder="Keluhan atau catatan untuk mekanik..."
                value={notes} onChange={e => setNotes(e.target.value)} />
            </div>
          )}

          {/* Ringkasan */}
          {cSvc && cSch && selVehicle && (
            <div className="card" style={{ padding: 22, borderTop: '3px solid #E8B400' }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: 14 }}>
                Ringkasan Booking
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, fontSize: 13, marginBottom: 18 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#9CA3AF' }}>Layanan</span>
                  <span style={{ fontWeight: 500, color: '#111827' }}>{cSvc.name}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#9CA3AF' }}>Jadwal</span>
                  <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 12, color: '#6B7280' }}>{formatDate(cSch.date)} · {cSch.start_time}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: 10, borderTop: '1px solid #F3F4F6' }}>
                  <span style={{ fontWeight: 500, color: '#6B7280' }}>Total</span>
                  <span style={{ fontFamily: "'Barlow Condensed',sans-serif", fontSize: 22, fontWeight: 800, color: '#111827' }}>{formatPrice(cSvc.price)}</span>
                </div>
              </div>
              <button type="submit" className="btn-primary"
                style={{ width: '100%', justifyContent: 'center', padding: '11px 20px', borderRadius: 7 }}
                disabled={submitting}>
                {submitting ? 'Memproses...' : 'Konfirmasi Booking'}
              </button>
            </div>
          )}
        </form>
      </div>
    </div>
  )
}
