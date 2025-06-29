import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import AdminLayout from '../../components/Admin/AdminLayout'
import { faqService } from '../../utils/supabase/faq'

const AdminFAQ = () => {
  const { t } = useTranslation()
  const [faqPairs, setFaqPairs] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [editingPair, setEditingPair] = useState(null)
  const [formData, setFormData] = useState({
    et: { question: '', answer: '' },
    en: { question: '', answer: '' }
  })

  useEffect(() => {
    loadFAQItems()
  }, [])

  const loadFAQItems = async () => {
    setLoading(true)
    const { data, error } = await faqService.getBilingualFAQItems()
    
    if (error) {
      setError(error.message)
    } else {
      setFaqPairs(data)
    }
    
    setLoading(false)
  }

  const handleInputChange = (language, field, value) => {
    setFormData(prev => ({
      ...prev,
      [language]: {
        ...prev[language],
        [field]: value
      }
    }))

    // Clear messages when user starts typing
    if (error) setError('')
    if (success) setSuccess('')
  }

  const validateForm = () => {
    const etHasContent = formData.et.question.trim() || formData.et.answer.trim()
    const enHasContent = formData.en.question.trim() || formData.en.answer.trim()
    
    if (!etHasContent && !enHasContent) {
      setError('Vähemalt üks keel peab olema täidetud')
      return false
    }

    // Check that if a language has content, both question and answer are filled
    if (etHasContent && (!formData.et.question.trim() || !formData.et.answer.trim())) {
      setError('Kui eesti keel on täidetud, peavad olema nii küsimus kui vastus')
      return false
    }

    if (enHasContent && (!formData.en.question.trim() || !formData.en.answer.trim())) {
      setError('Kui inglise keel on täidetud, peavad olema nii küsimus kui vastus')
      return false
    }

    return true
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!validateForm()) {
      return
    }

    setSaving(true)
    setError('')

    try {
      const displayOrder = editingPair ? editingPair.display_order : (faqPairs.length + 1)
      
      const { error } = await faqService.upsertFAQPair(
        formData.et.question.trim() ? formData.et : null,
        formData.en.question.trim() ? formData.en : null,
        displayOrder,
        editingPair?.et?.id,
        editingPair?.en?.id
      )
      
      if (error) {
        setError(error.message)
      } else {
        setSuccess(editingPair ? 'KKK paar edukalt uuendatud!' : 'KKK paar edukalt lisatud!')
        resetForm()
        await loadFAQItems()
        setTimeout(() => setSuccess(''), 3000)
      }
    } catch (err) {
      setError('Võrguühenduse viga')
    } finally {
      setSaving(false)
    }
  }

  const handleEdit = (pair) => {
    setEditingPair(pair)
    setFormData({
      et: {
        question: pair.et?.question || '',
        answer: pair.et?.answer || ''
      },
      en: {
        question: pair.en?.question || '',
        answer: pair.en?.answer || ''
      }
    })
  }

  const handleDelete = async (pair) => {
    if (!confirm('Kas olete kindel, et soovite selle KKK paari kustutada?')) {
      return
    }

    const { error } = await faqService.deleteFAQPair(pair.et?.id, pair.en?.id)
    
    if (error) {
      setError(error.message)
    } else {
      await loadFAQItems()
      setSuccess('KKK paar edukalt kustutatud!')
      setTimeout(() => setSuccess(''), 3000)
    }
  }

  const handleMoveUp = async (pair) => {
    const { error } = await faqService.moveFAQPair(pair.display_order, 'up')
    if (!error) {
      await loadFAQItems()
    }
  }

  const handleMoveDown = async (pair) => {
    const { error } = await faqService.moveFAQPair(pair.display_order, 'down')
    if (!error) {
      await loadFAQItems()
    }
  }

  const resetForm = () => {
    setEditingPair(null)
    setFormData({
      et: { question: '', answer: '' },
      en: { question: '', answer: '' }
    })
  }

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
      <div className="faq-container">
        <div className="faq-header">
          <h1>KKK haldus</h1>
          <p>Hallake korduma kippuvaid küsimusi eesti ja inglise keeles</p>
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

        <div className="faq-layout">
          {/* FAQ Form */}
          <div className="faq-form-section">
            <div className="form-card">
              <h3>{editingPair ? 'Muuda KKK paari' : 'Lisa uus KKK paar'}</h3>
              
              <form onSubmit={handleSubmit} className="faq-form">
                <div className="bilingual-fields">
                  {/* Estonian Content */}
                  <div className="language-section">
                    <h4 className="language-title">🇪🇪 Eesti keel</h4>
                    
                    <div className="form-group">
                      <label htmlFor="question-et">Küsimus</label>
                      <input
                        type="text"
                        id="question-et"
                        value={formData.et.question}
                        onChange={(e) => handleInputChange('et', 'question', e.target.value)}
                        className="form-input"
                        placeholder="Sisestage küsimus eesti keeles"
                      />
                    </div>

                    <div className="form-group">
                      <label htmlFor="answer-et">Vastus</label>
                      <textarea
                        id="answer-et"
                        value={formData.et.answer}
                        onChange={(e) => handleInputChange('et', 'answer', e.target.value)}
                        rows={6}
                        className="form-input"
                        placeholder="Sisestage vastus eesti keeles"
                      />
                    </div>
                  </div>

                  {/* English Content */}
                  <div className="language-section">
                    <h4 className="language-title">🇬🇧 English</h4>
                    
                    <div className="form-group">
                      <label htmlFor="question-en">Question</label>
                      <input
                        type="text"
                        id="question-en"
                        value={formData.en.question}
                        onChange={(e) => handleInputChange('en', 'question', e.target.value)}
                        className="form-input"
                        placeholder="Enter question in English"
                      />
                    </div>

                    <div className="form-group">
                      <label htmlFor="answer-en">Answer</label>
                      <textarea
                        id="answer-en"
                        value={formData.en.answer}
                        onChange={(e) => handleInputChange('en', 'answer', e.target.value)}
                        rows={6}
                        className="form-input"
                        placeholder="Enter answer in English"
                      />
                    </div>
                  </div>
                </div>

                <div className="form-hint-section">
                  <small className="form-hint">
                    💡 Vähemalt üks keel peab olema täidetud. Kui keelt täidate, peavad olema nii küsimus kui vastus.
                  </small>
                </div>

                <div className="form-actions">
                  {editingPair && (
                    <button 
                      type="button"
                      onClick={resetForm}
                      className="btn btn-secondary"
                    >
                      Tühista
                    </button>
                  )}
                  <button 
                    type="submit"
                    disabled={saving}
                    className="btn btn-primary"
                  >
                    {saving ? 'Salvestamine...' : (editingPair ? 'Uuenda' : 'Lisa KKK paar')}
                  </button>
                </div>
              </form>
            </div>
          </div>

          {/* FAQ List */}
          <div className="faq-list-section">
            <div className="list-card">
              <h3>Olemasolevad KKK paarid</h3>
              
              <div className="faq-list">
                {faqPairs.map((pair, index) => (
                  <div key={pair.display_order} className="faq-pair">
                    <div className="pair-content">
                      <div className="pair-languages">
                        <div className="pair-language">
                          <h5>🇪🇪 Eesti</h5>
                          {pair.et ? (
                            <>
                              <p className="pair-question">{pair.et.question}</p>
                              <p className="pair-answer">{pair.et.answer.substring(0, 100)}...</p>
                            </>
                          ) : (
                            <span className="missing-badge">Puudub</span>
                          )}
                        </div>
                        
                        <div className="pair-language">
                          <h5>🇬🇧 English</h5>
                          {pair.en ? (
                            <>
                              <p className="pair-question">{pair.en.question}</p>
                              <p className="pair-answer">{pair.en.answer.substring(0, 100)}...</p>
                            </>
                          ) : (
                            <span className="missing-badge">Missing</span>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <div className="pair-actions">
                      <div className="order-controls">
                        <button 
                          onClick={() => handleMoveUp(pair)}
                          disabled={index === 0}
                          className="btn btn-small btn-secondary"
                          title="Liiguta üles"
                        >
                          ↑
                        </button>
                        <span className="order-number">{pair.display_order}</span>
                        <button 
                          onClick={() => handleMoveDown(pair)}
                          disabled={index === faqPairs.length - 1}
                          className="btn btn-small btn-secondary"
                          title="Liiguta alla"
                        >
                          ↓
                        </button>
                      </div>
                      
                      <div className="action-buttons">
                        <button 
                          onClick={() => handleEdit(pair)}
                          className="btn btn-small btn-secondary"
                        >
                          ✏️ Muuda
                        </button>
                        <button 
                          onClick={() => handleDelete(pair)}
                          className="btn btn-small btn-danger"
                        >
                          🗑️ Kustuta
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {faqPairs.length === 0 && (
                <div className="empty-state">
                  <div className="empty-icon">❓</div>
                  <h4>KKK paare pole veel lisatud</h4>
                  <p>Alustage esimese küsimuse ja vastuse lisamisega</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        .faq-container {
          padding: 32px;
          max-width: 1600px;
          margin: 0 auto;
        }

        .faq-header {
          margin-bottom: 32px;
        }

        .faq-header h1 {
          font-family: var(--font-heading);
          color: var(--color-ultramarine);
          margin-bottom: 8px;
        }

        .faq-header p {
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

        .faq-layout {
          display: grid;
          grid-template-columns: 600px 1fr;
          gap: 32px;
        }

        .form-card,
        .list-card {
          background: white;
          border-radius: 8px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
          padding: 24px;
          height: fit-content;
        }

        .form-card h3,
        .list-card h3 {
          font-family: var(--font-heading);
          color: var(--color-ultramarine);
          margin-bottom: 24px;
          font-size: 1.25rem;
        }

        .faq-form {
          display: flex;
          flex-direction: column;
          gap: 24px;
        }

        .bilingual-fields {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 24px;
        }

        .language-section {
          padding: 20px;
          border: 1px solid #e9ecef;
          border-radius: 8px;
          background: #fafbfc;
        }

        .language-title {
          font-family: var(--font-heading);
          color: var(--color-ultramarine);
          margin-bottom: 16px;
          font-size: 1rem;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .form-group {
          display: flex;
          flex-direction: column;
          gap: 8px;
          margin-bottom: 16px;
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
          display: flex;
          gap: 12px;
          justify-content: flex-end;
        }

        .faq-list {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .faq-pair {
          border: 1px solid #e9ecef;
          border-radius: 8px;
          padding: 20px;
          background: #fafbfc;
        }

        .pair-content {
          margin-bottom: 16px;
        }

        .pair-languages {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 20px;
        }

        .pair-language h5 {
          font-family: var(--font-heading);
          color: var(--color-ultramarine);
          margin-bottom: 8px;
          font-size: 0.9rem;
        }

        .pair-question {
          font-weight: 500;
          margin-bottom: 4px;
          font-size: 0.9rem;
          line-height: 1.4;
        }

        .pair-answer {
          color: #666;
          font-size: 0.8rem;
          line-height: 1.4;
          margin: 0;
        }

        .missing-badge {
          background: #e9ecef;
          color: #666;
          padding: 4px 8px;
          border-radius: 12px;
          font-size: 0.75rem;
          font-style: italic;
        }

        .pair-actions {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding-top: 16px;
          border-top: 1px solid #e9ecef;
        }

        .order-controls {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .order-number {
          font-family: var(--font-heading);
          font-weight: 500;
          color: var(--color-ultramarine);
          min-width: 20px;
          text-align: center;
        }

        .action-buttons {
          display: flex;
          gap: 8px;
        }

        .empty-state {
          text-align: center;
          padding: 48px 24px;
          color: #666;
        }

        .empty-icon {
          font-size: 3rem;
          margin-bottom: 16px;
        }

        .empty-state h4 {
          font-family: var(--font-heading);
          color: var(--color-text);
          margin-bottom: 8px;
        }

        .btn {
          padding: 8px 16px;
          border: none;
          border-radius: 4px;
          font-family: var(--font-body);
          font-weight: 500;
          cursor: pointer;
          transition: opacity 0.2s ease;
          font-size: 0.9rem;
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

        .btn-secondary {
          background-color: #6c757d;
          color: white;
        }

        .btn-danger {
          background-color: #dc3545;
          color: white;
        }

        .btn-small {
          padding: 4px 8px;
          font-size: 0.8rem;
        }

        @media (max-width: 1200px) {
          .bilingual-fields {
            grid-template-columns: 1fr;
            gap: 16px;
          }

          .pair-languages {
            grid-template-columns: 1fr;
            gap: 16px;
          }
        }

        @media (max-width: 768px) {
          .faq-container {
            padding: 24px 16px;
          }

          .faq-layout {
            grid-template-columns: 1fr;
            gap: 24px;
          }

          .pair-actions {
            flex-direction: column;
            gap: 12px;
            align-items: stretch;
          }

          .action-buttons {
            justify-content: center;
          }
        }
      `}</style>
    </AdminLayout>
  )
}

export default AdminFAQ