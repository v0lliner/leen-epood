import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import AdminLayout from '../../components/Admin/AdminLayout'
import { faqService } from '../../utils/supabase/faq'

const AdminFAQ = () => {
  const { t } = useTranslation()
  const [faqItems, setFaqItems] = useState({ et: [], en: [] })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [activeLanguage, setActiveLanguage] = useState('et')
  const [editingItem, setEditingItem] = useState(null)
  const [reordering, setReordering] = useState(false)

  const [formData, setFormData] = useState({
    question: '',
    answer: '',
    is_active: true
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
      setFaqItems(data)
    }
    
    setLoading(false)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    setError('')
    setSuccess('')

    if (!formData.question.trim() || !formData.answer.trim()) {
      setError('Küsimus ja vastus on kohustuslikud')
      setSaving(false)
      return
    }

    try {
      const itemData = {
        ...formData,
        language: activeLanguage
      }

      if (editingItem) {
        itemData.id = editingItem.id
      }

      const { error } = await faqService.upsertFAQItem(itemData)
      
      if (error) {
        setError(error.message)
      } else {
        await loadFAQItems()
        resetForm()
        setSuccess(editingItem ? 'KKK küsimus edukalt uuendatud!' : 'KKK küsimus edukalt lisatud!')
        setTimeout(() => setSuccess(''), 3000)
      }
    } catch (err) {
      setError('Võrguühenduse viga')
    } finally {
      setSaving(false)
    }
  }

  const handleEdit = (item) => {
    setEditingItem(item)
    setFormData({
      question: item.question,
      answer: item.answer,
      is_active: item.is_active
    })
    setActiveLanguage(item.language)
  }

  const handleDelete = async (id) => {
    if (!confirm('Kas olete kindel, et soovite selle küsimuse kustutada?')) {
      return
    }

    const { error } = await faqService.deleteFAQItem(id)
    
    if (error) {
      setError(error.message)
    } else {
      await loadFAQItems()
      setSuccess('KKK küsimus edukalt kustutatud!')
      setTimeout(() => setSuccess(''), 3000)
    }
  }

  const handleMoveUp = async (id) => {
    setReordering(true)
    const { error } = await faqService.moveItemUp(id)
    
    if (error) {
      setError(error.message)
    } else {
      await loadFAQItems()
    }
    
    setReordering(false)
  }

  const handleMoveDown = async (id) => {
    setReordering(true)
    const { error } = await faqService.moveItemDown(id)
    
    if (error) {
      setError(error.message)
    } else {
      await loadFAQItems()
    }
    
    setReordering(false)
  }

  const resetForm = () => {
    setEditingItem(null)
    setFormData({
      question: '',
      answer: '',
      is_active: true
    })
  }

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }))
  }

  const currentItems = faqItems[activeLanguage] || []

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
          <p>Hallake korduma kippuvaid küsimusi ja vastuseid</p>
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
          {/* Form Section */}
          <div className="faq-form-section">
            <div className="form-card">
              <h3>{editingItem ? 'Muuda küsimust' : 'Lisa uus küsimus'}</h3>
              
              <div className="language-tabs">
                <button
                  onClick={() => setActiveLanguage('et')}
                  className={`language-tab ${activeLanguage === 'et' ? 'active' : ''}`}
                >
                  🇪🇪 Eesti
                </button>
                <button
                  onClick={() => setActiveLanguage('en')}
                  className={`language-tab ${activeLanguage === 'en' ? 'active' : ''}`}
                >
                  🇬🇧 English
                </button>
              </div>
              
              <form onSubmit={handleSubmit} className="faq-form">
                <div className="form-group">
                  <label htmlFor="question">Küsimus *</label>
                  <input
                    type="text"
                    id="question"
                    name="question"
                    value={formData.question}
                    onChange={handleInputChange}
                    required
                    className="form-input"
                    placeholder="Sisestage küsimus..."
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="answer">Vastus *</label>
                  <textarea
                    id="answer"
                    name="answer"
                    value={formData.answer}
                    onChange={handleInputChange}
                    required
                    rows="6"
                    className="form-input"
                    placeholder="Sisestage vastus... (kasutage \n\n lõikude eraldamiseks)"
                  />
                </div>

                <div className="form-group">
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      name="is_active"
                      checked={formData.is_active}
                      onChange={handleInputChange}
                      className="form-checkbox"
                    />
                    <span>Küsimus on aktiivne</span>
                  </label>
                </div>

                <div className="form-actions">
                  {editingItem && (
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
                    {saving ? 'Salvestamine...' : (editingItem ? 'Uuenda' : 'Lisa küsimus')}
                  </button>
                </div>
              </form>
            </div>
          </div>

          {/* FAQ Items List */}
          <div className="faq-list-section">
            <div className="list-card">
              <div className="list-header">
                <h3>KKK küsimused ({activeLanguage.toUpperCase()})</h3>
                <div className="language-indicator">
                  {activeLanguage === 'et' ? '🇪🇪 Eesti keel' : '🇬🇧 English'}
                </div>
              </div>

              {/* Ordering Info */}
              <div className="ordering-info">
                <p>📋 Kasutage ↑ ja ↓ nuppe järjestuse muutmiseks. Ülemine küsimus kuvatakse esimesena.</p>
              </div>
              
              <div className="faq-items-list">
                {currentItems.length === 0 ? (
                  <div className="empty-state">
                    <div className="empty-icon">❓</div>
                    <h4>KKK küsimusi pole veel lisatud</h4>
                    <p>Alustage esimese küsimuse lisamisega</p>
                  </div>
                ) : (
                  currentItems.map((item, index) => (
                    <div key={item.id} className="faq-item">
                      <div className="item-order">
                        <span className="order-number">#{item.display_order || index + 1}</span>
                        <div className="order-controls">
                          <button 
                            onClick={() => handleMoveUp(item.id)}
                            disabled={reordering || index === 0}
                            className="btn btn-small btn-order"
                            title="Liiguta üles"
                          >
                            ↑
                          </button>
                          <button 
                            onClick={() => handleMoveDown(item.id)}
                            disabled={reordering || index === currentItems.length - 1}
                            className="btn btn-small btn-order"
                            title="Liiguta alla"
                          >
                            ↓
                          </button>
                        </div>
                      </div>

                      <div className="item-content">
                        <div className="item-question">
                          <h4>{item.question}</h4>
                          {!item.is_active && (
                            <span className="inactive-badge">Mitteaktiivne</span>
                          )}
                        </div>
                        <div className="item-answer">
                          <p>{item.answer.length > 150 ? `${item.answer.substring(0, 150)}...` : item.answer}</p>
                        </div>
                      </div>

                      <div className="item-actions">
                        <button 
                          onClick={() => handleEdit(item)}
                          className="btn btn-secondary"
                        >
                          ✏️ Muuda
                        </button>
                        <button 
                          onClick={() => handleDelete(item.id)}
                          className="btn btn-danger"
                        >
                          🗑️ Kustuta
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
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
          grid-template-columns: 400px 1fr;
          gap: 32px;
        }

        .form-card,
        .list-card {
          background: white;
          border-radius: 8px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
          padding: 24px;
        }

        .form-card h3 {
          font-family: var(--font-heading);
          color: var(--color-ultramarine);
          margin-bottom: 24px;
          font-size: 1.25rem;
        }

        .language-tabs {
          display: flex;
          gap: 8px;
          margin-bottom: 24px;
        }

        .language-tab {
          padding: 8px 16px;
          border: 1px solid #ddd;
          border-radius: 4px;
          background: white;
          cursor: pointer;
          transition: all 0.2s ease;
          font-family: var(--font-body);
          font-size: 0.9rem;
        }

        .language-tab:hover {
          border-color: var(--color-ultramarine);
        }

        .language-tab.active {
          background: var(--color-ultramarine);
          color: white;
          border-color: var(--color-ultramarine);
        }

        .faq-form {
          display: flex;
          flex-direction: column;
          gap: 20px;
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

        .checkbox-label {
          display: flex;
          align-items: center;
          gap: 8px;
          cursor: pointer;
          font-family: var(--font-body) !important;
          font-weight: normal !important;
          font-size: 1rem !important;
        }

        .form-checkbox {
          width: 18px;
          height: 18px;
          accent-color: var(--color-ultramarine);
        }

        .form-actions {
          display: flex;
          gap: 12px;
          margin-top: 8px;
        }

        .list-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
        }

        .list-header h3 {
          font-family: var(--font-heading);
          color: var(--color-ultramarine);
          font-size: 1.25rem;
          margin: 0;
        }

        .language-indicator {
          font-size: 0.9rem;
          color: #666;
          background: #f5f5f5;
          padding: 4px 12px;
          border-radius: 12px;
        }

        .ordering-info {
          background: #f8f9fa;
          padding: 12px 16px;
          border-radius: 4px;
          border-left: 3px solid var(--color-ultramarine);
          margin-bottom: 20px;
        }

        .ordering-info p {
          margin: 0;
          font-size: 0.85rem;
          color: #666;
          line-height: 1.4;
        }

        .faq-items-list {
          display: flex;
          flex-direction: column;
          gap: 16px;
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

        .faq-item {
          border: 1px solid #e9ecef;
          border-radius: 8px;
          padding: 20px;
          display: grid;
          grid-template-columns: auto 1fr auto;
          gap: 20px;
          align-items: flex-start;
          transition: transform 0.2s ease, box-shadow 0.2s ease;
        }

        .faq-item:hover {
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
        }

        .item-order {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 8px;
          min-width: 60px;
        }

        .order-number {
          font-family: var(--font-heading);
          font-weight: 600;
          color: var(--color-ultramarine);
          font-size: 1rem;
        }

        .order-controls {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .btn-order {
          width: 28px;
          height: 28px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #f8f9fa;
          border: 1px solid #dee2e6;
          color: var(--color-text);
          font-size: 1rem;
          font-weight: bold;
        }

        .btn-order:hover:not(:disabled) {
          background: var(--color-ultramarine);
          color: white;
          border-color: var(--color-ultramarine);
        }

        .btn-order:disabled {
          opacity: 0.3;
          cursor: not-allowed;
        }

        .item-content {
          min-width: 0;
        }

        .item-question {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 8px;
        }

        .item-question h4 {
          font-family: var(--font-heading);
          color: var(--color-text);
          font-size: 1rem;
          line-height: 1.3;
          margin: 0;
        }

        .inactive-badge {
          background: #ffc107;
          color: #333;
          padding: 2px 8px;
          border-radius: 12px;
          font-size: 0.7rem;
          font-weight: 500;
        }

        .item-answer p {
          color: #666;
          font-size: 0.9rem;
          line-height: 1.4;
          margin: 0;
        }

        .item-actions {
          display: flex;
          gap: 8px;
          flex-shrink: 0;
        }

        .btn {
          padding: 6px 12px;
          border: none;
          border-radius: 4px;
          font-family: var(--font-body);
          font-weight: 500;
          cursor: pointer;
          transition: opacity 0.2s ease;
          font-size: 0.85rem;
          text-decoration: none;
          display: inline-block;
          text-align: center;
          white-space: nowrap;
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

        @media (max-width: 768px) {
          .faq-container {
            padding: 24px 16px;
          }

          .faq-layout {
            grid-template-columns: 1fr;
            gap: 24px;
          }

          .faq-item {
            grid-template-columns: 1fr;
            gap: 16px;
            text-align: center;
          }

          .item-order {
            flex-direction: row;
            justify-content: center;
            align-items: center;
            gap: 16px;
          }

          .order-controls {
            flex-direction: row;
            gap: 8px;
          }

          .item-actions {
            justify-content: center;
          }
        }
      `}</style>
    </AdminLayout>
  )
}

export default AdminFAQ