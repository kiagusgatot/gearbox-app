import Echo from 'laravel-echo'
import Pusher from 'pusher-js'

// Daftarkan Pusher ke window agar Laravel Echo bisa menemukannya
window.Pusher = Pusher

const BASE_URL =
  (import.meta.env.VITE_API_URL as string | undefined)?.replace('/api', '') ??
  'http://localhost:8000'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const echo = new Echo({
  broadcaster:       'reverb',
  key:               import.meta.env.VITE_REVERB_APP_KEY,
  wsHost:            import.meta.env.VITE_REVERB_HOST    ?? 'localhost',
  wsPort:            Number(import.meta.env.VITE_REVERB_PORT)  || 8080,
  wssPort:           Number(import.meta.env.VITE_REVERB_PORT)  || 8080,
  forceTLS:          (import.meta.env.VITE_REVERB_SCHEME ?? 'http') === 'https',
  enabledTransports: ['ws', 'wss'],
  disableStats:      true,

  authorizer: (channel: { name: string }) => ({
    authorize(socketId: string, callback: (err: boolean, data: unknown) => void) {
      const token = localStorage.getItem('token') ?? ''

      fetch(`${BASE_URL}/broadcasting/auth`, {
        method: 'POST',
        headers: {
          'Content-Type':  'application/json',
          'Accept':        'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          socket_id:    socketId,
          channel_name: channel.name,
        }),
      })
        .then(res => {
          if (!res.ok) throw new Error(`Auth failed: ${res.status}`)
          return res.json()
        })
        .then((data: unknown) => callback(false, data))
        .catch((e: unknown) => {
          console.error('[Echo] Auth error:', e)
          callback(true, e)
        })
    },
  }),
} as ConstructorParameters<typeof Echo>[0])

export default echo
