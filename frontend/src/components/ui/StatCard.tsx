import type { LucideIcon } from 'lucide-react'
import { TrendingUp, TrendingDown } from 'lucide-react'

interface StatCardProps {
  title: string
  value: number | string
  icon: LucideIcon
  color?: 'primary' | 'success' | 'warning' | 'danger' | 'accent'
  trend?: { value: number; positive: boolean }
  suffix?: string
}

const colorMap = {
  primary: {
    bg: 'from-primary-600/20 to-primary-500/10',
    icon: 'bg-primary-500/20 text-primary-400',
    border: 'border-primary-500/20',
    value: 'text-primary-400',
  },
  success: {
    bg: 'from-emerald-600/20 to-emerald-500/10',
    icon: 'bg-emerald-500/20 text-emerald-400',
    border: 'border-emerald-500/20',
    value: 'text-emerald-400',
  },
  warning: {
    bg: 'from-amber-600/20 to-amber-500/10',
    icon: 'bg-amber-500/20 text-amber-400',
    border: 'border-amber-500/20',
    value: 'text-amber-400',
  },
  danger: {
    bg: 'from-red-600/20 to-red-500/10',
    icon: 'bg-red-500/20 text-red-400',
    border: 'border-red-500/20',
    value: 'text-red-400',
  },
  accent: {
    bg: 'from-accent-600/20 to-accent-500/10',
    icon: 'bg-accent-500/20 text-accent-400',
    border: 'border-accent-500/20',
    value: 'text-accent-400',
  },
}

export function StatCard({ title, value, icon: Icon, color = 'primary', trend, suffix }: StatCardProps) {
  const c = colorMap[color]

  return (
    <div className={`glass-card p-6 bg-gradient-to-br ${c.bg} border ${c.border}
                     hover:-translate-y-1 hover:shadow-xl transition-all duration-300 cursor-default`}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-semibold text-dark-400 uppercase tracking-wider mb-3">{title}</p>
          <p className={`text-3xl font-bold ${c.value}`}>
            {value}{suffix && <span className="text-lg ml-1">{suffix}</span>}
          </p>
          {trend && (
            <div className={`flex items-center gap-1 mt-2 text-xs font-medium
                            ${trend.positive ? 'text-emerald-400' : 'text-red-400'}`}>
              {trend.positive
                ? <TrendingUp className="w-3 h-3" />
                : <TrendingDown className="w-3 h-3" />}
              <span>{trend.value}% vs last month</span>
            </div>
          )}
        </div>
        <div className={`w-12 h-12 rounded-2xl ${c.icon} flex items-center justify-center flex-shrink-0`}>
          <Icon className="w-6 h-6" />
        </div>
      </div>
    </div>
  )
}
