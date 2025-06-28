import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { useTranslation } from 'react-i18next'

const AdminLogin = () => {
  const { t } = useTranslation()
  const { signIn } = useAuth()
  const navigate = useNavigate()
  
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
    // Clear error when user starts typing
    if (error) setError('')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const { data, error } = await signIn(formData.email, formData.password)
      
      if (error) {
        setError(error.message || t('admin.login.error_generic'))
      } else if (data?.user) {
        // Successful login - redirect to dashboard
        navigate('/admin/dashboard', { replace: true })
      }
    } catch (err) {
      setError(t('admin.login.error_network'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="login-container">
      <div className="login-header">
        <Link to="/" className="back-home-btn">
          {t('admin.back_to_homepage')}
        </Link>
      </div>

      <div className="login-content">
        <div className="login-card">
          <div className="login-brand">
            <h1>Leen.</h1>
            <p>{t('admin.login.subtitle')}</p>
          </div>

          <form onSubmit={handleSubmit} className="login-form">
            {error && (
              <div className="error-message">
                {error}
              </div>
            )}

            <div className="form-group">
              <label htmlFor="email">{t('admin.login.email')}</label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                required
                disabled={loading}
                className="form-input"
                autoComplete="email"
              />
            </div>

            <div className="form-group">
              <label htmlFor="password">{t('admin.login.password')}</label>
              <input
                type="password"
                id="password"
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                required
                disabled={loading}
                className="form-input"
                autoComplete="current-password"
              />
            </div>

            <button 
              type="submit" 
              disabled={loading}
              className="login-button"
            >
              {loading ? t('admin.login.signing_in') : t('admin.login.sign_in')}
            </button>
          </form>
        </div>
      </div>

      <style jsx>{`
        .login-container {
          min-height: 100vh;
          background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
          display: flex;
          flex-direction: column;
        }

        .login-header {
          padding: 24px;
          display: flex;
          justify-content: flex-end;
        }

        .back-home-btn {
          color: var(--color-ultramarine);
          text-decoration: none;
          font-weight: 500;
          padding: 8px 16px;
          border-radius: 4px;
          transition: background-color 0.2s ease;
        }

        .back-home-btn:hover {
          background-color: rgba(47, 62, 156, 0.1);
        }

        .login-content {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 24px;
        }

        .login-card {
          background: white;
          border-radius: 8px;
          box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
          padding: 48px;
          width: 100%;
          max-width: 400px;
        }

        .login-brand {
          text-align: center;
          margin-bottom: 32px;
        }

        .login-brand h1 {
          font-family: var(--font-heading);
          color: var(--color-ultramarine);
          font-size: 2.5rem;
          margin-bottom: 8px;
        }

        .login-brand p {
          color: #666;
          font-size: 1rem;
        }

        .login-form {
          display: flex;
          flex-direction: column;
          gap: 24px;
        }

        .error-message {
          background-color: #fee;
          color: #c33;
          padding: 12px 16px;
          border-radius: 4px;
          border: 1px solid #fcc;
          font-size: 0.9rem;
        }

        .form-group {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .form-group label {
          font-family: var(--font-heading);
          font-weight: 500;
          color: var(--color-text);
          font-size: 0.9rem;
        }

        .form-input {
          padding: 12px 16px;
          border: 1px solid #ddd;
          border-radius: 4px;
          font-family: var(--font-body);
          font-size: 1rem;
          transition: border-color 0.2s ease;
        }

        .form-input:focus {
          outline: none;
          border-color: var(--color-ultramarine);
          box-shadow: 0 0 0 3px rgba(47, 62, 156, 0.1);
        }

        .form-input:disabled {
          background-color: #f5f5f5;
          cursor: not-allowed;
        }

        .login-button {
          background-color: var(--color-ultramarine);
          color: white;
          border: none;
          padding: 14px 24px;
          border-radius: 4px;
          font-family: var(--font-body);
          font-weight: 500;
          font-size: 1rem;
          cursor: pointer;
          transition: opacity 0.2s ease;
        }

        .login-button:hover:not(:disabled) {
          opacity: 0.9;
        }

        .login-button:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        @media (max-width: 480px) {
          .login-card {
            padding: 32px 24px;
          }

          .login-header {
            padding: 16px;
          }
        }
      `}</style>
    </div>
  )
}

export default AdminLogin