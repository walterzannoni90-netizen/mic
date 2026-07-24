import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react'
import { supabase } from './supabase'
import type { User, Gender } from './db'

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

  async function fetchProfile(id: string) {
    const { data } = await supabase.from('profiles').select('*').eq('id', id).single()
    return data as User | null
  }

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session?.user) {
        const p = await fetchProfile(session.user.id)
        setUser(p)
      }
      setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session?.user) {
        const p = await fetchProfile(session.user.id)
        setUser(p)
      } else {
        setUser(null)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  const login = useCallback(async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw new Error(error.message === 'Invalid login credentials' ? 'Email o password non corretti.' : error.message)
    const p = await fetchProfile(data.user.id)
    if (!p) throw new Error('Profilo non trovato.')
    setUser(p)
    return p
  }, [])

  const register = useCallback(async (name: string, email: string, password: string, gender: Gender) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { name, gender, role: 'user' } },
    })
    if (error) throw new Error(error.message === 'User already registered' ? 'Esiste già un account con questa email.' : error.message)
    if (!data.user) throw new Error('Errore durante la registrazione.')
    const p = await fetchProfile(data.user.id)
    if (!p) throw new Error('Errore durante la creazione del profilo.')
    setUser(p)
    return p
  }, [])

  const logout = useCallback(async () => {
    await supabase.auth.signOut()
    setUser(null)
  }, [])

  return <AuthContext.Provider value={{ user, loading, login, register, logout }}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth deve essere usato dentro AuthProvider')
  return ctx
}
