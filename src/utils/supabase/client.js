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

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
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