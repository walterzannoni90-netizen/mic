import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { supabase } from './supabase'
import type { User, Gender } from './db'

interface AuthContextValue {
  user: User | null
  loading: boolean
  login: (email: string, password: string) => Promise<User>
  register: (name: string, email: string, password: string, gender: Gender) => Promise<User>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

const FRIENDLY_ERROR: Record<string, string> = {
  'Invalid login credentials': 'Email o password non corretti.',
  'User already registered': 'Esiste già un account con questa email.',
  'Email not confirmed': 'Conferma la tua email prima di accedere.',
}

function friendlyAuthError(msg: string): string {
  return FRIENDLY_ERROR[msg] ?? msg
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchProfile = useCallback(async (id: string): Promise<User | null> => {
    const { data, error } = await supabase.from('profiles').select('*').eq('id', id).single()
    if (error) return null
    return data as User | null
  }, [])

  useEffect(() => {
    let mounted = true

    // 1) recupera sessione esistente
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!mounted) return
      if (session?.user) {
        const p = await fetchProfile(session.user.id)
        if (mounted) setUser(p)
      }
      if (mounted) setLoading(false)
    })

    // 2) ascolta cambi auth
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session?.user) {
        const p = await fetchProfile(session.user.id)
        setUser(p)
      } else {
        setUser(null)
      }
    })

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [fetchProfile])

  const login = useCallback(async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw new Error(friendlyAuthError(error.message))
    const p = await fetchProfile(data.user.id)
    if (!p) throw new Error('Profilo non trovato.')
    setUser(p)
    return p
  }, [fetchProfile])

  const register = useCallback(async (name: string, email: string, password: string, gender: Gender) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { name, gender, role: 'user' } },
    })
    if (error) throw new Error(friendlyAuthError(error.message))
    if (!data.user) throw new Error('Errore durante la registrazione.')
    const p = await fetchProfile(data.user.id)
    if (!p) throw new Error('Errore durante la creazione del profilo.')
    setUser(p)
    return p
  }, [fetchProfile])

  const logout = useCallback(async () => {
    await supabase.auth.signOut()
    setUser(null)
  }, [])

  const value = useMemo(() => ({ user, loading, login, register, logout }), [user, loading, login, register, logout])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth deve essere usato dentro AuthProvider')
  return ctx
}
