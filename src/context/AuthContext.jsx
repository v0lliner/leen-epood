import { createContext, useContext, useEffect, useState } from 'react'
import { authService } from '../utils/supabase/auth'

const AuthContext = createContext({
  user: null,
  session: null,
  loading: true,
  error: null,
  signIn: async () => ({ data: null, error: null }),
  signOut: async () => ({ error: null }),
})

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    // Get initial session
    const getInitialSession = async () => {
      try {
        console.log('Getting initial session...')
        const { data, error } = await authService.getSession()
        
        if (error) {
          console.error('Error getting initial session:', error)
          setError(error.message)
        } else {
          console.log('Initial session data:', data)
          setSession(data.session)
          setUser(data.session?.user ?? null)
          setError(null)
        }
      } catch (err) {
        console.error('Failed to get initial session:', err)
        setError('Failed to connect to authentication service')
      } finally {
        setLoading(false)
      }
    }

    getInitialSession()

    // Listen for auth changes
    const unsubscribe = authService.onAuthStateChange((event, session) => {
      console.log('Auth state changed:', event, session)
      setSession(session)
      setUser(session?.user ?? null)
      setError(null)
      setLoading(false)
    })

    return () => unsubscribe()
  }, [])

  const signIn = async (email, password) => {
    try {
      setError(null)
      const result = await authService.signIn(email, password)
      if (result.error) {
        setError(result.error.message)
      }
      return result
    } catch (err) {
      console.error('Sign in error:', err)
      setError('Failed to sign in')
      return { data: null, error: err }
    }
  }

  const signOut = async () => {
    try {
      setError(null)
      const result = await authService.signOut()
      if (result.error) {
        setError(result.error.message)
      }
      return result
    } catch (err) {
      console.error('Sign out error:', err)
      setError('Failed to sign out')
      return { error: err }
    }
  }

  const value = {
    user,
    session,
    loading,
    error,
    signIn,
    signOut,
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}