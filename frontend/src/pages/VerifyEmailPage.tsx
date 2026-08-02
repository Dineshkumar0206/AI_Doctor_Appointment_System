import { useState, useEffect, useRef } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { ArrowLeft, MailCheck } from 'lucide-react'
import toast from 'react-hot-toast'
import { authApi } from '../api/auth'

const OTP_LENGTH = 6
const EXPIRY_SECONDS = 5 * 60 // 5 minutes

export default function VerifyEmailPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const email: string = (location.state as any)?.email ?? ''

  const [digits, setDigits] = useState<string[]>(Array(OTP_LENGTH).fill(''))
  const [loading, setLoading] = useState(false)
  const [resending, setResending] = useState(false)
  const [timeLeft, setTimeLeft] = useState(EXPIRY_SECONDS)
  const [verified, setVerified] = useState(false)
  const inputRefs = useRef<HTMLInputElement[]>([])

  // Redirect if no email was passed
  useEffect(() => {
    if (!email) navigate('/register')
  }, [email, navigate])

  // Countdown timer
  useEffect(() => {
    if (timeLeft <= 0 || verified) return
    const id = setInterval(() => setTimeLeft(t => t - 1), 1000)
    return () => clearInterval(id)
  }, [timeLeft, verified])

  // Auto-focus first input on mount
  useEffect(() => {
    setTimeout(() => inputRefs.current[0]?.focus(), 100)
  }, [])

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60).toString().padStart(2, '0')
    const sec = (s % 60).toString().padStart(2, '0')
    return `${m}:${sec}`
  }

  const handleDigitChange = (index: number, value: string) => {
    const cleaned = value.replace(/\D/g, '').slice(-1)
    const next = [...digits]
    next[index] = cleaned
    setDigits(next)
    if (cleaned && index < OTP_LENGTH - 1) inputRefs.current[index + 1]?.focus()
  }

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !digits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus()
    }
  }

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault()
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, OTP_LENGTH)
    const next = Array(OTP_LENGTH).fill('')
    pasted.split('').forEach((ch, i) => { next[i] = ch })
    setDigits(next)
    const focusIdx = Math.min(pasted.length, OTP_LENGTH - 1)
    inputRefs.current[focusIdx]?.focus()
  }

  const handleVerify = async () => {
    const otp = digits.join('')
    if (otp.length !== OTP_LENGTH) { toast.error('Please enter all 6 digits'); return }
    if (timeLeft <= 0) { toast.error('OTP has expired. Please request a new one.'); return }

    setLoading(true)
    try {
      await authApi.verifyEmail(email, otp)
      setVerified(true)
      toast.success('Email verified! You can now log in 🎉')
      setTimeout(() => navigate('/login'), 2000)
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? 'Invalid OTP')
    } finally {
      setLoading(false)
    }
  }

  const handleResend = async () => {
    setResending(true)
    try {
      await authApi.resendVerification(email)
      setDigits(Array(OTP_LENGTH).fill(''))
      setTimeLeft(EXPIRY_SECONDS)
      toast.success('New verification code sent!')
      inputRefs.current[0]?.focus()
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? 'Failed to resend code')
    } finally {
      setResending(false)
    }
  }

  const timerColor = timeLeft < 60 ? '#ff5533' : timeLeft < 120 ? '#ff9900' : '#22d3ee'

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: '#050d1a' }}>
      {/* Ambient glow */}
      <div className="fixed inset-0 pointer-events-none"
        style={{ background: 'radial-gradient(ellipse 60% 50% at 50% 50%, rgba(0,150,200,0.07) 0%, transparent 70%)' }} />

      <div className="relative z-10 w-full max-w-md">
        <Link to="/register"
          className="inline-flex items-center gap-2 mb-6 text-sm transition-colors"
          style={{ color: '#4a7aaa' }}
          onMouseEnter={e => (e.currentTarget.style.color = '#22d3ee')}
          onMouseLeave={e => (e.currentTarget.style.color = '#4a7aaa')}>
          <ArrowLeft className="w-4 h-4" /> Back to Register
        </Link>

        <div className="rounded-2xl p-8"
          style={{ background: '#0a1628', border: '1px solid rgba(0,150,255,0.15)', boxShadow: '0 20px 60px rgba(0,0,0,0.4)' }}>

          {/* Icon */}
          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg, rgba(0,150,200,0.3), rgba(0,200,255,0.15))', border: '1px solid rgba(34,211,238,0.3)' }}>
              <MailCheck style={{ width: '28px', height: '28px', color: '#22d3ee' }} />
            </div>
          </div>

          <h1 className="text-xl font-bold text-center mb-1" style={{ color: '#e2eeff' }}>
            Verify Your Email
          </h1>
          <p className="text-xs text-center mb-1" style={{ color: '#4a6a8a' }}>
            A 6-digit verification code was sent to
          </p>
          <p className="text-sm text-center font-medium mb-6" style={{ color: '#22d3ee' }}>
            {email}
          </p>

          {/* OTP Input Grid */}
          <div className="flex justify-center gap-2.5 mb-6" onPaste={handlePaste}>
            {digits.map((d, i) => (
              <input
                key={i}
                ref={el => { if (el) inputRefs.current[i] = el }}
                type="text"
                inputMode="numeric"
                maxLength={2}
                value={d}
                onChange={e => handleDigitChange(i, e.target.value)}
                onKeyDown={e => handleKeyDown(i, e)}
                className="text-center font-bold rounded-xl outline-none transition-all"
                style={{
                  width: '48px',
                  height: '56px',
                  background: d ? 'rgba(0,150,200,0.15)' : 'rgba(5,20,50,0.8)',
                  border: d ? '2px solid rgba(34,211,238,0.7)' : '1px solid rgba(0,120,200,0.3)',
                  color: '#22d3ee',
                  fontSize: '22px',
                }}
                onFocus={e => (e.target.style.borderColor = '#22d3ee')}
                onBlur={e => (e.target.style.borderColor = digits[i] ? 'rgba(34,211,238,0.7)' : 'rgba(0,120,200,0.3)')}
              />
            ))}
          </div>

          {/* Timer */}
          <div className="text-center mb-5">
            <span className="text-sm font-mono font-bold" style={{ color: timerColor }}>
              {timeLeft > 0 ? `⏱ ${formatTime(timeLeft)}` : '⚠ Code Expired'}
            </span>
          </div>

          {/* Verify button */}
          {!verified ? (
            <button
              onClick={handleVerify}
              disabled={loading || digits.join('').length !== OTP_LENGTH}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg font-semibold text-sm transition-all active:scale-95 disabled:opacity-50"
              style={{ background: 'linear-gradient(90deg, #0077aa, #00aacc)', color: 'white', boxShadow: '0 4px 20px rgba(0,150,200,0.3)' }}>
              {loading
                ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                : <MailCheck className="w-4 h-4" />}
              {loading ? 'Verifying…' : 'Verify Email'}
            </button>
          ) : (
            <div className="flex items-center justify-center gap-2 py-2.5 rounded-lg"
              style={{ background: 'rgba(0,200,100,0.1)', border: '1px solid rgba(0,200,100,0.3)' }}>
              <span style={{ color: '#00e888' }}>✓ Email Verified! Redirecting to login…</span>
            </div>
          )}

          {/* Resend */}
          <div className="flex items-center justify-center gap-1 mt-4 text-xs" style={{ color: '#3a5a7a' }}>
            Didn't receive it?{' '}
            <button
              onClick={handleResend}
              disabled={resending || timeLeft > EXPIRY_SECONDS - 30}
              className="transition-colors disabled:opacity-40"
              style={{ color: '#3a9fd8' }}
              onMouseEnter={e => (e.currentTarget.style.color = '#22d3ee')}
              onMouseLeave={e => (e.currentTarget.style.color = '#3a9fd8')}>
              {resending ? 'Sending…' : 'Resend Code'}
            </button>
          </div>

          {/* Info */}
          <p className="text-center text-xs mt-5" style={{ color: '#2a4a6a' }}>
            Check your spam folder if you don't see it in your inbox.
          </p>
        </div>
      </div>
    </div>
  )
}
