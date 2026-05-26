import { useEffect, useState } from 'react'
import { CheckCircle, Info, AlertTriangle, X } from 'lucide-react'

interface ToastItem {
  id: number
  message: string
  type: 'success' | 'info' | 'warning'
}

interface ToastProps {
  toasts: ToastItem[]
  onRemove: (id: number) => void
}

const config = {
  success: { icon: CheckCircle, bg: '#F0FDF4', border: '#BBF7D0', color: '#15803D', iconColor: '#16A34A' },
  info:    { icon: Info,         bg: '#EFF6FF', border: '#BFDBFE', color: '#1D4ED8', iconColor: '#2563EB' },
  warning: { icon: AlertTriangle,bg: '#FFFBEB', border: '#FDE68A', color: '#92400E', iconColor: '#D97706' },
}

export function Toast({ toasts, onRemove }: ToastProps) {
  return (
    <div style={{
      position: 'fixed', bottom: 24, right: 24, zIndex: 999,
      display: 'flex', flexDirection: 'column', gap: 10,
      maxWidth: 360,
    }}>
      {toasts.map(toast => {
        const { icon: Icon, bg, border, color, iconColor } = config[toast.type]
        return (
          <div key={toast.id} style={{
            background: bg, border: `1px solid ${border}`,
            borderRadius: 10, padding: '12px 16px',
            display: 'flex', alignItems: 'flex-start', gap: 10,
            boxShadow: '0 4px 12px rgba(0,0,0,.08)',
            animation: 'slideIn .2s ease',
          }}>
            <Icon size={16} color={iconColor} style={{ flexShrink: 0, marginTop: 1 }} />
            <p style={{ fontSize: 13, fontWeight: 500, color, flex: 1, lineHeight: 1.5 }}>{toast.message}</p>
            <button onClick={() => onRemove(toast.id)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color, opacity: .6, flexShrink: 0, display: 'flex', alignItems: 'center' }}>
              <X size={14} />
            </button>
          </div>
        )
      })}
    </div>
  )
}

// Hook untuk manage toast state
let toastCounter = 0

export function useToast() {
  const [toasts, setToasts] = useState<ToastItem[]>([])

  function addToast(message: string, type: ToastItem['type'] = 'info') {
    const id = ++toastCounter
    setToasts(prev => [...prev, { id, message, type }])
    // Auto-remove setelah 5 detik
    setTimeout(() => removeToast(id), 5000)
  }

  function removeToast(id: number) {
    setToasts(prev => prev.filter(t => t.id !== id))
  }

  return { toasts, addToast, removeToast }
}
