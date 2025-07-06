import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import AdminLayout from '../../components/Admin/AdminLayout'
import { maksekeskusConfigService } from '../../utils/supabase/maksekeskusConfig'

const PaymentSettings = () => {
  const { t } = useTranslation()
  const [config, setConfig] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  
  // Form state for new values
  const [formData, setFormData] = useState({
    shop_id: '',
    api_secret_key: '',
    api_open_key: '',
    test_mode: false,
    active: true
  })
  
  // Track which fields have been modified
  const [modifiedFields, setModifiedFields] = useState({
    shop_id: false,
    api_secret_key: false,
    api_open_key: false
  })

  useEffect(() => {
    loadConfig()
  }, [])

  const loadConfig = async () => {
    setLoading(true)
    setError('')
    
    try {
      // Get masked config for display
      const { data: maskedData, error: maskedError } = await maksekeskusConfigService.getMaskedConfig()
      
      if (maskedError) {
        console.error('Error loading masked config:', maskedError)
        // If no config exists, that's okay - we'll show the form to create one
        if (maskedError.code !== 'PGRST116') {
          setError('Maksekeskuse konfiguratsiooni laadimine ebaõnnestus')
        }
        return
      }
      
      setConfig(maskedData)
      
      // Initialize form with masked data
      if (maskedData) {
        setFormData({
          id: maskedData.id,
          shop_id: maskedData.shop_id || '',
          api_secret_key: '', // Don't show actual key, just placeholder
          api_open_key: '', // Don't show actual key, just placeholder
          test_mode: maskedData.test_mode || false,
          active: maskedData.active || true
        })
      }
    } catch (err) {
      console.error('Error in loadConfig:', err)
      setError('Võrguühenduse viga')
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target
    const newValue = type === 'checkbox' ? checked : value
    
    setFormData(prev => ({
      ...prev,
      [name]: newValue
    }))
    
    // Track modified fields for text inputs
    if (type !== 'checkbox' && ['shop_id', 'api_secret_key', 'api_open_key'].includes(name)) {
      setModifiedFields(prev => ({
        ...prev,
        [name]: true
      }))
    }
    
    // Clear messages when user starts typing
    if (error) setError('')
    if (success) setSuccess('')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    setError('')
    setSuccess('')

    try {
      // Prepare data for update, only including modified fields
      const updateData = {
        id: formData.id,
        test_mode: formData.test_mode,
        active: formData.active
      }
      
      // Only include text fields that have been modified
      if (modifiedFields.shop_id) {
        updateData.shop_id = formData.shop_id
      }
      
      if (modifiedFields.api_secret_key && formData.api_secret_key) {
        updateData.api_secret_key = formData.api_secret_key
      }
      
      if (modifiedFields.api_open_key && formData.api_open_key) {
        updateData.api_open_key = formData.api_open_key
      }
      
      // If this is a new config (no ID), include all fields
      if (!formData.id) {
        if (!formData.shop_id || !formData.api_secret_key || !formData.api_open_key) {
          setError('Kõik väljad on kohustuslikud uue konfiguratsiooni loomisel')
          setSaving(false)
          return
        }
        
        // For new configs, include all required fields
        updateData.shop_id = formData.shop_id
        updateData.api_secret_key = formData.api_secret_key
        updateData.api_open_key = formData.api_open_key
      }
      
      const { data, error } = await maksekeskusConfigService.upsertMaksekeskusConfig(updateData)
      
      if (error) {
        setError(error.message)
      } else {
        setSuccess('Maksekeskuse seaded edukalt salvestatud!')
        
        // Reset modified fields tracking
        setModifiedFields({
          shop_id: false,
          api_secret_key: false,
          api_open_key: false
        })
        
        // Reload config to get updated masked values
        await loadConfig()
        
        // Clear success message after 3 seconds
        setTimeout(() => setSuccess(''), 3000)
      }
    } catch (err) {
      console.error('Error saving config:', err)
      setError('Võrguühenduse viga')
    } finally {
      setSaving(false)
    }
  }

  const handleToggleTestMode = async () => {
    if (!config?.id) return
    
    setSaving(true)
    setError('')
    
    try {
      const { error } = await maksekeskusConfigService.toggleTestMode(
        config.id, 
        !config.test_mode
      )
      
      if (error) {
        setError(error.message)
      } else {
        setSuccess('Testrežiim edukalt muudetud!')
        await loadConfig()
        setTimeout(() => setSuccess(''), 3000)
      }
    } catch (err) {
      setError('Võrguühenduse viga')
    } finally {
      setSaving(false)
    }
  }

  const handleToggleActive = async () => {
    if (!config?.id) return
    
    setSaving(true)
    setError('')
    
    try {
      const { error } = await maksekeskusConfigService.toggleActive(
        config.id, 
        !config.active
      )
      
      if (error) {
        setError(error.message)
      } else {
        setSuccess('Aktiivne olek edukalt muudetud!')
        await loadConfig()
        setTimeout(() => setSuccess(''), 3000)
      }
    } catch (err) {
      setError('Võrguühenduse viga')
    } finally {
      setSaving(false)
    }
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
      <div className="payment-settings-container">
        <div className="payment-settings-header">
          <h1>Maksekeskuse seaded</h1>
          <p>Hallake Maksekeskuse API võtmeid ja seadistusi</p>
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

        <div className="payment-settings-content">
          <div className="settings-card">
            <h2>Maksekeskuse API seaded</h2>
            
            {config ? (
              <div className="current-config">
                <div className="config-status">
                  <div className="status-item">
                    <span className="status-label">Staatus:</span>
                    <span className={`status-value ${config.active ? 'status-active' : 'status-inactive'}`}>
                      {config.active ? 'Aktiivne' : 'Mitteaktiivne'}
                    </span>
                    <button 
                      onClick={handleToggleActive}
                      disabled={saving}
                      className="btn btn-small btn-secondary"
                    >
                      {config.active ? 'Deaktiveeri' : 'Aktiveeri'}
                    </button>
                  </div>
                  
                  <div className="status-item">
                    <span className="status-label">Testrežiim:</span>
                    <span className={`status-value ${config.test_mode ? 'status-test' : 'status-live'}`}>
                      {config.test_mode ? 'Sees (Testimine)' : 'Väljas (Live)'}
                    </span>
                    <button 
                      onClick={handleToggleTestMode}
                      disabled={saving}
                      className="btn btn-small btn-secondary"
                    >
                      {config.test_mode ? 'Lülita välja' : 'Lülita sisse'}
                    </button>
                  </div>
                </div>
                
                <div className="config-details">
                  <div className="config-item">
                    <span className="config-label">Shop ID:</span>
                    <span className="config-value">{config.shop_id}</span>
                  </div>
                  
                  <div className="config-item">
                    <span className="config-label">API Secret Key:</span>
                    <span className="config-value">{config.api_secret_key_masked}</span>
                  </div>
                  
                  <div className="config-item">
                    <span className="config-label">API Open Key:</span>
                    <span className="config-value">{config.api_open_key_masked}</span>
                  </div>
                  
                  <div className="config-item">
                    <span className="config-label">Viimati uuendatud:</span>
                    <span className="config-value">
                      {new Date(config.updated_at).toLocaleString('et-EE')}
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="no-config">
                <p>Maksekeskuse konfiguratsiooni ei leitud. Palun lisage uus konfiguratsioon.</p>
              </div>
            )}
            
            <div className="config-form-section">
              <h3>{config ? 'Muuda konfiguratsiooni' : 'Lisa uus konfiguratsioon'}</h3>
              
              <form onSubmit={handleSubmit} className="config-form">
                <div className="form-group">
                  <label htmlFor="shop_id">Shop ID</label>
                  <input
                    type="text"
                    id="shop_id"
                    name="shop_id"
                    value={formData.shop_id}
                    onChange={handleInputChange}
                    className="form-input"
                    placeholder={config ? "Jäta tühjaks, et mitte muuta" : "Sisesta Shop ID"}
                    required={!config}
                  />
                </div>
                
                <div className="form-group">
                  <label htmlFor="api_secret_key">API Secret Key</label>
                  <input
                    type="password"
                    id="api_secret_key"
                    name="api_secret_key"
                    value={formData.api_secret_key}
                    onChange={handleInputChange}
                    className="form-input"
                    placeholder={config ? "Jäta tühjaks, et mitte muuta" : "Sisesta API Secret Key"}
                    required={!config}
                  />
                </div>
                
                <div className="form-group">
                  <label htmlFor="api_open_key">API Open Key</label>
                  <input
                    type="password"
                    id="api_open_key"
                    name="api_open_key"
                    value={formData.api_open_key}
                    onChange={handleInputChange}
                    className="form-input"
                    placeholder={config ? "Jäta tühjaks, et mitte muuta" : "Sisesta API Open Key"}
                    required={!config}
                  />
                </div>
                
                <div className="form-group checkbox-group">
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      name="test_mode"
                      checked={formData.test_mode}
                      onChange={handleInputChange}
                      className="form-checkbox"
                    />
                    <span>Testrežiim</span>
                  </label>
                  <small className="form-hint">
                    Testrežiimis ei toimu päris makseid. Kasutage seda ainult testimiseks.
                  </small>
                </div>
                
                <div className="form-group checkbox-group">
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      name="active"
                      checked={formData.active}
                      onChange={handleInputChange}
                      className="form-checkbox"
                    />
                    <span>Aktiivne</span>
                  </label>
                  <small className="form-hint">
                    Ainult üks konfiguratsioon saab olla korraga aktiivne.
                  </small>
                </div>
                
                <div className="form-actions">
                  <button 
                    type="submit"
                    disabled={saving}
                    className="btn btn-primary"
                  >
                    {saving ? 'Salvestamine...' : (config ? 'Uuenda seadeid' : 'Lisa konfiguratsioon')}
                  </button>
                </div>
              </form>
            </div>
          </div>
          
          <div className="settings-card">
            <h2>Maksekeskuse integratsioon</h2>
            
            <div className="integration-info">
              <h3>Kuidas Maksekeskus töötab?</h3>
              <p>Maksekeskus on Eesti maksevahendaja, mis võimaldab teie e-poes vastu võtta erinevaid makseid, sealhulgas pangalingid, krediitkaardid ja muud makseviisid.</p>
              
              <h3>Seadistamine</h3>
              <ol>
                <li>Looge konto <a href="https://maksekeskus.ee" target="_blank" rel="noopener noreferrer">Maksekeskuse veebilehel</a>.</li>
                <li>Saage oma Shop ID, API Secret Key ja API Open Key.</li>
                <li>Sisestage need võtmed ülaltoodud vormis.</li>
                <li>Testige makset testrežiimis.</li>
                <li>Kui kõik töötab, lülitage testrežiim välja ja aktiveerige konfiguratsioon.</li>
              </ol>
              
              <h3>Testimine</h3>
              <p>Testrežiimis saate kasutada järgmisi testkaardiandmeid:</p>
              <ul>
                <li><strong>Kaardi number:</strong> 4111 1111 1111 1111</li>
                <li><strong>Kehtivusaeg:</strong> Suvaline tuleviku kuupäev</li>
                <li><strong>CVC:</strong> Suvaline 3-kohaline number</li>
                <li><strong>Kaardi omanik:</strong> Suvaline nimi</li>
              </ul>
              
              <div className="warning-box">
                <h4>⚠️ Tähelepanu</h4>
                <p>API võtmed on tundlikud andmed. Ärge jagage neid kellegi teisega.</p>
                <p>Kui kahtlustate, et teie võtmed on lekkinud, looge Maksekeskuse kontol uued võtmed ja uuendage need siin.</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        .payment-settings-container {
          padding: 32px;
          max-width: 1200px;
          margin: 0 auto;
        }

        .payment-settings-header {
          margin-bottom: 32px;
        }

        .payment-settings-header h1 {
          font-family: var(--font-heading);
          color: var(--color-ultramarine);
          margin-bottom: 8px;
        }

        .payment-settings-header p {
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

        .payment-settings-content {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 32px;
        }

        .settings-card {
          background: white;
          border-radius: 8px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
          padding: 24px;
          height: fit-content;
        }

        .settings-card h2 {
          font-family: var(--font-heading);
          color: var(--color-ultramarine);
          margin-bottom: 24px;
          font-size: 1.25rem;
        }

        .current-config {
          margin-bottom: 32px;
        }

        .config-status {
          display: flex;
          flex-direction: column;
          gap: 12px;
          margin-bottom: 24px;
        }

        .status-item {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .status-label {
          font-weight: 500;
          min-width: 100px;
        }

        .status-value {
          padding: 4px 8px;
          border-radius: 4px;
          font-size: 0.9rem;
          font-weight: 500;
        }

        .status-active {
          background-color: #d4edda;
          color: #155724;
        }

        .status-inactive {
          background-color: #f8d7da;
          color: #721c24;
        }

        .status-test {
          background-color: #fff3cd;
          color: #856404;
        }

        .status-live {
          background-color: #d1ecf1;
          color: #0c5460;
        }

        .config-details {
          background: #f8f9fa;
          border-radius: 8px;
          padding: 16px;
        }

        .config-item {
          display: flex;
          justify-content: space-between;
          margin-bottom: 12px;
          padding-bottom: 12px;
          border-bottom: 1px solid #e9ecef;
        }

        .config-item:last-child {
          margin-bottom: 0;
          padding-bottom: 0;
          border-bottom: none;
        }

        .config-label {
          font-weight: 500;
          color: #495057;
        }

        .config-value {
          font-family: var(--font-heading);
          color: var(--color-ultramarine);
        }

        .no-config {
          background: #f8f9fa;
          padding: 24px;
          border-radius: 8px;
          text-align: center;
          margin-bottom: 32px;
        }

        .config-form-section {
          border-top: 1px solid #e9ecef;
          padding-top: 24px;
        }

        .config-form-section h3 {
          font-family: var(--font-heading);
          color: var(--color-text);
          margin-bottom: 24px;
          font-size: 1.125rem;
        }

        .config-form {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        .form-group {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .checkbox-group {
          flex-direction: row;
          align-items: center;
          gap: 12px;
        }

        .form-group label {
          font-family: var(--font-heading);
          font-weight: 500;
          color: var(--color-text);
          font-size: 0.9rem;
        }

        .checkbox-label {
          display: flex;
          align-items: center;
          gap: 8px;
          cursor: pointer;
        }

        .form-checkbox {
          width: 18px;
          height: 18px;
          accent-color: var(--color-ultramarine);
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

        .form-hint {
          font-size: 0.8rem;
          color: #666;
          margin-top: 4px;
        }

        .form-actions {
          display: flex;
          justify-content: flex-end;
          margin-top: 12px;
        }

        .integration-info {
          display: flex;
          flex-direction: column;
          gap: 24px;
        }

        .integration-info h3 {
          font-family: var(--font-heading);
          color: var(--color-ultramarine);
          margin-bottom: 12px;
          font-size: 1.125rem;
        }

        .integration-info p {
          margin-bottom: 12px;
          font-size: 0.95rem;
          line-height: 1.5;
          color: #495057;
        }

        .integration-info ol,
        .integration-info ul {
          margin-left: 24px;
          margin-bottom: 16px;
        }

        .integration-info li {
          margin-bottom: 8px;
          font-size: 0.95rem;
          line-height: 1.5;
          color: #495057;
        }

        .warning-box {
          background-color: #fff3cd;
          border: 1px solid #ffeeba;
          border-radius: 8px;
          padding: 16px;
          margin-top: 16px;
        }

        .warning-box h4 {
          color: #856404;
          margin-bottom: 8px;
          font-family: var(--font-heading);
          font-size: 1rem;
        }

        .warning-box p {
          color: #856404;
          margin-bottom: 8px;
          font-size: 0.9rem;
        }

        .warning-box p:last-child {
          margin-bottom: 0;
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

        .btn-small {
          padding: 4px 8px;
          font-size: 0.8rem;
        }

        @media (max-width: 1024px) {
          .payment-settings-content {
            grid-template-columns: 1fr;
            gap: 24px;
          }
        }

        @media (max-width: 768px) {
          .payment-settings-container {
            padding: 24px 16px;
          }

          .status-item {
            flex-direction: column;
            align-items: flex-start;
            gap: 8px;
          }

          .status-label {
            min-width: auto;
          }
        }
      `}</style>
    </AdminLayout>
  )
}

export default PaymentSettings