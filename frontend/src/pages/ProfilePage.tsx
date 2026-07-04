import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { User, Mail, Phone, Shield, Save, Lock, Eye, EyeOff } from 'lucide-react'
import toast from 'react-hot-toast'

export default function ProfilePage() {
  const { user, hasRole } = useAuth()
  const [showPwd, setShowPwd] = useState(false)
  const [pwdForm, setPwdForm] = useState({ current: '', newPwd: '', confirm: '' })
  const [pwdErrors, setPwdErrors] = useState<Record<string, string>>({})

  const roleLabel = hasRole('ROLE_ADMIN') ? 'Administrator' : hasRole('ROLE_DOCTOR') ? 'Doctor' : 'Patient'
  const roleColor = hasRole('ROLE_ADMIN')
    ? 'from-accent-600 to-accent-500'
    : hasRole('ROLE_DOCTOR')
    ? 'from-blue-600 to-blue-500'
    : 'from-emerald-600 to-emerald-500'

  const validatePwd = () => {
    const e: Record<string, string> = {}
    if (!pwdForm.current)        e.current = 'Current password required'
    if (!pwdForm.newPwd)         e.newPwd  = 'New password required'
    else if (pwdForm.newPwd.length < 8) e.newPwd = 'Min 8 characters'
    if (pwdForm.newPwd !== pwdForm.confirm) e.confirm = 'Passwords do not match'
    setPwdErrors(e)
    return Object.keys(e).length === 0
  }

  const handlePwdSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!validatePwd()) return
    // Password change would call API — showing success for demo
    toast.success('Password change feature requires backend /auth/change-password endpoint')
    setPwdForm({ current: '', newPwd: '', confirm: '' })
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-fade-in">
      <div className="page-header">
        <h1 className="page-title">My Profile</h1>
        <p className="page-subtitle">Manage your account information</p>
      </div>

      {/* Profile Card */}
      <div className="glass-card p-6">
        <div className="flex items-center gap-6 mb-6 pb-6 border-b border-dark-700">
          {/* Avatar */}
          <div className="relative">
            <div className={`w-20 h-20 rounded-2xl bg-gradient-to-br ${roleColor} flex items-center justify-center text-white text-2xl font-bold shadow-glow`}>
              {user?.firstName?.[0]}{user?.lastName?.[0]}
            </div>
            <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-emerald-500 rounded-full border-2 border-dark-900 flex items-center justify-center">
              <div className="w-2 h-2 bg-white rounded-full" />
            </div>
          </div>
          <div>
            <h2 className="text-xl font-bold text-dark-50">{user?.firstName} {user?.lastName}</h2>
            <p className="text-dark-400 text-sm mt-0.5">{user?.email}</p>
            <span className={`inline-flex items-center gap-1.5 mt-2 px-3 py-1 text-xs font-semibold rounded-full bg-gradient-to-r ${roleColor} text-white`}>
              <Shield className="w-3 h-3" /> {roleLabel}
            </span>
          </div>
        </div>

        {/* Info Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <InfoItem icon={User} label="First Name" value={user?.firstName ?? '—'} />
          <InfoItem icon={User} label="Last Name"  value={user?.lastName  ?? '—'} />
          <InfoItem icon={Mail} label="Email"      value={user?.email     ?? '—'} />
          <InfoItem icon={Phone} label="Phone"     value={user?.phone     ?? 'Not set'} />
          <div className="sm:col-span-2">
            <label className="form-label">Roles</label>
            <div className="flex flex-wrap gap-2 mt-1">
              {user?.roles?.map(role => (
                <span key={role} className="px-3 py-1 rounded-full text-xs font-semibold
                                           bg-primary-500/20 text-primary-400 border border-primary-500/30">
                  {role.replace('ROLE_', '')}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Account Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Member Since', value: user?.createdAt ? new Date(user.createdAt).getFullYear().toString() : '2024' },
          { label: 'Account ID',   value: `#${user?.id ?? '—'}` },
          { label: 'Status',       value: 'Active' },
        ].map(({ label, value }) => (
          <div key={label} className="glass-card p-4 text-center hover:border-primary-500/30 transition-all">
            <p className="text-lg font-bold text-dark-100">{value}</p>
            <p className="text-xs text-dark-400 mt-1">{label}</p>
          </div>
        ))}
      </div>

      {/* Change Password */}
      <div className="glass-card p-6">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-9 h-9 rounded-xl bg-amber-500/20 flex items-center justify-center text-amber-400">
            <Lock className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-dark-100">Change Password</h3>
            <p className="text-xs text-dark-400">Update your account password</p>
          </div>
        </div>

        <form onSubmit={handlePwdSubmit} className="space-y-4">
          {[
            { key: 'current', label: 'Current Password' },
            { key: 'newPwd',  label: 'New Password' },
            { key: 'confirm', label: 'Confirm New Password' },
          ].map(({ key, label }) => (
            <div key={key}>
              <label className="form-label">{label}</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-400" />
                <input
                  type={showPwd ? 'text' : 'password'}
                  value={pwdForm[key as keyof typeof pwdForm]}
                  onChange={e => setPwdForm(p => ({ ...p, [key]: e.target.value }))}
                  className={`input-field pl-10 ${pwdErrors[key] ? 'border-red-500' : ''}`}
                  placeholder="••••••••"
                />
                {key === 'confirm' && (
                  <button type="button" onClick={() => setShowPwd(p => !p)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-dark-400">
                    {showPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                )}
              </div>
              {pwdErrors[key] && <p className="text-red-400 text-xs mt-1">{pwdErrors[key]}</p>}
            </div>
          ))}

          <button type="submit" className="btn-primary flex items-center gap-2">
            <Save className="w-4 h-4" /> Update Password
          </button>
        </form>
      </div>
    </div>
  )
}

function InfoItem({ icon: Icon, label, value }: { icon: typeof User; label: string; value: string }) {
  return (
    <div>
      <label className="form-label">{label}</label>
      <div className="flex items-center gap-2 px-4 py-3 bg-dark-800 border border-dark-700 rounded-xl">
        <Icon className="w-4 h-4 text-dark-400 flex-shrink-0" />
        <span className="text-dark-200 text-sm">{value}</span>
      </div>
    </div>
  )
}
