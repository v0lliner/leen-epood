import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import AdminLayout from '../../components/Admin/AdminLayout'
import ImageUpload from '../../components/Admin/ImageUpload'
import { aboutPageService } from '../../utils/supabase/aboutPage'

const AdminAboutPage = () => {
  const { t } = useTranslation()
  const [content, setContent] = useState({ et: {}, en: {} })
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
    const { data, error } = await aboutPageService.getBilingualContent()
    
    if (error) {
      setError(error.message)
    } else {
      setContent(data)
    }
    
    setLoading(false)
  }

  const handleSectionUpdate = async (sectionKey, language, updates) => {
    setSaving(true)
    setError('')
    setSuccess('')

    try {
      const { data, error } = await aboutPageService.updateAboutSection(sectionKey, language, updates)
      
      if (error) {
        setError(error.message)
      } else {
        setContent(prev => ({
          ...prev,
          [language]: {
            ...prev[language],
            [sectionKey]: data
          }
        }))
        setSuccess(`${language.toUpperCase()} sisu edukalt uuendatud!`)
        setTimeout(() => setSuccess(''), 3000)
      }
    } catch (err) {
      setError('Võrguühenduse viga')
    } finally {
      setSaving(false)
    }
  }

  const handleContentChange = (sectionKey, language, field, value) => {
    setContent(prev => ({
      ...prev,
      [language]: {
        ...prev[language],
        [sectionKey]: {
          ...prev[language][sectionKey],
          [field]: value
        }
      }
    }))
  }

  const handleImageChange = (sectionKey, imageUrl, imagePath) => {
    // Images are shared between languages
    setContent(prev => ({
      ...prev,
      et: {
        ...prev.et,
        [sectionKey]: {
          ...prev.et[sectionKey],
          image_url: imageUrl,
          image_path: imagePath
        }
      },
      en: {
        ...prev.en,
        [sectionKey]: {
          ...prev.en[sectionKey],
          image_url: imageUrl,
          image_path: imagePath
        }
      }
    }))
  }

  const handleImageRemove = (sectionKey) => {
    // Remove images from both languages
    setContent(prev => ({
      ...prev,
      et: {
        ...prev.et,
        [sectionKey]: {
          ...prev.et[sectionKey],
          image_url: '',
          image_path: ''
        }
      },
      en: {
        ...prev.en,
        [sectionKey]: {
          ...prev.en[sectionKey],
          image_url: '',
          image_path: ''
        }
      }
    }))
  }

  const handleSaveBothLanguages = async (sectionKey) => {
    setSaving(true)
    setError('')
    setSuccess('')

    try {
      const etSection = content.et[sectionKey] || {}
      const enSection = content.en[sectionKey] || {}

      // Save both languages
      const [etResult, enResult] = await Promise.all([
        aboutPageService.updateAboutSection(sectionKey, 'et', {
          title: etSection.title,
          content: etSection.content,
          image_url: etSection.image_url || null,
          image_path: etSection.image_path || null
        }),
        aboutPageService.updateAboutSection(sectionKey, 'en', {
          title: enSection.title,
          content: enSection.content,
          image_url: enSection.image_url || null,
          image_path: enSection.image_path || null
        })
      ])

      if (etResult.error || enResult.error) {
        setError('Mõne keele salvestamine ebaõnnestus')
      } else {
        setContent(prev => ({
          ...prev,
          et: { ...prev.et, [sectionKey]: etResult.data },
          en: { ...prev.en, [sectionKey]: enResult.data }
        }))
        setSuccess('Mõlema keele sisu edukalt uuendatud!')
        setTimeout(() => setSuccess(''), 3000)
      }
    } catch (err) {
      setError('Võrguühenduse viga')
    } finally {
      setSaving(false)
    }
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
          <p>Hallake "Minust" lehe sisu eesti ja inglise keeles</p>
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
              
              const etSection = content.et[config.key] || {}
              const enSection = content.en[config.key] || {}
              
              return (
                <div key={config.key} className="editor-content">
                  <div className="editor-header">
                    <h2>{config.title}</h2>
                    <p>{config.description}</p>
                  </div>

                  <div className="editor-form">
                    {/* Image Upload (shared between languages) */}
                    {config.hasImage && (
                      <div className="form-group">
                        <label>Pilt (jagatud mõlema keele vahel)</label>
                        <ImageUpload
                          currentImage={etSection.image_url || enSection.image_url}
                          onImageChange={(url, path) => handleImageChange(config.key, url, path)}
                          onImageRemove={() => handleImageRemove(config.key)}
                          placeholder="Lohistage pilt siia või klõpsake valimiseks"
                        />
                      </div>
                    )}

                    {/* Bilingual Content Fields */}
                    <div className="bilingual-fields">
                      {/* Estonian Content */}
                      <div className="language-section">
                        <h3 className="language-title">🇪🇪 Eesti keel</h3>
                        
                        <div className="form-group">
                          <label htmlFor={`${config.key}-title-et`}>Sektsiooni pealkiri</label>
                          <input
                            type="text"
                            id={`${config.key}-title-et`}
                            value={etSection.title || ''}
                            onChange={(e) => handleContentChange(config.key, 'et', 'title', e.target.value)}
                            className="form-input"
                            placeholder="Sisestage sektsiooni pealkiri eesti keeles"
                          />
                        </div>

                        <div className="form-group">
                          <label htmlFor={`${config.key}-content-et`}>Sisu</label>
                          {config.isTextarea ? (
                            <textarea
                              id={`${config.key}-content-et`}
                              value={etSection.content || ''}
                              onChange={(e) => handleContentChange(config.key, 'et', 'content', e.target.value)}
                              rows={config.key === 'intro' ? 8 : 6}
                              className="form-input"
                              placeholder="Sisestage sektsiooni sisu eesti keeles"
                            />
                          ) : (
                            <input
                              type="text"
                              id={`${config.key}-content-et`}
                              value={etSection.content || ''}
                              onChange={(e) => handleContentChange(config.key, 'et', 'content', e.target.value)}
                              className="form-input"
                              placeholder="Sisestage sektsiooni sisu eesti keeles"
                            />
                          )}
                        </div>
                      </div>

                      {/* English Content */}
                      <div className="language-section">
                        <h3 className="language-title">🇬🇧 English</h3>
                        
                        <div className="form-group">
                          <label htmlFor={`${config.key}-title-en`}>Section title</label>
                          <input
                            type="text"
                            id={`${config.key}-title-en`}
                            value={enSection.title || ''}
                            onChange={(e) => handleContentChange(config.key, 'en', 'title', e.target.value)}
                            className="form-input"
                            placeholder="Enter section title in English"
                          />
                        </div>

                        <div className="form-group">
                          <label htmlFor={`${config.key}-content-en`}>Content</label>
                          {config.isTextarea ? (
                            <textarea
                              id={`${config.key}-content-en`}
                              value={enSection.content || ''}
                              onChange={(e) => handleContentChange(config.key, 'en', 'content', e.target.value)}
                              rows={config.key === 'intro' ? 8 : 6}
                              className="form-input"
                              placeholder="Enter section content in English"
                            />
                          ) : (
                            <input
                              type="text"
                              id={`${config.key}-content-en`}
                              value={enSection.content || ''}
                              onChange={(e) => handleContentChange(config.key, 'en', 'content', e.target.value)}
                              className="form-input"
                              placeholder="Enter section content in English"
                            />
                          )}
                        </div>
                      </div>
                    </div>

                    {(config.key === 'education' || config.key === 'experience' || config.key === 'inspiration') && (
                      <div className="form-hint-section">
                        <small className="form-hint">
                          💡 Kasutage • märki loetelu jaoks. Iga rida eraldi real.
                        </small>
                      </div>
                    )}

                    {/* Save Button */}
                    <div className="form-actions">
                      <button
                        onClick={() => handleSaveBothLanguages(config.key)}
                        disabled={saving}
                        className="btn btn-primary"
                      >
                        {saving ? 'Salvestamine...' : 'Salvesta mõlemad keeled'}
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
          max-width: 1600px;
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
          gap: 32px;
        }

        .bilingual-fields {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 32px;
        }

        .language-section {
          padding: 24px;
          border: 1px solid #e9ecef;
          border-radius: 8px;
          background: #fafbfc;
        }

        .language-title {
          font-family: var(--font-heading);
          color: var(--color-ultramarine);
          margin-bottom: 20px;
          font-size: 1.125rem;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .form-group {
          display: flex;
          flex-direction: column;
          gap: 8px;
          margin-bottom: 20px;
        }

        .form-group:last-child {
          margin-bottom: 0;
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
          background-color: white;
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

        .form-hint-section {
          background: #f8f9fa;
          padding: 16px;
          border-radius: 6px;
          border-left: 3px solid var(--color-ultramarine);
        }

        .form-hint {
          color: #666;
          font-size: 0.85rem;
          line-height: 1.4;
          margin: 0;
        }

        .form-actions {
          padding-top: 24px;
          border-top: 1px solid #e9ecef;
          text-align: center;
        }

        .btn {
          padding: 14px 32px;
          border: none;
          border-radius: 6px;
          font-family: var(--font-body);
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
          font-size: 1rem;
          text-decoration: none;
          display: inline-block;
          text-align: center;
        }

        .btn:hover:not(:disabled) {
          opacity: 0.9;
          transform: translateY(-1px);
        }

        .btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
          transform: none;
        }

        .btn-primary {
          background-color: var(--color-ultramarine);
          color: white;
          box-shadow: 0 2px 4px rgba(47, 62, 156, 0.2);
        }

        @media (max-width: 1200px) {
          .bilingual-fields {
            grid-template-columns: 1fr;
            gap: 24px;
          }
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

          .language-section {
            padding: 20px;
          }
        }
      `}</style>
    </AdminLayout>
  )
}

export default AdminAboutPage