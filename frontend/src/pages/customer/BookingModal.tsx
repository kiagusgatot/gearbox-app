import { useEffect, useState, useCallback } from 'react'
import { Check, Clock, Car, Wrench, AlertCircle, ChevronLeft, ChevronRight } from 'lucide-react'
import Modal from '../../components/shared/Modal'
import ConfirmDialog from '../../components/shared/ConfirmDialog'
import { serviceService } from '../../services/serviceService'
import { vehicleService } from '../../services/vehicleService'
import { bookingService } from '../../services/bookingService'
import { formatPrice } from '../../utils/formatPrice'
import type { Service, Vehicle } from '../../types'
import { format, startOfToday, isBefore, parseISO } from 'date-fns'
import { id as localeId } from 'date-fns/locale'

interface BookingModalProps {
  open: boolean
  onClose: () => void
  onSuccess?: () => void
  initialServiceId?: string
}

const STEPS = ['Layanan', 'Tanggal', 'Kendaraan', 'Konfirmasi']

// ── Stepper ──────────────────────────────────────────────────────────────────
function Stepper({ current }: { current: number }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', padding: '16px 24px', borderBottom: '1px solid #F3F4F6', background: '#FAFAFA' }}>
      {STEPS.map((label, i) => {
        const done   = i < current
        const active = i === current
        return (
          <div key={label} style={{ display: 'flex', alignItems: 'center', flex: i < STEPS.length - 1 ? 1 : 0 }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5 }}>
              <div style={{
                width: 28, height: 28, borderRadius: '50%',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: done ? '#E8B400' : active ? '#111827' : '#F3F4F6',
                border: `2px solid ${done ? '#E8B400' : active ? '#111827' : '#E5E7EB'}`,
                transition: 'all .2s', flexShrink: 0,
              }}>
                {done
                  ? <Check size={13} color="#1A1916" strokeWidth={2.5} />
                  : <span style={{ fontSize: 11, fontWeight: 700, color: active ? '#fff' : '#9CA3AF' }}>{i + 1}</span>
                }
              </div>
              <span style={{ fontSize: 10, fontWeight: 600, letterSpacing: '.06em', textTransform: 'uppercase', color: done ? '#B8900A' : active ? '#111827' : '#9CA3AF', whiteSpace: 'nowrap' }}>
                {label}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <div style={{ flex: 1, height: 2, background: done ? '#E8B400' : '#E5E7EB', margin: '0 8px', marginBottom: 20, transition: 'background .2s' }} />
            )}
          </div>
        )
      })}
    </div>
  )
}

// ── Helpers ──────────────────────────────────────────────────────────────────
function toNum(v: unknown): number {
  const n = Number(v)
  return isNaN(n) ? 0 : n
}

function formatDuration(min: number) {
  const h = Math.floor(min / 60)
  const m = min % 60
  if (h === 0) return `${m} menit`
  if (m === 0) return `${h} jam`
  return `${h} jam ${m} menit`
}

function formatTime(t: string) { return t ? t.slice(0, 5) : '' }

