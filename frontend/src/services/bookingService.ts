import api from './api'
import type { Booking, PaginatedResponse } from '../types'

export const bookingService = {
  async list(page = 1): Promise<PaginatedResponse<Booking>> {
    const { data } = await api.get('/bookings', { params: { page } })
    return data
  },

  async get(id: number): Promise<Booking> {
    const { data } = await api.get(`/bookings/${id}`)
    return data
  },

  async create(payload: {
    vehicle_id: number
    service_ids: number[]
    date: string
    notes?: string
  }) {
    const { data } = await api.post('/bookings', payload)
    return data
  },

  async cancel(id: number) {
    const { data } = await api.put(`/bookings/${id}/cancel`)
    return data
  },

  async checkAvailability(serviceIds: number[], date: string) {
    const params = new URLSearchParams()
    params.append('date', date)
    serviceIds.forEach(id => params.append('service_ids[]', String(id)))
    const { data } = await api.get(`/bookings/availability?${params}`)
    return data
  },

  async getCalendar(serviceIds: number[], from: string, to: string) {
    const params = new URLSearchParams()
    params.append('from', from)
    params.append('to', to)
    serviceIds.forEach(id => params.append('service_ids[]', String(id)))
    const { data } = await api.get(`/bookings/calendar?${params}`)
    return data
  },

  async adminList(page = 1, status?: string, date?: string): Promise<PaginatedResponse<Booking>> {
    const { data } = await api.get('/admin/bookings', { params: { page, status, date } })
    return data
  },

  async adminUpdateStatus(id: number, status: string, notes?: string) {
    const { data } = await api.put(`/admin/bookings/${id}/status`, { status, notes })
    return data
  },
}
