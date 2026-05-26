import { useEffect, useCallback } from 'react'
import echo from '../echo'
import { useAuth } from '../context/AuthContext'

interface BookingUpdatePayload {
  id: number
  booking_code: string
  queue_number: string
  bay_number: number
  status: string
  estimated_start: string
  estimated_end: string
  total_price: number
  services: { name: string; price: number }[]
  updated_at: string
}

interface UseBookingStatusOptions {
  onUpdate: (payload: BookingUpdatePayload) => void
  showToast?: (message: string, type?: 'success' | 'info' | 'warning') => void
}

const STATUS_LABELS: Record<string, string> = {
  confirmed:   'Booking kamu telah dikonfirmasi',
  in_progress: 'Kendaraan kamu sedang diservis',
  completed:   'Servis selesai! Kendaraan siap diambil',
  cancelled:   'Booking telah dibatalkan',
}

export function useBookingStatus({ onUpdate, showToast }: UseBookingStatusOptions) {
  const { user, token } = useAuth()

  // Update auth header Echo setiap kali token berubah
  useEffect(() => {
    if (token) {
      echo.connector.options.auth.headers.Authorization = `Bearer ${token}`
    }
  }, [token])

  useEffect(() => {
    if (!user || !token) return

    // Subscribe ke private channel user
    const channel = echo.private(`user.${user.id}`)
      .listen('.booking.status.updated', (payload: BookingUpdatePayload) => {
        console.log('[WS] Booking status updated:', payload)

        // Jalankan callback untuk update state
        onUpdate(payload)

        // Tampilkan notifikasi toast jika ada
        const message = STATUS_LABELS[payload.status]
        if (message && showToast) {
          showToast(message, payload.status === 'completed' ? 'success' : 'info')
        }
      })

    return () => {
      channel.stopListening('.booking.status.updated')
      echo.leave(`user.${user.id}`)
    }
  }, [user?.id, token])
}
