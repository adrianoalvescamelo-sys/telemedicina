import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type UserRole = 'admin' | 'medico' | 'recepcionista' | 'paciente'

export interface AuthUser {
  id: string
  nome: string
  email: string
  role: UserRole
  mfaAtivo: boolean
  avatar?: string
}

interface AuthState {
  user: AuthUser | null
  accessToken: string | null
  isAuthenticated: boolean
  mfaPending: boolean
  tempUserId: string | null

  setAuth: (user: AuthUser, token: string, refreshToken: string) => void
  setMfaPending: (userId: string) => void
  logout: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      accessToken: null,
      isAuthenticated: false,
      mfaPending: false,
      tempUserId: null,

      setAuth: (user, token, refreshToken) => {
        localStorage.setItem('access_token', token)
        localStorage.setItem('refresh_token', refreshToken)
        set({ user, accessToken: token, isAuthenticated: true, mfaPending: false, tempUserId: null })
      },

      setMfaPending: (userId) => {
        set({ mfaPending: true, tempUserId: userId, isAuthenticated: false })
      },

      logout: () => {
        localStorage.removeItem('access_token')
        localStorage.removeItem('refresh_token')
        set({ user: null, accessToken: null, isAuthenticated: false, mfaPending: false, tempUserId: null })
      },
    }),
    {
      name: 'clinicavida-auth',
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
)
