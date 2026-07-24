import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react'
import {
  apiCurrentUser,
  apiLogin,
  apiLogout,
  apiRegister,
  seedIfNeeded,
  type Gender,
  type User,
} from './db'

interface AuthContextValue {
  user: User | null
  loading: boolean
  login: (email: string, password: string) => Promise<User>
  register: (name: string, email: string, password: string, gender: Gender) => Promise<User>
  logout: () => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    seedIfNeeded()
    setUser(apiCurrentUser())
    setLoading(false)
  }, [])

  const login = useCallback(async (email: string, password: string) => {
    const u = await apiLogin(email, password)
    setUser(u)
    return u
  }, [])

  const register = useCallback(async (name: string, email: string, password: string, gender: Gender) => {
    const u = await apiRegister(name, email, password, gender)
    setUser(u)
    return u
  }, [])

  const logout = useCallback(() => {
    apiLogout()
    setUser(null)
  }, [])

  return <AuthContext.Provider value={{ user, loading, login, register, logout }}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth deve essere usato dentro AuthProvider')
  return ctx
}
