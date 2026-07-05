import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useSearchParams } from 'react-router-dom'
import {
  CalendarDays, Plus, Search, Filter, X, Pencil,
  Trash2, XCircle, CheckCircle, Clock,
} from 'lucide-react'
import { appointmentApi } from '../api/appointments'
import { doctorApi } from '../api/doctors'
import { patientApi } from '../api/patients'
import { Badge } from '../components/ui/Badge'
import { Modal } from '../components/ui/Modal'
import { Spinner } from '../components/ui/Spinner'
import { useAuth } from '../context/AuthContext'
import type { AppointmentRequest, AppointmentResponse } from '../types'
import toast from 'react-hot-toast'
import { format } from 'date-fns'

const EMPTY_FORM: AppointmentRequest = {
  patientId: 0, doctorId: 0, appointmentDate: '', startTime: '', endTime: '', reason: '', notes: '',
}

const STATUS_OPTIONS = ['PENDING', 'CONFIRMED', 'COMPLETED', 'CANCELLED', 'NO_SHOW']

export default function AppointmentsPage() {
  const qc = useQueryClient()
  const [searchParams, setSearchParams] = useSearchParams()
  const { hasRole, user } = useAuth()
  const isAdmin = hasRole('ROLE_ADMIN')
  const isDoctor = hasRole('ROLE_DOCTOR')
  const isPatient = hasRole('ROLE_PATIENT')

  const [page, setPage] = useState(0)
  const [filterStatus, setFilterStatus] = useState('')
  const [filterStartDate, setFilterStartDate] = useState('')
  const [filterEndDate, setFilterEndDate] = useState('')
  const [keyword, setKeyword] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [editApt, setEditApt] = useState<AppointmentResponse | null>(null)
  const [form, setForm] = useState<AppointmentRequest>(EMPTY_FORM)
  const [deleteId, setDeleteId] = useState<number | null>(null)
  const [statusUpdateId, setStatusUpdateId] = useState<number | null>(null)
  const [newStatus, setNewStatus] = useState('')

  const preselectedDoctorId = searchParams.get('doctorId')
  useEffect(() => {
    if (preselectedDoctorId) {
      setForm(prev => ({ ...prev, doctorId: Number(preselectedDoctorId) }))
      setModalOpen(true)
      setSearchParams({}, { replace: true })
    }
  }, [preselectedDoctorId, setSearchParams])

  // Load patient profile to get patientId if logged in as a Patient
  const { data: currentPatient } = useQuery({
    queryKey: ['current-patient', user?.id],
    queryFn: () => patientApi.getByUserId(user!.id),
    enabled: isPatient && !!user?.id,
  })
  const patientId = currentPatient?.data?.id

  const { data, isLoading } = useQuery({
    queryKey: ['appointments', page, filterStatus, filterStartDate, filterEndDate, patientId],
    queryFn: () => appointmentApi.search({
      patientId: isPatient ? (patientId || -1) : undefined,
      status: filterStatus || undefined,
      startDate: filterStartDate || undefined,
      endDate: filterEndDate || undefined,
      page, size: 10,
    }),
    enabled: !isPatient || (isPatient && !!patientId),
  })

  const { data: doctors } = useQuery({ queryKey: ['doctors-list'], queryFn: doctorApi.getAllList })
  const { data: patients } = useQuery({
    queryKey: ['patients-list'],
    queryFn: patientApi.getAllList,
    enabled: isAdmin || isDoctor,
  })

  const bookMut = useMutation({
    mutationFn: appointmentApi.book,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['appointments'] }); closeModal(); toast.success('Appointment booked!') },
    onError: (e: any) => toast.error(e?.response?.data?.message ?? 'Booking failed'),
  })

  const updateMut = useMutation({
    mutationFn: ({ id, data }: { id: number; data: AppointmentRequest }) => appointmentApi.update(id, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['appointments'] }); closeModal(); toast.success('Appointment updated') },
    onError: (e: any) => toast.error(e?.response?.data?.message ?? 'Failed'),
  })

  const cancelMut = useMutation({
    mutationFn: appointmentApi.cancel,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['appointments'] }); toast.success('Appointment cancelled') },
    onError: (e: any) => toast.error(e?.response?.data?.message ?? 'Failed'),
  })

  const statusMut = useMutation({
    mutationFn: ({ id, status }: { id: number; status: string }) => appointmentApi.updateStatus(id, status),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['appointments'] }); setStatusUpdateId(null); toast.success('Status updated') },
    onError: (e: any) => toast.error(e?.response?.data?.message ?? 'Failed'),
  })

  const deleteMut = useMutation({
    mutationFn: appointmentApi.delete,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['appointments'] }); setDeleteId(null); toast.success('Deleted') },
    onError: (e: any) => toast.error(e?.response?.data?.message ?? 'Failed'),
  })

  const appointments = data?.data?.content ?? []
  const totalPages = data?.data?.totalPages ?? 0

  const openCreate = () => { setEditApt(null); setForm(EMPTY_FORM); setModalOpen(true) }
  const openEdit = (a: AppointmentResponse) => {
    setEditApt(a)
    setForm({ patientId: a.patientId, doctorId: a.doctorId, appointmentDate: a.appointmentDate,
              startTime: a.startTime, endTime: a.endTime, reason: a.reason ?? '', notes: a.notes ?? '' })
    setModalOpen(true)
  }
  const closeModal = () => { setModalOpen(false); setEditApt(null); setForm(EMPTY_FORM) }
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const submissionForm = {
      ...form,
      patientId: isPatient ? (currentPatient?.data?.id ?? form.patientId) : form.patientId
    }
    if (editApt) updateMut.mutate({ id: editApt.id, data: submissionForm })
    else bookMut.mutate(submissionForm)
  }

  const clearFilters = () => { setFilterStatus(''); setFilterStartDate(''); setFilterEndDate(''); setPage(0) }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="page-header mb-0">
          <h1 className="page-title">Appointments</h1>
          <p className="page-subtitle">Book, manage, and track all appointments</p>
        </div>
        <button onClick={openCreate} className="btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" /> Book Appointment
        </button>
      </div>

      {/* Filters */}
      <div className="glass-card p-4">
        <div className="flex flex-wrap gap-3 items-end">
          <div className="flex-1 min-w-[160px]">
            <label className="form-label text-xs">Status</label>
            <select value={filterStatus} onChange={e => { setFilterStatus(e.target.value); setPage(0) }} className="input-field">
              <option value="">All Statuses</option>
              {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div className="flex-1 min-w-[160px]">
            <label className="form-label text-xs">From Date</label>
            <input type="date" value={filterStartDate} onChange={e => { setFilterStartDate(e.target.value); setPage(0) }} className="input-field" />
          </div>
          <div className="flex-1 min-w-[160px]">
            <label className="form-label text-xs">To Date</label>
            <input type="date" value={filterEndDate} onChange={e => { setFilterEndDate(e.target.value); setPage(0) }} className="input-field" />
          </div>
          {(filterStatus || filterStartDate || filterEndDate) && (
            <button onClick={clearFilters} className="btn-secondary flex items-center gap-1.5 text-sm">
              <X className="w-3.5 h-3.5" /> Clear
            </button>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="glass-card overflow-hidden">
        {isLoading ? (
          <div className="flex justify-center py-16"><Spinner size="lg" /></div>
        ) : appointments.length === 0 ? (
          <div className="flex flex-col items-center py-20 text-dark-500">
            <CalendarDays className="w-14 h-14 mb-4 opacity-30" />
            <p className="text-sm">No appointments found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Patient</th>
                  <th>Doctor</th>
                  <th>Date & Time</th>
                  <th>Reason</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {appointments.map(apt => (
                  <tr key={apt.id}>
                    <td>
                      <div>
                        <p className="font-medium text-dark-100">{apt.patientName}</p>
                        <p className="text-xs text-dark-500">{apt.patientEmail}</p>
                      </div>
                    </td>
                    <td>
                      <div>
                        <p className="text-dark-200">Dr. {apt.doctorName}</p>
                        <p className="text-xs text-dark-500">{apt.doctorSpecialization}</p>
                      </div>
                    </td>
                    <td>
                      <div>
                        <p className="text-dark-200">{apt.appointmentDate}</p>
                        <p className="text-xs text-dark-500 font-mono">{apt.startTime} – {apt.endTime}</p>
                      </div>
                    </td>
                    <td>
                      <p className="text-dark-400 text-xs max-w-[150px] truncate">{apt.reason || '—'}</p>
                    </td>
                    <td><Badge status={apt.status} /></td>
                    <td>
                      <div className="flex items-center gap-1.5">
                        {apt.status !== 'CANCELLED' && apt.status !== 'COMPLETED' && (
                          <>
                            <button onClick={() => openEdit(apt)} title="Edit"
                              className="w-8 h-8 rounded-lg bg-primary-500/10 text-primary-400 hover:bg-primary-500/20 flex items-center justify-center transition-all">
                              <Pencil className="w-3.5 h-3.5" />
                            </button>
                            <button onClick={() => cancelMut.mutate(apt.id)} title="Cancel"
                              className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-400 hover:bg-amber-500/20 flex items-center justify-center transition-all">
                              <XCircle className="w-3.5 h-3.5" />
                            </button>
                          </>
                        )}
                        {isAdmin && (
                          <>
                            <button onClick={() => { setStatusUpdateId(apt.id); setNewStatus(apt.status) }} title="Change Status"
                              className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 flex items-center justify-center transition-all">
                              <Clock className="w-3.5 h-3.5" />
                            </button>
                            <button onClick={() => setDeleteId(apt.id)} title="Delete"
                              className="w-8 h-8 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 flex items-center justify-center transition-all">
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center gap-2">
          {Array.from({ length: totalPages }).map((_, i) => (
            <button key={i} onClick={() => setPage(i)}
              className={`w-8 h-8 rounded-lg text-sm font-medium transition-all
                         ${page === i ? 'bg-primary-500 text-white' : 'bg-dark-800 text-dark-400 hover:bg-dark-700'}`}>
              {i + 1}
            </button>
          ))}
        </div>
      )}

      {/* Book / Edit Modal */}
      <Modal isOpen={modalOpen} onClose={closeModal} title={editApt ? 'Edit Appointment' : 'Book Appointment'} size="lg">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="form-label">Patient</label>
              {isPatient ? (
                <div className="input-field bg-dark-800 text-dark-300 flex items-center select-none">
                  {user?.firstName} {user?.lastName}
                </div>
              ) : (
                <select value={form.patientId} onChange={e => setForm(p => ({ ...p, patientId: Number(e.target.value) }))} className="input-field" required>
                  <option value={0}>Select Patient</option>
                  {patients?.data?.map(p => <option key={p.id} value={p.id}>{p.fullName}</option>)}
                </select>
              )}
            </div>
            <div>
              <label className="form-label">Doctor</label>
              <select value={form.doctorId} onChange={e => setForm(p => ({ ...p, doctorId: Number(e.target.value) }))} className="input-field" required>
                <option value={0}>Select Doctor</option>
                {doctors?.data?.map(d => <option key={d.id} value={d.id}>Dr. {d.fullName} – {d.specialization}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="form-label">Appointment Date</label>
            <input type="date" value={form.appointmentDate} onChange={e => setForm(p => ({ ...p, appointmentDate: e.target.value }))} className="input-field" required min={format(new Date(), 'yyyy-MM-dd')} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="form-label">Start Time</label>
              <input type="time" value={form.startTime} onChange={e => setForm(p => ({ ...p, startTime: e.target.value }))} className="input-field" required />
            </div>
            <div>
              <label className="form-label">End Time</label>
              <input type="time" value={form.endTime} onChange={e => setForm(p => ({ ...p, endTime: e.target.value }))} className="input-field" required />
            </div>
          </div>
          <div>
            <label className="form-label">Reason</label>
            <input value={form.reason} onChange={e => setForm(p => ({ ...p, reason: e.target.value }))} className="input-field" placeholder="Reason for visit..." />
          </div>
          <div>
            <label className="form-label">Notes</label>
            <textarea value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} className="input-field resize-none h-20" placeholder="Additional notes..." />
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={closeModal} className="btn-secondary flex-1">Cancel</button>
            <button type="submit" disabled={bookMut.isPending || updateMut.isPending} className="btn-primary flex-1">
              {bookMut.isPending || updateMut.isPending ? 'Saving...' : editApt ? 'Update' : 'Book'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Status Update Modal */}
      <Modal isOpen={statusUpdateId !== null} onClose={() => setStatusUpdateId(null)} title="Update Status" size="sm">
        <div className="space-y-4">
          <select value={newStatus} onChange={e => setNewStatus(e.target.value)} className="input-field">
            {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          <div className="flex gap-3">
            <button onClick={() => setStatusUpdateId(null)} className="btn-secondary flex-1">Cancel</button>
            <button onClick={() => statusUpdateId && statusMut.mutate({ id: statusUpdateId, status: newStatus })}
              disabled={statusMut.isPending} className="btn-primary flex-1">
              {statusMut.isPending ? 'Updating...' : 'Update Status'}
            </button>
          </div>
        </div>
      </Modal>

      {/* Delete Confirm */}
      <Modal isOpen={deleteId !== null} onClose={() => setDeleteId(null)} title="Delete Appointment" size="sm">
        <div className="text-center space-y-4">
          <div className="w-14 h-14 bg-red-500/20 rounded-full flex items-center justify-center mx-auto">
            <Trash2 className="w-7 h-7 text-red-400" />
          </div>
          <p className="text-dark-300 text-sm">Permanently delete this appointment?</p>
          <div className="flex gap-3">
            <button onClick={() => setDeleteId(null)} className="btn-secondary flex-1">Cancel</button>
            <button onClick={() => deleteId && deleteMut.mutate(deleteId)} disabled={deleteMut.isPending} className="btn-danger flex-1">
              {deleteMut.isPending ? 'Deleting...' : 'Delete'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
