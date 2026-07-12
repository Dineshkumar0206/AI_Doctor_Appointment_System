import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import {
  Stethoscope, Users, CalendarDays, Clock,
  CheckCircle, XCircle, TrendingUp, Activity, Bot,
} from 'lucide-react'
import { dashboardApi } from '../api/dashboard'
import { appointmentApi } from '../api/appointments'
import { patientApi } from '../api/patients'
import { StatCard } from '../components/ui/StatCard'
import { formatTimeTo12Hour } from '../utils/timeFormat'
import { Badge } from '../components/ui/Badge'
import { Spinner } from '../components/ui/Spinner'
import { useAuth } from '../context/AuthContext'
import { format } from 'date-fns'

export default function DashboardPage() {
  const { hasRole, user } = useAuth()
  const isPatient = hasRole('ROLE_PATIENT')
  const isAdmin = hasRole('ROLE_ADMIN')
  const isDoctor = hasRole('ROLE_DOCTOR')

  // Load patient profile to get patientId if logged in as a Patient
  const { data: currentPatient } = useQuery({
    queryKey: ['current-patient', user?.id],
    queryFn: () => patientApi.getByUserId(user!.id),
    enabled: isPatient && !!user?.id,
  })
  const patientId = currentPatient?.data?.id

  // Load patient's specific appointments
  const { data: patientAppointmentsData, isLoading: loadingPatientApts } = useQuery({
    queryKey: ['patient-appointments', patientId],
    queryFn: () => appointmentApi.search({ patientId, page: 0, size: 5 }),
    enabled: !!patientId,
  })
  const patientAppointments = patientAppointmentsData?.data?.content ?? []

  // Load system stats (Admin / Doctor only)
  const { data: statsData, isLoading: loadingStats } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: dashboardApi.getStats,
    enabled: isAdmin || isDoctor,
  })

  // Load today's system-wide appointments (Admin / Doctor only)
  const { data: todayData, isLoading: loadingToday } = useQuery({
    queryKey: ['today-appointments'],
    queryFn: appointmentApi.getToday,
    enabled: isAdmin || isDoctor,
  })

  const stats = statsData?.data
  const todayAppointments = todayData?.data ?? []

  if (isPatient) {
    if (loadingPatientApts || !patientId) {
      return (
        <div className="flex items-center justify-center h-64">
          <Spinner size="lg" />
        </div>
      )
    }

    return (
      <div className="space-y-8 animate-fade-in">
        {/* Header */}
        <div className="page-header flex items-center justify-between">
          <div>
            <h1 className="page-title">Welcome, {user?.firstName}!</h1>
            <p className="page-subtitle">
              {format(new Date(), 'EEEE, MMMM dd yyyy')} · Manage your healthcare appointments
            </p>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 glass-card text-emerald-400 text-sm">
            <Activity className="w-4 h-4 animate-pulse" />
            <span className="font-medium">System Live</span>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="glass-card p-6 flex flex-col justify-between">
            <div>
              <h3 className="text-lg font-semibold text-dark-50 mb-2">Book an Appointment</h3>
              <p className="text-sm text-dark-400 mb-4">
                Schedule a consultation with our experienced medical specialists.
              </p>
            </div>
            <Link to="/appointments" className="btn-primary w-fit flex items-center gap-2">
              <CalendarDays className="w-4 h-4" /> Book Now
            </Link>
          </div>

          <div className="glass-card p-6 flex flex-col justify-between">
            <div>
              <h3 className="text-lg font-semibold text-dark-50 mb-2">AI Assistant</h3>
              <p className="text-sm text-dark-400 mb-4">
                Consult with our AI medical agent to suggest slots, search doctors, and answer queries.
              </p>
            </div>
            <Link to="/ai-assistant" className="btn-secondary w-fit flex items-center gap-2">
              <Bot className="w-4 h-4 text-primary-400" /> Chat with AI
            </Link>
          </div>
        </div>

        {/* Patient's Appointments Table */}
        <div className="glass-card">
          <div className="flex items-center justify-between px-6 py-4 border-b border-dark-700">
            <h2 className="text-base font-semibold text-dark-100">Your Appointments</h2>
            <span className="text-xs text-dark-400 bg-dark-800 px-3 py-1 rounded-full">
              {patientAppointments.length} total
            </span>
          </div>

          {patientAppointments.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-dark-500">
              <CalendarDays className="w-12 h-12 mb-3 opacity-30" />
              <p className="text-sm">You have no appointments scheduled.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Doctor</th>
                    <th>Specialization</th>
                    <th>Date</th>
                    <th>Time</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {patientAppointments.map(apt => (
                    <tr key={apt.id}>
                      <td>
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-primary-500/20 flex items-center justify-center text-primary-400 text-xs font-bold">
                            {apt.doctorName.split(' ').map(n => n[0]).join('')}
                          </div>
                          <span className="font-medium text-dark-100">Dr. {apt.doctorName}</span>
                        </div>
                      </td>
                      <td className="text-dark-400">{apt.doctorSpecialization}</td>
                      <td className="text-dark-300">{apt.appointmentDate}</td>
                      <td className="text-dark-300 font-mono text-xs">
                        {formatTimeTo12Hour(apt.startTime)} – {formatTimeTo12Hour(apt.endTime)}
                      </td>
                      <td><Badge status={apt.status} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    )
  }

  if (loadingStats) {
    return (
      <div className="flex items-center justify-center h-64">
        <Spinner size="lg" />
      </div>
    )
  }

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="page-header flex items-center justify-between">
        <div>
          <h1 className="page-title">Dashboard</h1>
          <p className="page-subtitle">
            {format(new Date(), 'EEEE, MMMM dd yyyy')} · Welcome back!
          </p>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 glass-card text-emerald-400 text-sm">
          <Activity className="w-4 h-4 animate-pulse" />
          <span className="font-medium">System Live</span>
        </div>
      </div>

      {/* Stat Cards - Row 1 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
        <StatCard title="Total Doctors"      value={stats?.totalDoctors ?? 0}       icon={Stethoscope}  color="primary" />
        <StatCard title="Total Patients"     value={stats?.totalPatients ?? 0}      icon={Users}        color="accent"  />
        <StatCard title="Today's Appts"      value={stats?.todayAppointments ?? 0}  icon={CalendarDays} color="warning" />
        <StatCard title="Upcoming"           value={stats?.upcomingAppointments ?? 0} icon={Clock}      color="success" />
      </div>

      {/* Stat Cards - Row 2 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
        <StatCard title="Total Appointments" value={stats?.totalAppointments ?? 0}   icon={CalendarDays} color="primary" />
        <StatCard title="Completed"          value={stats?.completedAppointments ?? 0} icon={CheckCircle} color="success" />
        <StatCard title="Cancelled"          value={stats?.cancelledAppointments ?? 0} icon={XCircle}    color="danger"  />
        <StatCard title="Pending"            value={stats?.pendingAppointments ?? 0}   icon={TrendingUp}  color="warning" />
      </div>

      {/* Today's Appointments Table */}
      <div className="glass-card">
        <div className="flex items-center justify-between px-6 py-4 border-b border-dark-700">
          <h2 className="text-base font-semibold text-dark-100">Today's Appointments</h2>
          <span className="text-xs text-dark-400 bg-dark-800 px-3 py-1 rounded-full">
            {todayAppointments.length} scheduled
          </span>
        </div>

        {loadingToday ? (
          <div className="flex justify-center py-12"><Spinner /></div>
        ) : todayAppointments.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-dark-500">
            <CalendarDays className="w-12 h-12 mb-3 opacity-30" />
            <p className="text-sm">No appointments scheduled for today</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Patient</th>
                  <th>Doctor</th>
                  <th>Specialization</th>
                  <th>Time</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {todayAppointments.map(apt => (
                  <tr key={apt.id}>
                    <td>
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-primary-500/20 flex items-center justify-center text-primary-400 text-xs font-bold">
                          {apt.patientName.split(' ').map(n => n[0]).join('')}
                        </div>
                        <span className="font-medium text-dark-100">{apt.patientName}</span>
                      </div>
                    </td>
                    <td className="text-dark-300">Dr. {apt.doctorName}</td>
                    <td className="text-dark-400">{apt.doctorSpecialization}</td>
                    <td className="text-dark-300 font-mono text-xs">
                      {formatTimeTo12Hour(apt.startTime)} – {formatTimeTo12Hour(apt.endTime)}
                    </td>
                    <td><Badge status={apt.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
