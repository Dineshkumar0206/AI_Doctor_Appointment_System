import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Search, Plus, Pencil, Trash2, Stethoscope, Star, DollarSign } from 'lucide-react'
import { doctorApi } from '../api/doctors'
import { Badge } from '../components/ui/Badge'
import { Modal } from '../components/ui/Modal'
import { Spinner } from '../components/ui/Spinner'
import { useAuth } from '../context/AuthContext'
import type { DoctorRequest, DoctorResponse } from '../types'
import toast from 'react-hot-toast'

const EMPTY_FORM: DoctorRequest = {
  userId: 0, specialization: '', experience: 0,
  qualification: '', bio: '', consultationFee: 0, status: 'ACTIVE',
}

export default function DoctorsPage() {
  const qc = useQueryClient()
  const { hasRole } = useAuth()
  const isAdmin = hasRole('ROLE_ADMIN')

  const [keyword, setKeyword] = useState('')
  const [page, setPage] = useState(0)
  const [modalOpen, setModalOpen] = useState(false)
  const [editDoc, setEditDoc] = useState<DoctorResponse | null>(null)
  const [form, setForm] = useState<DoctorRequest>(EMPTY_FORM)
  const [deleteId, setDeleteId] = useState<number | null>(null)

  const { data, isLoading } = useQuery({
    queryKey: ['doctors', keyword, page],
    queryFn: () => doctorApi.getAll({ keyword, page, size: 8 }),
  })

  const createMut = useMutation({
    mutationFn: doctorApi.create,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['doctors'] }); closeModal(); toast.success('Doctor created') },
    onError: (e: any) => toast.error(e?.response?.data?.message ?? 'Failed'),
  })

  const updateMut = useMutation({
    mutationFn: ({ id, data }: { id: number; data: DoctorRequest }) => doctorApi.update(id, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['doctors'] }); closeModal(); toast.success('Doctor updated') },
    onError: (e: any) => toast.error(e?.response?.data?.message ?? 'Failed'),
  })

  const deleteMut = useMutation({
    mutationFn: doctorApi.delete,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['doctors'] }); setDeleteId(null); toast.success('Doctor deleted') },
    onError: (e: any) => toast.error(e?.response?.data?.message ?? 'Failed'),
  })

  const doctors = data?.data?.content ?? []
  const totalPages = data?.data?.totalPages ?? 0

  const openCreate = () => { setEditDoc(null); setForm(EMPTY_FORM); setModalOpen(true) }
  const openEdit = (d: DoctorResponse) => {
    setEditDoc(d)
    setForm({ userId: d.userId, specialization: d.specialization, experience: d.experience,
              qualification: d.qualification ?? '', bio: d.bio ?? '',
              consultationFee: d.consultationFee, status: d.status })
    setModalOpen(true)
  }
  const closeModal = () => { setModalOpen(false); setEditDoc(null); setForm(EMPTY_FORM) }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (editDoc) updateMut.mutate({ id: editDoc.id, data: form })
    else createMut.mutate(form)
  }

  const f = (key: keyof DoctorRequest) => ({
    value: String(form[key] ?? ''),
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
      setForm(p => ({ ...p, [key]: key === 'experience' || key === 'consultationFee' || key === 'userId'
        ? Number(e.target.value) : e.target.value })),
  })

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="page-header mb-0">
          <h1 className="page-title">Doctors</h1>
          <p className="page-subtitle">Manage medical professionals</p>
        </div>
        {isAdmin && (
          <button onClick={openCreate} className="btn-primary flex items-center gap-2">
            <Plus className="w-4 h-4" /> Add Doctor
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
            placeholder="Search by name or specialization..."
            className="input-field pl-10"
          />
        </div>
      </div>

      {/* Doctor Cards */}
      {isLoading ? (
        <div className="flex justify-center py-16"><Spinner size="lg" /></div>
      ) : doctors.length === 0 ? (
        <div className="glass-card flex flex-col items-center py-20 text-dark-500">
          <Stethoscope className="w-14 h-14 mb-4 opacity-30" />
          <p className="text-sm">No doctors found</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {doctors.map(doc => (
            <div key={doc.id} className="glass-card p-5 hover:border-primary-500/30 transition-all duration-300 hover:-translate-y-1">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary-600/30 to-primary-500/10 flex items-center justify-center text-primary-400 font-bold text-lg">
                    {doc.firstName[0]}{doc.lastName[0]}
                  </div>
                  <div>
                    <p className="font-semibold text-dark-100">Dr. {doc.fullName}</p>
                    <p className="text-xs text-dark-400">{doc.email}</p>
                  </div>
                </div>
                <Badge status={doc.status} />
              </div>

              <div className="space-y-2 mb-4">
                <div className="flex items-center gap-2 text-sm">
                  <Stethoscope className="w-3.5 h-3.5 text-primary-400 flex-shrink-0" />
                  <span className="text-dark-300 font-medium">{doc.specialization}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Star className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
                  <span className="text-dark-400">{doc.experience} years experience</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <DollarSign className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                  <span className="text-dark-400">₹{doc.consultationFee} consultation</span>
                </div>
              </div>

              {isAdmin && (
                <div className="flex gap-2 pt-3 border-t border-dark-700">
                  <button onClick={() => openEdit(doc)}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2 text-xs
                               bg-primary-500/10 text-primary-400 hover:bg-primary-500/20 rounded-lg transition-all">
                    <Pencil className="w-3.5 h-3.5" /> Edit
                  </button>
                  <button onClick={() => setDeleteId(doc.id)}
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
      <Modal isOpen={modalOpen} onClose={closeModal} title={editDoc ? 'Edit Doctor' : 'Add Doctor'} size="lg">
        <form onSubmit={handleSubmit} className="space-y-4">
          {!editDoc && (
            <div>
              <label className="form-label">User ID</label>
              <input type="number" {...f('userId')} className="input-field" placeholder="User ID" required />
            </div>
          )}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="form-label">Specialization</label>
              <input {...f('specialization')} className="input-field" placeholder="e.g. Cardiology" required />
            </div>
            <div>
              <label className="form-label">Experience (years)</label>
              <input type="number" {...f('experience')} className="input-field" min="0" max="60" required />
            </div>
          </div>
          <div>
            <label className="form-label">Qualification</label>
            <input {...f('qualification')} className="input-field" placeholder="e.g. MD, FACC" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="form-label">Consultation Fee (₹)</label>
              <input type="number" {...f('consultationFee')} className="input-field" min="0" />
            </div>
            <div>
              <label className="form-label">Status</label>
              <select {...f('status')} className="input-field">
                <option value="ACTIVE">Active</option>
                <option value="INACTIVE">Inactive</option>
                <option value="ON_LEAVE">On Leave</option>
              </select>
            </div>
          </div>
          <div>
            <label className="form-label">Bio</label>
            <textarea {...f('bio')} className="input-field resize-none h-20" placeholder="Brief bio..." />
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={closeModal} className="btn-secondary flex-1">Cancel</button>
            <button type="submit" disabled={createMut.isPending || updateMut.isPending} className="btn-primary flex-1">
              {createMut.isPending || updateMut.isPending ? 'Saving...' : editDoc ? 'Update' : 'Create'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirm Modal */}
      <Modal isOpen={deleteId !== null} onClose={() => setDeleteId(null)} title="Delete Doctor" size="sm">
        <div className="text-center space-y-4">
          <div className="w-14 h-14 bg-red-500/20 rounded-full flex items-center justify-center mx-auto">
            <Trash2 className="w-7 h-7 text-red-400" />
          </div>
          <p className="text-dark-300 text-sm">Are you sure you want to delete this doctor? This action cannot be undone.</p>
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
