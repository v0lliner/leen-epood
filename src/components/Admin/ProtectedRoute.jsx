import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

/**
 * Protected route component that requires authentication
 * Redirects to login if user is not authenticated
 */
const ProtectedRoute = ({ children }) => {
  const { user, loading, error } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    if (!loading && !user && !error) {
      navigate('/admin/login', { replace: true })
    }
  }, [user, loading, error, navigate])

  // Show error if there's a connection issue
  if (error) {
    return (
      <div className="error-container">
        <div className="error-content">
          <h2>Connection Error</h2>
          <p>Unable to connect to the authentication service.</p>
          <p className="error-message">{error}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="retry-button"
          >
            Retry
          </button>
        </div>
        
        <style jsx>{`
          .error-container {
            display: flex;
            align-items: center;
            justify-content: center;
            min-height: 100vh;
            padding: 20px;
            background-color: #f5f5f5;
          }

          .error-content {
            background: white;
            padding: 40px;
            border-radius: 8px;
            box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
            text-align: center;
            max-width: 500px;
          }

          .error-content h2 {
            color: #dc3545;
            margin-bottom: 16px;
          }

          .error-content p {
            margin-bottom: 12px;
            color: #666;
          }

          .error-message {
            background: #f8f9fa;
            padding: 12px;
            border-radius: 4px;
            font-family: monospace;
            font-size: 14px;
            color: #dc3545;
            border-left: 4px solid #dc3545;
          }

          .retry-button {
            background: var(--color-ultramarine, #007bff);
            color: white;
            border: none;
            padding: 12px 24px;
            border-radius: 4px;
            cursor: pointer;
            font-size: 16px;
            margin-top: 20px;
          }

          .retry-button:hover {
            background: var(--color-ultramarine-dark, #0056b3);
          }
        `}</style>
      </div>
    )
  }

  // Show loading while checking authentication
  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Laadin...</p>
        
        <style jsx>{`
          .loading-container {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            min-height: 100vh;
            gap: 16px;
          }

          .loading-spinner {
            width: 40px;
            height: 40px;
            border: 3px solid #f3f3f3;
            border-top: 3px solid var(--color-ultramarine, #007bff);
            border-radius: 50%;
            animation: spin 1s linear infinite;
          }

          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    )
  }

  // Don't render children if user is not authenticated
  if (!user) {
    return null
  }

  return children
}

export default ProtectedRoute