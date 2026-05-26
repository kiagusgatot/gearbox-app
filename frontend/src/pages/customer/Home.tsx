import { Link } from 'react-router-dom'
import { Calendar, Car, ShieldCheck, ArrowRight } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import Navbar from '../../components/shared/Navbar'

const features = [
  { icon: Calendar, title: 'Booking Mudah', desc: 'Pilih layanan, jadwal, dan kendaraan dalam beberapa klik.' },
  { icon: Car, title: 'Multi Kendaraan', desc: 'Daftarkan motor dan mobil, kelola semua dalam satu akun.' },
  { icon: ShieldCheck, title: 'Tracking Real-time', desc: 'Pantau status servis dari pending hingga selesai.' },
]

export default function Home() {
  const { user } = useAuth()
  return (
    <div style={{ minHeight: '100vh', background: '#F0F2F5' }}>
      <Navbar />
      <section style={{ maxWidth: 1080, margin: '0 auto', padding: '72px 24px 60px' }}>
        <div className="tag-label" style={{ marginBottom: 14 }}>Precision Automotive Engineering</div>
        <h1 style={{ fontFamily: "'Barlow Condensed',sans-serif", fontSize: 58, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '.02em', lineHeight: .95, color: '#111827', marginBottom: 18 }}>
          Servis Kendaraan<br /><span style={{ color: '#B8900A' }}>Tanpa Kompromi.</span>
        </h1>
        <p style={{ fontSize: 15, color: '#6B7280', maxWidth: 460, lineHeight: 1.75, marginBottom: 32 }}>
          Booking jadwal servis, pantau progress perbaikan, dan dapatkan laporan digital lengkap setiap kali kendaraan ditangani.
        </p>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <Link to="/services" className="btn-primary" style={{ padding: '10px 24px', borderRadius: 7 }}>Lihat Layanan <ArrowRight size={14} /></Link>
          {!user && <Link to="/register" className="btn-secondary" style={{ padding: '9px 24px', borderRadius: 7 }}>Daftar Gratis</Link>}
          {user && <Link to="/booking/create" className="btn-secondary" style={{ padding: '9px 24px', borderRadius: 7 }}>Booking Sekarang <ArrowRight size={14} /></Link>}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 14, marginTop: 52 }}>
          {[{ num: '2,400+', lbl: 'Unit Ditangani' }, { num: '12 Tahun', lbl: 'Pengalaman' }, { num: '98%', lbl: 'Kepuasan Klien' }].map(({ num, lbl }) => (
            <div key={lbl} className="card" style={{ padding: '20px 22px', display: 'flex', alignItems: 'baseline', gap: 10 }}>
              <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontSize: 30, fontWeight: 800, color: '#111827' }}>{num}</div>
              <div style={{ fontSize: 12, fontWeight: 500, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '.06em' }}>{lbl}</div>
            </div>
          ))}
        </div>
      </section>
      <section style={{ maxWidth: 1080, margin: '0 auto', padding: '0 24px 72px' }}>
        <div style={{ marginBottom: 28 }}>
          <div className="tag-label" style={{ marginBottom: 10 }}>Kenapa Gearbox</div>
          <h2 style={{ fontFamily: "'Barlow Condensed',sans-serif", fontSize: 32, fontWeight: 800, textTransform: 'uppercase', color: '#111827', lineHeight: 1 }}>Lebih dari sekadar bengkel.</h2>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 14 }}>
          {features.map(({ icon: Icon, title, desc }, i) => (
            <div key={title} className="card" style={{ padding: '24px 22px', borderTop: i === 0 ? '3px solid #E8B400' : '3px solid transparent' }}>
              <div style={{ width: 38, height: 38, background: '#FFFBEB', borderRadius: 9, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
                <Icon size={18} color="#B8900A" strokeWidth={1.6} />
              </div>
              <h3 style={{ fontFamily: "'Barlow Condensed',sans-serif", fontSize: 17, fontWeight: 700, textTransform: 'uppercase', color: '#111827', marginBottom: 8 }}>{title}</h3>
              <p style={{ fontSize: 13, color: '#6B7280', lineHeight: 1.7 }}>{desc}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
