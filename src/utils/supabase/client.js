import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://placeholder.supabase.co'
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'placeholder-key'

if (!import.meta.env.VITE_SUPABASE_URL || !import.meta.env.VITE_SUPABASE_ANON_KEY) {
  if (import.meta.env.DEV) {
    console.warn('Missing Supabase environment variables:', {
      url: import.meta.env.VITE_SUPABASE_URL ? 'present' : 'missing',
      key: import.meta.env.VITE_SUPABASE_ANON_KEY ? 'present' : 'missing'
    })
    console.warn('⚠️ Missing Supabase environment variables - some features may not work correctly. Check your .env file.')
  }
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
