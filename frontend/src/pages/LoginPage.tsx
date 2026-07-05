import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { Eye, EyeOff, Lock, Mail, UserCircle, CalendarClock } from 'lucide-react'
import toast from 'react-hot-toast'

export default function LoginPage() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({ email: '', password: '' })
  const [showPwd, setShowPwd] = useState(false)
  const [rememberMe, setRememberMe] = useState(false)
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const validate = () => {
    const e: Record<string, string> = {}
    if (!form.email) e.email = 'Email is required'
    else if (!/\S+@\S+\.\S+/.test(form.email)) e.email = 'Invalid email'
    if (!form.password) e.password = 'Password is required'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validate()) return
    setLoading(true)
    try {
      await login(form)
      toast.success('Welcome back!')
      navigate('/dashboard')
    } catch (err: any) {
      const msg = err?.response?.data?.message ?? 'Invalid credentials'
      toast.error(msg)
    } finally {
      setLoading(false)
    }
  }

  const fillAdmin = async () => {
    const adminForm = { email: 'admin@appointment.com', password: 'Admin@123' }
    setLoading(true)
    try {
      await login(adminForm)
      toast.success('Logged in as Admin!')
      navigate('/dashboard')
    } catch (err: any) {
      const msg = err?.response?.data?.message ?? 'Admin login failed'
      toast.error(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex" style={{ background: '#050d1a' }}>
      {/* ── LEFT HERO PANEL ── */}
      <div className="hidden lg:flex flex-1 relative overflow-hidden flex-col justify-center px-14"
        style={{ background: 'linear-gradient(135deg, #050d1a 0%, #071428 40%, #061035 100%)' }}>

        {/* Grid overlay */}
        <div className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: 'linear-gradient(rgba(0,180,255,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(0,180,255,0.3) 1px, transparent 1px)',
            backgroundSize: '60px 60px',
          }} />

        {/* Radial glow */}
        <div className="absolute inset-0"
          style={{ background: 'radial-gradient(ellipse 70% 60% at 50% 60%, rgba(0,100,255,0.12) 0%, transparent 70%)' }} />

        {/* Title */}
        <div className="relative z-10 mb-12">
          <div className="flex items-baseline gap-3 mb-3">
            <span className="text-5xl font-black" style={{ color: '#00cfff', textShadow: '0 0 20px rgba(0,207,255,0.6)' }}>AI</span>
            <span className="text-4xl font-bold text-white tracking-wide">APPOINTMENT</span>
          </div>
          <div className="text-4xl font-bold text-white tracking-wide mb-6">SYSTEM</div>
          <p className="text-lg font-medium" style={{ color: '#7eb8e0' }}>Smart Appointments,</p>
          <p className="text-lg font-medium" style={{ color: '#7eb8e0' }}>Better Healthcare</p>
        </div>

        {/* Animated Heart + ECG */}
        <div className="relative z-10 flex justify-center items-center" style={{ height: '320px' }}>
          {/* Outer ring pulses */}
          <div className="absolute rounded-full border animate-ping"
            style={{ width: '320px', height: '320px', borderColor: 'rgba(0,180,255,0.15)', animationDuration: '3s' }} />
          <div className="absolute rounded-full border"
            style={{ width: '280px', height: '280px', borderColor: 'rgba(0,180,255,0.2)' }} />
          <div className="absolute rounded-full border"
            style={{ width: '220px', height: '220px', borderColor: 'rgba(0,180,255,0.3)' }} />

          {/* Heart SVG with glow */}
          <svg viewBox="0 0 200 180" style={{ width: '180px', height: '180px', filter: 'drop-shadow(0 0 20px rgba(0,150,255,0.8))' }}>
            {/* Heart shape */}
            <defs>
              <linearGradient id="heartGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#0070ff" />
                <stop offset="100%" stopColor="#00cfff" />
              </linearGradient>
              <filter id="glow">
                <feGaussianBlur stdDeviation="3" result="coloredBlur" />
                <feMerge><feMergeNode in="coloredBlur" /><feMergeNode in="SourceGraphic" /></feMerge>
              </filter>
            </defs>
            <path
              d="M100 155 C60 130, 15 100, 15 65 C15 40, 35 20, 60 20 C75 20, 90 30, 100 42 C110 30, 125 20, 140 20 C165 20, 185 40, 185 65 C185 100, 140 130, 100 155Z"
              fill="url(#heartGrad)"
              opacity="0.85"
              filter="url(#glow)"
            />
            {/* ECG line across heart */}
            <polyline
              points="30,90 55,90 62,70 68,110 76,55 84,115 92,90 108,90 115,75 122,90 170,90"
              fill="none"
              stroke="white"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
              opacity="0.9"
            />
          </svg>

          {/* Medical cross icon top-right */}
          <div className="absolute top-4 right-8 w-10 h-10 rounded-lg flex items-center justify-center"
            style={{ background: 'rgba(0,100,255,0.2)', border: '1px solid rgba(0,150,255,0.4)' }}>
            <svg viewBox="0 0 24 24" style={{ width: '20px', height: '20px', fill: '#00cfff' }}>
              <path d="M19 8h-2V5a1 1 0 00-1-1H8a1 1 0 00-1 1v3H5a1 1 0 00-1 1v6a1 1 0 001 1h2v3a1 1 0 001 1h8a1 1 0 001-1v-3h2a1 1 0 001-1V9a1 1 0 00-1-1zm-9 9V7h4v10h-4z" />
              <rect x="9" y="7" width="6" height="10" rx="1" />
              <rect x="7" y="9" width="10" height="6" rx="1" />
            </svg>
          </div>

          {/* Shield icon bottom-left */}
          <div className="absolute bottom-8 left-6 w-10 h-10 rounded-lg flex items-center justify-center"
            style={{ background: 'rgba(0,100,255,0.2)', border: '1px solid rgba(0,150,255,0.4)' }}>
            <svg viewBox="0 0 24 24" style={{ width: '20px', height: '20px', fill: '#00cfff' }}>
              <path d="M12 1L3 5v6c0 5.5 3.8 10.7 9 12 5.2-1.3 9-6.5 9-12V5l-9-4z" />
            </svg>
          </div>
        </div>

        {/* Bottom platform rings */}
        <div className="relative z-10 flex justify-center mt-6">
          <div className="relative flex items-center justify-center" style={{ width: '280px', height: '50px' }}>
            <div className="absolute rounded-full border-2 opacity-40"
              style={{ width: '280px', height: '30px', borderColor: '#00cfff', borderRadius: '50%', transform: 'rotateX(75deg)' }} />
            <div className="absolute rounded-full border opacity-25"
              style={{ width: '200px', height: '20px', borderColor: '#00cfff', borderRadius: '50%', transform: 'rotateX(75deg)' }} />
          </div>
        </div>
      </div>

      {/* ── RIGHT FORM PANEL ── */}
      <div className="flex-1 lg:max-w-md xl:max-w-lg flex items-center justify-center p-8"
        style={{ background: 'linear-gradient(160deg, #071020 0%, #0a1628 100%)', borderLeft: '1px solid rgba(0,150,255,0.1)' }}>
        <div className="w-full max-w-sm">

          {/* Icon + heading */}
          <div className="flex flex-col items-center mb-8">
            <div className="mb-4 relative">
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center"
                style={{ background: 'linear-gradient(135deg, rgba(0,80,200,0.3), rgba(0,150,255,0.2))', border: '1px solid rgba(0,180,255,0.3)', boxShadow: '0 0 30px rgba(0,120,255,0.2)' }}>
                <CalendarClock style={{ width: '30px', height: '30px', color: '#00cfff' }} />
              </div>
            </div>
            <h1 className="text-2xl font-bold text-white mb-1">Welcome Back</h1>
            <p className="text-sm" style={{ color: '#6b8aad' }}>Sign in to your account</p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} noValidate className="space-y-4">
            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-xs font-medium mb-1.5" style={{ color: '#8aabcc' }}>
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: '#4a7aaa' }} />
                <input
                  id="email"
                  type="email"
                  value={form.email}
                  onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
                  placeholder="Enter your email"
                  autoComplete="email"
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
                  autoComplete="current-password"
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
                  aria-label="Toggle password visibility"
                >
                  {showPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.password && <p className="text-red-400 text-xs mt-1">{errors.password}</p>}
            </div>

            {/* Remember me + Forgot */}
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
              <Link
                to="/forgot-password"
                className="text-xs transition-colors hover:text-cyan-300"
                style={{ color: '#3a9fd8' }}>
                Forgot Password?
              </Link>
            </div>

            {/* Sign In button */}
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
              {loading ? 'Signing in...' : 'Sign In'}
            </button>

            {/* Divider */}
            <div className="flex items-center gap-3 my-1">
              <div className="flex-1 h-px" style={{ background: 'rgba(0,120,200,0.2)' }} />
              <span className="text-xs" style={{ color: '#4a6a8a' }}>or</span>
              <div className="flex-1 h-px" style={{ background: 'rgba(0,120,200,0.2)' }} />
            </div>

            {/* Login as Admin */}
            <button
              type="button"
              onClick={fillAdmin}
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg font-medium text-sm transition-all duration-200 active:scale-95 disabled:opacity-60"
              style={{
                background: 'transparent',
                border: '1px solid rgba(0,150,255,0.35)',
                color: '#90c8f0',
              }}
              onMouseEnter={e => (e.currentTarget.style.background = 'rgba(0,100,255,0.08)')}
              onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
            >
              <UserCircle className="w-4 h-4" />
              Login as Admin
            </button>
          </form>

          {/* Register link */}
          <p className="text-center text-sm mt-6" style={{ color: '#4a6a8a' }}>
            Don't have an account?{' '}
            <Link to="/register" className="font-semibold transition-colors hover:text-cyan-300" style={{ color: '#3a9fd8' }}>
              Register
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
