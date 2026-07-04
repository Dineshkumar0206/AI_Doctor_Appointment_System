import api from './axios'
import type { ApiResponse, DoctorRequest, DoctorResponse, PageResponse } from '../types'

export const doctorApi = {
  getAll: async (params?: {
    keyword?: string
    page?: number
    size?: number
    sortBy?: string
    sortDir?: string
  }): Promise<ApiResponse<PageResponse<DoctorResponse>>> => {
    const res = await api.get('/doctors', { params })
    return res.data
  },

  getAllList: async (): Promise<ApiResponse<DoctorResponse[]>> => {
    const res = await api.get('/doctors/list')
    return res.data
  },

  getById: async (id: number): Promise<ApiResponse<DoctorResponse>> => {
    const res = await api.get(`/doctors/${id}`)
    return res.data
  },

  getByUserId: async (userId: number): Promise<ApiResponse<DoctorResponse>> => {
    const res = await api.get(`/doctors/user/${userId}`)
    return res.data
  },

  getBySpecialization: async (spec: string): Promise<ApiResponse<DoctorResponse[]>> => {
    const res = await api.get(`/doctors/specialization/${spec}`)
    return res.data
  },

  create: async (data: DoctorRequest): Promise<ApiResponse<DoctorResponse>> => {
    const res = await api.post('/doctors', data)
    return res.data
  },

  update: async (id: number, data: DoctorRequest): Promise<ApiResponse<DoctorResponse>> => {
    const res = await api.put(`/doctors/${id}`, data)
    return res.data
  },

  updateStatus: async (id: number, status: string): Promise<ApiResponse<DoctorResponse>> => {
    const res = await api.patch(`/doctors/${id}/status`, null, { params: { status } })
    return res.data
  },

  delete: async (id: number): Promise<ApiResponse<null>> => {
    const res = await api.delete(`/doctors/${id}`)
    return res.data
  },
}
