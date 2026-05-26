import { useState, useEffect } from 'react'
import { bookingService } from '../services/bookingService'
import type { Booking, PaginatedResponse } from '../types'

export function useBookings() {
  const [bookings, setBookings] = useState<PaginatedResponse<Booking> | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  async function fetchBookings(page = 1) {
    setIsLoading(true)
    try {
      const res = await bookingService.list(page)
      setBookings(res)
    } catch {
      setError('Gagal memuat data booking')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => { fetchBookings() }, [])

  return { bookings, isLoading, error, refetch: fetchBookings }
}
