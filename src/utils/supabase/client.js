import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase environment variables:', {
    url: supabaseUrl ? 'present' : 'missing',
    key: supabaseAnonKey ? 'present' : 'missing'
  })
  console.warn('⚠️ Missing Supabase environment variables - some features may not work correctly')
}

console.log('🔌 Supabase client initialized with URL:', supabaseUrl)

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false
  },
  global: {
    headers: {
      'X-Client-Info': 'supabase-js-web'
    },
    fetch: (url, options = {}) => {
      console.log('🌐 Supabase fetch request:', url)
      
      // Add timeout to prevent hanging requests
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 10000) // 10 second timeout
      
      const fetchOptions = {
        ...options,
        signal: controller.signal,
        headers: {
          ...options.headers,
          'Access-Control-Allow-Origin': '*',
        }
      }
      
      return fetch(url, fetchOptions)
        .then(response => {
          clearTimeout(timeoutId)
          console.log('✅ Supabase response:', response.status, response.statusText)
          return response
        })
        .catch(error => {
          clearTimeout(timeoutId)
          console.error('❌ Supabase fetch error:', {
            url,
            error: error.message,
            name: error.name,
            stack: error.stack
          })
          
          // Provide more specific error messages
          if (error.name === 'AbortError') {
            throw new Error('Request timeout - Supabase server may be unreachable')
          } else if (error.message.includes('Failed to fetch')) {
            throw new Error('Network error - Check your internet connection and Supabase URL configuration')
          }
          
          throw error
        })
    }
  }
})