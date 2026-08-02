import { useQuery } from '@tanstack/react-query'
import api from '../api/axios'
import { Calendar, CheckCircle2, Clock, XCircle, AlertCircle, CalendarRange } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useState } from 'react'
import { formatTimeTo12Hour } from '../utils/timeFormat'

interface Stats {
  todayAppointments: number
  upcomingAppointments: number
  completedAppointments: number
  cancelledAppointments: number
}

interface Appointment {
  id: number
  patientId: number
  patientName: string
  patientEmail: string
  appointmentDate: string
  startTime: string
  endTime: string
  status: string
  reason: string
}

export default function DoctorDashboardPage() {
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0])

  // Fetch Dashboard Stats
  const { data: statsRes, isLoading: statsLoading } = useQuery({
    queryKey: ['doctor-stats'],
    queryFn: () => api.get('/doctor/dashboard/stats').then(res => res.data.data as Stats),
  })

  // Fetch Today's Schedule
  const { data: scheduleRes, isLoading: scheduleLoading } = useQuery({
    queryKey: ['doctor-schedule'],
    queryFn: () => api.get('/doctor/dashboard/schedule').then(res => res.data.data as Appointment[]),
  })

  // Fetch Upcoming Appointments (for Section 3)
  const { data: upcomingRes, isLoading: upcomingLoading } = useQuery({
    queryKey: ['doctor-upcoming-appointments-dash'],
    queryFn: () => api.get('/doctor/appointments?status=CONFIRMED&size=5').then(res => res.data.data.content as Appointment[]),
  })

  const stats = statsRes ?? { todayAppointments: 0, upcomingAppointments: 0, completedAppointments: 0, cancelledAppointments: 0 }
  const todaySchedule = scheduleRes ?? []
  const upcomingAppointments = upcomingRes ?? []

  const statCards = [
    { label: "Today's Appointments", value: stats.todayAppointments, icon: Clock, color: 'text-blue-500 dark:text-blue-400', bg: 'bg-blue-50 dark:bg-blue-500/10 border-blue-200 dark:border-blue-500/20' },
    { label: 'Upcoming Appointments', value: stats.upcomingAppointments, icon: CalendarRange, color: 'text-purple-500 dark:text-purple-400', bg: 'bg-purple-50 dark:bg-purple-500/10 border-purple-200 dark:border-purple-500/20' },
    { label: 'Completed Consultations', value: stats.completedAppointments, icon: CheckCircle2, color: 'text-emerald-500 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/20' },
    { label: 'Cancelled/Missed', value: stats.cancelledAppointments, icon: XCircle, color: 'text-red-500 dark:text-red-400', bg: 'bg-red-50 dark:bg-red-500/10 border-red-200 dark:border-red-500/20' },
  ]

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PENDING':
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-500/20 text-amber-400 border border-amber-500/30">Pending</span>
      case 'CONFIRMED':
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-500/20 text-blue-400 border border-blue-500/30">Confirmed</span>
      case 'COMPLETED':
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">Completed</span>
      case 'CANCELLED':
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-red-500/20 text-red-400 border border-red-500/30">Cancelled</span>
      default:
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-dark-700 text-dark-300">{status}</span>
    }
  }

  return (
    <div className="space-y-8">
      {/* Welcome banner */}
      <div className="relative rounded-2xl overflow-hidden bg-gradient-to-r from-blue-600 to-indigo-600 p-8 shadow-lg">
        <div className="absolute inset-0 opacity-10 bg-[linear-gradient(to_right,#808080_1px,transparent_1px),linear-gradient(to_bottom,#808080_1px,transparent_1px)] bg-[size:24px_24px]" />
        <div className="relative z-10">
          <h1 className="text-3xl font-bold text-white mb-2">Welcome to your Workspace</h1>
          <p className="text-blue-100 max-w-xl">
            You have {stats.todayAppointments} consultations scheduled for today. Review diagnoses, manage notes, or use our integrated medical AI helper features to guide your care.
          </p>
        </div>
      </div>

      {/* Statistics Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((card, idx) => {
          const Icon = card.icon
          return (
            <div key={idx} className={`p-6 rounded-xl border ${card.bg} flex items-center justify-between`}>
              <div className="space-y-1">
                <p className="text-sm text-dark-400 dark:text-dark-400 font-medium">{card.label}</p>
                <p className="text-3xl font-bold text-dark-50 dark:text-dark-50">
                  {statsLoading ? (
                    <span className="inline-block w-8 h-8 rounded bg-dark-200 dark:bg-dark-800 animate-pulse" />
                  ) : (
                    card.value
                  )}
                </p>
              </div>
              <div className={`w-12 h-12 rounded-xl bg-white/80 dark:bg-dark-900 flex items-center justify-center shadow-sm`}>
                <Icon className={`w-6 h-6 ${card.color}`} />
              </div>
            </div>
          )
        })}
      </div>

      {/* Main Schedule & Sidebar Columns */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Today's Schedule */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-dark-50 flex items-center gap-2.5">
              <Clock className="w-5 h-5 text-blue-400" />
              <span>Today's Schedule</span>
            </h2>
            <Link to="/doctor/appointments" className="text-sm font-semibold text-blue-400 hover:underline">
              View All
            </Link>
          </div>

          <div className="bg-dark-950 border border-dark-800 rounded-xl overflow-hidden">
            {scheduleLoading ? (
              <div className="p-12 text-center text-dark-500">
                <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                Loading schedule...
              </div>
            ) : todaySchedule.length === 0 ? (
              <div className="p-12 text-center text-dark-500">
                <AlertCircle className="w-8 h-8 mx-auto text-dark-600 mb-3" />
                <p className="text-sm">No consultations scheduled for today.</p>
              </div>
            ) : (
              <div className="divide-y divide-dark-800">
                {todaySchedule.map(apt => (
                  <div key={apt.id} className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-dark-900/40 transition-colors">
                    <div className="space-y-1">
                      <p className="font-semibold text-dark-100">{apt.patientName}</p>
                      <p className="text-xs text-dark-400 font-mono">{formatTimeTo12Hour(apt.startTime)} - {formatTimeTo12Hour(apt.endTime)}</p>
                      <p className="text-sm text-dark-300 mt-1 line-clamp-1">{apt.reason || 'No description provided.'}</p>
                    </div>
                    <div className="flex items-center gap-4">
                      {getStatusBadge(apt.status)}
                      <Link
                        to={`/doctor/appointments?id=${apt.id}`}
                        className="px-4 py-1.5 rounded-lg text-xs font-semibold border border-dark-700 bg-dark-900 hover:bg-dark-850 text-dark-200 transition-colors text-center"
                      >
                        Consult
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Calendar and Upcoming */}
        <div className="space-y-6">
          <h2 className="text-xl font-bold text-dark-50 flex items-center gap-2.5">
            <Calendar className="w-5 h-5 text-blue-400" />
            <span>Calendar Overview</span>
          </h2>

          {/* Simple Inline Calendar Visual */}
          <div className="bg-dark-950 border border-dark-800 rounded-xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-dark-100">
                {new Date().toLocaleString('default', { month: 'long', year: 'numeric' })}
              </span>
            </div>
            
            <div className="grid grid-cols-7 gap-1 text-center text-xs font-semibold text-dark-500">
              <span>S</span><span>M</span><span>T</span><span>W</span><span>T</span><span>F</span><span>S</span>
            </div>
            
            <div className="grid grid-cols-7 gap-1 text-center text-xs">
              {/* Simple layout representing dates around today */}
              {Array.from({ length: 31 }, (_, i) => {
                const day = i + 1
                const isToday = day === new Date().getDate()
                return (
                  <button
                    key={day}
                    disabled
                    className={`p-2 rounded-lg font-semibold ${
                      isToday
                        ? 'bg-blue-500 text-white shadow-glow'
                        : 'text-dark-300 hover:bg-dark-900'
                    }`}
                  >
                    {day}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Upcoming Consultations */}
          <div className="space-y-3">
            <h3 className="text-sm font-bold text-dark-400 uppercase tracking-wider">Upcoming Next</h3>
            
            {upcomingLoading ? (
              <div className="p-4 text-center text-dark-600 text-xs">Loading...</div>
            ) : upcomingAppointments.length === 0 ? (
              <div className="p-4 text-center text-dark-600 border border-dark-800 border-dashed rounded-lg text-xs">
                No upcoming consultations
              </div>
            ) : (
              <div className="space-y-3">
                {upcomingAppointments.map(apt => (
                  <div key={apt.id} className="p-4 bg-dark-950 border border-dark-800 rounded-xl flex items-center justify-between">
                    <div>
                      <p className="text-sm font-semibold text-dark-100">{apt.patientName}</p>
                      <p className="text-xs text-dark-400 mt-0.5">{apt.appointmentDate} · {formatTimeTo12Hour(apt.startTime)}</p>
                    </div>
                    <Link
                      to={`/doctor/appointments?id=${apt.id}`}
                      className="text-xs text-blue-400 hover:underline font-semibold"
                    >
                      View
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  )
}
