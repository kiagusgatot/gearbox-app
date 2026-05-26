import { useEffect, useState, useRef } from 'react'
import { Search, Users, Car, CalendarCheck, ChevronRight, X } from 'lucide-react'
import AdminLayout from '../../components/shared/AdminLayout'
import Modal from '../../components/shared/Modal'
import api from '../../services/api'
import { formatDate } from '../../utils/formatDate'
import { formatPrice } from '../../utils/formatPrice'

interface Customer {
  id: number
  name: string
  email: string
  phone?: string
  created_at: string
  bookings_count: number
  vehicles: { id: number; plate_number: string; brand: string; model: string; type: string }[]
  bookings: { id: number; booking_code: string; status: string; total_price: number; service?: { name: string }; schedule?: { date: string } }[]
}

interface CustomerDetail extends Customer {
  vehicles: (Customer['vehicles'][0] & { documents: { type: string; status: string }[] })[]
}

const statusLabel: Record<string, string> = {
  pending: 'Menunggu', confirmed: 'Dikonfirmasi',
  in_progress: 'Diproses', completed: 'Selesai', cancelled: 'Dibatalkan',
}

const statusBadgeClass: Record<string, string> = {
  pending: 'badge-pending', confirmed: 'badge-confirmed',
  in_progress: 'badge-progress', completed: 'badge-completed', cancelled: 'badge-cancelled',
}

