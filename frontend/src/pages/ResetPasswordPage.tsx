import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { ArrowLeft, Lock, Eye, EyeOff, CheckCircle } from 'lucide-react'
import toast from 'react-hot-toast'
import { authApi } from '../api/auth'

function getStrength(pw: string): { score: number; label: string; color: string } {
  let score = 0
  if (pw.length >= 8) score++
  if (/[A-Z]/.test(pw)) score++
  if (/[0-9]/.test(pw)) score++
  if (/[^a-zA-Z0-9]/.test(pw)) score++
  const map = [
    { label: '', color: 'transparent' },
    { label: 'Weak', color: '#ef4444' },
    { label: 'Fair', color: '#f97316' },
    { label: 'Good', color: '#eab308' },
    { label: 'Strong', color: '#22c55e' },
  ]
  return { score, ...map[score] }
}

export default function ResetPasswordPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const email: string = (location.state as any)?.email ?? ''
  const otp: string = (location.state as any)?.otp ?? ''

  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showNew, setShowNew] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const strength = getStrength(newPassword)

  const validate = () => {
    const e: Record<string, string> = {}
    if (!newPassword) e.newPassword = 'Password is required'
    else if (newPassword.length < 8) e.newPassword = 'Minimum 8 characters'
    if (!confirmPassword) e.confirmPassword = 'Please confirm your password'
    else if (newPassword !== confirmPassword) e.confirmPassword = 'Passwords do not match'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validate()) return

    setLoading(true)
    try {
      await authApi.resetPassword(email, otp, newPassword)
      setSuccess(true)
      toast.success('Password reset successfully!')
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? 'Failed to reset password')
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4" style={{ background: '#050d1a' }}>
        <div className="w-full max-w-md text-center">
          <div className="rounded-2xl p-10"
            style={{ background: '#0a1628', border: '1px solid rgba(0,200,100,0.2)', boxShadow: '0 20px 60px rgba(0,0,0,0.4)' }}>
            <div className="flex justify-center mb-6">
              <div className="w-20 h-20 rounded-full flex items-center justify-center"
                style={{ background: 'rgba(0,200,100,0.1)', border: '2px solid rgba(0,200,100,0.4)' }}>
                <CheckCircle style={{ width: '40px', height: '40px', color: '#00e888' }} />
              </div>
            </div>
            <h1 className="text-2xl font-bold mb-3" style={{ color: '#e2eeff' }}>Password Reset!</h1>
            <p className="text-sm mb-8" style={{ color: '#4a8a6a' }}>
              Your password has been successfully updated. You can now login with your new password.
            </p>
            <Link to="/login"
              className="inline-block w-full py-3 rounded-lg font-semibold text-sm text-white text-center transition-all active:scale-95"
              style={{ background: 'linear-gradient(90deg, #0050c8, #0090ff)', boxShadow: '0 4px 20px rgba(0,100,255,0.3)' }}>
              🚀 Go to Login
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: '#050d1a' }}>
      <div className="fixed inset-0 pointer-events-none"
        style={{ background: 'radial-gradient(ellipse 60% 50% at 50% 50%, rgba(0,80,255,0.07) 0%, transparent 70%)' }} />

      <div className="relative z-10 w-full max-w-md">
        <button onClick={() => navigate(-1)}
          className="inline-flex items-center gap-2 mb-6 text-sm transition-colors"
          style={{ color: '#4a7aaa', background: 'none', border: 'none', cursor: 'pointer' }}
          onMouseEnter={e => (e.currentTarget.style.color = '#00cfff')}
          onMouseLeave={e => (e.currentTarget.style.color = '#4a7aaa')}>
          <ArrowLeft className="w-4 h-4" /> Back
        </button>

        <div className="rounded-2xl p-8"
          style={{ background: '#0a1628', border: '1px solid rgba(0,150,255,0.15)', boxShadow: '0 20px 60px rgba(0,0,0,0.4)' }}>

          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg, rgba(0,80,200,0.3), rgba(0,150,255,0.2))', border: '1px solid rgba(0,180,255,0.3)' }}>
              <Lock style={{ width: '28px', height: '28px', color: '#00cfff' }} />
            </div>
          </div>

          <h1 className="text-xl font-bold text-center mb-2" style={{ color: '#e2eeff' }}>Create New Password</h1>
          <p className="text-xs text-center mb-6" style={{ color: '#4a6a8a' }}>
            Choose a strong password for your account
          </p>

          <form onSubmit={handleSubmit} noValidate className="space-y-4">
            {/* New Password */}
            <div>
              <label htmlFor="rp-new" className="block text-xs font-medium mb-1.5" style={{ color: '#8aabcc' }}>
                New Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: '#4a7aaa' }} />
                <input
                  id="rp-new"
                  type={showNew ? 'text' : 'password'}
                  value={newPassword}
                  onChange={e => { setNewPassword(e.target.value); setErrors(p => ({ ...p, newPassword: '' })) }}
                  placeholder="Min 8 characters"
                  className="w-full pl-10 pr-10 py-2.5 text-sm rounded-lg outline-none transition-all"
                  style={{
                    background: 'rgba(5,20,50,0.8)',
                    border: errors.newPassword ? '1px solid #ef4444' : '1px solid rgba(0,120,200,0.3)',
                    color: '#e2eeff',
                  }}
                  onFocus={e => (e.target.style.borderColor = '#00cfff')}
                  onBlur={e => (e.target.style.borderColor = errors.newPassword ? '#ef4444' : 'rgba(0,120,200,0.3)')}
                />
                <button type="button" onClick={() => setShowNew(p => !p)}
                  className="absolute right-3 top-1/2 -translate-y-1/2" style={{ color: '#4a7aaa' }}>
                  {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              {/* Strength bar */}
              {newPassword && (
                <div className="mt-2">
                  <div className="flex gap-1 mb-1">
                    {[1, 2, 3, 4].map(i => (
                      <div key={i} className="h-1 flex-1 rounded-full transition-all"
                        style={{ background: i <= strength.score ? strength.color : 'rgba(255,255,255,0.08)' }} />
                    ))}
                  </div>
                  <span className="text-xs" style={{ color: strength.color }}>{strength.label}</span>
                </div>
              )}
              {errors.newPassword && <p className="text-red-400 text-xs mt-1">{errors.newPassword}</p>}
            </div>

            {/* Confirm Password */}
            <div>
              <label htmlFor="rp-confirm" className="block text-xs font-medium mb-1.5" style={{ color: '#8aabcc' }}>
                Confirm Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: '#4a7aaa' }} />
                <input
                  id="rp-confirm"
                  type={showConfirm ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={e => { setConfirmPassword(e.target.value); setErrors(p => ({ ...p, confirmPassword: '' })) }}
                  placeholder="Re-enter your password"
                  className="w-full pl-10 pr-10 py-2.5 text-sm rounded-lg outline-none transition-all"
                  style={{
                    background: 'rgba(5,20,50,0.8)',
                    border: errors.confirmPassword ? '1px solid #ef4444' : '1px solid rgba(0,120,200,0.3)',
                    color: '#e2eeff',
                  }}
                  onFocus={e => (e.target.style.borderColor = '#00cfff')}
                  onBlur={e => (e.target.style.borderColor = errors.confirmPassword ? '#ef4444' : 'rgba(0,120,200,0.3)')}
                />
                <button type="button" onClick={() => setShowConfirm(p => !p)}
                  className="absolute right-3 top-1/2 -translate-y-1/2" style={{ color: '#4a7aaa' }}>
                  {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.confirmPassword && <p className="text-red-400 text-xs mt-1">{errors.confirmPassword}</p>}
            </div>

            {/* Password requirements */}
            <div className="rounded-lg p-3 text-xs space-y-1" style={{ background: 'rgba(0,80,200,0.06)', border: '1px solid rgba(0,100,200,0.15)' }}>
              {[
                ['Min 8 characters', newPassword.length >= 8],
                ['One uppercase letter', /[A-Z]/.test(newPassword)],
                ['One number', /[0-9]/.test(newPassword)],
                ['One special character', /[^a-zA-Z0-9]/.test(newPassword)],
              ].map(([label, met]) => (
                <div key={label as string} className="flex items-center gap-2" style={{ color: met ? '#22c55e' : '#3a5a7a' }}>
                  <span>{met ? '✓' : '○'}</span> {label as string}
                </div>
              ))}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg font-semibold text-sm transition-all active:scale-95 disabled:opacity-60"
              style={{ background: 'linear-gradient(90deg, #0050c8, #0090ff)', color: 'white', boxShadow: '0 4px 20px rgba(0,100,255,0.3)' }}>
              {loading
                ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                : <Lock className="w-4 h-4" />}
              {loading ? 'Resetting…' : 'Reset Password'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
