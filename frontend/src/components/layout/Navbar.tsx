import { Bell, Search, Sun, Moon, User } from 'lucide-react'
import { useState, useEffect, useRef } from 'react'
import { useAuth } from '../../context/AuthContext'
import { useQuery } from '@tanstack/react-query'
import { doctorApi } from '../../api/doctors'
import { patientApi } from '../../api/patients'
import { appointmentApi } from '../../api/appointments'
import { Link, useNavigate } from 'react-router-dom'
import { formatTimeTo12Hour } from '../../utils/timeFormat'

export function Navbar() {
  const { user, hasRole } = useAuth()
  const navigate = useNavigate()
  
  const [dark, setDark] = useState(() => {
    const saved = localStorage.getItem('theme')
    return saved !== 'light'
  })
  const [searchVal, setSearchVal] = useState('')
  const [showProfileMenu, setShowProfileMenu] = useState(false)
  const [showNotifications, setShowNotifications] = useState(false)
  
  const profileRef = useRef<HTMLDivElement>(null)
  const notificationsRef = useRef<HTMLDivElement>(null)
  const searchRef = useRef<HTMLDivElement>(null)

  // Toggle theme and update standard HTML class
  const toggleTheme = () => {
    const isDark = !dark
    setDark(isDark)
    if (isDark) {
      document.documentElement.classList.add('dark')
      localStorage.setItem('theme', 'dark')
    } else {
      document.documentElement.classList.remove('dark')
      localStorage.setItem('theme', 'light')
    }
  }

  // Handle clicking outside of dropdowns to close them
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setShowProfileMenu(false)
      }
      if (notificationsRef.current && !notificationsRef.current.contains(event.target as Node)) {
        setShowNotifications(false)
      }
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setSearchVal('')
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // 1. SEARCH: Query matching doctors in real-time
  const { data: doctorsData } = useQuery({
    queryKey: ['navbar-doctors-list'],
    queryFn: () => doctorApi.getAllList(),
    enabled: searchVal.trim().length > 1,
  })
  
  const matchingDoctors = doctorsData?.data?.filter(doc => 
    doc.fullName.toLowerCase().includes(searchVal.toLowerCase()) ||
    doc.specialization.toLowerCase().includes(searchVal.toLowerCase()) ||
    (doc.bio && doc.bio.toLowerCase().includes(searchVal.toLowerCase()))
  ) ?? []

  const handleDoctorClick = (docId: number) => {
    setSearchVal('')
    navigate(`/appointments?doctorId=${docId}`)
  }

  // 2. NOTIFICATIONS: Fetch upcoming appointments
  const isPatient = hasRole('ROLE_PATIENT')

  // Load patient profile to get patientId if logged in as a Patient
  const { data: currentPatient } = useQuery({
    queryKey: ['current-patient-nav', user?.id],
    queryFn: () => patientApi.getByUserId(user!.id),
    enabled: isPatient && !!user?.id,
  })
  const patientId = currentPatient?.data?.id

  // Fetch appointments for notifications list
  const { data: appointmentsData } = useQuery({
    queryKey: ['navbar-notifications-appointments', patientId, user?.id],
    queryFn: () => appointmentApi.search({
      patientId: isPatient ? (patientId || -1) : undefined,
      page: 0,
      size: 5,
    }),
    enabled: !!user?.id && (!isPatient || (isPatient && !!patientId)),
  })

  const appointments = appointmentsData?.data?.content ?? []
  
  const notificationsList = appointments
    .filter(apt => apt.status === 'PENDING' || apt.status === 'CONFIRMED')
    .map(apt => ({
      id: apt.id,
      title: isPatient ? `Appointment with Dr. ${apt.doctorName}` : `Appointment with ${apt.patientName}`,
      subtitle: `${apt.appointmentDate} · ${formatTimeTo12Hour(apt.startTime)} - ${formatTimeTo12Hour(apt.endTime)}`,
      status: apt.status,
    }))



  return (
    <header className="h-16 bg-dark-950/80 backdrop-blur-xl border-b border-dark-800 flex items-center px-6 gap-4 sticky top-0 z-30">
      {/* Search Bar */}
      <div ref={searchRef} className="flex-1 max-w-md relative">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-400" />
          <input
            type="text"
            value={searchVal}
            onChange={e => setSearchVal(e.target.value)}
            placeholder="Search doctors, specializations, locations..."
            className="w-full bg-dark-800 border border-dark-700 text-dark-200 placeholder-dark-500
                       rounded-xl pl-10 pr-4 py-2 text-sm focus:outline-none focus:border-primary-500
                       focus:ring-1 focus:ring-primary-500/30 transition-all"
          />
        </div>

        {/* Floating Search Dropdown */}
        {searchVal.trim().length > 1 && (
          <div className="absolute top-full left-0 right-0 mt-2 bg-dark-800 border border-dark-700 rounded-xl shadow-xl z-50 max-h-60 overflow-y-auto divide-y divide-dark-700">
            {matchingDoctors.length === 0 ? (
              <div className="p-4 text-sm text-dark-400 text-center">No matching doctors found</div>
            ) : (
              matchingDoctors.map(doc => (
                <div
                  key={doc.id}
                  onClick={() => handleDoctorClick(doc.id)}
                  className="p-3 hover:bg-dark-700 cursor-pointer flex flex-col gap-0.5 transition-colors"
                >
                  <div className="text-sm font-semibold text-dark-100">Dr. {doc.fullName}</div>
                  <div className="text-xs text-primary-400">{doc.specialization} · {doc.experience} yrs exp</div>
                  <div className="text-xs text-dark-400 line-clamp-1">{doc.bio}</div>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      <div className="flex items-center gap-2 ml-auto">
        {/* Theme toggle */}
        <button
          onClick={toggleTheme}
          className="w-9 h-9 rounded-xl bg-dark-800 border border-dark-700 flex items-center justify-center
                     text-dark-400 hover:text-dark-200 hover:border-dark-600 transition-all"
          aria-label="Toggle theme"
        >
          {dark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </button>

        {/* Notifications */}
        <div ref={notificationsRef} className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative w-9 h-9 rounded-xl bg-dark-800 border border-dark-700 flex items-center justify-center
                       text-dark-400 hover:text-dark-200 hover:border-dark-600 transition-all"
            aria-label="Notifications"
          >
            <Bell className="w-4 h-4" />
            {notificationsList.length > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-primary-500 rounded-full ring-2 ring-dark-950" />
            )}
          </button>

          {/* Floating Notifications Dropdown */}
          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 bg-dark-800 border border-dark-700 rounded-xl shadow-xl z-50 py-2 divide-y divide-dark-700">
              <div className="px-4 py-2 text-xs font-semibold text-dark-300 uppercase tracking-wider">
                Upcoming Appointments
              </div>
              <div className="max-h-64 overflow-y-auto divide-y divide-dark-700">
                {notificationsList.length === 0 ? (
                  <div className="p-4 text-sm text-dark-400 text-center">No upcoming appointments</div>
                ) : (
                  notificationsList.map(notif => (
                    <div key={notif.id} className="p-3 hover:bg-dark-700 transition-colors flex flex-col gap-0.5">
                      <div className="text-sm font-medium text-dark-100">{notif.title}</div>
                      <div className="text-xs text-dark-400">{notif.subtitle}</div>
                      <div className="text-[10px] uppercase font-bold tracking-wider mt-1 text-primary-400">{notif.status}</div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* Avatar Profile Settings Menu */}
        <div ref={profileRef} className="relative">
          <div
            onClick={() => setShowProfileMenu(!showProfileMenu)}
            className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary-600 to-accent-500
                       flex items-center justify-center text-white text-xs font-bold cursor-pointer
                       hover:opacity-90 transition-opacity shadow-glow"
          >
            {user?.firstName?.[0]}{user?.lastName?.[0]}
          </div>

          {/* Floating Profile Settings Dropdown */}
          {showProfileMenu && (
            <div className="absolute right-0 mt-2 w-56 bg-dark-800 border border-dark-700 rounded-xl shadow-xl z-50 py-2 divide-y divide-dark-700">
              <div className="px-4 py-2.5 flex flex-col gap-0.5">
                <div className="text-sm font-semibold text-dark-50 truncate">{user?.firstName} {user?.lastName}</div>
                <div className="text-xs text-dark-400 truncate">{user?.email}</div>
                <div className="text-[10px] font-bold tracking-wider text-primary-400 uppercase mt-1">
                  {user?.roles?.[0]?.replace('ROLE_', '')}
                </div>
              </div>
              <div className="py-1">
                <Link
                  to="/profile"
                  onClick={() => setShowProfileMenu(false)}
                  className="flex items-center gap-2 px-4 py-2 text-sm text-dark-300 hover:bg-dark-700 hover:text-dark-100 transition-colors"
                >
                  <User className="w-4 h-4 text-dark-400" />
                  My Profile
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
