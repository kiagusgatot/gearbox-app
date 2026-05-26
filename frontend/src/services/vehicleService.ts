import api from './api'
import type { Vehicle, VehicleDocument, PaginatedResponse } from '../types'

export const vehicleService = {
  async list(page = 1): Promise<PaginatedResponse<Vehicle>> {
    const { data } = await api.get('/vehicles', { params: { page } })
    return data
  },

  async get(id: number): Promise<Vehicle> {
    const { data } = await api.get(`/vehicles/${id}`)
    return data
  },

  async create(payload: Omit<Vehicle, 'id' | 'user_id' | 'is_verified' | 'documents'>) {
    const { data } = await api.post('/vehicles', payload)
    return data
  },

  async update(id: number, payload: Partial<Vehicle>) {
    const { data } = await api.put(`/vehicles/${id}`, payload)
    return data
  },

  async remove(id: number) {
    const { data } = await api.delete(`/vehicles/${id}`)
    return data
  },

  async getDocuments(vehicleId: number) {
    const { data } = await api.get(`/vehicles/${vehicleId}/documents`)
    return data
  },

  async uploadDocument(vehicleId: number, type: string, file: File) {
    const form = new FormData()
    form.append('type', type)
    form.append('file', file)
    const { data } = await api.post(`/vehicles/${vehicleId}/documents`, form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    return data
  },

  // ── Admin endpoints ─────────────────────────────────────────────────────────

  async adminListDocuments(status?: string): Promise<{ data: VehicleDocument[] }> {
    const { data } = await api.get('/admin/documents', { params: { status } })
    // Backend mengembalikan array langsung, wrap ke { data } agar konsisten
    return { data: Array.isArray(data) ? data : (data.data ?? []) }
  },

  async adminVerifyDocument(id: number, payload: { status: 'verified' | 'rejected'; notes?: string }) {
    const { data } = await api.put(`/admin/documents/${id}/verify`, payload)
    return data
  },
}
