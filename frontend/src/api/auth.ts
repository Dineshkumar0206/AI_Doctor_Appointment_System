import api from './axios'
import type { ApiResponse, AuthResponse, LoginRequest, RegisterRequest, UserInfo } from '../types'

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

  updateProfile: async (data: { firstName: string; lastName: string; phone: string }): Promise<ApiResponse<UserInfo>> => {
    const res = await api.put<ApiResponse<UserInfo>>('/users/profile', data)
    return res.data
  },

  forgotPassword: async (email: string): Promise<ApiResponse<void>> => {
    const res = await api.post<ApiResponse<void>>('/auth/forgot-password', { email })
    return res.data
  },

  verifyOtp: async (email: string, otp: string): Promise<ApiResponse<void>> => {
    const res = await api.post<ApiResponse<void>>('/auth/verify-otp', { email, otp })
    return res.data
  },

  resetPassword: async (email: string, otp: string, newPassword: string): Promise<ApiResponse<void>> => {
    const res = await api.post<ApiResponse<void>>('/auth/reset-password', { email, otp, newPassword })
    return res.data
  },

  verifyEmail: async (email: string, otp: string): Promise<ApiResponse<void>> => {
    const res = await api.post<ApiResponse<void>>('/auth/verify-email', { email, otp })
    return res.data
  },

  resendVerification: async (email: string): Promise<ApiResponse<void>> => {
    const res = await api.post<ApiResponse<void>>('/auth/resend-verification', { email })
    return res.data
  },
}
