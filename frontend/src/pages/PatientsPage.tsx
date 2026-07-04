import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Search, Plus, Pencil, Trash2, Users, Phone, Calendar, Droplets } from 'lucide-react'
import { patientApi } from '../api/patients'
import { Modal } from '../components/ui/Modal'
import { Spinner } from '../components/ui/Spinner'
import { useAuth } from '../context/AuthContext'
import type { PatientRequest, PatientResponse } from '../types'
import toast from 'react-hot-toast'

const EMPTY_FORM: PatientRequest = {
  userId: 0, dateOfBirth: '', gender: 'MALE',
  bloodGroup: '', address: '', emergencyContact: '', medicalNotes: '',
}

export default function PatientsPage() {
  const qc = useQueryClient()
  const { hasRole } = useAuth()
  const isAdmin = hasRole('ROLE_ADMIN')

  const [keyword, setKeyword] = useState('')
  const [page, setPage] = useState(0)
  const [modalOpen, setModalOpen] = useState(false)
  const [editPat, setEditPat] = useState<PatientResponse | null>(null)
  const [form, setForm] = useState<PatientRequest>(EMPTY_FORM)
  const [deleteId, setDeleteId] = useState<number | null>(null)

  const { data, isLoading } = useQuery({
    queryKey: ['patients', keyword, page],
    queryFn: () => patientApi.getAll({ keyword, page, size: 9 }),
  })

  const createMut = useMutation({
    mutationFn: patientApi.create,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['patients'] }); closeModal(); toast.success('Patient profile created') },
    onError: (e: any) => toast.error(e?.response?.data?.message ?? 'Failed'),
  })

  const updateMut = useMutation({
    mutationFn: ({ id, data }: { id: number; data: PatientRequest }) => patientApi.update(id, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['patients'] }); closeModal(); toast.success('Patient updated') },
    onError: (e: any) => toast.error(e?.response?.data?.message ?? 'Failed'),
  })

  const deleteMut = useMutation({
    mutationFn: patientApi.delete,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['patients'] }); setDeleteId(null); toast.success('Patient deleted') },
    onError: (e: any) => toast.error(e?.response?.data?.message ?? 'Failed'),
  })

  const patients = data?.data?.content ?? []
  const totalPages = data?.data?.totalPages ?? 0

  const openCreate = () => { setEditPat(null); setForm(EMPTY_FORM); setModalOpen(true) }
  const openEdit = (p: PatientResponse) => {
    setEditPat(p)
    setForm({ userId: p.userId, dateOfBirth: p.dateOfBirth ?? '', gender: p.gender ?? 'MALE',
              bloodGroup: p.bloodGroup ?? '', address: p.address ?? '',
              emergencyContact: p.emergencyContact ?? '', medicalNotes: p.medicalNotes ?? '' })
    setModalOpen(true)
  }
  const closeModal = () => { setModalOpen(false); setEditPat(null); setForm(EMPTY_FORM) }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (editPat) updateMut.mutate({ id: editPat.id, data: form })
    else createMut.mutate(form)
  }

  const f = (key: keyof PatientRequest) => ({
    value: String(form[key] ?? ''),
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
      setForm(p => ({ ...p, [key]: key === 'userId' ? Number(e.target.value) : e.target.value })),
  })

  const bloodGroupColor: Record<string, string> = {
    'A+': 'text-red-400', 'A-': 'text-red-300', 'B+': 'text-blue-400',
    'B-': 'text-blue-300', 'AB+': 'text-purple-400', 'AB-': 'text-purple-300',
    'O+': 'text-emerald-400', 'O-': 'text-emerald-300',
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="page-header mb-0">
          <h1 className="page-title">Patients</h1>
          <p className="page-subtitle">Manage patient profiles and medical records</p>
        </div>
        {isAdmin && (
          <button onClick={openCreate} className="btn-primary flex items-center gap-2">
            <Plus className="w-4 h-4" /> Add Patient
          </button>
        )}
      </div>

      {/* Search */}
      <div className="glass-card p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-400" />
          <input
            value={keyword}
            onChange={e => { setKeyword(e.target.value); setPage(0) }}
            placeholder="Search by name or email..."
            className="input-field pl-10"
          />
        </div>
      </div>

      {/* Patient Cards */}
      {isLoading ? (
        <div className="flex justify-center py-16"><Spinner size="lg" /></div>
      ) : patients.length === 0 ? (
        <div className="glass-card flex flex-col items-center py-20 text-dark-500">
          <Users className="w-14 h-14 mb-4 opacity-30" />
          <p className="text-sm">No patients found</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {patients.map(pat => (
            <div key={pat.id} className="glass-card p-5 hover:border-primary-500/30 transition-all duration-300 hover:-translate-y-1">
              {/* Avatar & name */}
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-accent-600/30 to-accent-500/10 flex items-center justify-center text-accent-400 font-bold text-lg">
                  {pat.firstName[0]}{pat.lastName[0]}
                </div>
                <div>
                  <p className="font-semibold text-dark-100">{pat.fullName}</p>
                  <p className="text-xs text-dark-400">{pat.email}</p>
                </div>
              </div>

              {/* Details */}
              <div className="space-y-2 mb-4">
                {pat.phone && (
                  <div className="flex items-center gap-2 text-sm">
                    <Phone className="w-3.5 h-3.5 text-dark-400 flex-shrink-0" />
                    <span className="text-dark-400">{pat.phone}</span>
                  </div>
                )}
                {pat.dateOfBirth && (
                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className="w-3.5 h-3.5 text-dark-400 flex-shrink-0" />
                    <span className="text-dark-400">{pat.dateOfBirth}</span>
                    {pat.gender && <span className="text-dark-500">· {pat.gender}</span>}
                  </div>
                )}
                {pat.bloodGroup && (
                  <div className="flex items-center gap-2 text-sm">
                    <Droplets className="w-3.5 h-3.5 flex-shrink-0 text-red-400" />
                    <span className={`font-semibold ${bloodGroupColor[pat.bloodGroup] ?? 'text-dark-300'}`}>
                      {pat.bloodGroup}
                    </span>
                  </div>
                )}
                {pat.medicalNotes && (
                  <p className="text-xs text-dark-500 line-clamp-2 mt-2 pl-1">
                    📋 {pat.medicalNotes}
                  </p>
                )}
              </div>

              {isAdmin && (
                <div className="flex gap-2 pt-3 border-t border-dark-700">
                  <button onClick={() => openEdit(pat)}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2 text-xs
                               bg-primary-500/10 text-primary-400 hover:bg-primary-500/20 rounded-lg transition-all">
                    <Pencil className="w-3.5 h-3.5" /> Edit
                  </button>
                  <button onClick={() => setDeleteId(pat.id)}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2 text-xs
                               bg-red-500/10 text-red-400 hover:bg-red-500/20 rounded-lg transition-all">
                    <Trash2 className="w-3.5 h-3.5" /> Delete
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

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

      {/* Create / Edit Modal */}
      <Modal isOpen={modalOpen} onClose={closeModal} title={editPat ? 'Edit Patient' : 'Add Patient'} size="lg">
        <form onSubmit={handleSubmit} className="space-y-4">
          {!editPat && (
            <div>
              <label className="form-label">User ID</label>
              <input type="number" {...f('userId')} className="input-field" required />
            </div>
          )}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="form-label">Date of Birth</label>
              <input type="date" {...f('dateOfBirth')} className="input-field" />
            </div>
            <div>
              <label className="form-label">Gender</label>
              <select {...f('gender')} className="input-field">
                <option value="MALE">Male</option>
                <option value="FEMALE">Female</option>
                <option value="OTHER">Other</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="form-label">Blood Group</label>
              <select {...f('bloodGroup')} className="input-field">
                <option value="">-- Select --</option>
                {['A+','A-','B+','B-','AB+','AB-','O+','O-'].map(bg => (
                  <option key={bg} value={bg}>{bg}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="form-label">Emergency Contact</label>
              <input {...f('emergencyContact')} className="input-field" placeholder="10-digit number" />
            </div>
          </div>
          <div>
            <label className="form-label">Address</label>
            <input {...f('address')} className="input-field" placeholder="Full address" />
          </div>
          <div>
            <label className="form-label">Medical Notes</label>
            <textarea {...f('medicalNotes')} className="input-field resize-none h-20" placeholder="Allergies, conditions..." />
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={closeModal} className="btn-secondary flex-1">Cancel</button>
            <button type="submit" disabled={createMut.isPending || updateMut.isPending} className="btn-primary flex-1">
              {createMut.isPending || updateMut.isPending ? 'Saving...' : editPat ? 'Update' : 'Create'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirm */}
      <Modal isOpen={deleteId !== null} onClose={() => setDeleteId(null)} title="Delete Patient" size="sm">
        <div className="text-center space-y-4">
          <div className="w-14 h-14 bg-red-500/20 rounded-full flex items-center justify-center mx-auto">
            <Trash2 className="w-7 h-7 text-red-400" />
          </div>
          <p className="text-dark-300 text-sm">Delete this patient profile? This cannot be undone.</p>
          <div className="flex gap-3">
            <button onClick={() => setDeleteId(null)} className="btn-secondary flex-1">Cancel</button>
            <button onClick={() => deleteId && deleteMut.mutate(deleteId)}
              disabled={deleteMut.isPending} className="btn-danger flex-1">
              {deleteMut.isPending ? 'Deleting...' : 'Delete'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
