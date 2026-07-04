// ─── Auth ────────────────────────────────────────────────────────────────────
export interface RegisterRequest {
  firstName: string
  lastName: string
  email: string
  password: string
  phone?: string
  role?: string
}

export interface LoginRequest {
  email: string
  password: string
}

export interface UserInfo {
  id: number
  firstName: string
  lastName: string
  email: string
  phone?: string
  roles: string[]
  createdAt?: string
}

export interface AuthResponse {
  accessToken: string
  refreshToken: string
  tokenType: string
  expiresIn: number
  user: UserInfo
}

// ─── Doctor ──────────────────────────────────────────────────────────────────
export interface SlotInfo {
  id: number
  dayOfWeek: string
  startTime: string
  endTime: string
  slotDuration: number
  isAvailable: boolean
}

export interface DoctorResponse {
  id: number
  userId: number
  firstName: string
  lastName: string
  fullName: string
  email: string
  phone?: string
  specialization: string
  experience: number
  qualification?: string
  bio?: string
  consultationFee: number
  status: 'ACTIVE' | 'INACTIVE' | 'ON_LEAVE'
  availableSlots: SlotInfo[]
  createdAt?: string
  updatedAt?: string
}

export interface DoctorRequest {
  userId: number
  specialization: string
  experience: number
  qualification?: string
  bio?: string
  consultationFee?: number
  status?: string
}

// ─── Patient ─────────────────────────────────────────────────────────────────
export interface PatientResponse {
  id: number
  userId: number
  firstName: string
  lastName: string
  fullName: string
  email: string
  phone?: string
  dateOfBirth?: string
  gender?: 'MALE' | 'FEMALE' | 'OTHER'
  bloodGroup?: string
  address?: string
  emergencyContact?: string
  medicalNotes?: string
  createdAt?: string
  updatedAt?: string
}

export interface PatientRequest {
  userId: number
  dateOfBirth?: string
  gender?: string
  bloodGroup?: string
  address?: string
  emergencyContact?: string
  medicalNotes?: string
}

// ─── Appointment ─────────────────────────────────────────────────────────────
export type AppointmentStatus = 'PENDING' | 'CONFIRMED' | 'COMPLETED' | 'CANCELLED' | 'NO_SHOW'

export interface AppointmentResponse {
  id: number
  patientId: number
  patientName: string
  patientEmail: string
  doctorId: number
  doctorName: string
  doctorSpecialization: string
  appointmentDate: string
  startTime: string
  endTime: string
  status: AppointmentStatus
  reason?: string
  notes?: string
  aiSummary?: string
  createdAt?: string
  updatedAt?: string
}

export interface AppointmentRequest {
  patientId: number
  doctorId: number
  appointmentDate: string
  startTime: string
  endTime: string
  reason?: string
  notes?: string
}

// ─── Dashboard ───────────────────────────────────────────────────────────────
export interface DashboardStats {
  totalDoctors: number
  totalPatients: number
  totalAppointments: number
  todayAppointments: number
  upcomingAppointments: number
  completedAppointments: number
  cancelledAppointments: number
  pendingAppointments: number
  confirmedAppointments: number
}

// ─── API Wrappers ────────────────────────────────────────────────────────────
export interface ApiResponse<T> {
  success: boolean
  message: string
  data: T
  timestamp: string
}

export interface PageResponse<T> {
  content: T[]
  totalElements: number
  totalPages: number
  size: number
  number: number
  first: boolean
  last: boolean
}
