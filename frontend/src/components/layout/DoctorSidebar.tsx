import { NavLink } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import {
  LayoutDashboard,
  CalendarDays,
  Users,
  User,
  Bot,
  Activity,
  ChevronRight,
} from 'lucide-react'
import { useAuth } from '../../context/AuthContext'

const navItems = [
  { to: '/doctor/dashboard',    icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/doctor/appointments', icon: CalendarDays,    label: 'Appointments' },
  { to: '/doctor/patients',     icon: Users,           label: 'Patients' },
  { to: '/doctor/ai-assistant', icon: Bot,             label: 'AI Assistant' },
]

export function DoctorSidebar() {
  const { user } = useAuth()
  const { t } = useTranslation()

  return (
    <aside className="w-64 min-h-screen bg-white dark:bg-dark-950 border-r-2 border-blue-200 dark:border-dark-800 flex flex-col flex-shrink-0">
      {/* Logo */}
      <div className="px-6 py-6 border-b-2 border-blue-100 dark:border-dark-800">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center shadow-glow">
            <Activity className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="text-sm font-bold text-slate-800 dark:text-dark-50 leading-none">MediSchedule</p>
            <p className="text-xs text-blue-500 dark:text-blue-400 mt-0.5 font-medium">Doctor Portal</p>
          </div>
        </div>
      </div>

      {/* Doctor Info */}
      <div className="px-4 py-4 border-b-2 border-blue-100 dark:border-dark-800">
        <div className="flex items-center gap-3 px-2 py-2">
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-600 to-cyan-400 flex items-center justify-center text-white text-sm font-semibold flex-shrink-0">
            {user?.firstName?.[0]}{user?.lastName?.[0]}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-slate-800 dark:text-dark-100 break-words whitespace-normal">
              Dr. {user?.firstName} {user?.lastName}
            </p>
            <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-blue-500/20 text-blue-600 dark:text-blue-400">
              Doctor
            </span>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        <p className="text-xs font-bold text-slate-800 dark:text-dark-200 uppercase tracking-wider px-3 mb-3">
          {t('Navigation')}
        </p>
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `nav-item group ${isActive ? 'active' : ''}`
            }
          >
            <Icon className="w-4 h-4 flex-shrink-0" />
            <span className="flex-1">{t(label)}</span>
            <ChevronRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-50 transition-opacity" />
          </NavLink>
        ))}
      </nav>
    </aside>
  )
}
