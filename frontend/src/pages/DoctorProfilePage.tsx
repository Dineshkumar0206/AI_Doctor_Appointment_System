import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '../api/axios'
import { User, Phone, Mail, FileText, CheckCircle, Save, Stethoscope, Image, Landmark, Star, LogOut } from 'lucide-react'
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import toast from 'react-hot-toast'

interface Doctor {
  id: number
  userId: number
  firstName: string
  lastName: string
  fullName: string
  email: string
  phone: string
  specialization: string
  experience: number
  qualification: string
  bio: string
  profilePhoto: string
  consultationFee: number
  status: string
}

export default function DoctorProfilePage() {
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  const { logout } = useAuth()

  // Profile Form States
  const [form, setForm] = useState({
    phone: '',
    bio: '',
    profilePhoto: ''
  })

  // Fetch Doctor Profile
  const { data: profileRes, isLoading, isError, refetch } = useQuery({
    queryKey: ['doctor-profile'],
    queryFn: () => api.get('/doctor/profile').then(res => res.data.data as Doctor),
    retry: 2,
  })
  const doctor = profileRes

  // Sync profile details with inputs
  useEffect(() => {
    if (doctor) {
      setForm({
        phone: doctor.phone || '',
        bio: doctor.bio || '',
        profilePhoto: doctor.profilePhoto || ''
      })
    }
  }, [doctor])

  // Update Profile Mutation
  const updateProfileMutation = useMutation({
    mutationFn: (data: typeof form) => api.put('/doctor/profile', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['doctor-profile'] })
      toast.success('Profile details updated successfully')
    },
    onError: () => {
      toast.error('Failed to update profile')
    }
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    updateProfileMutation.mutate(form)
  }

  if (isLoading) {
    return (
      <div className="py-24 text-center text-dark-500">
        <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-sm mt-2">Loading your profile...</p>
      </div>
    )
  }

  if (isError || !doctor) {
    return (
      <div className="py-16 text-center space-y-4">
        <div className="w-14 h-14 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center mx-auto">
          <svg className="w-7 h-7 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M12 3a9 9 0 100 18A9 9 0 0012 3z" />
          </svg>
        </div>
        <div>
          <p className="text-base font-semibold text-dark-100">Profile could not be loaded</p>
          <p className="text-sm text-dark-400 mt-1">Make sure the backend is running and your session is valid.</p>
        </div>
        <button
          onClick={() => refetch()}
          className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold transition-colors"
        >
          Retry
        </button>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
      
      {/* ── LEFT CARD: VIEW ONLY PROFILE INFO ── */}
      <div className="lg:col-span-4 bg-dark-950 border border-dark-800 rounded-2xl overflow-hidden p-6 space-y-6">
        
        {/* Profile Image & Avatar */}
        <div className="text-center space-y-4">
          <div className="relative inline-block">
            {form.profilePhoto ? (
              <img
                src={form.profilePhoto}
                alt="Doctor Profile"
                className="w-28 h-28 rounded-2xl object-cover border-2 border-blue-500/50 shadow-glow mx-auto"
                onError={() => {
                  toast.error('Failed to load profile photo URL')
                  setForm(prev => ({ ...prev, profilePhoto: '' }))
                }}
              />
            ) : (
              <div className="w-28 h-28 rounded-2xl bg-gradient-to-br from-blue-600 to-cyan-400 flex items-center justify-center text-white text-3xl font-bold shadow-glow mx-auto">
                {doctor.firstName[0]}{doctor.lastName[0]}
              </div>
            )}
            <span className="absolute -bottom-1.5 -right-1.5 bg-blue-500 text-white rounded-full p-1 border border-dark-950 shadow-md">
              <CheckCircle className="w-4 h-4" />
            </span>
          </div>

          <div>
            <h3 className="text-xl font-bold text-dark-50">Dr. {doctor.fullName}</h3>
            <p className="text-xs text-blue-400 font-semibold uppercase tracking-wider mt-1">{doctor.specialization}</p>
          </div>
        </div>

        {/* Read-only Medical Credentials info */}
        <div className="space-y-4 pt-6 border-t border-dark-900 text-xs">
          <div className="flex items-center gap-3">
            <Landmark className="w-4 h-4 text-dark-500" />
            <div>
              <p className="text-dark-500 font-medium">Qualification</p>
              <p className="font-semibold text-dark-100 mt-0.5">{doctor.qualification || 'MBBS, MD'}</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Star className="w-4 h-4 text-dark-500" />
            <div>
              <p className="text-dark-500 font-medium">Clinical Experience</p>
              <p className="font-semibold text-dark-100 mt-0.5">{doctor.experience} Years Active</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Landmark className="w-4 h-4 text-dark-500" />
            <div>
              <p className="text-dark-500 font-medium">Consultation Fee</p>
              <p className="font-semibold text-emerald-400 mt-0.5">${doctor.consultationFee.toFixed(2)}</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Mail className="w-4 h-4 text-dark-500" />
            <div>
              <p className="text-dark-500 font-medium">Workspace Email</p>
              <p className="font-semibold text-dark-100 mt-0.5">{doctor.email}</p>
            </div>
          </div>
        </div>

        {/* Working details */}
        <div className="pt-4 border-t border-dark-900 text-xs space-y-2">
          <p className="text-dark-500 font-bold uppercase tracking-wider">Hospital Locations</p>
          <p className="text-dark-300 leading-relaxed bg-dark-900 border border-dark-800 rounded-xl p-3">
            Karur &amp; Dindigul Specialty Care Centres
          </p>
        </div>

      </div>

      {/* ── RIGHT PANEL: EDITABLE PROFILE FORM ── */}
      <div className="lg:col-span-8 bg-dark-950 border border-dark-800 rounded-2xl p-8">
        <h4 className="text-lg font-bold text-dark-50 mb-6 flex items-center gap-2">
          <User className="w-5 h-5 text-blue-400" />
          <span>Edit Profile Details</span>
        </h4>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Phone */}
          <div className="space-y-1.5">
            <label htmlFor="phone" className="block text-xs font-semibold text-dark-400">
              Phone Number
            </label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-500" />
              <input
                id="phone"
                type="text"
                value={form.phone}
                onChange={e => setForm(p => ({ ...p, phone: e.target.value }))}
                placeholder="e.g. +91 9876543210"
                className="w-full pl-10 pr-4 py-2.5 bg-dark-900 border border-dark-800 rounded-xl text-sm text-dark-100 outline-none focus:border-blue-500 transition-colors"
              />
            </div>
          </div>

          {/* Profile Photo */}
          <div className="space-y-1.5">
            <label htmlFor="photo" className="block text-xs font-semibold text-dark-400">
              Profile Photo URL
            </label>
            <div className="relative">
              <Image className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-500" />
              <input
                id="photo"
                type="text"
                value={form.profilePhoto}
                onChange={e => setForm(p => ({ ...p, profilePhoto: e.target.value }))}
                placeholder="https://images.unsplash.com/... or base64"
                className="w-full pl-10 pr-4 py-2.5 bg-dark-900 border border-dark-800 rounded-xl text-sm text-dark-100 outline-none focus:border-blue-500 transition-colors"
              />
            </div>
            <p className="text-[10px] text-dark-500">Provide an image link to show a profile photo.</p>
          </div>

          {/* Bio */}
          <div className="space-y-1.5">
            <label htmlFor="bio" className="block text-xs font-semibold text-dark-400">
              Professional Biography
            </label>
            <div className="relative">
              <FileText className="absolute left-3 top-3 w-4 h-4 text-dark-500" />
              <textarea
                id="bio"
                value={form.bio}
                onChange={e => setForm(p => ({ ...p, bio: e.target.value }))}
                placeholder="Describe your background, specialization history, and consulting times..."
                rows={5}
                className="w-full pl-10 pr-4 py-2.5 bg-dark-900 border border-dark-800 rounded-xl text-sm text-dark-100 outline-none focus:border-blue-500 transition-colors resize-y"
              />
            </div>
          </div>

          {/* Submit */}
          <div className="flex justify-end pt-4 border-t border-dark-900">
            <button
              type="submit"
              disabled={updateProfileMutation.isPending}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-sm transition-all active:scale-95 disabled:opacity-55 shadow-glow"
            >
              <Save className="w-4 h-4" />
              <span>{updateProfileMutation.isPending ? 'Updating...' : 'Save Profile Changes'}</span>
            </button>
          </div>
        </form>
      </div>

      {/* Session Management (Logout) */}
      <div className="lg:col-span-12 bg-dark-950 border border-dark-800 rounded-2xl p-6">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-red-500/20 flex items-center justify-center text-red-400">
              <LogOut className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-dark-50">Sign Out</h3>
              <p className="text-xs text-dark-400">Log out of your doctor portal session</p>
            </div>
          </div>
          <button
            onClick={async () => {
              await logout()
              navigate('/login')
            }}
            className="px-5 py-2.5 bg-red-600 hover:bg-red-500 text-white text-sm font-semibold rounded-xl transition-colors flex items-center gap-2"
          >
            <LogOut className="w-4 h-4" /> Logout
          </button>
        </div>
      </div>

    </div>
  )
}