// ── Main ─────────────────────────────────────────────────────────────────────
export default function BookingModal({ open, onClose, onSuccess, initialServiceId }: BookingModalProps) {
  const [services, setServices] = useState<Service[]>([])
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [step, setStep]         = useState(0)

  const [selServices, setSelServices] = useState<number[]>(initialServiceId ? [+initialServiceId] : [])
  const [selDate, setSelDate]         = useState('')
  const [selVehicle, setSelVehicle]   = useState('')
  const [notes, setNotes]             = useState('')

  const [calendarDays, setCalendarDays] = useState<{
    date: string; queue_count: number; is_available: boolean;
    next_slot: { bay: number; start: string; end: string } | null
  }[]>([])
  const [availability, setAvailability] = useState<{
    next_slot: { bay: number; start: string; end: string } | null;
    capacity: { queue_count: number }
  } | null>(null)
  const [calendarLoading, setCalendarLoading] = useState(false)
  const [availLoading, setAvailLoading]       = useState(false)
  const [calendarMonth, setCalendarMonth]     = useState(new Date())

  const [submitting, setSubmitting] = useState(false)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [noVehicle, setNoVehicle]   = useState(false)

  // Fix NaN: cast semua nilai numerik dari API
  const selectedServices = services.filter(s => selServices.includes(s.id))
  const totalDuration = selectedServices.reduce((sum, s) => sum + toNum(s.duration_minutes), 0)
  const totalPrice    = selectedServices.reduce((sum, s) => sum + toNum(s.price), 0)
  const selVehicleObj = vehicles.find(v => v.id === +selVehicle)
  const slotInfo      = availability?.next_slot

  function resetAll() {
    setStep(0)
    setSelServices(initialServiceId ? [+initialServiceId] : [])
    setSelDate('')
    setSelVehicle('')
    setNotes('')
    setAvailability(null)
    setCalendarDays([])
    setConfirmOpen(false)
    setCalendarMonth(new Date())
  }

  useEffect(() => {
    if (!open) return
    resetAll()
    serviceService.list().then(r => setServices(r.data))
    vehicleService.list().then(r => {
      setVehicles(r.data)
      setNoVehicle(r.data.length === 0)
    })
  }, [open, initialServiceId])

  // Load kalender saat step 1
  const loadCalendar = useCallback(async () => {
    if (selServices.length === 0) return
    setCalendarLoading(true)
    try {
      const from = format(new Date(calendarMonth.getFullYear(), calendarMonth.getMonth(), 1), 'yyyy-MM-dd')
      const to   = format(new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() + 1, 0), 'yyyy-MM-dd')
      const data = await bookingService.getCalendar(selServices, from, to)
      setCalendarDays(data)
    } catch (e) {
      console.error('Calendar error:', e)
    } finally { setCalendarLoading(false) }
  }, [selServices, calendarMonth])

  useEffect(() => {
    if (step === 1) loadCalendar()
  }, [step, loadCalendar])

  // Cek availability saat tanggal dipilih
  useEffect(() => {
    if (!selDate || selServices.length === 0) return
    setAvailability(null)
    setAvailLoading(true)
    bookingService.checkAvailability(selServices, selDate)
      .then(data => setAvailability(data))
      .catch(e => { console.error('Availability error:', e); setAvailability(null) })
      .finally(() => setAvailLoading(false))
  }, [selDate])

  function toggleService(id: number) {
    setSelServices(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])
    setSelDate('')
    setAvailability(null)
  }

  function canProceed() {
    if (step === 0) return selServices.length > 0
    if (step === 1) return !!selDate && !!slotInfo
    if (step === 2) return !!selVehicle
    return true
  }

  async function handleConfirm() {
    setSubmitting(true)
    try {
      await bookingService.create({ vehicle_id: +selVehicle, service_ids: selServices, date: selDate, notes })
      setConfirmOpen(false)
      onClose()
      onSuccess?.()
    } finally { setSubmitting(false) }
  }

  const today = startOfToday()

  function getDaysInMonth() {
    const year  = calendarMonth.getFullYear()
    const month = calendarMonth.getMonth()
    const first = new Date(year, month, 1).getDay()
    const days  = new Date(year, month + 1, 0).getDate()
    return { first: first === 0 ? 6 : first - 1, days }
  }

  function getDateInfo(day: number) {
    const dateStr = format(new Date(calendarMonth.getFullYear(), calendarMonth.getMonth(), day), 'yyyy-MM-dd')
    return calendarDays.find(d => d.date === dateStr)
  }

  const selCard: React.CSSProperties = { background: '#FFFBEB', border: '2px solid #E8B400', cursor: 'pointer', transition: 'all .15s', borderRadius: 8 }
  const defCard: React.CSSProperties = { background: '#fff', border: '1px solid #E5E7EB', cursor: 'pointer', transition: 'all .15s', borderRadius: 8 }

  return (
    <>
      <Modal open={open} onClose={onClose} title="Buat Booking Servis" width={640}>
        <div style={{ margin: '-22px -24px 0', overflow: 'hidden' }}>
          <Stepper current={step} />
        </div>

        {noVehicle ? (
          <div style={{ textAlign: 'center', padding: '28px 0 8px' }}>
            <Car size={32} color="#E8B400" style={{ margin: '0 auto 14px' }} />
            <p style={{ fontSize: 14, fontWeight: 600, color: '#111827', marginBottom: 6 }}>Belum ada kendaraan</p>
            <p style={{ fontSize: 13, color: '#6B7280', marginBottom: 20, lineHeight: 1.6 }}>Daftarkan minimal satu kendaraan sebelum melakukan booking.</p>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
              <button className="btn-secondary" onClick={onClose}>Nanti saja</button>
              <a href="/vehicles?new=1" className="btn-primary" style={{ borderRadius: 7 }}>Tambah Kendaraan</a>
            </div>
          </div>
        ) : (
          <>
            <div style={{ minHeight: 300, paddingTop: 20 }}>

              {/* ── Step 0: Multi-select layanan ── */}
              {step === 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <p style={{ fontSize: 12, color: '#9CA3AF', fontWeight: 500 }}>Pilih satu atau lebih layanan yang ingin dikerjakan dalam satu kunjungan</p>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                    {services.map(s => {
                      const selected = selServices.includes(s.id)
                      return (
                        <button key={s.id} type="button" onClick={() => toggleService(s.id)}
                          style={{ ...(selected ? selCard : defCard), padding: '12px 14px', textAlign: 'left', position: 'relative' }}>
                          {selected && (
                            <div style={{ position: 'absolute', top: 8, right: 8, width: 18, height: 18, background: '#E8B400', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                              <Check size={11} color="#1A1916" strokeWidth={2.5} />
                            </div>
                          )}
                          <div style={{ fontSize: 13, fontWeight: 600, color: '#111827', marginBottom: 4, paddingRight: 20 }}>{s.name}</div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <span style={{ fontSize: 13, fontWeight: 700, color: '#B8900A' }}>{formatPrice(toNum(s.price))}</span>
                            <span style={{ fontSize: 11, color: '#9CA3AF', display: 'flex', alignItems: 'center', gap: 3 }}>
                              <Clock size={10} />{toNum(s.duration_minutes)} mnt
                            </span>
                          </div>
                        </button>
                      )
                    })}
                  </div>

                  {/* Summary bar — fix NaN */}
                  {selServices.length > 0 && (
                    <div style={{ background: '#F9FAFB', border: '1px solid #E5E7EB', borderRadius: 8, padding: '12px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                        <div style={{ fontSize: 12, color: '#6B7280' }}>
                          <strong style={{ color: '#111827' }}>{selServices.length}</strong> layanan dipilih
                        </div>
                        <div style={{ fontSize: 12, color: '#6B7280', display: 'flex', alignItems: 'center', gap: 4 }}>
                          <Clock size={12} color="#9CA3AF" />
                          Estimasi <strong style={{ color: '#111827' }}>{formatDuration(totalDuration)}</strong>
                        </div>
                      </div>
                      <div style={{ fontSize: 16, fontWeight: 800, color: '#B8900A' }}>
                        {formatPrice(totalPrice)}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* ── Step 1: Pilih tanggal ── */}
              {step === 1 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  {/* Summary layanan terpilih */}
                  <div style={{ background: '#F9FAFB', borderRadius: 8, padding: '10px 14px', display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
                    {selectedServices.map(s => (
                      <div key={s.id} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12 }}>
                        <Wrench size={11} color="#B8900A" />
                        <span style={{ fontWeight: 500, color: '#374151' }}>{s.name}</span>
                      </div>
                    ))}
                    <span style={{ fontSize: 12, color: '#9CA3AF', marginLeft: 'auto' }}>Total {formatDuration(totalDuration)}</span>
                  </div>

                  {/* Kalender */}
                  <div style={{ border: '1px solid #E5E7EB', borderRadius: 8, overflow: 'hidden' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', background: '#F9FAFB', borderBottom: '1px solid #F3F4F6' }}>
                      <button type="button" onClick={() => setCalendarMonth(m => new Date(m.getFullYear(), m.getMonth() - 1))}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6B7280', display: 'flex' }}>
                        <ChevronLeft size={16} />
                      </button>
                      <span style={{ fontSize: 13, fontWeight: 600, color: '#111827' }}>
                        {format(calendarMonth, 'MMMM yyyy', { locale: localeId })}
                      </span>
                      <button type="button" onClick={() => setCalendarMonth(m => new Date(m.getFullYear(), m.getMonth() + 1))}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6B7280', display: 'flex' }}>
                        <ChevronRight size={16} />
                      </button>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', background: '#F9FAFB', borderBottom: '1px solid #F3F4F6' }}>
                      {['Sen','Sel','Rab','Kam','Jum','Sab','Min'].map(d => (
                        <div key={d} style={{ textAlign: 'center', padding: '6px 0', fontSize: 10, fontWeight: 600, color: '#9CA3AF' }}>{d}</div>
                      ))}
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', padding: '8px' }}>
                      {Array(getDaysInMonth().first).fill(null).map((_, i) => <div key={`e-${i}`} />)}
                      {Array(getDaysInMonth().days).fill(null).map((_, i) => {
                        const day     = i + 1
                        const dateStr = format(new Date(calendarMonth.getFullYear(), calendarMonth.getMonth(), day), 'yyyy-MM-dd')
                        const info    = getDateInfo(day)
                        const isPast  = isBefore(parseISO(dateStr), today)
                        const isSel   = selDate === dateStr
                        const avail   = !isPast && (calendarLoading ? true : (info?.is_available ?? true))
                        const qCount  = info?.queue_count ?? 0

                        return (
                          <button key={day} type="button"
                            disabled={isPast || (!calendarLoading && !avail)}
                            onClick={() => { setSelDate(dateStr); setAvailability(null) }}
                            style={{
                              margin: 2, padding: '6px 2px', borderRadius: 7,
                              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3,
                              cursor: isPast || (!calendarLoading && !avail) ? 'not-allowed' : 'pointer',
                              background: isSel ? '#111827' : 'transparent',
                              border: `2px solid ${isSel ? '#111827' : 'transparent'}`,
                              opacity: isPast ? 0.3 : 1,
                              transition: 'all .15s',
                            }}>
                            <span style={{ fontSize: 13, fontWeight: isSel ? 700 : 500, color: isSel ? '#fff' : '#111827' }}>{day}</span>
                            {!isPast && !calendarLoading && info && (
                              <div style={{ width: 5, height: 5, borderRadius: '50%', background: !avail ? '#FCA5A5' : qCount >= 4 ? '#FCD34D' : '#86EFAC' }} />
                            )}
                          </button>
                        )
                      })}
                    </div>
                    <div style={{ borderTop: '1px solid #F3F4F6', padding: '8px 16px', display: 'flex', gap: 16, justifyContent: 'center' }}>
                      {[{ color: '#86EFAC', label: 'Tersedia' }, { color: '#FCD34D', label: 'Mulai penuh' }, { color: '#FCA5A5', label: 'Penuh' }].map(({ color, label }) => (
                        <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 10, color: '#9CA3AF' }}>
                          <div style={{ width: 6, height: 6, borderRadius: '50%', background: color }} />
                          {label}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Info slot */}
                  {selDate && (
                    <div style={{ background: availLoading ? '#F9FAFB' : slotInfo ? '#F0FDF4' : '#FEF2F2', border: `1px solid ${availLoading ? '#E5E7EB' : slotInfo ? '#BBF7D0' : '#FECACA'}`, borderRadius: 8, padding: '12px 16px' }}>
                      {availLoading ? (
                        <p style={{ fontSize: 13, color: '#9CA3AF' }}>Mengecek ketersediaan...</p>
                      ) : !availability ? (
                        <p style={{ fontSize: 13, color: '#9CA3AF' }}>Tidak dapat mengecek ketersediaan.</p>
                      ) : slotInfo ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <Check size={14} color="#16A34A" />
                            <span style={{ fontSize: 13, fontWeight: 600, color: '#15803D' }}>
                              Slot tersedia — {format(parseISO(selDate), 'EEEE, d MMMM yyyy', { locale: localeId })}
                            </span>
                          </div>
                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 8 }}>
                            {[
                              { label: 'Bay', value: `Bay ${slotInfo.bay}` },
                              { label: 'Jam Masuk', value: formatTime(slotInfo.start) },
                              { label: 'Est. Selesai', value: formatTime(slotInfo.end) },
                            ].map(({ label, value }) => (
                              <div key={label} style={{ background: '#fff', borderRadius: 6, padding: '8px 10px', textAlign: 'center' }}>
                                <div style={{ fontSize: 14, fontWeight: 700, color: '#111827' }}>{value}</div>
                                <div style={{ fontSize: 10, color: '#9CA3AF', marginTop: 2 }}>{label}</div>
                              </div>
                            ))}
                          </div>
                          <p style={{ fontSize: 11, color: '#6B7280' }}>
                            Antrean hari ini: <strong>{availability.capacity.queue_count}</strong> kendaraan
                          </p>
                        </div>
                      ) : (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <AlertCircle size={16} color="#DC2626" />
                          <span style={{ fontSize: 13, color: '#DC2626', fontWeight: 500 }}>Kapasitas penuh untuk tanggal ini. Pilih tanggal lain.</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* ── Step 2: Pilih kendaraan ── */}
              {step === 2 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <p style={{ fontSize: 12, color: '#9CA3AF', fontWeight: 500 }}>Pilih kendaraan yang akan diservis</p>
                  {vehicles.map(v => (
                    <button key={v.id} type="button" onClick={() => setSelVehicle(String(v.id))}
                      style={{ ...(selVehicle === String(v.id) ? selCard : defCard), padding: '12px 16px', textAlign: 'left', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <div style={{ width: 36, height: 36, background: '#F9FAFB', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <Car size={16} color="#9CA3AF" />
                        </div>
                        <div>
                          <div style={{ fontSize: 13, fontWeight: 600, color: '#111827' }}>{v.brand} {v.model} {v.year}</div>
                          <div style={{ fontSize: 11, color: '#9CA3AF', marginTop: 2 }}>{v.plate_number} · {v.type}</div>
                        </div>
                      </div>
                      {selVehicle === String(v.id) && (
                        <div style={{ width: 20, height: 20, background: '#E8B400', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          <Check size={11} color="#1A1916" strokeWidth={2.5} />
                        </div>
                      )}
                    </button>
                  ))}
                  <div style={{ marginTop: 4 }}>
                    <label className="label">Catatan untuk mekanik <span style={{ color: '#9CA3AF', fontWeight: 400, textTransform: 'none', letterSpacing: 0 }}>(opsional)</span></label>
                    <textarea className="input" style={{ resize: 'none' }} rows={3}
                      placeholder="Contoh: AC kurang dingin, bunyi kasar di RPM tinggi..."
                      value={notes} onChange={e => setNotes(e.target.value)}
                    />
                  </div>
                </div>
              )}

              {/* ── Step 3: Ringkasan ── */}
              {step === 3 && slotInfo && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <p style={{ fontSize: 12, color: '#9CA3AF', fontWeight: 500 }}>Pastikan semua detail sudah benar sebelum konfirmasi</p>

                  {/* Antrian card */}
                  <div style={{ background: '#111827', borderRadius: 10, padding: '16px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div>
                      <p style={{ fontSize: 10, fontWeight: 600, color: '#9CA3AF', letterSpacing: '.1em', textTransform: 'uppercase', marginBottom: 4 }}>Nomor Antrian</p>
                      <p style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 18, fontWeight: 700, color: '#E8B400' }}>
                        GBX-{format(parseISO(selDate), 'ddMMyy')}-???
                      </p>
                      <p style={{ fontSize: 10, color: '#6B7280', marginTop: 3 }}>Ditetapkan setelah konfirmasi</p>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <p style={{ fontSize: 10, fontWeight: 600, color: '#9CA3AF', letterSpacing: '.1em', textTransform: 'uppercase', marginBottom: 4 }}>Bay</p>
                      <p style={{ fontSize: 28, fontWeight: 800, color: '#fff' }}>{slotInfo.bay}</p>
                    </div>
                  </div>

                  {/* Detail grid */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                    {[
                      { label: 'Tanggal', value: format(parseISO(selDate), 'EEEE, d MMMM', { locale: localeId }) },
                      { label: 'Jam Masuk', value: formatTime(slotInfo.start) },
                      { label: 'Est. Selesai', value: formatTime(slotInfo.end) },
                      { label: 'Total Durasi', value: formatDuration(totalDuration) },
                      { label: 'Kendaraan', value: selVehicleObj ? `${selVehicleObj.brand} ${selVehicleObj.model}` : '' },
                      { label: 'Plat Nomor', value: selVehicleObj?.plate_number || '' },
                    ].map(({ label, value }) => (
                      <div key={label} style={{ background: '#F9FAFB', borderRadius: 8, padding: '10px 14px' }}>
                        <p style={{ fontSize: 10, color: '#9CA3AF', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 3 }}>{label}</p>
                        <p style={{ fontSize: 13, fontWeight: 600, color: '#111827' }}>{value}</p>
                      </div>
                    ))}
                  </div>

                  {/* Layanan */}
                  <div style={{ background: '#F9FAFB', borderRadius: 8, padding: '12px 14px' }}>
                    <p style={{ fontSize: 10, color: '#9CA3AF', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 8 }}>Layanan</p>
                    {selectedServices.map(s => (
                      <div key={s.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 5 }}>
                        <span style={{ color: '#374151' }}>{s.name} <span style={{ color: '#9CA3AF', fontSize: 11 }}>({toNum(s.duration_minutes)} mnt)</span></span>
                        <span style={{ fontWeight: 600, color: '#374151' }}>{formatPrice(toNum(s.price))}</span>
                      </div>
                    ))}
                    <div style={{ borderTop: '1px solid #E5E7EB', paddingTop: 8, marginTop: 4, display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ fontSize: 13, fontWeight: 600, color: '#111827' }}>Total</span>
                      <span style={{ fontSize: 16, fontWeight: 800, color: '#B8900A' }}>{formatPrice(totalPrice)}</span>
                    </div>
                  </div>

                  {notes && (
                    <div style={{ background: '#F9FAFB', borderRadius: 8, padding: '10px 14px' }}>
                      <p style={{ fontSize: 10, color: '#9CA3AF', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 4 }}>Catatan</p>
                      <p style={{ fontSize: 13, color: '#374151' }}>{notes}</p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Footer */}
            <div style={{ borderTop: '1px solid #F3F4F6', paddingTop: 16, marginTop: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                {step > 0 && (
                  <button className="btn-secondary" onClick={() => setStep(s => s - 1)} style={{ borderRadius: 7 }}>← Kembali</button>
                )}
              </div>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <span style={{ fontSize: 12, color: '#9CA3AF' }}>{step + 1} dari {STEPS.length}</span>
                {step === STEPS.length - 1 ? (
                  <button className="btn-primary" style={{ borderRadius: 7 }} onClick={() => setConfirmOpen(true)}>Buat Booking</button>
                ) : (
                  <button className="btn-primary" style={{ borderRadius: 7 }} disabled={!canProceed()} onClick={() => setStep(s => s + 1)}>Lanjut →</button>
                )}
              </div>
            </div>
          </>
        )}
      </Modal>

      <ConfirmDialog
        open={confirmOpen} onClose={() => setConfirmOpen(false)} onConfirm={handleConfirm}
        variant="info" title="Konfirmasi Booking"
        description="Booking akan diproses dan nomor antrian akan diberikan setelah konfirmasi."
        confirmLabel="Ya, Buat Booking" loading={submitting}
      />
    </>
  )
}
