import { Link, useNavigate, useLocation } from 'react-router-dom'
import { Wrench, LogOut, User, Menu, X } from 'lucide-react'
import { useState } from 'react'
import { useAuth } from '../../context/AuthContext'

export default function Navbar() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [open, setOpen] = useState(false)

  async function handleLogout() {
    await logout()
    navigate('/login')
  }

  const p = location.pathname

  // Setiap menu punya kondisi aktif yang eksplisit — tidak ada overlap
  const active: Record<string, boolean> = {
    '/services':  p === '/services',
    '/bookings':  p === '/bookings' || p.startsWith('/booking'),
    '/vehicles':  p === '/vehicles' || p.startsWith('/vehicles/'),
    '/admin':     p === '/admin'    || p.startsWith('/admin/'),
  }

  const linkStyle = (path: string): React.CSSProperties => ({
    fontSize: 13,
    fontWeight: active[path] ? 600 : 500,
    color: active[path] ? '#111827' : '#6B7280',
    textDecoration: 'none',
    position: 'relative',
    paddingBottom: 2,
    transition: 'color .15s',
  })

  const underline = (path: string) => active[path] ? (
    <span style={{
      position: 'absolute',
      bottom: -18, left: 0, right: 0,
      height: 2, background: '#E8B400', borderRadius: 1,
    }} />
  ) : null

  const mobileLinkStyle = (path: string): React.CSSProperties => ({
    fontSize: 13,
    fontWeight: active[path] ? 600 : 500,
    color: active[path] ? '#111827' : '#6B7280',
    textDecoration: 'none',
    display: 'flex', alignItems: 'center',
    padding: '6px 0',
    borderLeft: active[path] ? '2px solid #E8B400' : '2px solid transparent',
    paddingLeft: active[path] ? 10 : 0,
    transition: 'all .15s',
  })

  return (
    <nav style={{
      background: '#fff', borderBottom: '1px solid #E5E7EB',
      position: 'sticky', top: 0, zIndex: 50,
      boxShadow: '0 1px 3px rgba(0,0,0,.04)',
    }}>
      <div style={{
        maxWidth: 1080, margin: '0 auto', padding: '0 24px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 56,
      }}>

        <Link
          to={user ? (user.role === 'admin' ? '/admin' : '/services') : '/'}
          style={{ display: 'flex', alignItems: 'center', gap: 9, textDecoration: 'none' }}
        >
          <div style={{ width: 28, height: 28, background: '#E8B400', borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Wrench size={13} color="#1A1916" strokeWidth={2.5} />
          </div>
          <span style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 17, fontWeight: 800, letterSpacing: '.06em', textTransform: 'uppercase', color: '#111827' }}>
            Gearbox
          </span>
        </Link>

        <div className="hidden md:flex" style={{ alignItems: 'center', gap: 28, height: '100%' }}>
          <Link to="/services" style={linkStyle('/services')}>
            Layanan {underline('/services')}
          </Link>
          {user && user.role === 'user' && (
            <>
              <Link to="/bookings" style={linkStyle('/bookings')}>
                Booking Saya {underline('/bookings')}
              </Link>
              <Link to="/vehicles" style={linkStyle('/vehicles')}>
                Kendaraan {underline('/vehicles')}
              </Link>
            </>
          )}
          {user?.role === 'admin' && (
            <Link to="/admin" style={{ ...linkStyle('/admin'), color: '#B8900A', fontWeight: 600 }}>
              Admin Panel {underline('/admin')}
            </Link>
          )}
        </div>

        <div className="hidden md:flex" style={{ alignItems: 'center', gap: 10 }}>
          {user ? (
            <>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#9CA3AF', fontWeight: 500 }}>
                <User size={13} color="#9CA3AF" /> {user.name}
              </div>
              <button onClick={handleLogout} className="btn-secondary" style={{ padding: '6px 14px', fontSize: 12 }}>
                <LogOut size={12} /> Keluar
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="btn-secondary" style={{ padding: '6px 16px', fontSize: 12 }}>Masuk</Link>
              <Link to="/register" className="btn-primary" style={{ padding: '7px 16px', fontSize: 12 }}>Daftar</Link>
            </>
          )}
        </div>

        <button className="md:hidden" onClick={() => setOpen(!open)}
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6B7280', padding: 4 }}>
          {open ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {open && (
        <div style={{ background: '#fff', borderTop: '1px solid #F3F4F6', padding: '12px 24px 16px', display: 'flex', flexDirection: 'column', gap: 4 }}>
          <Link to="/services" style={mobileLinkStyle('/services')} onClick={() => setOpen(false)}>Layanan</Link>
          {user && user.role === 'user' && (
            <>
              <Link to="/bookings" style={mobileLinkStyle('/bookings')} onClick={() => setOpen(false)}>Booking Saya</Link>
              <Link to="/vehicles" style={mobileLinkStyle('/vehicles')} onClick={() => setOpen(false)}>Kendaraan</Link>
            </>
          )}
          {user ? (
            <button onClick={handleLogout} style={{ background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left', fontSize: 13, fontWeight: 500, color: '#DC2626', padding: '6px 0', marginTop: 4, borderTop: '1px solid #F3F4F6', paddingTop: 12 }}>
              Keluar
            </button>
          ) : (
            <>
              <Link to="/login" style={mobileLinkStyle('/login')} onClick={() => setOpen(false)}>Masuk</Link>
              <Link to="/register" style={mobileLinkStyle('/register')} onClick={() => setOpen(false)}>Daftar</Link>
            </>
          )}
        </div>
      )}
    </nav>
  )
}
