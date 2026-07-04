import api from './axios'
import type { ApiResponse, DashboardStats } from '../types'

export const dashboardApi = {
  getStats: async (): Promise<ApiResponse<DashboardStats>> => {
    const res = await api.get('/dashboard/stats')
    return res.data
  },
}
