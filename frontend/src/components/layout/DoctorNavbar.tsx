import { Bell, Sun, Moon, User } from 'lucide-react'
import { useState, useEffect, useRef } from 'react'
import { useAuth } from '../../context/AuthContext'
import { useQuery } from '@tanstack/react-query'
import { Link, useNavigate } from 'react-router-dom'
import { doctorApi } from '../../api/doctors'
import { appointmentApi } from '../../api/appointments'
import { formatTimeTo12Hour } from '../../utils/timeFormat'

export function DoctorNavbar() {
  const { user } = useAuth()
  const navigate = useNavigate()
  
  const [dark, setDark] = useState(true)
  const [showProfileMenu, setShowProfileMenu] = useState(false)
  const [showNotifications, setShowNotifications] = useState(false)
  
  const profileRef = useRef<HTMLDivElement>(null)
  const notificationsRef = useRef<HTMLDivElement>(null)

  const toggleTheme = () => {
    const isDark = !dark
    setDark(isDark)
    if (isDark) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setShowProfileMenu(false)
      }
      if (notificationsRef.current && !notificationsRef.current.contains(event.target as Node)) {
        setShowNotifications(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Load doctor profile to get doctorId
  const { data: currentDoctor } = useQuery({
    queryKey: ['current-doctor-nav', user?.id],
    queryFn: () => doctorApi.getByUserId(user!.id),
    enabled: !!user?.id,
  })
  const doctorId = currentDoctor?.data?.id

  // Fetch appointments for notifications (upcoming for this doctor)
  const { data: appointmentsData } = useQuery({
    queryKey: ['doctor-navbar-notifications', doctorId],
    queryFn: () => appointmentApi.search({
      doctorId: doctorId || -1,
      page: 0,
      size: 5,
    }),
    enabled: !!doctorId,
  })

  const appointments = appointmentsData?.data?.content ?? []
  
  const notificationsList = appointments
    .filter(apt => apt.status === 'PENDING' || apt.status === 'CONFIRMED')
    .map(apt => ({
      id: apt.id,
      title: `Upcoming appointment with ${apt.patientName}`,
      subtitle: `${apt.appointmentDate} · ${formatTimeTo12Hour(apt.startTime)}`,
      status: apt.status,
    }))



  return (
    <header className="h-16 bg-dark-950 border-b border-dark-800 flex items-center justify-between px-6 z-20">
      {/* Search / Context placeholder */}
      <div>
        <p className="text-sm font-semibold text-dark-100">
          Good Day, <span className="text-blue-400">Dr. {user?.firstName}</span> 👋
        </p>
        <p className="text-xs text-dark-400">Here's your schedule details for today.</p>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-4">
        {/* Dark mode */}
        <button
          onClick={toggleTheme}
          className="p-2 text-dark-400 hover:text-dark-100 hover:bg-dark-900 rounded-lg transition-colors"
          title="Toggle Theme"
        >
          {dark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </button>

        {/* Notifications */}
        <div className="relative" ref={notificationsRef}>
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="p-2 text-dark-400 hover:text-dark-100 hover:bg-dark-900 rounded-lg transition-colors relative"
          >
            <Bell className="w-4 h-4" />
            {notificationsList.length > 0 && (
              <span className="absolute top-1 right-1 w-2 h-2 bg-blue-500 rounded-full animate-pulse-glow" />
            )}
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 bg-dark-900 border border-dark-800 rounded-xl shadow-xl py-2 z-50 animate-slide-up">
              <div className="px-4 py-2 border-b border-dark-800">
                <p className="text-xs font-semibold text-dark-300 uppercase tracking-wider">
                  Upcoming Consultations ({notificationsList.length})
                </p>
              </div>
              <div className="max-h-64 overflow-y-auto">
                {notificationsList.length === 0 ? (
                  <div className="px-4 py-6 text-center text-dark-500 text-sm">
                    No upcoming appointments
                  </div>
                ) : (
                  notificationsList.map(notif => (
                    <div
                      key={notif.id}
                      onClick={() => {
                        setShowNotifications(false)
                        navigate('/doctor/appointments')
                      }}
                      className="px-4 py-3 border-b border-dark-800/50 hover:bg-dark-850 cursor-pointer transition-colors"
                    >
                      <p className="text-sm font-medium text-dark-100">{notif.title}</p>
                      <p className="text-xs text-dark-400 mt-1">{notif.subtitle}</p>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* Divider */}
        <div className="w-px h-6 bg-dark-800" />

        {/* Profile Menu */}
        <div className="relative" ref={profileRef}>
          <button
            onClick={() => setShowProfileMenu(!showProfileMenu)}
            className="flex items-center gap-2.5 hover:bg-dark-900 p-1.5 rounded-lg transition-colors"
          >
            <div className="w-7 h-7 rounded-full bg-blue-500 flex items-center justify-center text-white text-xs font-semibold">
              {user?.firstName?.[0]}{user?.lastName?.[0]}
            </div>
            <span className="text-sm font-medium text-dark-200 hidden md:inline">
              Dr. {user?.firstName}
            </span>
          </button>

          {showProfileMenu && (
            <div className="absolute right-0 mt-2 w-48 bg-dark-900 border border-dark-800 rounded-xl shadow-xl py-1 z-50 animate-slide-up">
              <Link
                to="/doctor/profile"
                onClick={() => setShowProfileMenu(false)}
                className="flex items-center gap-2 px-4 py-2 text-sm text-dark-300 hover:bg-dark-850 hover:text-dark-100 transition-colors"
              >
                <User className="w-4 h-4 text-dark-400" />
                <span>My Profile</span>
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
