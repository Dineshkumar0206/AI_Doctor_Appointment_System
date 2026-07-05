import { useState, useEffect, useRef } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { ArrowLeft, ShieldCheck } from 'lucide-react'
import toast from 'react-hot-toast'
import { authApi } from '../api/auth'

const OTP_LENGTH = 6
const EXPIRY_SECONDS = 5 * 60 // 5 minutes

export default function VerifyOtpPage() {
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
    if (!email) navigate('/forgot-password')
  }, [email, navigate])

  // Countdown timer
  useEffect(() => {
    if (timeLeft <= 0 || verified) return
    const id = setInterval(() => setTimeLeft(t => t - 1), 1000)
    return () => clearInterval(id)
  }, [timeLeft, verified])

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
      await authApi.verifyOtp(email, otp)
      setVerified(true)
      toast.success('OTP verified! Setting your new password…')
      setTimeout(() => navigate('/reset-password', { state: { email, otp } }), 1500)
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? 'Invalid OTP')
    } finally {
      setLoading(false)
    }
  }

  const handleResend = async () => {
    setResending(true)
    try {
      await authApi.forgotPassword(email)
      setDigits(Array(OTP_LENGTH).fill(''))
      setTimeLeft(EXPIRY_SECONDS)
      toast.success('New OTP sent to your email!')
      inputRefs.current[0]?.focus()
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? 'Failed to resend OTP')
    } finally {
      setResending(false)
    }
  }

  const timerColor = timeLeft < 60 ? '#ff5533' : timeLeft < 120 ? '#ff9900' : '#00cfff'

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: '#050d1a' }}>
      <div className="fixed inset-0 pointer-events-none"
        style={{ background: 'radial-gradient(ellipse 60% 50% at 50% 50%, rgba(80,0,200,0.07) 0%, transparent 70%)' }} />

      <div className="relative z-10 w-full max-w-md">
        <Link to="/forgot-password"
          className="inline-flex items-center gap-2 mb-6 text-sm transition-colors"
          style={{ color: '#4a7aaa' }}
          onMouseEnter={e => (e.currentTarget.style.color = '#00cfff')}
          onMouseLeave={e => (e.currentTarget.style.color = '#4a7aaa')}>
          <ArrowLeft className="w-4 h-4" /> Back
        </Link>

        <div className="rounded-2xl p-8"
          style={{ background: '#0a1628', border: '1px solid rgba(0,150,255,0.15)', boxShadow: '0 20px 60px rgba(0,0,0,0.4)' }}>

          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg, rgba(80,0,200,0.3), rgba(150,0,255,0.2))', border: '1px solid rgba(167,139,250,0.3)' }}>
              <ShieldCheck style={{ width: '28px', height: '28px', color: '#a78bfa' }} />
            </div>
          </div>

          <h1 className="text-xl font-bold text-center mb-1" style={{ color: '#e2eeff' }}>Enter OTP</h1>
          <p className="text-xs text-center mb-1" style={{ color: '#4a6a8a' }}>
            A 6-digit code was sent to
          </p>
          <p className="text-sm text-center font-medium mb-6" style={{ color: '#a78bfa' }}>{email}</p>

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
                className="w-11 h-13 text-center text-xl font-bold rounded-xl outline-none transition-all"
                style={{
                  width: '48px',
                  height: '56px',
                  background: d ? 'rgba(100,50,255,0.15)' : 'rgba(5,20,50,0.8)',
                  border: d ? '2px solid rgba(167,139,250,0.7)' : '1px solid rgba(0,120,200,0.3)',
                  color: '#a78bfa',
                  fontSize: '22px',
                }}
                onFocus={e => (e.target.style.borderColor = '#a78bfa')}
                onBlur={e => (e.target.style.borderColor = digits[i] ? 'rgba(167,139,250,0.7)' : 'rgba(0,120,200,0.3)')}
              />
            ))}
          </div>

          {/* Timer */}
          <div className="text-center mb-5">
            <span className="text-sm font-mono font-bold" style={{ color: timerColor }}>
              {timeLeft > 0 ? `⏱ ${formatTime(timeLeft)}` : '⚠ OTP Expired'}
            </span>
          </div>

          {/* Verify button */}
          {!verified ? (
            <button
              onClick={handleVerify}
              disabled={loading || digits.join('').length !== OTP_LENGTH}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg font-semibold text-sm transition-all active:scale-95 disabled:opacity-50"
              style={{ background: 'linear-gradient(90deg, #5500cc, #8800ff)', color: 'white', boxShadow: '0 4px 20px rgba(120,0,255,0.3)' }}>
              {loading
                ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                : <ShieldCheck className="w-4 h-4" />}
              {loading ? 'Verifying…' : 'Verify OTP'}
            </button>
          ) : (
            <div className="flex items-center justify-center gap-2 py-2.5 rounded-lg" style={{ background: 'rgba(0,200,100,0.1)', border: '1px solid rgba(0,200,100,0.3)' }}>
              <span style={{ color: '#00e888' }}>✓ Verified! Redirecting…</span>
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
              onMouseEnter={e => (e.currentTarget.style.color = '#00cfff')}
              onMouseLeave={e => (e.currentTarget.style.color = '#3a9fd8')}>
              {resending ? 'Sending…' : 'Resend OTP'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
