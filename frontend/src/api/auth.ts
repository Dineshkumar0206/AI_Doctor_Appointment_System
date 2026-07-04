import api from './axios'
import type { ApiResponse, AuthResponse, LoginRequest, RegisterRequest } from '../types'

export const authApi = {
  register: async (data: RegisterRequest): Promise<ApiResponse<AuthResponse>> => {
    const res = await api.post<ApiResponse<AuthResponse>>('/auth/register', data)
    return res.data
  },

  login: async (data: LoginRequest): Promise<ApiResponse<AuthResponse>> => {
    const res = await api.post<ApiResponse<AuthResponse>>('/auth/login', data)
    return res.data
  },

  refreshToken: async (refreshToken: string): Promise<ApiResponse<AuthResponse>> => {
    const res = await api.post<ApiResponse<AuthResponse>>('/auth/refresh-token', { refreshToken })
    return res.data
  },

  logout: async (refreshToken: string): Promise<void> => {
    await api.post('/auth/logout', { refreshToken })
  },
}
