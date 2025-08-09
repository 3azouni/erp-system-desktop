import { createClient } from '@supabase/supabase-js'

// Browser-safe Supabase client
// Uses only NEXT_PUBLIC_* environment variables
// Includes SSR guards to prevent window/localStorage access on server

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables for browser client')
}

// Create browser client with SSR safety
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    // Only use localStorage in browser environment
    storage: typeof window !== 'undefined' ? window.localStorage : undefined,
    autoRefreshToken: true,
    persistSession: typeof window !== 'undefined',
    detectSessionInUrl: true
  }
})

// Helper function to check if we're in browser environment
export const isBrowser = typeof window !== 'undefined'

// Helper function to safely access localStorage only in browser
export const getLocalStorage = (key: string): string | null => {
  if (typeof window !== 'undefined') {
    return window.localStorage.getItem(key)
  }
  return null
}

export const setLocalStorage = (key: string, value: string): void => {
  if (typeof window !== 'undefined') {
    window.localStorage.setItem(key, value)
  }
}

export const removeLocalStorage = (key: string): void => {
  if (typeof window !== 'undefined') {
    window.localStorage.removeItem(key)
  }
}
