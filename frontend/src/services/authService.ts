import api from './api'
import type { User } from '../types'

export const authService = {
  async login(email: string, password: string) {
    const { data } = await api.post('/login', { email, password })
    return data
  },
  async register(payload: { name: string; email: string; password: string; password_confirmation: string; phone?: string }) {
    const { data } = await api.post('/register', payload)
    return data
  },
  async logout() {
    await api.post('/logout')
    localStorage.removeItem('token')
    localStorage.removeItem('user')
  },
  async me(): Promise<User> {
    const { data } = await api.get('/me')
    return data
  },
}
