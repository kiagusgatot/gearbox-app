import { useEffect } from 'react'
import echo from '../echo'

interface QueueUpdatePayload {
  date: string
  queue_count: number
  is_available: boolean
}

interface UseQueueCapacityOptions {
  date: string
  onUpdate: (payload: QueueUpdatePayload) => void
  enabled?: boolean
}

export function useQueueCapacity({ date, onUpdate, enabled = true }: UseQueueCapacityOptions) {
  useEffect(() => {
    if (!date || !enabled) return

    // Public channel — tidak perlu auth
    const channel = echo.channel(`queue.${date}`)
      .listen('.queue.updated', (payload: QueueUpdatePayload) => {
        console.log('[WS] Queue updated:', payload)
        onUpdate(payload)
      })

    return () => {
      channel.stopListening('.queue.updated')
      echo.leave(`queue.${date}`)
    }
  }, [date, enabled])
}
