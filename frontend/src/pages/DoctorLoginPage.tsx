import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { Eye, EyeOff, Lock, Mail, UserCircle, CalendarClock } from 'lucide-react'
import axios from 'axios'
import toast from 'react-hot-toast'

const BASE_URL = import.meta.env.VITE_API_URL || '/api'

export default function DoctorLoginPage() {
  const { updateUser } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({ email: '', password: '' })
  const [showPwd, setShowPwd] = useState(false)
  const [rememberMe, setRememberMe] = useState(false)
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const validate = () => {
    const e: Record<string, string> = {}
    if (!form.email) e.email = 'Doctor Name or Email is required'
    if (!form.password) e.password = 'Password is required'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validate()) return
    setLoading(true)
    try {
      const res = await axios.post(`${BASE_URL}/auth/doctor/login`, form)
      const { accessToken, refreshToken, user: userInfo } = res.data.data
      
      localStorage.setItem('accessToken', accessToken)
      localStorage.setItem('refreshToken', refreshToken)
      updateUser(userInfo)
      
      toast.success('Welcome back, Doctor!')
      navigate('/doctor/dashboard')
    } catch (err: any) {
      const msg = err?.response?.data?.message ?? 'Invalid credentials'
      toast.error(msg)
    } finally {
      setLoading(false)
    }
  }

  const fillDoctorDemo = (name: string, passwordPrefix: string) => {
    setForm({
      email: name.replaceAll(' ', '').toLowerCase(),
      password: `${passwordPrefix.substring(0, 3).toLowerCase()}@123`
    })
  }

  return (
    <div className="min-h-screen flex" style={{ background: '#050d1a' }}>
      {/* ── LEFT HERO PANEL ── */}
      <div className="hidden lg:flex flex-1 relative overflow-hidden flex-col justify-center px-14"
        style={{ background: 'linear-gradient(135deg, #050d1a 0%, #071428 40%, #061035 100%)' }}>
        <div className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: 'linear-gradient(rgba(0,180,255,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(0,180,255,0.3) 1px, transparent 1px)',
            backgroundSize: '60px 60px',
          }} />
        <div className="absolute inset-0"
          style={{ background: 'radial-gradient(ellipse 70% 60% at 50% 60%, rgba(0,100,255,0.12) 0%, transparent 70%)' }} />

        <div className="relative z-10 mb-12">
          <div className="flex items-baseline gap-3 mb-3">
            <span className="text-5xl font-black" style={{ color: '#00cfff', textShadow: '0 0 20px rgba(0,207,255,0.6)' }}>AI</span>
            <span className="text-4xl font-bold text-white tracking-wide">DOCTOR</span>
          </div>
          <div className="text-4xl font-bold text-white tracking-wide mb-6">PORTAL</div>
          <p className="text-lg font-medium" style={{ color: '#7eb8e0' }}>Manage appointments,</p>
          <p className="text-lg font-medium" style={{ color: '#7eb8e0' }}>prescribe & consult with AI power.</p>
        </div>

        {/* Doctor Demo Quick Login */}
        <div className="relative z-10 bg-dark-950/80 border border-dark-800 rounded-xl p-5 max-w-md">
          <p className="text-xs font-semibold text-blue-400 uppercase tracking-wider mb-3">Quick Demo Logins</p>
          <div className="grid grid-cols-2 gap-2 text-xs text-dark-300">
            <button
              onClick={() => fillDoctorDemo('Saravana Kumar', 'Saravana')}
              className="p-2 border border-dark-800 rounded hover:border-blue-500 hover:text-white transition-colors text-left"
            >
              Dr. Saravana Kumar
            </button>
            <button
              onClick={() => fillDoctorDemo('Rajesh Kannan', 'Rajesh')}
              className="p-2 border border-dark-800 rounded hover:border-blue-500 hover:text-white transition-colors text-left"
            >
              Dr. Rajesh Kannan
            </button>
            <button
              onClick={() => fillDoctorDemo('Harish Prasad', 'Harish')}
              className="p-2 border border-dark-800 rounded hover:border-blue-500 hover:text-white transition-colors text-left"
            >
              Dr. Harish Prasad
            </button>
            <button
              onClick={() => fillDoctorDemo('Kavitha Mani', 'Kavitha')}
              className="p-2 border border-dark-800 rounded hover:border-blue-500 hover:text-white transition-colors text-left"
            >
              Dr. Kavitha Mani
            </button>
          </div>
        </div>
      </div>

      {/* ── RIGHT FORM PANEL ── */}
      <div className="flex-1 lg:max-w-md xl:max-w-lg flex items-center justify-center p-8"
        style={{ background: 'linear-gradient(160deg, #071020 0%, #0a1628 100%)', borderLeft: '1px solid rgba(0,150,255,0.1)' }}>
        <div className="w-full max-w-sm">
          <div className="flex flex-col items-center mb-8">
            <div className="mb-4 relative">
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center"
                style={{ background: 'linear-gradient(135deg, rgba(0,80,200,0.3), rgba(0,150,255,0.2))', border: '1px solid rgba(0,180,255,0.3)', boxShadow: '0 0 30px rgba(0,120,255,0.2)' }}>
                <CalendarClock style={{ width: '30px', height: '30px', color: '#00cfff' }} />
              </div>
            </div>
            <h1 className="text-2xl font-bold text-white mb-1">Doctor Portal</h1>
            <p className="text-sm" style={{ color: '#6b8aad' }}>Sign in to your doctor workspace</p>
          </div>

          <form onSubmit={handleSubmit} noValidate className="space-y-4">
            {/* Email / Username */}
            <div>
              <label htmlFor="email" className="block text-xs font-medium mb-1.5" style={{ color: '#8aabcc' }}>
                Doctor Name / Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: '#4a7aaa' }} />
                <input
                  id="email"
                  type="text"
                  value={form.email}
                  onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
                  placeholder="e.g. saravanakumar"
                  className={`w-full pl-10 pr-4 py-2.5 text-sm rounded-lg outline-none transition-all ${errors.email ? 'border-red-500' : ''}`}
                  style={{
                    background: 'rgba(5,20,50,0.8)',
                    border: errors.email ? '1px solid #ef4444' : '1px solid rgba(0,120,200,0.3)',
                    color: '#e2eeff',
                    boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.3)',
                  }}
                  onFocus={e => (e.target.style.borderColor = '#00cfff')}
                  onBlur={e => (e.target.style.borderColor = errors.email ? '#ef4444' : 'rgba(0,120,200,0.3)')}
                />
              </div>
              {errors.email && <p className="text-red-400 text-xs mt-1">{errors.email}</p>}
            </div>

            {/* Password */}
            <div>
              <label htmlFor="password" className="block text-xs font-medium mb-1.5" style={{ color: '#8aabcc' }}>
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: '#4a7aaa' }} />
                <input
                  id="password"
                  type={showPwd ? 'text' : 'password'}
                  value={form.password}
                  onChange={e => setForm(p => ({ ...p, password: e.target.value }))}
                  placeholder="Enter your password"
                  className={`w-full pl-10 pr-10 py-2.5 text-sm rounded-lg outline-none transition-all ${errors.password ? 'border-red-500' : ''}`}
                  style={{
                    background: 'rgba(5,20,50,0.8)',
                    border: errors.password ? '1px solid #ef4444' : '1px solid rgba(0,120,200,0.3)',
                    color: '#e2eeff',
                    boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.3)',
                  }}
                  onFocus={e => (e.target.style.borderColor = '#00cfff')}
                  onBlur={e => (e.target.style.borderColor = errors.password ? '#ef4444' : 'rgba(0,120,200,0.3)')}
                />
                <button
                  type="button"
                  onClick={() => setShowPwd(p => !p)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 transition-colors"
                  style={{ color: '#4a7aaa' }}
                >
                  {showPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.password && <p className="text-red-400 text-xs mt-1">{errors.password}</p>}
            </div>

            {/* Remember me */}
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={e => setRememberMe(e.target.checked)}
                  className="w-3.5 h-3.5 rounded accent-cyan-400"
                />
                <span className="text-xs" style={{ color: '#6b8aad' }}>Remember me</span>
              </label>
            </div>

            {/* Login button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg font-semibold text-sm transition-all duration-200 active:scale-95 disabled:opacity-60"
              style={{
                background: loading ? 'rgba(0,100,200,0.5)' : 'linear-gradient(90deg, #0050c8, #0090ff)',
                color: 'white',
                boxShadow: '0 4px 20px rgba(0,100,255,0.35)',
              }}
            >
              {loading ? (
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <UserCircle className="w-4 h-4" />
              )}
              {loading ? 'Signing in...' : 'Doctor Sign In'}
            </button>

            <div className="flex items-center gap-3 my-1">
              <div className="flex-1 h-px" style={{ background: 'rgba(0,120,200,0.2)' }} />
              <span className="text-xs" style={{ color: '#4a6a8a' }}>or</span>
              <div className="flex-1 h-px" style={{ background: 'rgba(0,120,200,0.2)' }} />
            </div>

            {/* Go to Patient Login */}
            <Link
              to="/login"
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg font-medium text-sm transition-all duration-200 active:scale-95"
              style={{
                background: 'transparent',
                border: '1px solid rgba(0,150,255,0.35)',
                color: '#90c8f0',
                textAlign: 'center'
              }}
            >
              <UserCircle className="w-4 h-4" />
              Login as Patient / Admin
            </Link>
          </form>
        </div>
      </div>
    </div>
  )
}
