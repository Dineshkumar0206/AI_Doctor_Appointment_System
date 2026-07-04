import { Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { ProtectedRoute } from './routes/ProtectedRoute'
import { Layout } from './components/layout/Layout'
import LoginPage       from './pages/LoginPage'
import RegisterPage    from './pages/RegisterPage'
import DashboardPage   from './pages/DashboardPage'
import DoctorsPage     from './pages/DoctorsPage'
import PatientsPage    from './pages/PatientsPage'
import AppointmentsPage from './pages/AppointmentsPage'
import AiAssistantPage from './pages/AiAssistantPage'
import ProfilePage     from './pages/ProfilePage'

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        {/* Public routes */}
        <Route path="/login"    element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />

        {/* Protected routes – all authenticated users */}
        <Route element={<ProtectedRoute />}>
          <Route element={<Layout />}>
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard"    element={<DashboardPage />} />
            <Route path="/doctors"      element={<DoctorsPage />} />
            <Route path="/appointments" element={<AppointmentsPage />} />
            <Route path="/ai-assistant" element={<AiAssistantPage />} />
            <Route path="/profile"      element={<ProfilePage />} />

            {/* Admin + Doctor only */}
            <Route
              element={<ProtectedRoute allowedRoles={['ROLE_ADMIN', 'ROLE_DOCTOR']} />}
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
