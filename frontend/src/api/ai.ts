import api from './axios'
import type { ApiResponse } from '../types'

export const aiApi = {
  suggestSlots: async (query: string): Promise<ApiResponse<string>> => {
    const res = await api.post('/ai/suggest-slots', null, { params: { query } })
    return res.data
  },

  generateSummary: async (appointmentId: number): Promise<ApiResponse<string>> => {
    const res = await api.get(`/ai/appointment-summary/${appointmentId}`)
    return res.data
  },

  searchDoctors: async (query: string): Promise<ApiResponse<string>> => {
    const res = await api.post('/ai/search-doctors', null, { params: { query } })
    return res.data
  },

  generateReminder: async (appointmentId: number): Promise<ApiResponse<string>> => {
    const res = await api.get(`/ai/reminder/${appointmentId}`)
    return res.data
  },

  chat: async (message: string): Promise<ApiResponse<string>> => {
    const res = await api.post('/ai/chat', null, { params: { message } })
    return res.data
  },
}
