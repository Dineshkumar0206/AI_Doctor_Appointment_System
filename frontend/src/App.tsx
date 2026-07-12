import { Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { ProtectedRoute } from './routes/ProtectedRoute'
import { DoctorProtectedRoute } from './routes/DoctorProtectedRoute'
import { Layout } from './components/layout/Layout'
import { DoctorLayout } from './components/layout/DoctorLayout'
import LoginPage          from './pages/LoginPage'
import DoctorLoginPage    from './pages/DoctorLoginPage'
import RegisterPage       from './pages/RegisterPage'
import ForgotPasswordPage from './pages/ForgotPasswordPage'
import VerifyOtpPage      from './pages/VerifyOtpPage'
import ResetPasswordPage  from './pages/ResetPasswordPage'
import DashboardPage      from './pages/DashboardPage'
import DoctorDashboardPage from './pages/DoctorDashboardPage'
import DoctorsPage        from './pages/DoctorsPage'
import PatientsPage       from './pages/PatientsPage'
import DoctorPatientsPage from './pages/DoctorPatientsPage'
import AppointmentsPage   from './pages/AppointmentsPage'
import DoctorAppointmentsPage from './pages/DoctorAppointmentsPage'
import AiAssistantPage    from './pages/AiAssistantPage'
import ProfilePage        from './pages/ProfilePage'
import DoctorProfilePage  from './pages/DoctorProfilePage'

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        {/* Public routes */}
        <Route path="/login"          element={<LoginPage />} />
        <Route path="/register"       element={<RegisterPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/verify-otp"     element={<VerifyOtpPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />

        {/* Doctor portal public routes */}
        <Route path="/doctor/login"   element={<DoctorLoginPage />} />

        {/* Doctor portal protected routes */}
        <Route element={<DoctorProtectedRoute />}>
          <Route element={<DoctorLayout />}>
            <Route index element={<Navigate to="/doctor/dashboard" replace />} />
            <Route path="/doctor/dashboard"    element={<DoctorDashboardPage />} />
            <Route path="/doctor/appointments" element={<DoctorAppointmentsPage />} />
            <Route path="/doctor/patients"     element={<DoctorPatientsPage />} />
            <Route path="/doctor/profile"      element={<DoctorProfilePage />} />
            <Route path="/doctor/ai-assistant" element={<AiAssistantPage />} />
          </Route>
        </Route>

        {/* Patient/Admin protected routes */}
        <Route element={<ProtectedRoute />}>
          <Route element={<Layout />}>
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard"    element={<DashboardPage />} />
            <Route path="/doctors"      element={<DoctorsPage />} />
            <Route path="/appointments" element={<AppointmentsPage />} />
            <Route path="/ai-assistant" element={<AiAssistantPage />} />
            <Route path="/profile"      element={<ProfilePage />} />

            {/* Admin only */}
            <Route
              element={<ProtectedRoute allowedRoles={['ROLE_ADMIN']} />}
            >
              <Route path="/patients" element={<PatientsPage />} />
            </Route>
          </Route>
        </Route>

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </AuthProvider>
  )
}