export default function AdminCustomers() {
  const [customers, setCustomers]         = useState<Customer[]>([])
  const [total, setTotal]                 = useState(0)
  const [isLoading, setIsLoading]         = useState(true)
  const [search, setSearch]               = useState('')
  const [debouncedSearch, setDebounced]   = useState('')
  const [selected, setSelected]           = useState<CustomerDetail | null>(null)
  const [detailLoading, setDetailLoading] = useState(false)
  const debounceRef = useRef<ReturnType<typeof setTimeout>>()

  useEffect(() => {
    clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => setDebounced(search), 400)
    return () => clearTimeout(debounceRef.current)
  }, [search])

  useEffect(() => { load() }, [debouncedSearch])

  async function load() {
    setIsLoading(true)
    try {
      const params = debouncedSearch ? { search: debouncedSearch } : {}
      const res = await api.get('/admin/customers', { params })
      setCustomers(res.data.data || [])
      setTotal(res.data.total || 0)
    } finally { setIsLoading(false) }
  }

  async function openDetail(id: number) {
    setDetailLoading(true)
    try {
      const res = await api.get(`/admin/customers/${id}`)
      setSelected(res.data)
    } finally { setDetailLoading(false) }
  }

  function getInitials(name: string) {
    return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
  }

  return (
    <AdminLayout>
      <div className="page-header">
        <div>
          <div className="page-eyebrow">Data</div>
          <h1 className="page-title">Pelanggan</h1>
        </div>
        {!isLoading && (
          <div style={{
            background: '#fff', border: '1px solid #E5E7EB', borderRadius: 10,
            padding: '14px 20px', minWidth: 150, textAlign: 'center',
          }}>
            <div style={{ fontSize: 28, fontWeight: 800, color: '#111827', lineHeight: 1 }}>{total}</div>
            <div style={{ fontSize: 12, fontWeight: 500, color: '#6B7280', marginTop: 4 }}>Total Pelanggan</div>
            <div style={{ fontSize: 10, color: '#9CA3AF', marginTop: 1 }}>terdaftar</div>
          </div>
        )}
      </div>

      {/* Search */}
      <div style={{ position: 'relative', marginBottom: 20, maxWidth: 400 }}>
        <Search size={15} color="#9CA3AF" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)' }} />
        <input
          className="input"
          style={{ paddingLeft: 36, paddingRight: search ? 36 : 12, borderRadius: 8 }}
          placeholder="Cari nama, email, atau no. HP..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        {search && (
          <button onClick={() => setSearch('')} style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#9CA3AF', display: 'flex', alignItems: 'center' }}>
            <X size={14} />
          </button>
        )}
      </div>

      {/* Tabel */}
      <div className="card" style={{ overflow: 'hidden' }}>
        {isLoading ? (
          <div style={{ padding: '48px 0', textAlign: 'center', color: '#9CA3AF', fontSize: 13 }}>Memuat...</div>
        ) : customers.length === 0 ? (
          <div style={{ padding: '48px 0', textAlign: 'center' }}>
            <Users size={32} color="#E8B400" style={{ margin: '0 auto 12px' }} />
            <p style={{ fontSize: 14, fontWeight: 600, color: '#111827', marginBottom: 4 }}>
              {debouncedSearch ? 'Pelanggan tidak ditemukan' : 'Belum ada pelanggan'}
            </p>
            <p style={{ fontSize: 13, color: '#9CA3AF' }}>
              {debouncedSearch ? `Tidak ada hasil untuk "${debouncedSearch}"` : 'Pelanggan yang mendaftar akan muncul di sini'}
            </p>
          </div>
        ) : (
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Pelanggan</th>
                  <th className="col-hide-mobile">Kontak</th>
                  <th className="col-hide-mobile">Kendaraan</th>
                  <th>Total Booking</th>
                  <th className="col-hide-mobile">Bergabung</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {customers.map(c => (
                  <tr key={c.id} style={{ cursor: 'pointer' }} onClick={() => openDetail(c.id)}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{
                          width: 34, height: 34, borderRadius: '50%',
                          background: '#FFFBEB', border: '1px solid #FDE68A',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: 12, fontWeight: 700, color: '#B8900A', flexShrink: 0,
                        }}>
                          {getInitials(c.name)}
                        </div>
                        <span style={{ fontWeight: 600, color: '#111827', fontSize: 13 }}>{c.name}</span>
                      </div>
                    </td>
                    <td className="col-hide-mobile">
                      <div style={{ fontSize: 12, color: '#6B7280' }}>{c.email}</div>
                      {c.phone && <div style={{ fontSize: 11, color: '#9CA3AF', marginTop: 1 }}>{c.phone}</div>}
                    </td>
                    <td className="col-hide-mobile">
                      {c.vehicles.length === 0 ? (
                        <span style={{ fontSize: 12, color: '#D1D5DB' }}>—</span>
                      ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                          {c.vehicles.slice(0, 2).map(v => (
                            <div key={v.id} style={{ fontSize: 11, color: '#6B7280' }}>
                              {v.brand} {v.model} <span style={{ color: '#9CA3AF' }}>· {v.plate_number}</span>
                            </div>
                          ))}
                          {c.vehicles.length > 2 && (
                            <div style={{ fontSize: 11, color: '#9CA3AF' }}>+{c.vehicles.length - 2} lainnya</div>
                          )}
                        </div>
                      )}
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <div style={{ fontSize: 18, fontWeight: 800, color: c.bookings_count > 0 ? '#111827' : '#D1D5DB' }}>
                          {c.bookings_count}
                        </div>
                        <span style={{ fontSize: 11, color: '#9CA3AF' }}>booking</span>
                      </div>
                    </td>
                    <td className="col-hide-mobile" style={{ fontSize: 12, color: '#9CA3AF' }}>{formatDate(c.created_at)}</td>
                    <td><ChevronRight size={16} color="#9CA3AF" /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal Detail */}
      <Modal
        open={!!selected || detailLoading}
        onClose={() => setSelected(null)}
        title="Detail Pelanggan"
        width={560}
      >
        {detailLoading ? (
          <div style={{ padding: '32px 0', textAlign: 'center', color: '#9CA3AF', fontSize: 13 }}>Memuat...</div>
        ) : selected ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <div style={{ width: 48, height: 48, borderRadius: '50%', background: '#FFFBEB', border: '2px solid #FDE68A', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, fontWeight: 800, color: '#B8900A', flexShrink: 0 }}>
                {getInitials(selected.name)}
              </div>
              <div>
                <p style={{ fontSize: 16, fontWeight: 700, color: '#111827', marginBottom: 2 }}>{selected.name}</p>
                <p style={{ fontSize: 13, color: '#6B7280' }}>{selected.email}</p>
                {selected.phone && <p style={{ fontSize: 12, color: '#9CA3AF', marginTop: 1 }}>{selected.phone}</p>}
              </div>
              <div style={{ marginLeft: 'auto', textAlign: 'right' }}>
                <div style={{ fontSize: 22, fontWeight: 800, color: '#111827' }}>{selected.bookings_count}</div>
                <div style={{ fontSize: 11, color: '#9CA3AF' }}>Total Booking</div>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 1, background: '#F3F4F6', borderRadius: 8, overflow: 'hidden' }}>
              {[
                { label: 'Kendaraan', value: selected.vehicles.length, icon: Car },
                { label: 'Booking', value: selected.bookings_count, icon: CalendarCheck },
                { label: 'Bergabung', value: formatDate(selected.created_at), icon: null },
              ].map(({ label, value, icon: Icon }) => (
                <div key={label} style={{ background: '#fff', padding: '12px 14px', textAlign: 'center' }}>
                  <div style={{ fontSize: 16, fontWeight: 700, color: '#111827', marginBottom: 2 }}>{value}</div>
                  <div style={{ fontSize: 11, color: '#9CA3AF', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
                    {Icon && <Icon size={11} />}{label}
                  </div>
                </div>
              ))}
            </div>

            {selected.vehicles.length > 0 && (
              <div>
                <p style={{ fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '.06em' }}>Kendaraan</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {selected.vehicles.map(v => (
                    <div key={v.id} style={{ background: '#F9FAFB', borderRadius: 8, padding: '10px 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div>
                        <p style={{ fontSize: 13, fontWeight: 600, color: '#111827' }}>{v.brand} {v.model}</p>
                        <p style={{ fontSize: 11, color: '#9CA3AF', marginTop: 1 }}>{v.plate_number} · {v.type}</p>
                      </div>
                      {v.documents && v.documents.length > 0 && (
                        <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                          {v.documents.map(d => (
                            <span key={d.type} className={`badge badge-${d.status === 'verified' ? 'verified' : d.status === 'rejected' ? 'rejected' : 'pending'}`} style={{ fontSize: 10 }}>
                              {d.type.replace('_', ' ')}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {selected.bookings.length > 0 && (
              <div>
                <p style={{ fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '.06em' }}>10 Booking Terakhir</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {selected.bookings.map(b => (
                    <div key={b.id} style={{ background: '#F9FAFB', borderRadius: 8, padding: '10px 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3 }}>
                          <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 11, color: '#9CA3AF' }}>{b.booking_code}</span>
                          <span className={`badge ${statusBadgeClass[b.status] || 'badge-cancelled'}`} style={{ fontSize: 10 }}>
                            {statusLabel[b.status] || b.status}
                          </span>
                        </div>
                        <p style={{ fontSize: 13, fontWeight: 500, color: '#374151' }}>{b.service?.name || '—'}</p>
                        {b.schedule && <p style={{ fontSize: 11, color: '#9CA3AF', marginTop: 1 }}>{formatDate(b.schedule.date)}</p>}
                      </div>
                      <div style={{ fontWeight: 700, color: '#B8900A', fontSize: 14 }}>{formatPrice(b.total_price)}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {selected.bookings.length === 0 && selected.vehicles.length === 0 && (
              <div style={{ textAlign: 'center', padding: '16px 0', color: '#9CA3AF', fontSize: 13 }}>
                Pelanggan ini belum memiliki aktivitas.
              </div>
            )}
          </div>
        ) : null}
      </Modal>
    </AdminLayout>
  )
}
