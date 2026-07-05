import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Mail, ArrowLeft, Send } from 'lucide-react'
import toast from 'react-hot-toast'
import { authApi } from '../api/auth'

export default function ForgotPasswordPage() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email) { setError('Email is required'); return }
    if (!/\S+@\S+\.\S+/.test(email)) { setError('Enter a valid email'); return }

    setLoading(true)
    setError('')
    try {
      await authApi.forgotPassword(email)
      setSent(true)
      toast.success('OTP sent! Check your inbox.')
      // Pass email forward via state so VerifyOTP page can use it
      setTimeout(() => navigate('/verify-otp', { state: { email } }), 1800)
    } catch (err: any) {
      const msg = err?.response?.data?.message ?? 'Failed to send OTP'
      setError(msg)
      toast.error(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: '#050d1a' }}>
      {/* Bg glow */}
      <div className="fixed inset-0 pointer-events-none"
        style={{ background: 'radial-gradient(ellipse 60% 50% at 50% 50%, rgba(0,80,255,0.08) 0%, transparent 70%)' }} />

      <div className="relative z-10 w-full max-w-md">
        {/* Back link */}
        <Link to="/login"
          className="inline-flex items-center gap-2 mb-6 text-sm transition-colors"
          style={{ color: '#4a7aaa' }}
          onMouseEnter={e => (e.currentTarget.style.color = '#00cfff')}
          onMouseLeave={e => (e.currentTarget.style.color = '#4a7aaa')}>
          <ArrowLeft className="w-4 h-4" /> Back to Login
        </Link>

        {/* Card */}
        <div className="rounded-2xl p-8"
          style={{ background: '#0a1628', border: '1px solid rgba(0,150,255,0.15)', boxShadow: '0 20px 60px rgba(0,0,0,0.4)' }}>

          {/* Icon */}
          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg, rgba(0,80,200,0.3), rgba(0,150,255,0.2))', border: '1px solid rgba(0,180,255,0.3)' }}>
              <Mail style={{ width: '28px', height: '28px', color: '#00cfff' }} />
            </div>
          </div>

          <h1 className="text-xl font-bold text-center mb-2" style={{ color: '#e2eeff' }}>Forgot Password?</h1>
          <p className="text-sm text-center mb-6" style={{ color: '#4a6a8a' }}>
            Enter your registered email and we'll send you a 6-digit OTP.
          </p>

          {sent ? (
            /* Success state */
            <div className="text-center py-6">
              <div className="text-5xl mb-4">📧</div>
              <p className="text-sm font-medium mb-1" style={{ color: '#00cfff' }}>OTP Sent!</p>
              <p className="text-xs" style={{ color: '#4a6a8a' }}>Redirecting to verification page…</p>
              <div className="mt-4 flex justify-center">
                <span className="w-5 h-5 border-2 border-cyan-400/30 border-t-cyan-400 rounded-full animate-spin" />
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} noValidate className="space-y-4">
              <div>
                <label htmlFor="fp-email" className="block text-xs font-medium mb-1.5" style={{ color: '#8aabcc' }}>
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: '#4a7aaa' }} />
                  <input
                    id="fp-email"
                    type="email"
                    value={email}
                    onChange={e => { setEmail(e.target.value); setError('') }}
                    placeholder="Enter your registered email"
                    autoComplete="email"
                    className="w-full pl-10 pr-4 py-2.5 text-sm rounded-lg outline-none transition-all"
                    style={{
                      background: 'rgba(5,20,50,0.8)',
                      border: error ? '1px solid #ef4444' : '1px solid rgba(0,120,200,0.3)',
                      color: '#e2eeff',
                    }}
                    onFocus={e => (e.target.style.borderColor = '#00cfff')}
                    onBlur={e => (e.target.style.borderColor = error ? '#ef4444' : 'rgba(0,120,200,0.3)')}
                  />
                </div>
                {error && <p className="text-red-400 text-xs mt-1">{error}</p>}
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg font-semibold text-sm transition-all active:scale-95 disabled:opacity-60"
                style={{ background: 'linear-gradient(90deg, #0050c8, #0090ff)', color: 'white', boxShadow: '0 4px 20px rgba(0,100,255,0.3)' }}>
                {loading
                  ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  : <Send className="w-4 h-4" />}
                {loading ? 'Sending OTP…' : 'Send OTP'}
              </button>
            </form>
          )}

          <p className="text-center text-xs mt-6" style={{ color: '#3a5a7a' }}>
            Remembered your password?{' '}
            <Link to="/login" style={{ color: '#3a9fd8' }} className="font-medium hover:text-cyan-300 transition-colors">
              Sign In
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
