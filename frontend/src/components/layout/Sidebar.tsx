import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard,
  Stethoscope,
  Users,
  CalendarDays,
  Bot,
  Activity,
  ChevronRight,
} from 'lucide-react'
import { useAuth } from '../../context/AuthContext'

const navItems = [
  { to: '/dashboard',    icon: LayoutDashboard, label: 'Dashboard',   roles: ['ROLE_ADMIN', 'ROLE_DOCTOR', 'ROLE_PATIENT'] },
  { to: '/doctors',      icon: Stethoscope,     label: 'Doctors',     roles: ['ROLE_ADMIN', 'ROLE_DOCTOR', 'ROLE_PATIENT'] },
  { to: '/patients',     icon: Users,           label: 'Patients',    roles: ['ROLE_ADMIN', 'ROLE_DOCTOR'] },
  { to: '/appointments', icon: CalendarDays,    label: 'Appointments',roles: ['ROLE_ADMIN', 'ROLE_DOCTOR', 'ROLE_PATIENT'] },
  { to: '/ai-assistant', icon: Bot,             label: 'AI Assistant',roles: ['ROLE_ADMIN', 'ROLE_DOCTOR', 'ROLE_PATIENT'] },
]

export function Sidebar() {
  const { user, hasRole } = useAuth()

  const visibleItems = navItems.filter(item =>
    item.roles.some(role => hasRole(role)),
  )

  const roleLabel = hasRole('ROLE_ADMIN')
    ? 'Administrator'
    : hasRole('ROLE_DOCTOR')
    ? 'Doctor'
    : 'Patient'

  const roleColor = hasRole('ROLE_ADMIN')
    ? 'bg-accent-500/20 text-accent-400'
    : hasRole('ROLE_DOCTOR')
    ? 'bg-blue-500/20 text-blue-400'
    : 'bg-emerald-500/20 text-emerald-400'

  return (
    <aside className="w-64 min-h-screen bg-dark-950 border-r border-dark-800 flex flex-col">
      {/* Logo */}
      <div className="px-6 py-6 border-b border-dark-800">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center shadow-glow">
            <Activity className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="text-sm font-bold text-dark-50 leading-none">MediSchedule</p>
            <p className="text-xs text-dark-400 mt-0.5">AI Powered</p>
          </div>
        </div>
      </div>

      {/* User Info */}
      <div className="px-4 py-4 border-b border-dark-800">
        <div className="flex items-center gap-3 px-2 py-2">
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary-600 to-primary-400 flex items-center justify-center text-white text-sm font-semibold flex-shrink-0">
            {user?.firstName?.[0]}{user?.lastName?.[0]}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-dark-100 break-words whitespace-normal">
              {user?.firstName} {user?.lastName}
            </p>
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${roleColor}`}>
              {roleLabel}
            </span>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        <p className="text-xs font-semibold text-dark-500 uppercase tracking-wider px-3 mb-3">
          Navigation
        </p>
        {visibleItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `nav-item group ${isActive ? 'active' : ''}`
            }
          >
            <Icon className="w-4 h-4 flex-shrink-0" />
            <span className="flex-1">{label}</span>
            <ChevronRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-50 transition-opacity" />
          </NavLink>
        ))}
      </nav>
    </aside>
  )
}
