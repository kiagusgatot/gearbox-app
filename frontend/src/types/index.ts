export interface User {
  id: number
  name: string
  email: string
  phone?: string
  role: 'admin' | 'user'
}

export interface Vehicle {
  id: number
  user_id: number
  plate_number: string
  brand: string
  model: string
  year: number
  type: 'motor' | 'mobil'
  is_verified: boolean
  documents?: VehicleDocument[]
}

export interface VehicleDocument {
  id: number
  vehicle_id: number
  type: 'plat_nomor' | 'stnk' | 'kir'
  file_path: string
  file_name: string
  status: 'pending' | 'verified' | 'rejected'
  notes?: string
  verified_by?: number
  verified_at?: string
  verifier?: { id: number; name: string }
  created_at: string
}

export interface Service {
  id: number
  name: string
  description?: string
  price: number
  duration_minutes: number
  category: 'mesin' | 'kelistrikan' | 'bodi' | 'ac'
  status: 'active' | 'inactive'
}

export interface ServiceSchedule {
  id: number
  service_id: number
  service?: Service
  date: string
  start_time: string
  end_time: string
  capacity: number
  booked_count: number
  is_available: boolean
}

export interface Booking {
  id: number
  user_id: number
  vehicle_id: number
  service_id: number
  schedule_id: number
  booking_code: string
  status: 'pending' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled'
  total_price: number
  notes?: string
  created_at: string
  user?: User
  vehicle?: Vehicle
  service?: Service
  schedule?: ServiceSchedule
  status_histories?: BookingStatusHistory[]
}

export interface BookingStatusHistory {
  id: number
  booking_id: number
  old_status: string
  new_status: string
  notes?: string
  changed_by: number
  created_at: string
}

export interface Review {
  id: number
  booking_id: number
  service_id: number
  user_id: number
  rating: number
  comment?: string
  user?: User
  service?: Service
  created_at: string
}

export interface Part {
  id: number
  sku: string
  name: string
  description?: string
  category: 'mesin' | 'kelistrikan' | 'bodi' | 'ac' | 'ban' | 'lainnya'
  brand?: string
  unit: string
  price: number
  stock: number
  min_stock: number
  status: 'active' | 'inactive'
  is_low_stock?: boolean
}

export interface PaginatedResponse<T> {
  current_page: number
  data: T[]
  last_page: number
  per_page: number
  total: number
}

export interface ApiResponse<T> {
  message?: string
  data?: T
}
