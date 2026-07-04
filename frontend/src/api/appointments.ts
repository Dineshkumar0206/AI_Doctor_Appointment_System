import api from './axios'
import type {
  ApiResponse,
  AppointmentRequest,
  AppointmentResponse,
  PageResponse,
} from '../types'

export const appointmentApi = {
  book: async (data: AppointmentRequest): Promise<ApiResponse<AppointmentResponse>> => {
    const res = await api.post('/appointments', data)
    return res.data
  },

  getById: async (id: number): Promise<ApiResponse<AppointmentResponse>> => {
    const res = await api.get(`/appointments/${id}`)
    return res.data
  },

  getByPatient: async (
    patientId: number,
    params?: { page?: number; size?: number },
  ): Promise<ApiResponse<PageResponse<AppointmentResponse>>> => {
    const res = await api.get(`/appointments/patient/${patientId}`, { params })
    return res.data
  },

  getByDoctor: async (
    doctorId: number,
    params?: { page?: number; size?: number },
  ): Promise<ApiResponse<PageResponse<AppointmentResponse>>> => {
    const res = await api.get(`/appointments/doctor/${doctorId}`, { params })
    return res.data
  },

  getToday: async (): Promise<ApiResponse<AppointmentResponse[]>> => {
    const res = await api.get('/appointments/today')
    return res.data
  },

  getUpcoming: async (params?: {
    page?: number
    size?: number
  }): Promise<ApiResponse<PageResponse<AppointmentResponse>>> => {
    const res = await api.get('/appointments/upcoming', { params })
    return res.data
  },

  search: async (params: {
    patientId?: number
    doctorId?: number
    status?: string
    startDate?: string
    endDate?: string
    page?: number
    size?: number
  }): Promise<ApiResponse<PageResponse<AppointmentResponse>>> => {
    const res = await api.get('/appointments/search', { params })
    return res.data
  },

  update: async (
    id: number,
    data: AppointmentRequest,
  ): Promise<ApiResponse<AppointmentResponse>> => {
    const res = await api.put(`/appointments/${id}`, data)
    return res.data
  },

  updateStatus: async (
    id: number,
    status: string,
  ): Promise<ApiResponse<AppointmentResponse>> => {
    const res = await api.patch(`/appointments/${id}/status`, null, { params: { status } })
    return res.data
  },

  cancel: async (id: number): Promise<ApiResponse<AppointmentResponse>> => {
    const res = await api.patch(`/appointments/${id}/cancel`)
    return res.data
  },

  delete: async (id: number): Promise<ApiResponse<null>> => {
    const res = await api.delete(`/appointments/${id}`)
    return res.data
  },
}
