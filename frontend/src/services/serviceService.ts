import api from './api'
import type { Service, ServiceSchedule, PaginatedResponse } from '../types'

export const serviceService = {
  async list(): Promise<PaginatedResponse<Service>> {
    const { data } = await api.get('/services')
    return data
  },
  async get(id: number): Promise<Service> {
    const { data } = await api.get(`/services/${id}`)
    return data
  },
  async getSchedules(serviceId?: number, date?: string): Promise<PaginatedResponse<ServiceSchedule>> {
    const { data } = await api.get('/schedules', { params: { service_id: serviceId, date, is_available: true } })
    return data
  },
  async adminCreate(payload: Partial<Service>) {
    const { data } = await api.post('/admin/services', payload)
    return data
  },
  async adminUpdate(id: number, payload: Partial<Service>) {
    const { data } = await api.put(`/admin/services/${id}`, payload)
    return data
  },
  async adminDelete(id: number) {
    const { data } = await api.delete(`/admin/services/${id}`)
    return data
  },
  async adminCreateSchedule(payload: Partial<ServiceSchedule>) {
    const { data } = await api.post('/admin/schedules', payload)
    return data
  },
  async adminUpdateSchedule(id: number, payload: Partial<ServiceSchedule>) {
    const { data } = await api.put(`/admin/schedules/${id}`, payload)
    return data
  },
  async adminDeleteSchedule(id: number) {
    const { data } = await api.delete(`/admin/schedules/${id}`)
    return data
  },
}
