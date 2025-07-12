import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Missing Supabase environment variables:', {
    url: supabaseUrl ? 'present' : 'missing',
    key: supabaseAnonKey ? 'present' : 'missing'
  })
  console.warn('⚠️ Missing Supabase environment variables - some features may not work correctly. Check your .env file.')
}

// Only log in development mode
if (import.meta.env.DEV) {
  console.log('🔌 Supabase client initialized with URL:', supabaseUrl)
}

// Add fallback values for development to prevent crashes
const url = supabaseUrl || 'https://epcenpirjkfkgdgxktrm.supabase.co'
const key = supabaseAnonKey || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVwY2VucGlyamtma2dkZ3hrdHJtIiwicm9sZSI6ImFub24iLCJpYXQiOjE2ODkyNDcyNTgsImV4cCI6MjAwNDgyMzI1OH0.sMCXnPUQJiYzJdaMZTxEVDcgdZl2hi1j9-XfOuZe-Yk'

export const supabase = createClient(url, key, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false
  },
  global: {
    headers: {
      'X-Client-Info': 'supabase-js-web'
    }
  }
})