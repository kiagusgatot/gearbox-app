import { useState, FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowRight, CheckCircle } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'

export default function Register() {
  const { register, isLoading } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '', password_confirmation: '' })
  const [errors, setErrors] = useState<Record<string, string>>({})

  function set(key: string, value: string) {
    setForm(p => ({ ...p, [key]: value }))
    setErrors(p => ({ ...p, [key]: '' }))
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setErrors({})
    if (form.password !== form.password_confirmation) {
      setErrors({ password_confirmation: 'Password tidak cocok' })
      return
    }
    try {
      const { redirectTo } = await register(form)
      navigate(redirectTo)
    } catch (err: unknown) {
      const ax = err as { response?: { data?: { errors?: Record<string, string[]> } } }
      const apiErrors = ax.response?.data?.errors
      if (apiErrors) {
        const flat: Record<string, string> = {}
        Object.entries(apiErrors).forEach(([k, v]) => { flat[k] = v[0] })
        setErrors(flat)
      }
    }
  }

  const perks = [
    'Booking servis kapan saja & di mana saja',
    'Pantau status servis secara real-time',
    'Riwayat servis kendaraan lengkap',
  ]

  return (
    <>
      <style>{`
        .auth-wrapper {
          min-height: 100vh;
          display: flex;
          font-family: 'Plus Jakarta Sans', sans-serif;
        }
        .auth-left {
          width: 42%;
          background: #0F0F0F;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          padding: 40px 48px;
          flex-shrink: 0;
        }
        .auth-right {
          flex: 1;
          background: #fff;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 40px 48px;
          overflow-y: auto;
        }
        .auth-form-box {
          width: 100%;
          max-width: 360px;
        }
        @media (max-width: 767px) {
          .auth-left { display: none !important; }
          .auth-right {
            padding: 40px 24px;
            align-items: flex-start;
          }
          .auth-form-box { max-width: 100%; }
        }
        @media (min-width: 768px) and (max-width: 1023px) {
          .auth-left { width: 36%; padding: 32px; }
          .auth-left h1 { font-size: 36px !important; }
          .auth-right { padding: 32px 36px; }
        }
      `}</style>

      <div className="auth-wrapper">

        {/* Panel kiri */}
        <div className="auth-left">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 36, height: 36, background: '#E8B400', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#0F0F0F" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>
              </svg>
            </div>
            <span style={{ fontSize: 17, fontWeight: 700, color: '#fff', letterSpacing: '-.01em' }}>Gearbox</span>
          </div>

          <div>
            <h1 style={{ fontSize: 48, fontWeight: 700, color: '#fff', lineHeight: 1.1, letterSpacing: '-.02em', marginBottom: 24 }}>
              Start your<br />journey<br />today.
            </h1>
            <p style={{ fontSize: 15, color: '#6B6B6B', lineHeight: 1.7, maxWidth: 300, marginBottom: 28 }}>
              Bergabung dan nikmati kemudahan booking servis kendaraan premium.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {perks.map(p => (
                <div key={p} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <CheckCircle size={15} color="#E8B400" strokeWidth={2} style={{ flexShrink: 0 }} />
                  <span style={{ fontSize: 13, color: '#888', lineHeight: 1.4 }}>{p}</span>
                </div>
              ))}
            </div>
          </div>

          <p style={{ fontSize: 11, color: '#333', letterSpacing: '.04em' }}>© 2026 Gearbox Engineering</p>
        </div>

        {/* Panel kanan */}
        <div className="auth-right">
          <div className="auth-form-box">

            {/* Logo mobile */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 32 }} className="mobile-logo-reg">
              <style>{`.mobile-logo-reg { display: none; } @media (max-width: 767px) { .mobile-logo-reg { display: flex !important; } }`}</style>
              <div style={{ width: 30, height: 30, background: '#E8B400', borderRadius: 7, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#0F0F0F" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>
                </svg>
              </div>
              <span style={{ fontSize: 16, fontWeight: 700, color: '#111' }}>Gearbox</span>
            </div>

            <h2 style={{ fontSize: 28, fontWeight: 700, color: '#111827', letterSpacing: '-.02em', marginBottom: 6 }}>
              Create Account
            </h2>
            <p style={{ fontSize: 14, color: '#9CA3AF', marginBottom: 24 }}>
              Start organizing your service today.
            </p>

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label className="label">Full Name</label>
                <input className="input" placeholder="Budi Santoso"
                  value={form.name} onChange={e => set('name', e.target.value)} required />
                {errors.name && <p style={{ fontSize: 11, color: '#DC2626', marginTop: 4 }}>{errors.name}</p>}
              </div>

              <div>
                <label className="label">Email Address</label>
                <input type="email" className="input" placeholder="email@contoh.com"
                  value={form.email} onChange={e => set('email', e.target.value)} required />
                {errors.email && <p style={{ fontSize: 11, color: '#DC2626', marginTop: 4 }}>{errors.email}</p>}
              </div>

              <div>
                <label className="label">
                  No. HP <span style={{ color: '#9CA3AF', fontWeight: 400 }}>(opsional)</span>
                </label>
                <input className="input" placeholder="08xxxxxxxxxx"
                  value={form.phone} onChange={e => set('phone', e.target.value)} />
              </div>

              <div>
                <label className="label">Password</label>
                <input type="password" className="input" placeholder="Min. 8 characters"
                  value={form.password} onChange={e => set('password', e.target.value)} required minLength={8} />
                {errors.password && <p style={{ fontSize: 11, color: '#DC2626', marginTop: 4 }}>{errors.password}</p>}
              </div>

              <div>
                <label className="label">Confirm Password</label>
                <input type="password" className="input" placeholder="Repeat password"
                  value={form.password_confirmation} onChange={e => set('password_confirmation', e.target.value)} required />
                {errors.password_confirmation && <p style={{ fontSize: 11, color: '#DC2626', marginTop: 4 }}>{errors.password_confirmation}</p>}
              </div>

              <button type="submit" disabled={isLoading}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                  width: '100%', padding: '12px 20px', marginTop: 4,
                  background: '#E8B400', color: '#1A1916',
                  fontSize: 14, fontWeight: 600,
                  border: 'none', borderRadius: 8, cursor: isLoading ? 'not-allowed' : 'pointer',
                  opacity: isLoading ? .6 : 1, transition: 'background .15s',
                  fontFamily: "'Plus Jakarta Sans', sans-serif",
                }}
                onMouseEnter={e => { if (!isLoading) e.currentTarget.style.background = '#D4A200' }}
                onMouseLeave={e => { e.currentTarget.style.background = '#E8B400' }}
              >
                {isLoading ? 'Memproses...' : <> Create Account <ArrowRight size={16} /> </>}
              </button>
            </form>

            <p style={{ textAlign: 'center', fontSize: 13, color: '#9CA3AF', marginTop: 20 }}>
              Already have an account?{' '}
              <Link to="/login" style={{ color: '#111827', fontWeight: 600, textDecoration: 'underline', textUnderlineOffset: 2 }}>
                Sign In
              </Link>
            </p>
          </div>
        </div>
      </div>
    </>
  )
}
