import api from './axios'
import type { ApiResponse, PageResponse, PatientRequest, PatientResponse } from '../types'

export const patientApi = {
  getAll: async (params?: {
    keyword?: string
    page?: number
    size?: number
  }): Promise<ApiResponse<PageResponse<PatientResponse>>> => {
    const res = await api.get('/patients', { params })
    return res.data
  },

  getAllList: async (): Promise<ApiResponse<PatientResponse[]>> => {
    const res = await api.get('/patients/list')
    return res.data
  },

  getById: async (id: number): Promise<ApiResponse<PatientResponse>> => {
    const res = await api.get(`/patients/${id}`)
    return res.data
  },

  getByUserId: async (userId: number): Promise<ApiResponse<PatientResponse>> => {
    const res = await api.get(`/patients/user/${userId}`)
    return res.data
  },

  create: async (data: PatientRequest): Promise<ApiResponse<PatientResponse>> => {
    const res = await api.post('/patients', data)
    return res.data
  },

  update: async (id: number, data: PatientRequest): Promise<ApiResponse<PatientResponse>> => {
    const res = await api.put(`/patients/${id}`, data)
    return res.data
  },

  delete: async (id: number): Promise<ApiResponse<null>> => {
    const res = await api.delete(`/patients/${id}`)
    return res.data
  },
}
