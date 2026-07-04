import type { AppointmentStatus } from '../../types'

const statusConfig: Record<string, { label: string; className: string }> = {
  PENDING:   { label: 'Pending',   className: 'badge-pending' },
  CONFIRMED: { label: 'Confirmed', className: 'badge-confirmed' },
  COMPLETED: { label: 'Completed', className: 'badge-completed' },
  CANCELLED: { label: 'Cancelled', className: 'badge-cancelled' },
  NO_SHOW:   { label: 'No Show',   className: 'badge-no_show' },
  ACTIVE:    { label: 'Active',    className: 'badge-active' },
  INACTIVE:  { label: 'Inactive',  className: 'badge-inactive' },
  ON_LEAVE:  { label: 'On Leave',  className: 'badge-on_leave' },
}

interface BadgeProps {
  status: string
  size?: 'sm' | 'md'
}

export function Badge({ status, size = 'sm' }: BadgeProps) {
  const config = statusConfig[status?.toUpperCase()] ?? { label: status, className: 'bg-dark-700 text-dark-300 border border-dark-600' }
  const padding = size === 'sm' ? 'px-2.5 py-0.5 text-xs' : 'px-3 py-1 text-sm'

  return (
    <span className={`inline-flex items-center rounded-full font-semibold ${padding} ${config.className}`}>
      <span className="w-1.5 h-1.5 rounded-full bg-current mr-1.5 opacity-70" />
      {config.label}
    </span>
  )
}
