import { ReactNode } from 'react'
import { AlertTriangle, Trash2, CheckCircle, Info } from 'lucide-react'

type Variant = 'danger' | 'warning' | 'success' | 'info'

interface ConfirmDialogProps {
  open: boolean
  onClose: () => void
  onConfirm: () => void
  title: string
  description?: string
  confirmLabel?: string
  cancelLabel?: string
  variant?: Variant
  loading?: boolean
  children?: ReactNode
}

const variantConfig = {
  danger:  { icon: Trash2,         iconBg: '#FEF2F2', iconColor: '#DC2626', btnClass: 'btn-danger'   },
  warning: { icon: AlertTriangle,  iconBg: '#FFFBEB', iconColor: '#D97706', btnClass: 'btn-primary'  },
  success: { icon: CheckCircle,    iconBg: '#F0FDF4', iconColor: '#16A34A', btnClass: 'btn-primary'  },
  info:    { icon: Info,           iconBg: '#EFF6FF', iconColor: '#2563EB', btnClass: 'btn-primary'  },
}

export default function ConfirmDialog({
  open, onClose, onConfirm,
  title, description,
  confirmLabel = 'Konfirmasi',
  cancelLabel  = 'Batal',
  variant = 'info',
  loading = false,
  children,
}: ConfirmDialogProps) {
  if (!open) return null

  const { icon: Icon, iconBg, iconColor, btnClass } = variantConfig[variant]

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 300,
        background: 'rgba(0,0,0,.45)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 24,
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: '#fff', borderRadius: 12,
          boxShadow: '0 20px 60px rgba(0,0,0,.15)',
          width: '100%', maxWidth: 400,
          padding: '28px 28px 24px',
        }}
      >
        {/* Icon */}
        <div style={{
          width: 44, height: 44, borderRadius: 12,
          background: iconBg,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          marginBottom: 16,
        }}>
          <Icon size={20} color={iconColor} strokeWidth={1.8} />
        </div>

        {/* Title & desc */}
        <h3 style={{
          fontSize: 15, fontWeight: 700, color: '#111827',
          marginBottom: description || children ? 6 : 20,
          fontFamily: "'Plus Jakarta Sans', sans-serif",
        }}>{title}</h3>

        {description && (
          <p style={{ fontSize: 13, color: '#6B7280', lineHeight: 1.6, marginBottom: 16 }}>
            {description}
          </p>
        )}

        {children && (
          <div style={{ marginBottom: 16 }}>{children}</div>
        )}

        {/* Actions */}
        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          <button
            onClick={onClose}
            className="btn-secondary"
            disabled={loading}
            style={{ padding: '8px 18px' }}
          >
            {cancelLabel}
          </button>
          <button
            onClick={onConfirm}
            className={btnClass}
            disabled={loading}
            style={{ padding: '8px 18px' }}
          >
            {loading ? 'Memproses...' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
