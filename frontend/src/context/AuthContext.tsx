import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from 'react'
import { authApi } from '../api/auth'
import type { LoginRequest, RegisterRequest, UserInfo } from '../types'

interface AuthContextType {
  user: UserInfo | null
  isAuthenticated: boolean
  isLoading: boolean
  login: (data: LoginRequest) => Promise<void>
  register: (data: RegisterRequest) => Promise<void>
  logout: () => Promise<void>
  hasRole: (role: string) => boolean
  updateUser: (userInfo: UserInfo) => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserInfo | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Re-hydrate user from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem('user')
    const token = localStorage.getItem('accessToken')
    if (stored && token) {
      try {
        setUser(JSON.parse(stored))
      } catch {
        localStorage.clear()
      }
    }
    setIsLoading(false)
  }, [])

  const login = useCallback(async (data: LoginRequest) => {
    const res = await authApi.login(data)
    const { accessToken, refreshToken, user: userInfo } = res.data
    localStorage.setItem('accessToken', accessToken)
    localStorage.setItem('refreshToken', refreshToken)
    localStorage.setItem('user', JSON.stringify(userInfo))
    setUser(userInfo)
  }, [])

  const register = useCallback(async (data: RegisterRequest) => {
    const res = await authApi.register(data)
    const { accessToken, refreshToken, user: userInfo } = res.data
    localStorage.setItem('accessToken', accessToken)
    localStorage.setItem('refreshToken', refreshToken)
    localStorage.setItem('user', JSON.stringify(userInfo))
    setUser(userInfo)
  }, [])

  const logout = useCallback(async () => {
    const refreshToken = localStorage.getItem('refreshToken')
    try {
      if (refreshToken) await authApi.logout(refreshToken)
    } catch {
      // ignore
    } finally {
      localStorage.clear()
      setUser(null)
    }
  }, [])

  const hasRole = useCallback(
    (role: string) => user?.roles?.includes(role) ?? false,
    [user],
  )

  const updateUser = useCallback((userInfo: UserInfo) => {
    localStorage.setItem('user', JSON.stringify(userInfo))
    setUser(userInfo)
  }, [])

  return (
    <AuthContext.Provider
      value={{ user, isAuthenticated: !!user, isLoading, login, register, logout, hasRole, updateUser }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth(): AuthContextType {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
