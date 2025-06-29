import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import AdminLayout from '../../components/Admin/AdminLayout'
import { faqService } from '../../utils/supabase/faq'

const AdminFAQ = () => {
  const { t } = useTranslation()
  const [faqItems, setFaqItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [editingItem, setEditingItem] = useState(null)
  const [reordering, setReordering] = useState(false)

  const [formData, setFormData] = useState({
    et: { question: '', answer: '' },
    en: { question: '', answer: '' },
    is_active: true
  })

  useEffect(() => {
    loadFAQItems()
  }, [])

  const loadFAQItems = async () => {
    setLoading(true)
    try {
      const { data, error } = await faqService.getBilingualFAQItems()
      
      if (error) {
        setError(error.message)
      } else {
        // Organize items by pairing ET and EN versions
        const organizedItems = organizeBilingualItems(data)
        setFaqItems(organizedItems)
      }
    } catch (err) {
      setError('Võrguühenduse viga')
    } finally {
      setLoading(false)
    }
  }

  const organizeBilingualItems = (data) => {
    const etItems = data.et || []
    const enItems = data.en || []
    const organized = []

    // Create a map of EN items by display_order for quick lookup
    const enItemsMap = {}
    enItems.forEach(item => {
      enItemsMap[item.display_order] = item
    })

    // Process ET items and pair with EN items
    etItems.forEach(etItem => {
      const enItem = enItemsMap[etItem.display_order]
      organized.push({
        display_order: etItem.display_order,
        et: etItem,
        en: enItem || { question: '', answer: '', language: 'en', display_order: etItem.display_order, is_active: true }
      })
    })

    // Add any EN items that don't have ET counterparts
    enItems.forEach(enItem => {
      const hasEtCounterpart = etItems.some(etItem => etItem.display_order === enItem.display_order)
      if (!hasEtCounterpart) {
        organized.push({
          display_order: enItem.display_order,
          et: { question: '', answer: '', language: 'et', display_order: enItem.display_order, is_active: true },
          en: enItem
        })
      }
    })

    return organized.sort((a, b) => a.display_order - b.display_order)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    setError('')
    setSuccess('')

    // Validate that at least one language has content
    const hasEtContent = formData.et.question.trim() && formData.et.answer.trim()
    const hasEnContent = formData.en.question.trim() && formData.en.answer.trim()

    if (!hasEtContent && !hasEnContent) {
      setError('Vähemalt ühes keeles peab olema küsimus ja vastus')
      setSaving(false)
      return
    }

    try {
      let displayOrder = editingItem ? editingItem.display_order : null

      // If creating new item, get next display order
      if (!editingItem) {
        const maxOrder = faqItems.length > 0 ? Math.max(...faqItems.map(item => item.display_order)) : 0
        displayOrder = maxOrder + 1
      }

      const promises = []

      // Save ET version if it has content
      if (hasEtContent) {
        const etData = {
          question: formData.et.question,
          answer: formData.et.answer,
          language: 'et',
          display_order: displayOrder,
          is_active: formData.is_active
        }

        if (editingItem?.et?.id) {
          etData.id = editingItem.et.id
        }

        promises.push(faqService.upsertFAQItem(etData))
      }

      // Save EN version if it has content
      if (hasEnContent) {
        const enData = {
          question: formData.en.question,
          answer: formData.en.answer,
          language: 'en',
          display_order: displayOrder,
          is_active: formData.is_active
        }

        if (editingItem?.en?.id) {
          enData.id = editingItem.en.id
        }

        promises.push(faqService.upsertFAQItem(enData))
      }

      const results = await Promise.all(promises)
      const hasErrors = results.some(result => result.error)

      if (hasErrors) {
        setError('Mõne keele salvestamine ebaõnnestus')
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
      et: {
        question: item.et?.question || '',
        answer: item.et?.answer || ''
      },
      en: {
        question: item.en?.question || '',
        answer: item.en?.answer || ''
      },
      is_active: item.et?.is_active ?? item.en?.is_active ?? true
    })
  }

  const handleDelete = async (item) => {
    if (!confirm('Kas olete kindel, et soovite selle küsimuse kustutada mõlemast keelest?')) {
      return
    }

    try {
      const promises = []
      
      if (item.et?.id) {
        promises.push(faqService.deleteFAQItem(item.et.id))
      }
      
      if (item.en?.id) {
        promises.push(faqService.deleteFAQItem(item.en.id))
      }

      await Promise.all(promises)
      await loadFAQItems()
      setSuccess('KKK küsimus edukalt kustutatud!')
      setTimeout(() => setSuccess(''), 3000)
    } catch (err) {
      setError('Kustutamine ebaõnnestus')
    }
  }

  const handleMoveUp = async (item, index) => {
    if (index === 0) return

    setReordering(true)
    try {
      const currentItem = faqItems[index]
      const aboveItem = faqItems[index - 1]

      // Swap display orders
      const promises = []

      if (currentItem.et?.id) {
        promises.push(faqService.upsertFAQItem({
          ...currentItem.et,
          display_order: aboveItem.display_order
        }))
      }

      if (currentItem.en?.id) {
        promises.push(faqService.upsertFAQItem({
          ...currentItem.en,
          display_order: aboveItem.display_order
        }))
      }

      if (aboveItem.et?.id) {
        promises.push(faqService.upsertFAQItem({
          ...aboveItem.et,
          display_order: currentItem.display_order
        }))
      }

      if (aboveItem.en?.id) {
        promises.push(faqService.upsertFAQItem({
          ...aboveItem.en,
          display_order: currentItem.display_order
        }))
      }

      await Promise.all(promises)
      await loadFAQItems()
    } catch (err) {
      setError('Järjestuse muutmine ebaõnnestus')
    } finally {
      setReordering(false)
    }
  }

  const handleMoveDown = async (item, index) => {
    if (index === faqItems.length - 1) return

    setReordering(true)
    try {
      const currentItem = faqItems[index]
      const belowItem = faqItems[index + 1]

      // Swap display orders
      const promises = []

      if (currentItem.et?.id) {
        promises.push(faqService.upsertFAQItem({
          ...currentItem.et,
          display_order: belowItem.display_order
        }))
      }

      if (currentItem.en?.id) {
        promises.push(faqService.upsertFAQItem({
          ...currentItem.en,
          display_order: belowItem.display_order
        }))
      }

      if (belowItem.et?.id) {
        promises.push(faqService.upsertFAQItem({
          ...belowItem.et,
          display_order: currentItem.display_order
        }))
      }

      if (belowItem.en?.id) {
        promises.push(faqService.upsertFAQItem({
          ...belowItem.en,
          display_order: currentItem.display_order
        }))
      }

      await Promise.all(promises)
      await loadFAQItems()
    } catch (err) {
      setError('Järjestuse muutmine ebaõnnestus')
    } finally {
      setReordering(false)
    }
  }

  const resetForm = () => {
    setEditingItem(null)
    setFormData({
      et: { question: '', answer: '' },
      en: { question: '', answer: '' },
      is_active: true
    })
  }

  const handleInputChange = (language, field, value) => {
    setFormData(prev => ({
      ...prev,
      [language]: {
        ...prev[language],
        [field]: value
      }
    }))
  }

  const handleActiveChange = (checked) => {
    setFormData(prev => ({
      ...prev,
      is_active: checked
    }))
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
          <p>Hallake korduma kippuvaid küsimusi ja vastuseid eesti ja inglise keeles</p>
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
              
              <form onSubmit={handleSubmit} className="faq-form">
                {/* Bilingual Fields */}
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
                        rows="6"
                        className="form-input"
                        placeholder="Sisestage vastus eesti keeles (kasutage \n\n lõikude eraldamiseks)"
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
                        rows="6"
                        className="form-input"
                        placeholder="Enter answer in English (use \n\n to separate paragraphs)"
                      />
                    </div>
                  </div>
                </div>

                {/* Active Status */}
                <div className="form-group">
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={formData.is_active}
                      onChange={(e) => handleActiveChange(e.target.checked)}
                      className="form-checkbox"
                    />
                    <span>Küsimus on aktiivne</span>
                  </label>
                </div>

                <div className="form-hint-section">
                  <small className="form-hint">
                    💡 Vähemalt ühes keeles peab olema küsimus ja vastus. Teine keel võib jääda tühjaks.
                  </small>
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
                    {saving ? 'Salvestamine...' : (editingItem ? 'Uuenda mõlemad keeled' : 'Lisa mõlemad keeled')}
                  </button>
                </div>
              </form>
            </div>
          </div>

          {/* FAQ Items List */}
          <div className="faq-list-section">
            <div className="list-card">
              <div className="list-header">
                <h3>KKK küsimused ({faqItems.length})</h3>
              </div>

              {/* Ordering Info */}
              <div className="ordering-info">
                <p>📋 Kasutage ↑ ja ↓ nuppe järjestuse muutmiseks. Ülemine küsimus kuvatakse esimesena.</p>
              </div>
              
              <div className="faq-items-list">
                {faqItems.length === 0 ? (
                  <div className="empty-state">
                    <div className="empty-icon">❓</div>
                    <h4>KKK küsimusi pole veel lisatud</h4>
                    <p>Alustage esimese küsimuse lisamisega</p>
                  </div>
                ) : (
                  faqItems.map((item, index) => (
                    <div key={`${item.display_order}-${index}`} className="faq-item">
                      <div className="item-order">
                        <span className="order-number">#{item.display_order}</span>
                        <div className="order-controls">
                          <button 
                            onClick={() => handleMoveUp(item, index)}
                            disabled={reordering || index === 0}
                            className="btn btn-small btn-order"
                            title="Liiguta üles"
                          >
                            ↑
                          </button>
                          <button 
                            onClick={() => handleMoveDown(item, index)}
                            disabled={reordering || index === faqItems.length - 1}
                            className="btn btn-small btn-order"
                            title="Liiguta alla"
                          >
                            ↓
                          </button>
                        </div>
                      </div>

                      <div className="item-content">
                        <div className="item-languages">
                          {/* Estonian Version */}
                          <div className="language-version">
                            <div className="language-header">
                              <span className="language-flag">🇪🇪</span>
                              <span className="language-name">ET</span>
                              {!item.et?.question && (
                                <span className="missing-badge">Puudub</span>
                              )}
                            </div>
                            {item.et?.question && (
                              <div className="version-content">
                                <h5>{item.et.question}</h5>
                                <p>{item.et.answer.length > 100 ? `${item.et.answer.substring(0, 100)}...` : item.et.answer}</p>
                              </div>
                            )}
                          </div>

                          {/* English Version */}
                          <div className="language-version">
                            <div className="language-header">
                              <span className="language-flag">🇬🇧</span>
                              <span className="language-name">EN</span>
                              {!item.en?.question && (
                                <span className="missing-badge">Missing</span>
                              )}
                            </div>
                            {item.en?.question && (
                              <div className="version-content">
                                <h5>{item.en.question}</h5>
                                <p>{item.en.answer.length > 100 ? `${item.en.answer.substring(0, 100)}...` : item.en.answer}</p>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Status */}
                        <div className="item-status">
                          {!(item.et?.is_active ?? item.en?.is_active ?? true) && (
                            <span className="inactive-badge">Mitteaktiivne</span>
                          )}
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
                          onClick={() => handleDelete(item)}
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
          grid-template-columns: 600px 1fr;
          gap: 32px;
        }

        .form-card,
        .list-card {
          background: white;
          border-radius: 8px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
          padding: 32px;
        }

        .form-card h3 {
          font-family: var(--font-heading);
          color: var(--color-ultramarine);
          margin-bottom: 32px;
          font-size: 1.25rem;
        }

        .faq-form {
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
          gap: 16px;
          justify-content: flex-end;
          padding-top: 24px;
          border-top: 1px solid #eee;
        }

        .list-header {
          margin-bottom: 20px;
        }

        .list-header h3 {
          font-family: var(--font-heading);
          color: var(--color-ultramarine);
          font-size: 1.25rem;
          margin: 0;
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
          flex: 1;
        }

        .item-languages {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 20px;
          margin-bottom: 12px;
        }

        .language-version {
          border: 1px solid #e9ecef;
          border-radius: 6px;
          padding: 16px;
          background: #fafbfc;
        }

        .language-header {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 12px;
        }

        .language-flag {
          font-size: 1.2rem;
        }

        .language-name {
          font-family: var(--font-heading);
          font-weight: 600;
          color: var(--color-ultramarine);
          font-size: 0.9rem;
        }

        .missing-badge {
          background: #ffc107;
          color: #333;
          padding: 2px 8px;
          border-radius: 12px;
          font-size: 0.7rem;
          font-weight: 500;
        }

        .version-content h5 {
          font-family: var(--font-heading);
          color: var(--color-text);
          font-size: 0.95rem;
          line-height: 1.3;
          margin-bottom: 8px;
        }

        .version-content p {
          color: #666;
          font-size: 0.85rem;
          line-height: 1.4;
          margin: 0;
        }

        .item-status {
          display: flex;
          justify-content: center;
        }

        .inactive-badge {
          background: #ffc107;
          color: #333;
          padding: 4px 12px;
          border-radius: 12px;
          font-size: 0.8rem;
          font-weight: 500;
        }

        .item-actions {
          display: flex;
          gap: 8px;
          flex-shrink: 0;
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

        @media (max-width: 1200px) {
          .bilingual-fields {
            grid-template-columns: 1fr;
            gap: 24px;
          }

          .item-languages {
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