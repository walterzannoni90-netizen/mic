import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// In test/CI environment we provide safe dummy values via vitest setup
const isTest = import.meta.env.MODE === 'test' || (typeof process !== 'undefined' && process.env?.VITEST)

const effectiveUrl = supabaseUrl || (isTest ? 'http://localhost:0' : '')
const effectiveKey = supabaseAnonKey || (isTest ? 'dummy-key' : '')

if (!effectiveUrl || !effectiveKey) {
  throw new Error('Mancano VITE_SUPABASE_URL o VITE_SUPABASE_ANON_KEY nel file .env')
}

export const supabase = createClient(effectiveUrl, effectiveKey)