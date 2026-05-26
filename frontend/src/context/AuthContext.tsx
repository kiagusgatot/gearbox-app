import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import type { User } from '../types'
import { authService } from '../services/authService'

interface AuthContextType {
  user: User | null
  token: string | null
  isLoading: boolean
  login: (email: string, password: string) => Promise<{ redirectTo: string }>
  register: (payload: { name: string; email: string; password: string; password_confirmation: string; phone?: string }) => Promise<{ redirectTo: string }>
  logout: () => Promise<void>
  isAdmin: boolean
}

const AuthContext = createContext<AuthContextType | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(() => {
    try { return JSON.parse(localStorage.getItem('user') || 'null') } catch { return null }
  })
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('token'))
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (token && !user) {
      authService.me().then(setUser).catch(() => {
        setToken(null)
        localStorage.removeItem('token')
      })
    }
  }, [token])

  function getRedirect(role: string) {
    return role === 'admin' ? '/admin' : '/services'
  }

  async function login(email: string, password: string) {
    setIsLoading(true)
    try {
      const res = await authService.login(email, password)
      localStorage.setItem('token', res.token)
      localStorage.setItem('user', JSON.stringify(res.user))
      setToken(res.token)
      setUser(res.user)
      return { redirectTo: getRedirect(res.user.role) }
    } finally {
      setIsLoading(false)
    }
  }

  async function register(payload: { name: string; email: string; password: string; password_confirmation: string; phone?: string }) {
    setIsLoading(true)
    try {
      const res = await authService.register(payload)
      localStorage.setItem('token', res.token)
      localStorage.setItem('user', JSON.stringify(res.user))
      setToken(res.token)
      setUser(res.user)
      // Setelah register, user belum punya kendaraan — langsung ke halaman kendaraan
      return { redirectTo: '/vehicles?new=1' }
    } finally {
      setIsLoading(false)
    }
  }

  async function logout() {
    await authService.logout()
    setUser(null)
    setToken(null)
  }

  return (
    <AuthContext.Provider value={{
      user, token, isLoading, login, register, logout,
      isAdmin: user?.role === 'admin',
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
