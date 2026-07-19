import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { Activity, Eye, EyeOff, Lock, Mail, User, Phone, Calendar } from 'lucide-react'
import toast from 'react-hot-toast'

export default function RegisterPage() {
  const { register } = useAuth()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [showPwd, setShowPwd] = useState(false)
  const [form, setForm] = useState({
    firstName: '', lastName: '', email: '',
    password: '', phone: '', role: 'PATIENT',
    dateOfBirth: '',
  })
  const [errors, setErrors] = useState<Record<string, string>>({})

  const calculateAge = (dob: string) => {
    if (!dob) return ''
    const birthDate = new Date(dob)
    const today = new Date()
    let age = today.getFullYear() - birthDate.getFullYear()
    const m = today.getMonth() - birthDate.getMonth()
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
      age--
    }
    return age >= 0 ? String(age) : ''
  }

  const validate = () => {
    const e: Record<string, string> = {}
    if (form.role === 'PATIENT' && !form.dateOfBirth) {
      e.dateOfBirth = 'Date of birth required'
    }
    if (!form.firstName.trim()) {
      e.firstName = 'First name required'
    } else if (form.firstName.trim().length < 2) {
      e.firstName = 'Min 2 characters'
    }

    if (!form.lastName.trim()) {
      e.lastName = 'Last name required'
    }

    if (!form.email)            e.email     = 'Email required'
    else if (!/\S+@\S+\.\S+/.test(form.email)) e.email = 'Invalid email'
    if (!form.password)         e.password  = 'Password required'
    else if (form.password.length < 8) e.password = 'Min 8 characters'
    else if (!/(?=.*[A-Z])(?=.*[a-z])(?=.*\d)(?=.*[@$!%*?&])/.test(form.password))
      e.password = 'Need uppercase, lowercase, digit & special char'
    if (form.phone && !/^\d{10}$/.test(form.phone)) e.phone = 'Must be 10 digits'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validate()) return
    setLoading(true)
    try {
      await register(form)
      toast.success('Account created! Welcome aboard 🎉')
      navigate('/dashboard')
    } catch (err: any) {
      if (err?.response?.data?.data) {
        setErrors(err.response.data.data)
      }
      const msg = err?.response?.data?.message ?? 'Registration failed'
      toast.error(msg)
    } finally {
      setLoading(false)
    }
  }

  const field = (key: keyof typeof form) => ({
    value: form[key],
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
      setForm(p => ({ ...p, [key]: e.target.value })),
  })

  return (
    <div className="min-h-screen bg-mesh flex items-center justify-center p-4">
      <div className="absolute top-1/4 right-1/4 w-80 h-80 bg-accent-600/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-lg relative z-10">
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center shadow-glow mb-4">
            <Activity className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-dark-50">Create your account</h1>
          <p className="text-dark-400 text-sm mt-1">Join MediSchedule AI today</p>
        </div>

        <div className="glass-card p-8">
          <form onSubmit={handleSubmit} noValidate className="space-y-4">
            {/* Name row */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="form-label">First name</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-400" />
                  <input {...field('firstName')} className={`input-field pl-10 ${errors.firstName ? 'border-red-500' : ''}`} placeholder="John" />
                </div>
                {errors.firstName && <p className="text-red-400 text-xs mt-1">{errors.firstName}</p>}
              </div>
              <div>
                <label className="form-label">Last name</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-400" />
                  <input {...field('lastName')} className={`input-field pl-10 ${errors.lastName ? 'border-red-500' : ''}`} placeholder="Doe" />
                </div>
                {errors.lastName && <p className="text-red-400 text-xs mt-1">{errors.lastName}</p>}
              </div>
            </div>

            {/* Email */}
            <div>
              <label className="form-label">Email address</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-400" />
                <input {...field('email')} type="email" className={`input-field pl-10 ${errors.email ? 'border-red-500' : ''}`} placeholder="you@example.com" />
              </div>
              {errors.email && <p className="text-red-400 text-xs mt-1">{errors.email}</p>}
            </div>

            {/* Password */}
            <div>
              <label className="form-label">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-400" />
                <input
                  {...field('password')}
                  type={showPwd ? 'text' : 'password'}
                  className={`input-field pl-10 pr-10 ${errors.password ? 'border-red-500' : ''}`}
                  placeholder="••••••••"
                />
                <button type="button" onClick={() => setShowPwd(p => !p)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-dark-400 hover:text-dark-200">
                  {showPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.password && <p className="text-red-400 text-xs mt-1">{errors.password}</p>}
            </div>

            {form.role === 'PATIENT' && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="form-label">Date of Birth</label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-400" />
                    <input
                      type="date"
                      value={form.dateOfBirth}
                      onChange={e => {
                        const dob = e.target.value
                        setForm(p => ({ ...p, dateOfBirth: dob }))
                      }}
                      className={`input-field pl-10 ${errors.dateOfBirth ? 'border-red-500' : ''}`}
                      max={new Date().toISOString().split('T')[0]}
                    />
                  </div>
                  {errors.dateOfBirth && <p className="text-red-400 text-xs mt-1">{errors.dateOfBirth}</p>}
                </div>
                <div>
                  <label className="form-label">Age</label>
                  <input
                    type="text"
                    readOnly
                    value={form.dateOfBirth ? calculateAge(form.dateOfBirth) : ''}
                    placeholder="Auto-calculated"
                    className="input-field bg-dark-900/50 cursor-not-allowed text-dark-300"
                  />
                </div>
              </div>
            )}

            {/* Phone & Role */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="form-label">Phone (optional)</label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-400" />
                  <input {...field('phone')} className={`input-field pl-10 ${errors.phone ? 'border-red-500' : ''}`} placeholder="9876543210" />
                </div>
                {errors.phone && <p className="text-red-400 text-xs mt-1">{errors.phone}</p>}
              </div>
              <div>
                <label className="form-label">Register as</label>
                <select
                  value={form.role}
                  onChange={e => setForm(p => ({ ...p, role: e.target.value }))}
                  className="input-field"
                >
                  <option value="PATIENT">Patient</option>
                  <option value="DOCTOR">Doctor</option>
                </select>
              </div>
            </div>

            <button type="submit" disabled={loading} className="btn-primary w-full flex items-center justify-center gap-2 mt-2">
              {loading && <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
              {loading ? 'Creating account...' : 'Create account'}
            </button>
          </form>
        </div>

        <p className="text-center text-sm text-dark-400 mt-6">
          Already have an account?{' '}
          <Link to="/login" className="text-primary-400 hover:text-primary-300 font-medium transition-colors">Sign in</Link>
        </p>
      </div>
    </div>
  )
}
