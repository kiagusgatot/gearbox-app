import { NavLink, useNavigate, useLocation } from 'react-router-dom'
import { useEffect, useState } from 'react'
import {
  LayoutDashboard, CalendarCheck, Wrench,
  Clock, Users, FileCheck, Package, LogOut, Menu, X,
} from 'lucide-react'
import { useAuth } from '../../context/AuthContext'

const links = [
  { to: '/admin',           label: 'Dashboard',          icon: LayoutDashboard, end: true },
  { to: '/admin/bookings',  label: 'Booking',            icon: CalendarCheck },
  { to: '/admin/services',  label: 'Layanan',            icon: Wrench },
  { to: '/admin/schedules', label: 'Jadwal',             icon: Clock },
  { to: '/admin/customers', label: 'Pelanggan',          icon: Users },
  { to: '/admin/documents', label: 'Verifikasi Dokumen', icon: FileCheck },
  { to: '/admin/inventory', label: 'Inventory',          icon: Package },
]

function SidebarContent({ onClose }: { onClose?: () => void }) {
  const { logout, user } = useAuth()
  const navigate = useNavigate()

  async function handleLogout() {
    await logout()
    navigate('/login')
  }

  return (
    <div style={{
      width: '100%', height: '100%',
      background: '#1C1E2E',
      display: 'flex', flexDirection: 'column',
    }}>
      {/* Logo */}
      <div style={{
        padding: '20px 16px 18px',
        borderBottom: '1px solid rgba(255,255,255,.07)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 30, height: 30, background: '#E8B400', borderRadius: 7,
            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
          }}>
            <Wrench size={14} color="#1A1916" strokeWidth={2.5} />
          </div>
          <div>
            <div style={{
              fontFamily: "'Plus Jakarta Sans', sans-serif",
              fontSize: 17, fontWeight: 800,
              letterSpacing: '.06em', textTransform: 'uppercase' as const,
              color: '#FFFFFF', lineHeight: 1,
            }}>Gearbox</div>
            <div style={{
              fontSize: 9, fontWeight: 700,
              letterSpacing: '.18em', textTransform: 'uppercase' as const,
              color: '#E8B400', opacity: .75, marginTop: 2,
            }}>Admin Panel</div>
          </div>
        </div>
        {/* Tombol close — hanya muncul di mobile */}
        {onClose && (
          <button onClick={onClose} style={{
            background: 'none', border: 'none', cursor: 'pointer',
            color: '#8B90A0', display: 'flex', alignItems: 'center', padding: 4,
          }}>
            <X size={18} />
          </button>
        )}
      </div>

      {/* Nav links */}
      <nav style={{ flex: 1, padding: '10px 8px', display: 'flex', flexDirection: 'column', gap: 2, overflowY: 'auto' }}>
        {links.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to} to={to} end={end}
            onClick={onClose}
            style={({ isActive }) => ({
              display: 'flex', alignItems: 'center', gap: 9,
              padding: '9px 10px', borderRadius: 7,
              fontSize: 13, fontWeight: isActive ? 600 : 500,
              color: isActive ? '#FFFFFF' : '#8B90A0',
              background: isActive ? '#2F3350' : 'transparent',
              textDecoration: 'none', transition: 'all .12s',
              fontFamily: "'Plus Jakarta Sans', sans-serif",
            })}
          >
            {({ isActive }) => (
              <>
                <Icon size={15} strokeWidth={isActive ? 2.2 : 1.8} color={isActive ? '#E8B400' : '#8B90A0'} style={{ flexShrink: 0 }} />
                <span>{label}</span>
                {isActive && (
                  <div style={{ marginLeft: 'auto', width: 4, height: 4, borderRadius: '50%', background: '#E8B400', flexShrink: 0 }} />
                )}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* User + Logout */}
      <div style={{ padding: '8px', borderTop: '1px solid rgba(255,255,255,.07)' }}>
        <div style={{ padding: '8px 10px', display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
          <div style={{
            width: 28, height: 28, borderRadius: '50%', background: '#2F3350',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 11, fontWeight: 600, color: '#8B90A0', flexShrink: 0,
          }}>
            {user?.name?.charAt(0).toUpperCase() || 'A'}
          </div>
          <div style={{ fontSize: 12, fontWeight: 500, color: '#8B90A0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {user?.name}
          </div>
        </div>
        <button onClick={handleLogout} style={{
          display: 'flex', alignItems: 'center', gap: 9,
          padding: '7px 10px', borderRadius: 7,
          fontSize: 12.5, fontWeight: 500, color: '#8B90A0',
          background: 'transparent', border: 'none', cursor: 'pointer', width: '100%',
          fontFamily: "'Plus Jakarta Sans', sans-serif", transition: 'all .12s',
        }}
          onMouseEnter={e => { e.currentTarget.style.color = '#F87171'; e.currentTarget.style.background = 'rgba(248,113,113,.08)' }}
          onMouseLeave={e => { e.currentTarget.style.color = '#8B90A0'; e.currentTarget.style.background = 'transparent' }}
        >
          <LogOut size={15} strokeWidth={1.8} style={{ flexShrink: 0 }} />
          <span>Keluar</span>
        </button>
      </div>
    </div>
  )
}

export default function Sidebar() {
  const [mobileOpen, setMobileOpen] = useState(false)
  const location = useLocation()

  // Tutup drawer saat navigasi
  useEffect(() => { setMobileOpen(false) }, [location.pathname])

  // Lock scroll saat drawer buka
  useEffect(() => {
    document.body.style.overflow = mobileOpen ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [mobileOpen])

  return (
    <>
      {/* ── Desktop sidebar sticky ── */}
      <aside style={{
        width: 220, flexShrink: 0,
        position: 'sticky', top: 0,
        height: '100vh', overflowY: 'auto',
        display: 'none',
      }} className="sidebar-desktop">
        <SidebarContent />
      </aside>

      {/* ── Mobile top bar ── */}
      <div className="sidebar-mobile-bar" style={{
        display: 'none',
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
        background: '#1C1E2E', height: 52,
        alignItems: 'center', justifyContent: 'space-between',
        padding: '0 16px',
        boxShadow: '0 2px 8px rgba(0,0,0,.2)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 26, height: 26, background: '#E8B400', borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Wrench size={13} color="#1A1916" strokeWidth={2.5} />
          </div>
          <span style={{ fontSize: 15, fontWeight: 800, color: '#fff', letterSpacing: '.04em', textTransform: 'uppercase' }}>Gearbox</span>
        </div>
        <button onClick={() => setMobileOpen(true)} style={{
          background: 'none', border: 'none', cursor: 'pointer',
          color: '#8B90A0', display: 'flex', alignItems: 'center',
        }}>
          <Menu size={22} />
        </button>
      </div>

      {/* ── Mobile drawer overlay ── */}
      {mobileOpen && (
        <div
          onClick={() => setMobileOpen(false)}
          style={{
            position: 'fixed', inset: 0, zIndex: 200,
            background: 'rgba(0,0,0,.5)',
          }}
        />
      )}

      {/* ── Mobile drawer ── */}
      <div style={{
        position: 'fixed', top: 0, left: 0, bottom: 0, zIndex: 201,
        width: 260,
        transform: mobileOpen ? 'translateX(0)' : 'translateX(-100%)',
        transition: 'transform .25s ease',
      }}>
        <SidebarContent onClose={() => setMobileOpen(false)} />
      </div>

      {/* ── CSS responsive ── */}
      <style>{`
        @media (min-width: 768px) {
          .sidebar-desktop { display: flex !important; }
          .sidebar-mobile-bar { display: none !important; }
        }
        @media (max-width: 767px) {
          .sidebar-desktop { display: none !important; }
          .sidebar-mobile-bar { display: flex !important; }
        }
      `}</style>
    </>
  )
}
