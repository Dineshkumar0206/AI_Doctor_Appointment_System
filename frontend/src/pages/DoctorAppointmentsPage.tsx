import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useSearchParams } from 'react-router-dom'
import api from '../api/axios'
import {
  Calendar,
  Search,
  Filter,
  CheckCircle,
  XCircle,
  Clock,
  ChevronRight,
  Sparkles,
  Save,
  CalendarDays,
  FileText,
  AlertCircle,
  Copy,
  Activity
} from 'lucide-react'
import { useState, useEffect } from 'react'
import toast from 'react-hot-toast'
import { formatTimeTo12Hour } from '../utils/timeFormat'

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
  notes: string
  aiSummary: string
  diagnosis: string
  prescription: string
  advice: string
  followUpDate: string
}

export default function DoctorAppointmentsPage() {
  const queryClient = useQueryClient()
  const [searchParams, setSearchParams] = useSearchParams()
  
  // States
  const [statusFilter, setStatusFilter] = useState<string>('ALL')
  const [searchVal, setSearchVal] = useState<string>('')
  const [selectedAptId, setSelectedAptId] = useState<number | null>(null)
  
  // Reschedule & Cancel modals
  const [showReschedule, setShowReschedule] = useState<boolean>(false)
  const [rescheduleData, setRescheduleData] = useState({ date: '', time: '' })
  const [showCancel, setShowCancel] = useState<boolean>(false)
  const [cancelReason, setCancelReason] = useState<string>('')

  // Consultation notes editing states
  const [notesForm, setNotesForm] = useState({
    diagnosis: '',
    prescription: '',
    advice: '',
    followUpDate: ''
  })
  const [simpleNotes, setSimpleNotes] = useState('')

  // AI assistant loading/output states
  const [aiLoading, setAiLoading] = useState<string | null>(null)
  const [aiOutput, setAiOutput] = useState<string>('')

  // Direct ID check from URL (e.g. from Dashboard click)
  const paramId = searchParams.get('id')
  useEffect(() => {
    if (paramId) {
      setSelectedAptId(Number(paramId))
    }
  }, [paramId])

  // Fetch Appointments
  const { data: appointmentsRes, isLoading: aptsLoading } = useQuery({
    queryKey: ['doctor-appointments', statusFilter, searchVal],
    queryFn: () => {
      const statusParam = statusFilter !== 'ALL' ? `&status=${statusFilter}` : ''
      const searchParam = searchVal ? `&keyword=${searchVal}` : ''
      return api.get(`/doctor/appointments?size=50${statusParam}${searchParam}`)
        .then(res => res.data.data.content as Appointment[])
    }
  })
  const appointments = appointmentsRes ?? []

  // Fetch Selected Appointment Details
  const { data: detailRes, isLoading: detailLoading } = useQuery({
    queryKey: ['doctor-appointment-detail', selectedAptId],
    queryFn: () => api.get(`/doctor/appointments/${selectedAptId}`)
      .then(res => res.data.data as Appointment),
    enabled: !!selectedAptId
  })
  const selectedApt = detailRes

  // Sync edit states when selection loads
  useEffect(() => {
    if (selectedApt) {
      setNotesForm({
        diagnosis: selectedApt.diagnosis || '',
        prescription: selectedApt.prescription || '',
        advice: selectedApt.advice || '',
        followUpDate: selectedApt.followUpDate || ''
      })
      setSimpleNotes(selectedApt.notes || '')
    }
  }, [selectedApt])

  // Mutations
  const updateNotesMutation = useMutation({
    mutationFn: (notes: string) => api.put(`/doctor/appointments/${selectedAptId}/notes`, { notes }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['doctor-appointment-detail', selectedAptId] })
      toast.success('Notes saved')
    }
  })

  const saveConsultationMutation = useMutation({
    mutationFn: (data: typeof notesForm) => api.put(`/doctor/appointments/${selectedAptId}/consultation`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['doctor-appointment-detail', selectedAptId] })
      toast.success('Consultation notes saved')
    }
  })

  const completeMutation = useMutation({
    mutationFn: (data: typeof notesForm) => api.post(`/doctor/appointments/${selectedAptId}/complete`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['doctor-appointments'] })
      queryClient.invalidateQueries({ queryKey: ['doctor-appointment-detail', selectedAptId] })
      toast.success('Appointment Completed! Patient notified via email.')
    }
  })

  const cancelMutation = useMutation({
    mutationFn: (reason: string) => api.post(`/doctor/appointments/${selectedAptId}/cancel`, { reason }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['doctor-appointments'] })
      queryClient.invalidateQueries({ queryKey: ['doctor-appointment-detail', selectedAptId] })
      setShowCancel(false)
      setCancelReason('')
      toast.success('Appointment Cancelled! Patient notified via email.')
    }
  })

  const rescheduleMutation = useMutation({
    mutationFn: (data: typeof rescheduleData) => api.post(`/doctor/appointments/${selectedAptId}/reschedule?date=${data.date}&time=${data.time}`, {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['doctor-appointments'] })
      queryClient.invalidateQueries({ queryKey: ['doctor-appointment-detail', selectedAptId] })
      setShowReschedule(false)
      setRescheduleData({ date: '', time: '' })
      toast.success('Appointment Rescheduled! Patient notified via email.')
    }
  })

  const acceptMutation = useMutation({
    mutationFn: () => api.post(`/doctor/appointments/${selectedAptId}/accept`, {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['doctor-appointments'] })
      queryClient.invalidateQueries({ queryKey: ['doctor-appointment-detail', selectedAptId] })
      toast.success('Appointment Accepted! Patient notified via email.')
    }
  })

  // AI Prompt Helpers
  const triggerAi = async (endpoint: string, type: string) => {
    setAiLoading(type)
    setAiOutput('')
    try {
      const res = await api.get(`/doctor/appointments/${selectedAptId}/${endpoint}`)
      const text = res.data.data.summary || res.data.data.diagnosis || res.data.data.prescription || res.data.data.explanation || res.data.data.followup
      setAiOutput(text)
      toast.success('AI generation complete!')
    } catch (err: any) {
      toast.error('AI generation failed')
    } finally {
      setAiLoading(null)
    }
  }

  const handleCopyAi = () => {
    navigator.clipboard.writeText(aiOutput)
    toast.success('Copied to clipboard!')
  }

  const handleApplyAi = (targetField: keyof typeof notesForm) => {
    setNotesForm(prev => ({ ...prev, [targetField]: aiOutput }))
    toast.success(`Applied AI output to ${targetField}!`)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING': return 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
      case 'CONFIRMED': return 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
      case 'COMPLETED': return 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
      case 'CANCELLED': return 'bg-red-500/20 text-red-400 border border-red-500/30'
      default: return 'bg-dark-800 text-dark-300'
    }
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 min-h-[calc(100vh-8rem)]">
      {/* ── LEFT PANEL: APPOINTMENT LIST ── */}
      <div className="lg:col-span-5 bg-white dark:bg-dark-950 border-2 border-blue-200 dark:border-dark-800 rounded-2xl flex flex-col h-[calc(100vh-8rem)] overflow-hidden">
        {/* Header / Filter search */}
        <div className="p-4 border-b-2 border-blue-100 dark:border-dark-800 space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-dark-500" />
            <input
              type="text"
              value={searchVal}
              onChange={e => setSearchVal(e.target.value)}
              placeholder="Search by patient name..."
              className="w-full pl-10 pr-4 py-2 bg-blue-50 dark:bg-dark-900 border-2 border-blue-200 dark:border-dark-800 rounded-lg text-sm outline-none text-slate-700 dark:text-dark-100 placeholder-slate-400 dark:placeholder-dark-500 focus:border-blue-400 transition-colors"
            />
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
            {['ALL', 'PENDING', 'CONFIRMED', 'COMPLETED', 'CANCELLED'].map(filter => (
              <button
                key={filter}
                onClick={() => setStatusFilter(filter)}
                className={`px-3 py-1 rounded-full text-xs font-semibold border transition-all ${
                  statusFilter === filter
                    ? 'bg-blue-500 text-white border-blue-500'
                    : 'bg-white dark:bg-dark-900 text-slate-600 dark:text-dark-400 border-blue-200 dark:border-dark-800 hover:border-blue-400 hover:text-blue-600'
                }`}
              >
                {filter === 'ALL' ? 'All' : filter.charAt(0) + filter.slice(1).toLowerCase()}
              </button>
            ))}
          </div>
        </div>

        {/* List scroll */}
        <div className="flex-1 overflow-y-auto divide-y divide-dark-850">
          {aptsLoading ? (
            <div className="p-12 text-center text-dark-500 text-sm">
              <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
              Loading appointments...
            </div>
          ) : appointments.length === 0 ? (
            <div className="p-12 text-center text-dark-500 text-sm">
              <AlertCircle className="w-8 h-8 mx-auto text-dark-700 mb-2" />
              No appointments found
            </div>
          ) : (
            appointments.map(apt => (
              <div
                key={apt.id}
                onClick={() => {
                  setSelectedAptId(apt.id)
                  setSearchParams({ id: String(apt.id) })
                }}
                className={`p-4 cursor-pointer transition-all flex items-center justify-between gap-4 border-b border-blue-100 dark:border-dark-850 ${
                  selectedAptId === apt.id
                    ? 'bg-blue-100 dark:bg-dark-900 border-l-4 border-l-blue-500'
                    : 'hover:bg-blue-50 dark:hover:bg-dark-900/50'
                }`}
              >
                <div className="space-y-1 min-w-0">
                  <p className="font-semibold text-slate-800 dark:text-dark-100 truncate">{apt.patientName}</p>
                  <p className="text-xs text-slate-500 dark:text-dark-400 flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-blue-500" />
                    <span>{apt.appointmentDate} · {formatTimeTo12Hour(apt.startTime)}</span>
                  </p>
                  <p className="text-xs text-slate-600 dark:text-dark-300 line-clamp-1 mt-1">{apt.reason || 'No details provided.'}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${getStatusColor(apt.status)}`}>
                    {apt.status}
                  </span>
                  <ChevronRight className="w-4 h-4 text-blue-400 flex-shrink-0" />
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* ── RIGHT PANEL: CONSULTATION BOARD ── */}
      <div className="lg:col-span-7 space-y-6 overflow-y-auto h-[calc(100vh-8rem)] pr-2">
        {selectedAptId === null ? (
          <div className="h-full bg-white dark:bg-dark-950 border-2 border-dashed border-blue-300 dark:border-blue-500/40 rounded-2xl flex flex-col items-center justify-center p-12 text-center transition-all duration-200 shadow-sm">
            <div className="w-16 h-16 rounded-2xl bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/30 flex items-center justify-center mb-4 shadow-sm">
              <Activity className="w-8 h-8 text-blue-600 dark:text-blue-400" />
            </div>
            <h3 className="text-xl font-bold text-slate-800 dark:text-dark-50 mb-1.5">Select an Appointment</h3>
            <p className="text-sm text-slate-600 dark:text-dark-300 max-w-sm leading-relaxed">
              Select a patient appointment from the list on the left to begin the consultation and manage clinical records.
            </p>
          </div>
        ) : detailLoading ? (
          <div className="h-full bg-dark-950 border border-dark-800 rounded-2xl flex flex-col items-center justify-center p-12 text-center text-dark-500">
            <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mb-3" />
            Loading consultation records...
          </div>
        ) : selectedApt ? (
          <div className="space-y-6">
            {/* Consultation Header Card */}
            <div className="bg-white dark:bg-dark-950 border-2 border-blue-200 dark:border-dark-800 rounded-2xl p-6 space-y-4 shadow-sm">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1">
                  <span className="text-xs text-blue-400 font-bold tracking-wider uppercase">Consultation Active</span>
                  <h3 className="text-2xl font-bold text-dark-50">{selectedApt.patientName}</h3>
                  <p className="text-sm text-dark-400">{selectedApt.patientEmail}</p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className={`text-xs px-2.5 py-1 rounded-full font-bold ${getStatusColor(selectedApt.status)}`}>
                    {selectedApt.status}
                  </span>
                  
                  {selectedApt.status === 'PENDING' && (
                    <button
                      onClick={() => acceptMutation.mutate()}
                      disabled={acceptMutation.isPending}
                      className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white transition-colors"
                    >
                      {acceptMutation.isPending ? 'Accepting...' : 'Accept Request'}
                    </button>
                  )}
                  
                  {selectedApt.status !== 'COMPLETED' && selectedApt.status !== 'CANCELLED' && (
                    <>
                      <button
                        onClick={() => setShowReschedule(true)}
                        className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-dark-900 border border-dark-700 hover:bg-dark-850 text-dark-200 transition-colors"
                      >
                        Reschedule
                      </button>
                      <button
                        onClick={() => setShowCancel(true)}
                        className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20 transition-colors"
                      >
                        Cancel
                      </button>
                    </>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 pt-4 border-t border-slate-200 dark:border-dark-850 text-xs">
                <div className="bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/30 rounded-xl p-3">
                  <p className="text-blue-600 dark:text-blue-400 uppercase tracking-wider font-bold flex items-center gap-1">
                    <CalendarDays className="w-3.5 h-3.5" /> Date
                  </p>
                  <p className="font-extrabold text-slate-900 dark:text-blue-300 mt-1.5 text-sm">{selectedApt.appointmentDate}</p>
                </div>
                <div className="bg-cyan-50 dark:bg-cyan-500/10 border border-cyan-200 dark:border-cyan-500/30 rounded-xl p-3">
                  <p className="text-cyan-600 dark:text-cyan-400 uppercase tracking-wider font-bold flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" /> Time Slot
                  </p>
                  <p className="font-extrabold text-slate-900 dark:text-cyan-300 mt-1.5 text-sm">{formatTimeTo12Hour(selectedApt.startTime)} – {formatTimeTo12Hour(selectedApt.endTime)}</p>
                </div>
                <div className="col-span-2 md:col-span-1 bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/30 rounded-xl p-3">
                  <p className="text-amber-600 dark:text-amber-400 uppercase tracking-wider font-bold flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5" /> Visit Reason
                  </p>
                  <p className="font-extrabold text-slate-900 dark:text-amber-200 mt-1.5 text-sm">{selectedApt.reason || 'Not specified'}</p>
                </div>
              </div>
            </div>

            {/* Quick General Notes Section */}
            <div className="bg-white dark:bg-dark-950 border-2 border-blue-200 dark:border-blue-500/30 rounded-2xl p-6 space-y-4 shadow-sm">
              <h4 className="text-base font-bold text-slate-900 dark:text-dark-50 flex items-center gap-2">
                <FileText className="w-5 h-5 text-blue-500 dark:text-blue-400" />
                <span>General Notes</span>
              </h4>
              <textarea
                value={simpleNotes}
                onChange={e => setSimpleNotes(e.target.value)}
                placeholder="Enter quick notes or comments about this visit..."
                rows={3}
                className="w-full p-4 bg-white dark:bg-dark-900 border-2 border-blue-500/40 rounded-xl text-sm outline-none text-slate-900 dark:text-dark-100 placeholder-slate-700 dark:placeholder-blue-300 focus:border-blue-400 transition-colors resize-y font-medium"
              />
              <div className="flex justify-end">
                <button
                  onClick={() => updateNotesMutation.mutate(simpleNotes)}
                  disabled={updateNotesMutation.isPending}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs transition-all active:scale-95 disabled:opacity-55"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>{updateNotesMutation.isPending ? 'Saving...' : 'Save General Notes'}</span>
                </button>
              </div>
            </div>

            {/* Consultation Forms & AI Assistance Grid */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
              
              {/* Consultation Notes Form */}
              <div className="md:col-span-7 bg-white dark:bg-dark-950 border-2 border-blue-200 dark:border-dark-800 rounded-2xl p-6 space-y-6 shadow-sm">
                <h4 className="text-base font-bold text-slate-900 dark:text-dark-50 flex items-center gap-2">
                  <Activity className="w-5 h-5 text-blue-500 dark:text-blue-400" />
                  <span>Clinical Records</span>
                </h4>

                <div className="space-y-4">
                  {/* Diagnosis */}
                  <div>
                    <label className="block text-xs font-bold text-cyan-600 dark:text-cyan-400 mb-1.5 uppercase tracking-wide">🔬 Diagnosis</label>
                    <textarea
                      value={notesForm.diagnosis}
                      onChange={e => setNotesForm(p => ({ ...p, diagnosis: e.target.value }))}
                      placeholder="Enter clinical diagnosis details..."
                      rows={3}
                      className="w-full p-3 bg-white dark:bg-dark-900 border-2 border-cyan-500/50 rounded-lg text-sm text-slate-900 dark:text-dark-100 outline-none focus:border-cyan-500 transition-colors placeholder-slate-700 dark:placeholder-cyan-300 font-medium"
                    />
                  </div>

                  {/* Prescription */}
                  <div>
                    <label className="block text-xs font-bold text-emerald-600 dark:text-emerald-400 mb-1.5 uppercase tracking-wide">💊 Prescription</label>
                    <textarea
                      value={notesForm.prescription}
                      onChange={e => setNotesForm(p => ({ ...p, prescription: e.target.value }))}
                      placeholder="Medication names, dosage, frequencies..."
                      rows={3}
                      className="w-full p-3 bg-white dark:bg-dark-900 border-2 border-emerald-500/50 rounded-lg text-sm text-slate-900 dark:text-dark-100 outline-none focus:border-emerald-500 transition-colors placeholder-slate-700 dark:placeholder-emerald-300 font-medium"
                    />
                  </div>

                  {/* Advice */}
                  <div>
                    <label className="block text-xs font-bold text-amber-600 dark:text-amber-400 mb-1.5 uppercase tracking-wide">💡 Advice / Guidelines</label>
                    <textarea
                      value={notesForm.advice}
                      onChange={e => setNotesForm(p => ({ ...p, advice: e.target.value }))}
                      placeholder="Dietary changes, rest guidance, warnings..."
                      rows={2}
                      className="w-full p-3 bg-white dark:bg-dark-900 border-2 border-amber-500/50 rounded-lg text-sm text-slate-900 dark:text-dark-100 outline-none focus:border-amber-500 transition-colors placeholder-slate-700 dark:placeholder-amber-300 font-medium"
                    />
                  </div>

                  {/* Follow up date */}
                  <div>
                    <label className="block text-xs font-bold text-violet-600 dark:text-violet-400 mb-1.5 uppercase tracking-wide">📅 Follow-up Date (Optional)</label>
                    <div className="relative">
                      <CalendarDays className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-violet-500 dark:text-violet-400" />
                      <input
                        type="date"
                        value={notesForm.followUpDate}
                        onChange={e => setNotesForm(p => ({ ...p, followUpDate: e.target.value }))}
                        className="w-full pl-10 pr-4 py-2 bg-white dark:bg-dark-900 border-2 border-violet-500/50 rounded-lg text-sm text-slate-900 dark:text-dark-100 outline-none focus:border-violet-500 transition-colors font-medium"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 pt-4 border-t border-dark-850">
                  <button
                    onClick={() => saveConsultationMutation.mutate(notesForm)}
                    disabled={saveConsultationMutation.isPending || selectedApt.status === 'COMPLETED' || selectedApt.status === 'CANCELLED'}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg border border-dark-700 bg-dark-900 hover:bg-dark-850 text-dark-200 font-semibold text-xs transition-all active:scale-95 disabled:opacity-55"
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>Save Draft</span>
                  </button>

                  <button
                    onClick={() => completeMutation.mutate(notesForm)}
                    disabled={completeMutation.isPending || selectedApt.status === 'COMPLETED' || selectedApt.status === 'CANCELLED'}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs transition-all active:scale-95 shadow-glow-emerald disabled:opacity-55"
                  >
                    <CheckCircle className="w-3.5 h-3.5" />
                    <span>Complete Consultation</span>
                  </button>
                </div>
              </div>

              {/* AI Assistance Sidebar */}
              <div className="md:col-span-5 bg-white dark:bg-dark-950 border-2 border-blue-200 dark:border-dark-800 rounded-2xl p-6 space-y-4 shadow-sm">
                <h4 className="text-base font-bold text-dark-50 flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-blue-400" />
                  <span>Clinical AI Assistant</span>
                </h4>
                <p className="text-xs text-dark-400">Generate prompt responses based on current patient visit logs.</p>

                <div className="flex flex-col gap-2">
                  <button
                    onClick={() => triggerAi('ai-summary', 'summary')}
                    disabled={!!aiLoading}
                    className="w-full flex items-center justify-between p-2.5 text-left text-xs bg-dark-900 border border-dark-800 hover:border-blue-500/50 rounded-lg text-dark-200 transition-all font-semibold"
                  >
                    <span>Generate AI Visit Summary</span>
                    {aiLoading === 'summary' ? (
                      <span className="w-3.5 h-3.5 border border-blue-500 border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <ChevronRight className="w-4 h-4 text-dark-500" />
                    )}
                  </button>

                  <button
                    onClick={() => triggerAi('ai-diagnosis', 'diagnosis')}
                    disabled={!!aiLoading}
                    className="w-full flex items-center justify-between p-2.5 text-left text-xs bg-dark-900 border border-dark-800 hover:border-blue-500/50 rounded-lg text-dark-200 transition-all font-semibold"
                  >
                    <span>Suggest Diagnoses</span>
                    {aiLoading === 'diagnosis' ? (
                      <span className="w-3.5 h-3.5 border border-blue-500 border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <ChevronRight className="w-4 h-4 text-dark-500" />
                    )}
                  </button>

                  <button
                    onClick={() => triggerAi('ai-prescription', 'prescription')}
                    disabled={!!aiLoading}
                    className="w-full flex items-center justify-between p-2.5 text-left text-xs bg-dark-900 border border-dark-800 hover:border-blue-500/50 rounded-lg text-dark-200 transition-all font-semibold"
                  >
                    <span>Suggest Prescription</span>
                    {aiLoading === 'prescription' ? (
                      <span className="w-3.5 h-3.5 border border-blue-500 border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <ChevronRight className="w-4 h-4 text-dark-500" />
                    )}
                  </button>

                  <button
                    onClick={() => triggerAi('ai-explanation', 'explanation')}
                    disabled={!!aiLoading}
                    className="w-full flex items-center justify-between p-2.5 text-left text-xs bg-dark-900 border border-dark-800 hover:border-blue-500/50 rounded-lg text-dark-200 transition-all font-semibold"
                  >
                    <span>Explain to Patient</span>
                    {aiLoading === 'explanation' ? (
                      <span className="w-3.5 h-3.5 border border-blue-500 border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <ChevronRight className="w-4 h-4 text-dark-500" />
                    )}
                  </button>

                  <button
                    onClick={() => triggerAi('ai-followup', 'followup')}
                    disabled={!!aiLoading}
                    className="w-full flex items-center justify-between p-2.5 text-left text-xs bg-dark-900 border border-dark-800 hover:border-blue-500/50 rounded-lg text-dark-200 transition-all font-semibold"
                  >
                    <span>Follow-up Guidelines</span>
                    {aiLoading === 'followup' ? (
                      <span className="w-3.5 h-3.5 border border-blue-500 border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <ChevronRight className="w-4 h-4 text-dark-500" />
                    )}
                  </button>
                </div>

                {/* AI Output terminal */}
                {aiOutput && (
                  <div className="bg-dark-900 border border-dark-800 rounded-xl p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] uppercase font-bold tracking-wider text-blue-400">AI Recommendation</span>
                      <button onClick={handleCopyAi} className="p-1 hover:bg-dark-850 rounded text-dark-400 hover:text-white transition-colors" title="Copy Output">
                        <Copy className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <p className="text-xs text-dark-200 whitespace-pre-wrap leading-relaxed max-h-48 overflow-y-auto scrollbar-thin">{aiOutput}</p>
                    
                    {/* Apply action buttons */}
                    <div className="flex flex-wrap gap-1.5 pt-2 border-t border-dark-800/60">
                      <button onClick={() => handleApplyAi('diagnosis')} className="px-2 py-1 bg-dark-850 hover:bg-blue-500/15 hover:text-blue-300 text-[10px] rounded font-semibold text-dark-300">
                        + Apply Diagnosis
                      </button>
                      <button onClick={() => handleApplyAi('prescription')} className="px-2 py-1 bg-dark-850 hover:bg-blue-500/15 hover:text-blue-300 text-[10px] rounded font-semibold text-dark-300">
                        + Apply Prescription
                      </button>
                      <button onClick={() => handleApplyAi('advice')} className="px-2 py-1 bg-dark-850 hover:bg-blue-500/15 hover:text-blue-300 text-[10px] rounded font-semibold text-dark-300">
                        + Apply Advice
                      </button>
                    </div>
                  </div>
                )}
              </div>

            </div>

          </div>
        ) : null}
      </div>

      {/* ── RESCHEDULE MODAL ── */}
      {showReschedule && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-dark-950 border-2 border-blue-200 dark:border-dark-800 rounded-2xl max-w-sm w-full p-6 space-y-4 animate-slide-up shadow-xl">
            <h4 className="text-lg font-bold text-slate-800 dark:text-dark-50">Reschedule Appointment</h4>
            <div className="space-y-3">
              <div>
                <label className="block text-xs text-slate-700 dark:text-dark-400 mb-1 font-semibold">New Date</label>
                <input
                  type="date"
                  value={rescheduleData.date}
                  onChange={e => setRescheduleData(p => ({ ...p, date: e.target.value }))}
                  className="w-full px-3 py-2 bg-white dark:bg-dark-900 border-2 border-blue-200 dark:border-dark-800 rounded-lg text-sm text-slate-900 dark:text-dark-100 outline-none font-medium"
                />
              </div>
              <div>
                <label className="block text-xs text-slate-700 dark:text-dark-400 mb-1 font-semibold">New Time Slot</label>
                <input
                  type="time"
                  value={rescheduleData.time}
                  onChange={e => setRescheduleData(p => ({ ...p, time: e.target.value }))}
                  className="w-full px-3 py-2 bg-white dark:bg-dark-900 border-2 border-blue-200 dark:border-dark-800 rounded-lg text-sm text-slate-900 dark:text-dark-100 outline-none font-medium"
                />
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowReschedule(false)}
                className="flex-1 py-2 border border-dark-800 rounded-lg text-xs font-semibold text-dark-400 hover:text-dark-50 transition-colors"
              >
                Close
              </button>
              <button
                onClick={() => rescheduleMutation.mutate(rescheduleData)}
                disabled={rescheduleMutation.isPending || !rescheduleData.date || !rescheduleData.time}
                className="flex-1 py-2 rounded-lg bg-blue-600 hover:bg-blue-505 text-white text-xs font-semibold transition-all active:scale-95 disabled:opacity-55"
              >
                {rescheduleMutation.isPending ? 'Rescheduling...' : 'Confirm'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── CANCEL MODAL ── */}
      {showCancel && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-dark-950 border-2 border-blue-200 dark:border-dark-800 rounded-2xl max-w-sm w-full p-6 space-y-4 animate-slide-up shadow-xl">
            <h4 className="text-lg font-bold text-slate-800 dark:text-dark-50">Cancel Appointment</h4>
            <div>
              <label className="block text-xs text-slate-700 dark:text-dark-400 mb-1 font-semibold">Cancellation Reason</label>
              <textarea
                value={cancelReason}
                onChange={e => setCancelReason(e.target.value)}
                placeholder="Reason for cancellation..."
                rows={3}
                className="w-full p-3 bg-white dark:bg-dark-900 border-2 border-blue-200 dark:border-dark-800 rounded-lg text-sm text-slate-900 dark:text-dark-100 placeholder-slate-600 dark:placeholder-dark-400 outline-none font-medium"
              />
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowCancel(false)}
                className="flex-1 py-2 border border-dark-800 rounded-lg text-xs font-semibold text-dark-400 hover:text-dark-50 transition-colors"
              >
                Close
              </button>
              <button
                onClick={() => cancelMutation.mutate(cancelReason)}
                disabled={cancelMutation.isPending || !cancelReason.trim()}
                className="flex-1 py-2 rounded-lg bg-red-600 hover:bg-red-500 text-white text-xs font-semibold transition-all active:scale-95 disabled:opacity-55"
              >
                {cancelMutation.isPending ? 'Cancelling...' : 'Confirm Cancellation'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
