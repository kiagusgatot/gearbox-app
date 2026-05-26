import { useState, FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Eye, EyeOff, ArrowRight } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'

export default function Login() {
  const { login, isLoading } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [error, setError]       = useState('')

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError('')
    try {
      const { redirectTo } = await login(email, password)
      navigate(redirectTo)
    } catch (err: unknown) {
      const ax = err as { response?: { data?: { message?: string } } }
      setError(ax.response?.data?.message || 'Email atau password salah')
    }
  }

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
        /* Mobile: sembunyikan panel kiri, full width form */
        @media (max-width: 767px) {
          .auth-left { display: none !important; }
          .auth-right {
            padding: 40px 24px;
            align-items: flex-start;
          }
          .auth-form-box { max-width: 100%; }
        }
        /* Tablet: panel kiri lebih kecil */
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
            <h1 style={{ fontSize: 52, fontWeight: 700, color: '#fff', lineHeight: 1.1, letterSpacing: '-.02em', marginBottom: 20 }}>
              Track.<br />Manage.<br />Succeed.
            </h1>
            <p style={{ fontSize: 15, color: '#6B6B6B', lineHeight: 1.7, maxWidth: 300 }}>
              Platform booking servis kendaraan dengan standar workshop premium.
            </p>
          </div>

          <div style={{ display: 'flex', gap: 32 }}>
            {[['01', 'BOOKING'], ['02', 'TRACKING'], ['03', 'SELESAI']].map(([num, label]) => (
              <div key={num}>
                <div style={{ fontSize: 22, fontWeight: 700, color: '#fff', lineHeight: 1 }}>{num}</div>
                <div style={{ fontSize: 10, fontWeight: 600, color: '#444', letterSpacing: '.12em', marginTop: 4 }}>{label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Panel kanan */}
        <div className="auth-right">
          <div className="auth-form-box">

            {/* Logo mobile */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 36 }} className="mobile-logo">
              <style>{`.mobile-logo { display: none; } @media (max-width: 767px) { .mobile-logo { display: flex !important; } }`}</style>
              <div style={{ width: 30, height: 30, background: '#E8B400', borderRadius: 7, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#0F0F0F" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>
                </svg>
              </div>
              <span style={{ fontSize: 16, fontWeight: 700, color: '#111' }}>Gearbox</span>
            </div>

            <h2 style={{ fontSize: 28, fontWeight: 700, color: '#111827', letterSpacing: '-.02em', marginBottom: 6 }}>
              Sign In
            </h2>
            <p style={{ fontSize: 14, color: '#9CA3AF', marginBottom: 24 }}>
              Access your personalized dashboard.
            </p>

            {/* Demo hint */}
            <div style={{ background: '#F9FAFB', border: '1px solid #F3F4F6', borderRadius: 8, padding: '12px 14px', marginBottom: 24 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                <div style={{ width: 16, height: 16, borderRadius: '50%', border: '1.5px solid #9CA3AF', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <span style={{ fontSize: 10, color: '#9CA3AF', fontWeight: 700 }}>i</span>
                </div>
                <span style={{ fontSize: 12, fontWeight: 600, color: '#6B7280' }}>Demo Account</span>
              </div>
              <div style={{ fontSize: 12, color: '#6B7280', lineHeight: 1.7 }}>
                <div>Admin: <code style={{ background: '#F3F4F6', padding: '1px 5px', borderRadius: 4, fontSize: 11 }}>admin@gearbox.com</code></div>
                <div>User: <code style={{ background: '#F3F4F6', padding: '1px 5px', borderRadius: 4, fontSize: 11 }}>budi@example.com</code></div>
                <div>Password: <code style={{ background: '#F3F4F6', padding: '1px 5px', borderRadius: 4, fontSize: 11 }}>password123</code></div>
              </div>
            </div>

            {error && (
              <div style={{ marginBottom: 18, padding: '10px 14px', background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 7, fontSize: 13, color: '#DC2626' }}>
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <label className="label">Email Address</label>
                <input type="email" className="input" placeholder="email@contoh.com"
                  value={email} onChange={e => setEmail(e.target.value)} required />
              </div>
              <div>
                <label className="label">Password</label>
                <div style={{ position: 'relative' }}>
                  <input type={showPass ? 'text' : 'password'} className="input"
                    style={{ paddingRight: 44 }} placeholder="••••••••"
                    value={password} onChange={e => setPassword(e.target.value)} required />
                  <button type="button" onClick={() => setShowPass(!showPass)}
                    style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#9CA3AF', display: 'flex', alignItems: 'center' }}>
                    {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
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
                {isLoading ? 'Memproses...' : <> Sign In <ArrowRight size={16} /> </>}
              </button>
            </form>

            <p style={{ textAlign: 'center', fontSize: 13, color: '#9CA3AF', marginTop: 20 }}>
              New to Gearbox?{' '}
              <Link to="/register" style={{ color: '#111827', fontWeight: 600, textDecoration: 'underline', textUnderlineOffset: 2 }}>
                Create Account
              </Link>
            </p>
          </div>
        </div>
      </div>
    </>
  )
}
