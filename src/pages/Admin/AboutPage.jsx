import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import AdminLayout from '../../components/Admin/AdminLayout'
import ImageUpload from '../../components/Admin/ImageUpload'
import { aboutPageService } from '../../utils/supabase/aboutPage'

const AdminAboutPage = () => {
  const { t } = useTranslation()
  const [sections, setSections] = useState({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [activeSection, setActiveSection] = useState('intro')

  useEffect(() => {
    loadContent()
  }, [])

  const loadContent = async () => {
    setLoading(true)
    const { data, error } = await aboutPageService.getOrganizedContent()
    
    if (error) {
      setError(error.message)
    } else {
      setSections(data)
    }
    
    setLoading(false)
  }

  const handleSectionUpdate = async (sectionKey, updates) => {
    setSaving(true)
    setError('')
    setSuccess('')

    try {
      const { data, error } = await aboutPageService.updateAboutSection(sectionKey, updates)
      
      if (error) {
        setError(error.message)
      } else {
        setSections(prev => ({
          ...prev,
          [sectionKey]: data
        }))
        setSuccess('Sisu edukalt uuendatud!')
        setTimeout(() => setSuccess(''), 3000)
      }
    } catch (err) {
      setError('Võrguühenduse viga')
    } finally {
      setSaving(false)
    }
  }

  const handleContentChange = (sectionKey, field, value) => {
    setSections(prev => ({
      ...prev,
      [sectionKey]: {
        ...prev[sectionKey],
        [field]: value
      }
    }))
  }

  const handleImageChange = (sectionKey, imageUrl, imagePath) => {
    handleContentChange(sectionKey, 'image_url', imageUrl)
    handleContentChange(sectionKey, 'image_path', imagePath)
  }

  const handleImageRemove = (sectionKey) => {
    handleContentChange(sectionKey, 'image_url', '')
    handleContentChange(sectionKey, 'image_path', '')
  }

  const sectionConfig = [
    {
      key: 'intro',
      title: 'Sissejuhatus',
      description: 'Peamine tutvustav tekst ja profiilipilt',
      hasImage: true,
      isTextarea: true
    },
    {
      key: 'story',
      title: 'Minu lugu',
      description: 'Täiendav lugu ja kirjeldus',
      hasImage: false,
      isTextarea: true
    },
    {
      key: 'education',
      title: 'Haridus',
      description: 'Hariduskäik ja õpingud',
      hasImage: false,
      isTextarea: true
    },
    {
      key: 'experience',
      title: 'Kogemus',
      description: 'Töökogemus ja praktika',
      hasImage: false,
      isTextarea: true
    },
    {
      key: 'inspiration',
      title: 'Inspiratsioon',
      description: 'Inspiratsiooni allikad',
      hasImage: false,
      isTextarea: true
    },
    {
      key: 'cta',
      title: 'Kutse',
      description: 'Kutse vaatama tooteid',
      hasImage: false,
      isTextarea: false
    }
  ]

  if (loading) {
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
      <div className="about-page-container">
        <div className="about-page-header">
          <h1>Minust lehe haldus</h1>
          <p>Hallake "Minust" lehe sisu ja pilte</p>
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

        <div className="about-page-layout">
          {/* Section Navigation */}
          <div className="section-nav">
            <h3>Sektsioonid</h3>
            <div className="nav-list">
              {sectionConfig.map(config => (
                <button
                  key={config.key}
                  onClick={() => setActiveSection(config.key)}
                  className={`nav-item ${activeSection === config.key ? 'active' : ''}`}
                >
                  <div className="nav-item-content">
                    <h4>{config.title}</h4>
                    <p>{config.description}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Section Editor */}
          <div className="section-editor">
            {sectionConfig.map(config => {
              if (activeSection !== config.key) return null
              
              const section = sections[config.key] || {}
              
              return (
                <div key={config.key} className="editor-content">
                  <div className="editor-header">
                    <h2>{config.title}</h2>
                    <p>{config.description}</p>
                  </div>

                  <div className="editor-form">
                    {/* Title Field */}
                    <div className="form-group">
                      <label htmlFor={`${config.key}-title`}>Sektsiooni pealkiri</label>
                      <input
                        type="text"
                        id={`${config.key}-title`}
                        value={section.title || ''}
                        onChange={(e) => handleContentChange(config.key, 'title', e.target.value)}
                        className="form-input"
                        placeholder="Sisestage sektsiooni pealkiri"
                      />
                    </div>

                    {/* Content Field */}
                    <div className="form-group">
                      <label htmlFor={`${config.key}-content`}>Sisu</label>
                      {config.isTextarea ? (
                        <textarea
                          id={`${config.key}-content`}
                          value={section.content || ''}
                          onChange={(e) => handleContentChange(config.key, 'content', e.target.value)}
                          rows={config.key === 'intro' ? 8 : 6}
                          className="form-input"
                          placeholder="Sisestage sektsiooni sisu"
                        />
                      ) : (
                        <input
                          type="text"
                          id={`${config.key}-content`}
                          value={section.content || ''}
                          onChange={(e) => handleContentChange(config.key, 'content', e.target.value)}
                          className="form-input"
                          placeholder="Sisestage sektsiooni sisu"
                        />
                      )}
                      {(config.key === 'education' || config.key === 'experience' || config.key === 'inspiration') && (
                        <small className="form-hint">
                          Kasutage • märki loetelu jaoks. Iga rida eraldi real.
                        </small>
                      )}
                    </div>

                    {/* Image Upload */}
                    {config.hasImage && (
                      <div className="form-group">
                        <label>Pilt</label>
                        <ImageUpload
                          currentImage={section.image_url}
                          onImageChange={(url, path) => handleImageChange(config.key, url, path)}
                          onImageRemove={() => handleImageRemove(config.key)}
                          placeholder="Lohistage pilt siia või klõpsake valimiseks"
                        />
                      </div>
                    )}

                    {/* Save Button */}
                    <div className="form-actions">
                      <button
                        onClick={() => handleSectionUpdate(config.key, {
                          title: section.title,
                          content: section.content,
                          image_url: section.image_url || null,
                          image_path: section.image_path || null
                        })}
                        disabled={saving}
                        className="btn btn-primary"
                      >
                        {saving ? 'Salvestamine...' : 'Salvesta muudatused'}
                      </button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      <style jsx>{`
        .about-page-container {
          padding: 32px;
          max-width: 1400px;
          margin: 0 auto;
        }

        .about-page-header {
          margin-bottom: 32px;
        }

        .about-page-header h1 {
          font-family: var(--font-heading);
          color: var(--color-ultramarine);
          margin-bottom: 8px;
        }

        .about-page-header p {
          color: #666;
          font-size: 1rem;
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

        .about-page-layout {
          display: grid;
          grid-template-columns: 300px 1fr;
          gap: 32px;
        }

        .section-nav {
          background: white;
          border-radius: 8px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
          padding: 24px;
          height: fit-content;
          position: sticky;
          top: 32px;
        }

        .section-nav h3 {
          font-family: var(--font-heading);
          color: var(--color-ultramarine);
          margin-bottom: 20px;
          font-size: 1.125rem;
        }

        .nav-list {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .nav-item {
          background: none;
          border: none;
          padding: 16px;
          border-radius: 6px;
          cursor: pointer;
          transition: all 0.2s ease;
          text-align: left;
          border: 1px solid transparent;
        }

        .nav-item:hover {
          background-color: #f8f9fa;
          border-color: #e9ecef;
        }

        .nav-item.active {
          background-color: rgba(47, 62, 156, 0.1);
          border-color: var(--color-ultramarine);
        }

        .nav-item-content h4 {
          font-family: var(--font-heading);
          color: var(--color-text);
          margin-bottom: 4px;
          font-size: 0.95rem;
        }

        .nav-item-content p {
          color: #666;
          font-size: 0.8rem;
          line-height: 1.3;
          margin: 0;
        }

        .nav-item.active .nav-item-content h4 {
          color: var(--color-ultramarine);
        }

        .section-editor {
          background: white;
          border-radius: 8px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
          padding: 32px;
        }

        .editor-header {
          margin-bottom: 32px;
          padding-bottom: 24px;
          border-bottom: 1px solid #e9ecef;
        }

        .editor-header h2 {
          font-family: var(--font-heading);
          color: var(--color-ultramarine);
          margin-bottom: 8px;
          font-size: 1.5rem;
        }

        .editor-header p {
          color: #666;
          font-size: 1rem;
        }

        .editor-form {
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
          background-color: var(--color-background);
        }

        .form-input:focus {
          outline: none;
          border-color: var(--color-ultramarine);
          box-shadow: 0 0 0 3px rgba(47, 62, 156, 0.1);
        }

        .form-input::placeholder {
          color: #999;
        }

        textarea.form-input {
          resize: vertical;
          min-height: 120px;
          line-height: 1.5;
        }

        .form-hint {
          color: #666;
          font-size: 0.8rem;
          line-height: 1.4;
        }

        .form-actions {
          padding-top: 24px;
          border-top: 1px solid #e9ecef;
        }

        .btn {
          padding: 12px 24px;
          border: none;
          border-radius: 4px;
          font-family: var(--font-body);
          font-weight: 500;
          cursor: pointer;
          transition: opacity 0.2s ease;
          font-size: 1rem;
          text-decoration: none;
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

        @media (max-width: 768px) {
          .about-page-container {
            padding: 24px 16px;
          }

          .about-page-layout {
            grid-template-columns: 1fr;
            gap: 24px;
          }

          .section-nav {
            position: static;
          }

          .nav-list {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 12px;
          }

          .section-editor {
            padding: 24px;
          }
        }
      `}</style>
    </AdminLayout>
  )
}

export default AdminAboutPage