import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import AdminLayout from '../../components/Admin/AdminLayout'
import ImageUpload from '../../components/Admin/ImageUpload'
import { portfolioItemService } from '../../utils/supabase/portfolioItems'

const TehtudToodForm = () => {
  const { t } = useTranslation()
  const { id } = useParams()
  const navigate = useNavigate()
  const isEdit = Boolean(id)

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  
  const [formData, setFormData] = useState({
    title: '',
    technique: '',
    dimensions: '',
    year: new Date().getFullYear(),
    category: 'ceramics',
    image: ''
  })

  const [imagePath, setImagePath] = useState('')

  const categories = [
    { value: 'ceramics', label: 'Keraamika' },
    { value: 'clothing', label: 'Rõivad' },
    { value: 'other', label: 'Muud tooted' }
  ]

  useEffect(() => {
    if (isEdit && id) {
      loadPortfolioItem()
    }
  }, [id, isEdit])

  const loadPortfolioItem = async () => {
    setLoading(true)
    const { data, error } = await portfolioItemService.getPortfolioItem(id)
    
    if (error) {
      setError(error.message)
    } else if (data) {
      setFormData(data)
    }
    
    setLoading(false)
  }

  const handleInputChange = (e) => {
    const { name, value, type } = e.target
    
    setFormData(prev => ({
      ...prev,
      [name]: type === 'number' ? parseInt(value) || '' : value
    }))

    // Clear messages when user starts typing
    if (error) setError('')
    if (success) setSuccess('')
  }

  const handleImageChange = (imageUrl, imagePath) => {
    setFormData(prev => ({
      ...prev,
      image: imageUrl
    }))
    setImagePath(imagePath)
  }

  const handleImageRemove = () => {
    setFormData(prev => ({
      ...prev,
      image: ''
    }))
    setImagePath('')
  }

  const validateForm = () => {
    if (!formData.title.trim()) {
      setError('Pala pealkiri on kohustuslik')
      return false
    }
    if (!formData.category) {
      setError('Kategooria on kohustuslik')
      return false
    }
    return true
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!validateForm()) {
      return
    }

    setLoading(true)
    setError('')

    try {
      const portfolioData = {
        ...formData,
        year: formData.year || null
      }

      if (isEdit) {
        portfolioData.id = id
      }

      const { data, error } = await portfolioItemService.upsertPortfolioItem(portfolioData)
      
      if (error) {
        setError(error.message)
      } else {
        setSuccess(isEdit ? 'Pala edukalt uuendatud!' : 'Pala edukalt lisatud!')
        setTimeout(() => {
          navigate('/admin/parimad-palad')
        }, 1500)
      }
    } catch (err) {
      setError('Võrguühenduse viga')
    } finally {
      setLoading(false)
    }
  }

  if (loading && isEdit) {
    return (
      <AdminLayout>
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Laadin...</p>
        </div>
      </AdminLayout>
    )
  }

  return (
    <AdminLayout>
      <div className="form-container">
        <div className="form-header">
          <h1>{isEdit ? t('admin.portfolio.form.edit_title') : t('admin.portfolio.form.create_title')}</h1>
          <button 
            onClick={() => navigate('/admin/parimad-palad')}
            className="btn btn-secondary"
          >
            Tagasi
          </button>
        </div>

        {error && (
          <div className="error-message">
            {error}
          </div>
        )}

        {success && (
          <div className="success-message">
            {success}
          </div>
        )}

        <form onSubmit={handleSubmit} className="portfolio-form">
          <div className="form-grid">
            {/* Left Column */}
            <div className="form-column">
              <div className="form-group">
                <label htmlFor="title">{t('admin.portfolio.form.title')} *</label>
                <input
                  type="text"
                  id="title"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  required
                  className="form-input"
                  placeholder={t('admin.portfolio.form.title_placeholder')}
                />
              </div>

              <div className="form-group">
                <label htmlFor="technique">{t('admin.portfolio.form.technique')}</label>
                <input
                  type="text"
                  id="technique"
                  name="technique"
                  value={formData.technique}
                  onChange={handleInputChange}
                  className="form-input"
                  placeholder={t('admin.portfolio.form.technique_placeholder')}
                />
              </div>

              <div className="form-group">
                <label htmlFor="dimensions">{t('admin.portfolio.form.dimensions')}</label>
                <input
                  type="text"
                  id="dimensions"
                  name="dimensions"
                  value={formData.dimensions}
                  onChange={handleInputChange}
                  className="form-input"
                  placeholder={t('admin.portfolio.form.dimensions_placeholder')}
                />
              </div>

              <div className="form-group">
                <label htmlFor="year">{t('admin.portfolio.form.year')}</label>
                <input
                  type="number"
                  id="year"
                  name="year"
                  value={formData.year}
                  onChange={handleInputChange}
                  className="form-input"
                  placeholder="Nt. 1995"
                />
                <small className="form-hint">Jätke tühjaks, kui aasta pole teada</small>
              </div>

              <div className="form-group">
                <label htmlFor="category">{t('admin.portfolio.form.category')} *</label>
                <select
                  id="category"
                  name="category"
                  value={formData.category}
                  onChange={handleInputChange}
                  required
                  className="form-input"
                >
                  {categories.map(category => (
                    <option key={category.value} value={category.value}>
                      {category.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Right Column */}
            <div className="form-column">
              <div className="form-group">
                <label>{t('admin.portfolio.form.image')}</label>
                <ImageUpload
                  currentImage={formData.image}
                  onImageChange={handleImageChange}
                  onImageRemove={handleImageRemove}
                  placeholder="Lohistage pala pilt siia või klõpsake valimiseks"
                />
              </div>
            </div>
          </div>

          <div className="form-actions">
            <button 
              type="button"
              onClick={() => navigate('/admin/parimad-palad')}
              className="btn btn-secondary"
            >
              Tühista
            </button>
            <button 
              type="submit"
              disabled={loading}
              className="btn btn-primary"
            >
              {loading ? 'Salvestamine...' : (isEdit ? t('admin.portfolio.form.update') : t('admin.portfolio.form.create'))}
            </button>
          </div>
        </form>
      </div>

      <style jsx>{`
        .form-container {
          padding: 32px;
          max-width: 1200px;
          margin: 0 auto;
        }

        .form-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 32px;
        }

        .form-header h1 {
          font-family: var(--font-heading);
          color: var(--color-ultramarine);
          margin: 0;
        }

        .loading-container {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 64px;
          gap: 16px;
        }

        .loading-spinner {
          width: 40px;
          height: 40px;
          border: 3px solid #f3f3f3;
          border-top: 3px solid var(--color-ultramarine);
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        .error-message {
          background-color: #fee;
          color: #c33;
          padding: 12px 16px;
          border-radius: 4px;
          border: 1px solid #fcc;
          margin-bottom: 24px;
        }

        .success-message {
          background-color: #efe;
          color: #363;
          padding: 12px 16px;
          border-radius: 4px;
          border: 1px solid #cfc;
          margin-bottom: 24px;
        }

        .portfolio-form {
          background: white;
          border-radius: 8px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
          padding: 32px;
        }

        .form-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 32px;
          margin-bottom: 32px;
        }

        .form-column {
          display: flex;
          flex-direction: column;
          gap: 24px;
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

        .form-input::placeholder {
          color: #999;
        }

        .form-hint {
          color: #666;
          font-size: 0.8rem;
          font-style: italic;
          margin-top: 4px;
        }

        .form-actions {
          display: flex;
          gap: 16px;
          justify-content: flex-end;
          padding-top: 24px;
          border-top: 1px solid #eee;
        }

        .btn {
          padding: 12px 24px;
          border: none;
          border-radius: 4px;
          font-family: var(--font-body);
          font-weight: 500;
          text-decoration: none;
          cursor: pointer;
          transition: opacity 0.2s ease;
          font-size: 1rem;
          display: inline-block;
          text-align: center;
        }

        .btn:hover:not(:disabled) {
          opacity: 0.9;
        }

        .btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .btn-primary {
          background-color: var(--color-ultramarine);
          color: white;
        }

        .btn-secondary {
          background-color: #6c757d;
          color: white;
        }

        @media (max-width: 768px) {
          .form-container {
            padding: 24px 16px;
          }

          .form-header {
            flex-direction: column;
            gap: 16px;
            align-items: stretch;
          }

          .form-grid {
            grid-template-columns: 1fr;
            gap: 24px;
          }

          .form-actions {
            flex-direction: column;
          }
        }
      `}</style>
    </AdminLayout>
  )
}

export default TehtudToodForm