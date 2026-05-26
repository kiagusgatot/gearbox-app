import { useEffect } from 'react'
import echo from '../echo'
import { useAuth } from '../context/AuthContext'

interface NewBookingPayload {
  id: number
  booking_code: string
  queue_number: string
  bay_number: number
  status: string
  total_price: number
  estimated_start: string
  estimated_end: string
  user: { id: number; name: string }
  vehicle: { brand: string; model: string; plate_number: string } | null
  services: { name: string; duration_minutes: number }[]
  created_at: string
}

interface BookingStatusPayload {
  id: number
  booking_code: string
  status: string
  updated_at: string
}

interface UseAdminBookingsOptions {
  onNewBooking?: (payload: NewBookingPayload) => void
  onStatusUpdate?: (payload: BookingStatusPayload) => void
}

export function useAdminBookings({ onNewBooking, onStatusUpdate }: UseAdminBookingsOptions) {
  const { user, token } = useAuth()

  useEffect(() => {
    if (!user || user.role !== 'admin' || !token) return

    echo.connector.options.auth.headers.Authorization = `Bearer ${token}`

    const channel = echo.private('admin.bookings')

    // Booking baru masuk
    if (onNewBooking) {
      channel.listen('.booking.created', (payload: NewBookingPayload) => {
        console.log('[WS] New booking:', payload)
        onNewBooking(payload)
      })
    }

    // Status booking berubah
    if (onStatusUpdate) {
      channel.listen('.booking.status.updated', (payload: BookingStatusPayload) => {
        console.log('[WS] Status updated:', payload)
        onStatusUpdate(payload)
      })
    }

    return () => {
      channel.stopListening('.booking.created')
      channel.stopListening('.booking.status.updated')
      echo.leave('admin.bookings')
    }
  }, [user?.id, token])
}
