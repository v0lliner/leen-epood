import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import AdminLayout from '../../components/Admin/AdminLayout'
import { Link } from 'react-router-dom'
import { maksekeskusConfigService } from '../../utils/supabase/maksekeskusConfig'
import { shippingSettingsService } from '../../utils/supabase/shippingSettings'

const PaymentSettings = () => {
  const { t } = useTranslation()
  const [config, setConfig] = useState(null)
  const [omnivaSettings, setOmnivaSettings] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  
  // Omniva shipping settings
  const [omnivaShippingSettings, setOmnivaShippingSettings] = useState(null)
  const [shippingPrice, setShippingPrice] = useState('3.99')
  
  // Omniva shipping settings state
  const [omnivaShippingFormData, setOmnivaShippingFormData] = useState({
    price: '3.99',
    currency: 'EUR',
    active: true
  })
  const [savingOmnivaSettings, setSavingOmnivaSettings] = useState(false)
  
  // Form state for new values
  const [maksekeskusFormData, setMaksekeskusFormData] = useState({
    shop_id: '',
    api_secret_key: '',
    api_open_key: '',
    test_mode: false,
    active: true
  })

  // Form state for Omniva settings
  const [omnivaFormData, setOmnivaFormData] = useState({
    customer_code: '',
    username: '', 
    password: '', 
    test_mode: false, 
    active: true,
    price: '3.99',
    currency: 'EUR'
  })
  
  // Track which fields have been modified
  const [maksekeskusModifiedFields, setMaksekeskusModifiedFields] = useState({
    shop_id: false,
    api_secret_key: false,
    api_open_key: false
  })
  
  // Track which Omniva fields have been modified
  const [omnivaModifiedFields, setOmnivaModifiedFields] = useState({
    customer_code: false,
    username: false, 
    password: false,
    price: false
  })

  // Active tab state
  const [activeTab, setActiveTab] = useState('maksekeskus')

  useEffect(() => {
    loadConfig()
    loadOmnivaShippingSettings()
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
        setMaksekeskusFormData({
          id: maskedData.id,
          shop_id: maskedData.shop_id || '',
          api_secret_key: '', // Don't show actual key, just placeholder
          api_open_key: '', // Don't show actual key, just placeholder
          test_mode: maskedData.test_mode || false,
          active: maskedData.active || true
        })
      }

      // Load Omniva settings
      loadOmnivaCredentials()
    } catch (err) {
      console.error('Error in loadConfig:', err)
      setError('Võrguühenduse viga')
    } finally {
      setLoading(false)
    }
  }


  const loadOmnivaCredentials = async () => {
    try {
      // Fetch Omniva settings from localStorage or API
      const omnivaSettings = localStorage.getItem('omnivaSettings')
      
      if (omnivaSettings) {
        const parsedSettings = JSON.parse(omnivaSettings)
        setOmnivaFormData({
          customer_code: parsedSettings.customer_code || '',
          username: parsedSettings.username || '',
          password: '', // Don't show actual password, just placeholder
          test_mode: parsedSettings.test_mode || false, 
          price: omnivaSettings?.price || '3.99',
          active: parsedSettings.active || true
        })
      }
    } catch (error) {
      console.error('Error loading Omniva settings:', error)
    }
  }

  const loadOmnivaShippingSettings = async () => {
    try {
      const { data, error } = await shippingSettingsService.getOmnivaShippingSettings()
      
      if (error) {
        console.error('Error loading Omniva shipping settings:', error)
        return
      }
      
      setOmnivaShippingSettings(data)
      
      if (data) {
        setOmnivaShippingFormData({
          id: data.id,
          price: data.price.toString(),
          currency: data.currency,
          active: data.active
        })
      }
    } catch (err) {
      console.error('Error in loadOmnivaShippingSettings:', err)
    }
  }

  const handleMaksekeskusInputChange = (e) => {
    const { name, value, type, checked } = e.target
    const newValue = type === 'checkbox' ? checked : value
    
    setMaksekeskusFormData(prev => ({
      ...prev,
      [name]: newValue
    }))
    
    // Track modified fields for text inputs
    if (type !== 'checkbox' && ['shop_id', 'api_secret_key', 'api_open_key'].includes(name)) {
      setMaksekeskusModifiedFields(prev => ({
        ...prev,
        [name]: true
      }))
    }
    
    // Clear messages when user starts typing
    if (error) setError('')
    if (success) setSuccess('')
  }

  const handleOmnivaInputChange = (e) => {
    const { name, value, type, checked } = e.target
    const newValue = type === 'checkbox' ? checked : value
    
    setOmnivaFormData(prev => ({
      ...prev,
      [name]: newValue
    }))
    
    // Track modified fields for text inputs
    if (type !== 'checkbox' && ['customer_code', 'username', 'password'].includes(name)) {
      setOmnivaModifiedFields(prev => ({
        ...prev,
        [name]: true
      }))
    }
    
    // Clear messages when user starts typing
    if (error) setError('')
    if (success) setSuccess('')
  }

  const handleOmnivaShippingInputChange = (e) => {
    const { name, value, type, checked } = e.target
    const newValue = type === 'checkbox' ? checked : value
    
    setOmnivaShippingFormData(prev => ({
      ...prev,
      [name]: newValue
    }))
    
    // Clear messages when user starts typing
    if (error) setError('')
    if (success) setSuccess('')
  }

  const handleMaksekeskusSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    setError('')
    setSuccess('')

    try {
      // Prepare data for update, only including modified fields
      const updateData = {
        id: maksekeskusFormData.id,
        test_mode: maksekeskusFormData.test_mode,
        active: maksekeskusFormData.active
      }
      
      // Only include text fields that have been modified
      if (maksekeskusModifiedFields.shop_id) {
        updateData.shop_id = maksekeskusFormData.shop_id
      }
      
      if (maksekeskusModifiedFields.api_secret_key && maksekeskusFormData.api_secret_key) {
        updateData.api_secret_key = maksekeskusFormData.api_secret_key
      }
      
      if (maksekeskusModifiedFields.api_open_key && maksekeskusFormData.api_open_key) {
        updateData.api_open_key = maksekeskusFormData.api_open_key
      }
      
      // If this is a new config (no ID), include all required fields
      if (!maksekeskusFormData.id) {
        if (!maksekeskusFormData.shop_id || !maksekeskusFormData.api_secret_key || !maksekeskusFormData.api_open_key) {
          setError('Kõik väljad on kohustuslikud uue konfiguratsiooni loomisel')
          setSaving(false)
          return
        }
        
        // For new configs, include all required fields
        updateData.shop_id = maksekeskusFormData.shop_id
        updateData.api_secret_key = maksekeskusFormData.api_secret_key
        updateData.api_open_key = maksekeskusFormData.api_open_key
      }
      
      const { data, error } = await maksekeskusConfigService.upsertMaksekeskusConfig(updateData)
      
      if (error) {
        setError(error.message)
      } else {
        setSuccess('Maksekeskuse seaded edukalt salvestatud!')
        
        // Reset modified fields tracking
        setMaksekeskusModifiedFields({
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

  const handleOmnivaShippingSubmit = async (e) => {
    e.preventDefault()
    setSavingOmnivaSettings(true)
    setError('')
    setSuccess('')

    try {
      // Validate price
      const price = parseFloat(omnivaShippingFormData.price)
      if (isNaN(price) || price <= 0) {
        setError('Hind peab olema positiivne number')
        setSavingOmnivaSettings(false)
        return
      }

      let result
      if (omnivaShippingSettings?.id) {
        // Update existing settings
        result = await shippingSettingsService.updateOmnivaSettings(
          omnivaShippingSettings.id,
          {
            price,
            currency: omnivaShippingFormData.currency,
            active: omnivaShippingFormData.active
        )
      } else {
        // Create new settings
        result = await shippingSettingsService.createOmnivaShippingSettings({
          price,
          currency: omnivaShippingFormData.currency,
          active: omnivaShippingFormData.active
        })
      }

      if (result.error) {
        setError(result.error.message)
      } else {
        setSuccess('Omniva tarnehind edukalt salvestatud!')
        setOmnivaShippingSettings(result.data)
        setTimeout(() => setSuccess(''), 3000)
      }
    } catch (err) {
      setError('Võrguühenduse viga')
    } finally {
      setSavingOmnivaSettings(false)
    }
  }

  const handleOmnivaSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    setError('')
    setSuccess('')

    try { 
      // Validate required fields for new config
      if (!omnivaFormData.customer_code || !omnivaFormData.username || 
          (omnivaModifiedFields.password && !omnivaFormData.password)) {
        setError('Kõik väljad on kohustuslikud')
        setSaving(false)
        return
      }

      // Save shipping price to database
      if (omnivaModifiedFields.price) {
        const priceValue = parseFloat(omnivaFormData.price)
        if (isNaN(priceValue) || priceValue <= 0) {
          setError('Hind peab olema positiivne number')
          setSaving(false)
          return
        }

        if (omnivaSettings?.id) {
          await shippingSettingsService.updateOmnivaShippingSettings(omnivaSettings.id, {
            price: priceValue,
            active: omnivaFormData.active
          })
        } else {
          await shippingSettingsService.createOmnivaShippingSettings({
            price: priceValue,
            active: omnivaFormData.active
          })
        }
      }

      // Store in localStorage (in a real app, this would be stored in the database)
      const settingsToSave = {
        customer_code: omnivaFormData.customer_code,
        username: omnivaFormData.username,
        // Only include password if it was modified
        ...(omnivaModifiedFields.password && { password: '********' }), // Store masked password
        test_mode: omnivaFormData.test_mode,
        active: omnivaFormData.active,
        price: omnivaFormData.price
      }

      localStorage.setItem('omnivaSettings', JSON.stringify(settingsToSave))
      
      setSuccess('Omniva seaded edukalt salvestatud!')
      setTimeout(() => setSuccess(''), 3000)
      
      // Reset modified fields
      setOmnivaModifiedFields({ customer_code: false, username: false, password: false, price: false })
    } catch (err) {
      setError('Seadete salvestamine ebaõnnestus: ' + err.message)
    } finally {
      setSaving(false)
    }
  }

  const handleShippingPriceSubmit = async (e) => {
    e.preventDefault()
    
    if (!omnivaShippingSettings?.id) {
      setError('Omniva shipping settings not found')
      return
    }
    
    const price = parseFloat(shippingPrice)
    if (isNaN(price) || price <= 0) {
      setError('Please enter a valid price greater than 0')
      return
    }
    
    setSaving(true)
    setError('')
    setSuccess('')
    
    try {
      const { data, error } = await shippingSettingsService.updateOmnivaShippingPrice(
        omnivaShippingSettings.id,
        price
      )
      
      if (error) {
        setError(error.message)
      } else {
        setSuccess('Omniva shipping price updated successfully!')
        setOmnivaShippingSettings(data)
        setTimeout(() => setSuccess(''), 3000)
      }
    } catch (err) {
      setError('Network error occurred')
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
        <div className="settings-header">
          <div>
            <h1>Maksete ja tarne seaded</h1>
            <p>Hallake maksete ja tarne seadistusi</p>
          </div>
          <Link to="/admin/dashboard" className="back-link">
            ← Tagasi töölauale
          </Link>
        </div>

        {error && (
          <div className="alert alert-error">
            <div className="alert-icon">⚠️</div>
            <div className="alert-content">
              <h4>Viga</h4>
              <p>{error}</p>
            </div>
          </div>
        )}

        {success && (
          <div className="alert alert-success">
            <div className="alert-icon">✅</div>
            <div className="alert-content">
              <h4>Õnnestus</h4>
              <p>{success}</p>
            </div>
          </div>
        )}

        {/* Tabs navigation */}
        <div className="settings-tabs">
          <button 
            className={`tab-button ${activeTab === 'maksekeskus' ? 'active' : ''}`}
            onClick={() => setActiveTab('maksekeskus')}
          >
            <span className="tab-icon">💳</span>
            <span>Maksekeskus</span>
          </button>
          <button 
            className={`tab-button ${activeTab === 'omniva' ? 'active' : ''}`}
            onClick={() => setActiveTab('omniva')}
          >
            <span className="tab-icon">📦</span>
            <span>Omniva</span>
          </button>
        </div>

        <div className="settings-content">
          {/* Maksekeskus Settings */}
          <div 
            className={`settings-card ${activeTab === 'maksekeskus' ? '' : 'hidden'}`}
          >
            <h2>Maksekeskuse API seaded</h2>
            
            {config ? (
              <>
                <div className="config-summary">
                  <div className="config-status-card">
                    <div className="status-header">
                      <h3>Maksekeskuse staatus</h3>
                      <span className={`status-badge ${config.active ? 'status-active' : 'status-inactive'}`}>
                        {config.active ? 'Aktiivne' : 'Mitteaktiivne'}
                      </span>
                    </div>
                    <div className="status-body">
                      <div className="status-row">
                        <span className="status-label">Testrežiim:</span>
                        <span className={`status-indicator ${config.test_mode ? 'status-test' : 'status-live'}`}>
                          {config.test_mode ? 'Sees (Testimine)' : 'Väljas (Live)'}
                        </span>
                      </div>
                      <div className="status-row">
                        <span className="status-label">Viimati uuendatud:</span>
                        <span className="status-value">
                          {new Date(config.updated_at).toLocaleString('et-EE')}
                        </span>
                      </div>
                    </div>
                    <div className="status-actions">
                      <button 
                        onClick={handleToggleActive}
                        disabled={saving}
                        className="btn btn-secondary"
                      >
                        {config.active ? 'Deaktiveeri' : 'Aktiveeri'}
                      </button>
                      <button 
                        onClick={handleToggleTestMode}
                        disabled={saving}
                        className={`btn ${config.test_mode ? 'btn-warning' : 'btn-success'}`}
                      >
                        {config.test_mode ? 'Lülita testrežiim välja' : 'Lülita testrežiim sisse'}
                      </button>
                    </div>
                  </div>
                  
                  <div className="config-details-card">
                    <h3>API seaded</h3>
                    <div className="details-body">
                      <div className="details-row">
                        <span className="details-label">Shop ID:</span>
                        <span className="details-value">{config.shop_id}</span>
                      </div>
                      
                      <div className="details-row">
                        <span className="details-label">API Secret Key:</span>
                        <span className="details-value masked-value">{config.api_secret_key_masked}</span>
                      </div>
                      
                      <div className="details-row">
                        <span className="details-label">API Open Key:</span>
                        <span className="details-value masked-value">{config.api_open_key_masked}</span>
                      </div>
                    </div>
                </div>
              </div>
              </>
            ) : (
              <div className="no-config-card">
                <div className="no-config-icon">🔑</div>
                <h3>Maksekeskuse seaded puuduvad</h3>
                <p>Maksekeskuse konfiguratsiooni ei leitud. Palun lisage uus konfiguratsioon alloleva vormi abil.</p>
              </div>
            )}
            
            <div className="config-form-section">
              <h3 className="form-section-title">{config ? 'Muuda konfiguratsiooni' : 'Lisa uus konfiguratsioon'}</h3>
              
              <form onSubmit={handleMaksekeskusSubmit} className="config-form">
                <div className="form-group">
                  <label htmlFor="shop_id">Shop ID</label>
                  <input
                    type="text"
                    id="shop_id"
                    name="shop_id"
                    value={maksekeskusFormData.shop_id}
                    onChange={handleMaksekeskusInputChange}
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
                    value={maksekeskusFormData.api_secret_key}
                    onChange={handleMaksekeskusInputChange}
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
                    value={maksekeskusFormData.api_open_key}
                    onChange={handleMaksekeskusInputChange}
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
                      checked={maksekeskusFormData.test_mode}
                      onChange={handleMaksekeskusInputChange}
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
                      checked={maksekeskusFormData.active}
                      onChange={handleMaksekeskusInputChange}
                      className="form-checkbox"
                    />
                    <span>Aktiivne</span>
                  </label>
                  <small className="form-hint">
                    Ainult üks konfiguratsioon saab olla korraga aktiivne.
                  </small>
                </div>
                
                <div className="form-actions">
                  {config && (
                    <button 
                      type="button"
                      onClick={() => {
                        setMaksekeskusFormData({
                          id: config.id,
                          shop_id: config.shop_id || '',
                          api_secret_key: '',
                          api_open_key: '',
                          test_mode: config.test_mode || false,
                          active: config.active || true
                        });
                        setMaksekeskusModifiedFields({
                          shop_id: false,
                          api_secret_key: false,
                          api_open_key: false
                        });
                      }}
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
                    {saving ? 'Salvestamine...' : (config ? 'Uuenda seadeid' : 'Lisa konfiguratsioon')}
                  </button>
                </div>
              </form>
            </div>
          </div>
          
          <div className={`settings-card ${activeTab === 'maksekeskus' ? '' : 'hidden'}`}>
            <h2>Maksekeskuse info</h2>
            
            <div className="info-cards">
              <div className="info-card">
                <div className="info-card-header">
                  <div className="info-card-icon">💳</div>
                  <h3>Kuidas Maksekeskus töötab?</h3>
                </div>
                <div className="info-card-body">
                  <p>Maksekeskus on Eesti maksevahendaja, mis võimaldab teie e-poes vastu võtta erinevaid makseid, sealhulgas pangalingid, krediitkaardid ja muud makseviisid.</p>
                  <a href="https://maksekeskus.ee" target="_blank" rel="noopener noreferrer" className="info-link">
                    Külasta Maksekeskuse veebilehte →
                  </a>
                </div>
              </div>
              
              <div className="info-card">
                <div className="info-card-header">
                  <div className="info-card-icon">🔧</div>
                  <h3>Seadistamine</h3>
                </div>
                <div className="info-card-body">
                  <ol className="numbered-list">
                    <li>Looge konto <a href="https://maksekeskus.ee" target="_blank" rel="noopener noreferrer">Maksekeskuse veebilehel</a>.</li>
                    <li>Saage oma Shop ID, API Secret Key ja API Open Key.</li>
                    <li>Sisestage need võtmed ülaltoodud vormis.</li>
                    <li>Testige makset testrežiimis.</li>
                    <li>Kui kõik töötab, lülitage testrežiim välja ja aktiveerige konfiguratsioon.</li>
                  </ol>
                </div>
              </div>
              
              <div className="info-card">
                <div className="info-card-header">
                  <div className="info-card-icon">🧪</div>
                  <h3>Testimine</h3>
                </div>
                <div className="info-card-body">
                  <p>Testrežiimis saate kasutada järgmisi testkaardiandmeid:</p>
                  <div className="test-card-info">
                    <div className="test-card-row">
                      <span className="test-card-label">Kaardi number:</span>
                      <code className="test-card-value">4111 1111 1111 1111</code>
                    </div>
                    <div className="test-card-row">
                      <span className="test-card-label">Kehtivusaeg:</span>
                      <span className="test-card-value">Suvaline tuleviku kuupäev</span>
                    </div>
                    <div className="test-card-row">
                      <span className="test-card-label">CVC:</span>
                      <span className="test-card-value">Suvaline 3-kohaline number</span>
                    </div>
                    <div className="test-card-row">
                      <span className="test-card-label">Kaardi omanik:</span>
                      <span className="test-card-value">Suvaline nimi</span>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="info-card warning">
                <div className="info-card-header">
                  <div className="info-card-icon">⚠️</div>
                  <h3>Tähelepanu</h3>
                </div>
                <div className="info-card-body">
                  <p>API võtmed on tundlikud andmed. Ärge jagage neid kellegi teisega.</p>
                  <p>Kui kahtlustate, et teie võtmed on lekkinud, looge Maksekeskuse kontol uued võtmed ja uuendage need siin.</p>
                </div>
              </div>
            </div>
          </div>

          {/* Omniva Settings */}
          <div className={`settings-card ${activeTab === 'omniva' ? '' : 'hidden'}`}>
            <h2>Omniva API seaded</h2>
            
            {/* Omniva Shipping Price Settings */}
            <div className="config-form-section">
              <h3 className="form-section-title">Omniva tarnehind</h3>
              
              <form onSubmit={handleOmnivaShippingSubmit} className="config-form">
                <div className="form-group">
                  <label htmlFor="price">Tarnehind</label>
                  <input
                    type="text"
                    id="price"
                    name="price"
                    value={omnivaShippingFormData.price}
                    onChange={handleOmnivaShippingInputChange}
                    className="form-input"
                    placeholder="Nt. 3.99"
                    required
                  />
                  <small className="form-hint">
                    Sisestage Omniva pakiautomaadi tarnehind (nt. 3.99)
                  </small>
                </div>
                
                <div className="form-group">
                  <label htmlFor="currency">Valuuta</label>
                  <select
                    id="currency"
                    name="currency"
                    value={omnivaShippingFormData.currency}
                    onChange={handleOmnivaShippingInputChange}
                    className="form-input"
                    required
                  >
                    <option value="EUR">EUR</option>
                  </select>
                </div>
                
                <div className="form-group checkbox-group">
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      name="active"
                      checked={omnivaShippingFormData.active}
                      onChange={handleOmnivaShippingInputChange}
                      className="form-checkbox"
                    />
                    <span>Aktiivne</span>
                  </label>
                </div>
                
                <div className="form-actions">
                  <button 
                    type="submit"
                    disabled={savingOmnivaSettings}
                    className="btn btn-primary"
                  >
                    {savingOmnivaSettings ? 'Salvestamine...' : 'Salvesta tarnehind'}
                  </button>
                </div>
              </form>
            </div>
            
            <div className="section-divider"></div>
            
            <div className="config-summary">
              <div className="config-status-card">
                <div className="status-header">
                  <h3>Omniva staatus</h3>
                  <span className={`status-badge ${omnivaFormData.active ? 'status-active' : 'status-inactive'}`}>
                    {omnivaFormData.active ? 'Aktiivne' : 'Mitteaktiivne'}
                  </span>
                </div>
                <div className="status-body">
                  <div className="status-row">
                    <span className="status-label">Testrežiim:</span>
                    <span className={`status-indicator ${omnivaFormData.test_mode ? 'status-test' : 'status-live'}`}>
                      {omnivaFormData.test_mode ? 'Sees (Testimine)' : 'Väljas (Live)'}
                    </span>
                  </div>
                  <div className="status-row">
                    <span className="status-label">Seadistus:</span>
                    <span className="status-value">
                      {omnivaFormData.customer_code ? 'Seadistatud' : 'Puudub'}
                    </span>
                  </div>
                </div>
              </div>
              
              <div className="config-info-card">
                <h3>Omniva tarne hind</h3>
                <form onSubmit={handleShippingPriceSubmit} className="shipping-price-form">
                  <div className="form-group">
                    <label htmlFor="shipping_price">Pakiautomaadi tarne hind</label>
                    <div className="price-input-wrapper">
                      <input
                        type="text"
                        id="shipping_price"
                        value={shippingPrice}
                        onChange={(e) => setShippingPrice(e.target.value)}
                        className="form-input price-input"
                        placeholder="3.99"
                        required
                      />
                      <span className="currency-symbol">€</span>
                    </div>
                    <small className="form-hint">
                      See hind kuvatakse klientidele ostukorvis Omniva pakiautomaadi valiku juures.
                    </small>
                  </div>
                  <button 
                    type="submit"
                    disabled={saving}
                    className="btn btn-primary shipping-price-btn"
                  >
                    {saving ? 'Salvestamine...' : 'Uuenda tarne hinda'}
                  </button>
                </form>
              </div>
            </div>
            
            <div className="config-form-section">
              <h3 className="form-section-title">Omniva API seadistus</h3>
              
              <form onSubmit={handleOmnivaSubmit} className="config-form">
                <div className="form-group">
                  <label htmlFor="customer_code">Kliendikood</label>
                  <input
                    type="text"
                    id="customer_code"
                    name="customer_code"
                    value={omnivaFormData.customer_code}
                    onChange={handleOmnivaInputChange}
                    className="form-input"
                    placeholder="Sisesta Omniva kliendikood"
                    required
                  />
                </div>
                
                <div className="form-group">
                  <label htmlFor="username">Kasutajanimi</label>
                  <input
                    type="text"
                    id="username"
                    name="username"
                    value={omnivaFormData.username}
                    onChange={handleOmnivaInputChange}
                    className="form-input"
                    placeholder="Sisesta Omniva kasutajanimi"
                    required
                  />
                </div>
                
                <div className="form-group">
                  <label htmlFor="password">Parool</label>
                  <input
                    type="password"
                    id="password"
                    name="password"
                    value={omnivaFormData.password}
                    onChange={handleOmnivaInputChange}
                    className="form-input"
                    placeholder="Sisesta Omniva parool"
                  />
                  <small className="form-hint">
                    {omnivaFormData.password === '' && localStorage.getItem('omnivaSettings') ? 
                      'Jäta tühjaks, et säilitada olemasolev parool' : 
                      'Sisesta Omniva API parool'}
                  </small>
                </div>
                
                <div className="form-group">
                  <label htmlFor="price">Tarnehind (€)</label>
                  <input
                    type="text"
                    id="price"
                    name="price"
                    value={omnivaFormData.price}
                    onChange={handleOmnivaInputChange}
                    className="form-input"
                    placeholder="Sisesta tarnehind (nt. 3.99)"
                    required
                  />
                  <small className="form-hint">
                    Tarnehind kuvatakse kliendile ostukorvis ja tellimuse vormistamisel
                      'Sisesta Omniva API parool'}
                  </small>
                </div>
                
                <div className="form-group checkbox-group">
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      name="test_mode"
                      checked={omnivaFormData.test_mode}
                      onChange={handleOmnivaInputChange}
                      className="form-checkbox"
                    />
                    <span>Testrežiim</span>
                  </label>
                  <small className="form-hint">
                    Testrežiimis ei toimu päris saadetiste registreerimist. Kasutage seda ainult testimiseks.
                  </small>
                </div>
                
                <div className="form-group checkbox-group">
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      name="active"
                      checked={omnivaFormData.active}
                      onChange={handleOmnivaInputChange}
                      className="form-checkbox"
                    />
                    <span>Aktiivne</span>
                  </label>
                </div>
                
                <div className="form-actions">
                  <button 
                    type="button"
                    onClick={() => {
                      loadOmnivaSettings();
                      setOmnivaModifiedFields({
                        customer_code: false,
                        username: false,
                        password: false
                      });
                    }}
                    className="btn btn-secondary"
                  >
                    Tühista
                  </button>
                  <button 
                    type="submit"
                    disabled={saving}
                    className="btn btn-primary"
                  >
                    {saving ? 'Salvestamine...' : 'Salvesta Omniva seaded'}
                  </button>
                </div>
              </form>
            </div>
            
            <div className="info-cards">
              <div className="info-card">
                <div className="info-card-header">
                  <div className="info-card-icon">📦</div>
                  <h3>Omniva seadistamine</h3>
                </div>
                <div className="info-card-body">
                  <p>Omniva API seadistamiseks on vaja kliendikood, kasutajanimi ja parool, mille saate Omniva klienditeenindusest.</p>
                  <p>Kui teil pole veel Omniva kontot, võtke ühendust Omniva klienditeenindusega telefonil 661 6616 või e-posti aadressil info@omniva.ee.</p>
                  <a href="https://www.omniva.ee/ari" target="_blank" rel="noopener noreferrer" className="info-link">
                    Külasta Omniva ärikliendi lehte →
                  </a>
                </div>
              </div>
              
              <div className="info-card">
                <div className="info-card-header">
                  <div className="info-card-icon">🔄</div>
                  <h3>Kuidas see töötab?</h3>
                </div>
                <div className="info-card-body">
                  <ol className="numbered-list">
                    <li>Klient valib ostukorvis Omniva pakiautomaadi.</li>
                    <li>Pärast makse tegemist registreeritakse saadetis automaatselt Omniva süsteemis.</li>
                    <li>Klient saab e-kirja jälgimisnumbriga.</li>
                    <li>Tellimuste lehel näete saadetise staatust ja jälgimisnumbrit.</li>
                  </ol>
                </div>
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

        .settings-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 32px;
          padding-bottom: 16px;
          border-bottom: 1px solid #e9ecef;
        }

        .settings-header h1 {
          font-family: var(--font-heading);
          color: var(--color-ultramarine);
          margin-bottom: 8px;
        }

        .settings-header p {
          color: #666;
          font-size: 1rem;
          margin: 0;
        }
        
        .back-link {
          display: inline-flex;
          align-items: center;
          padding: 8px 16px;
          background-color: #f8f9fa;
          border-radius: 4px;
          color: var(--color-text);
          text-decoration: none;
          font-weight: 500;
          transition: all 0.2s ease;
        }
        
        .back-link:hover {
          background-color: #e9ecef;
          color: var(--color-ultramarine);
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

        .alert {
          display: flex;
          align-items: flex-start;
          padding: 16px;
          border-radius: 8px;
          margin-bottom: 24px;
          border: 1px solid transparent;
        }

        .alert-error {
          background-color: #fff5f5;
          border-color: #fed7d7;
          color: #c53030;
        }

        .alert-success {
          background-color: #f0fff4;
          border-color: #c6f6d5;
          color: #2f855a;
        }
        
        .alert-icon {
          flex-shrink: 0;
          margin-right: 12px;
          font-size: 1.25rem;
        }
        
        .alert-content h4 {
          margin: 0 0 4px 0;
          font-size: 1rem;
          font-weight: 600;
        }
        
        .alert-content p {
          margin: 0;
          font-size: 0.9rem;
        }

        .settings-tabs {
          display: flex;
          gap: 12px;
          margin-bottom: 32px;
          overflow-x: auto;
          padding-bottom: 4px;
        }

        .tab-button {
          display: flex;
          align-items: center;
          gap: 8px;
          background-color: #f8f9fa;
          border: 1px solid #e9ecef;
          padding: 12px 20px;
          border-radius: 8px;
          font-family: var(--font-heading);
          font-weight: 500;
          font-size: 1rem;
          color: var(--color-text);
          cursor: pointer;
          transition: all 0.2s ease;
        }
        
        .tab-icon {
          font-size: 1.25rem;
        }

        .tab-button:hover {
          background-color: #e9ecef;
          transform: translateY(-1px);
        }

        .tab-button.active {
          background-color: var(--color-ultramarine);
          color: var(--color-ultramarine);
          border-color: var(--color-ultramarine);
          color: white;
          box-shadow: 0 2px 8px rgba(47, 62, 156, 0.2);
        }

        .settings-content {
          display: grid;
          grid-template-columns: 1fr;
          gap: 32px;
        }

        .hidden {
          display: none;
        }

        .settings-card {
          background: white;
          border-radius: 8px;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
          padding: 24px;
          height: fit-content;
          margin-bottom: 32px;
        }

        .settings-card h2 {
          font-family: var(--font-heading);
          color: var(--color-ultramarine);
          margin-bottom: 32px;
          font-size: 1.25rem;
          position: relative;
          padding-bottom: 16px;
        }
        
        .settings-card h2:after {
          content: '';
          position: absolute;
          bottom: 0;
          left: 0;
          width: 60px;
          height: 3px;
          background-color: var(--color-ultramarine);
          border-radius: 3px;
        }

        .config-summary {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 24px;
          margin-bottom: 40px;
        }

        .config-status-card, 
        .config-details-card,
        .config-info-card {
          background-color: #f8f9fa;
          border-radius: 8px;
          padding: 20px;
          height: 100%;
        }

        .status-header, 
        .info-card-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 16px;
          padding-bottom: 12px;
          border-bottom: 1px solid #e9ecef;
        }

        .status-header h3,
        .info-card-header h3 {
          font-family: var(--font-heading);
          font-size: 1.1rem;
          color: var(--color-text);
          margin: 0;
        }

        .status-badge {
          padding: 6px 12px;
          border-radius: 20px;
          font-size: 0.8rem;
          font-weight: 500;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .status-active {
          background-color: #c6f6d5;
          color: #2f855a;
        }

        .status-inactive {
          background-color: #fed7d7;
          color: #c53030;
        }

        .status-test {
          background-color: #fefcbf;
          color: #744210;
        }

        .status-live {
          background-color: #bee3f8;
          color: #2b6cb0;
        }
        
        .status-body,
        .details-body {
          margin-bottom: 20px;
        }
        
        .status-row,
        .details-row {
          display: flex;
          justify-content: space-between;
          padding: 8px 0;
          border-bottom: 1px solid #e9ecef;
        }
        
        .status-row:last-child,
        .details-row:last-child {
          border-bottom: none;
        }
        
        .status-label,
        .details-label {
          font-weight: 500;
          color: #4a5568;
        }
        
        .status-value,
        .details-value {
          color: #2d3748;
        }
        
        .status-indicator {
          padding: 4px 8px;
          border-radius: 4px;
          font-size: 0.8rem;
          font-weight: 500;
        }
        
        .masked-value {
          font-family: monospace;
          letter-spacing: 1px;
        }
        
        .status-actions {
          display: flex;
          gap: 12px;
          justify-content: flex-end;
        }

        .no-config-card {
          background-color: #f8f9fa;
          border-radius: 8px;
          padding: 32px;
          text-align: center;
          margin-bottom: 32px;
        }
        
        .no-config-icon {
          font-size: 3rem;
          margin-bottom: 16px;
          color: #a0aec0;
        }
        
        .no-config-card h3 {
          font-family: var(--font-heading);
          color: var(--color-text);
          margin-bottom: 12px;
          font-size: 1.2rem;
        }
        
        .no-config-card p {
          color: #4a5568;
          max-width: 500px;
          margin: 0 auto;
        }

        .config-form-section {
          border-top: 1px solid #e9ecef;
          padding-top: 32px;
          margin-top: 16px;
        }

        .form-section-title {
          font-family: var(--font-heading);
          color: var(--color-text);
          margin-bottom: 24px;
          font-size: 1.2rem;
          font-weight: 500;
        }

        .config-form {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 24px;
          margin-bottom: 24px;
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
          grid-column: span 2;
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
          border: 1px solid #e2e8f0;
          border-radius: 8px 0 0 8px;
          font-family: var(--font-body);
          font-size: 1rem;
          transition: all 0.2s ease;
          background-color: white;
        }

        .price-input-wrapper {
          display: flex;
          align-items: stretch;
        }

        .currency-symbol {
          display: flex;
          align-items: center;
          justify-content: center;
          background-color: #f1f5f9;
          border: 1px solid #e2e8f0;
          border-left: none;
          border-radius: 0 8px 8px 0;
          padding: 0 12px;
          font-weight: 500;
          color: #64748b;
        }

        .shipping-price-form {
          margin-top: 16px;
        }

        .shipping-price-btn {
          margin-top: 16px;
        }

        .form-input:focus {
          outline: none;
          border-color: var(--color-ultramarine);
          box-shadow: 0 0 0 3px rgba(47, 62, 156, 0.1);
        }

        .form-input::placeholder {
          color: #a0aec0;
        }

        .form-hint {
          font-size: 0.8rem;
          color: #718096;
        }
        
        .section-divider {
          margin: 32px 0;
          border-top: 1px solid #e9ecef;
        }

        .form-actions {
          display: flex;
          justify-content: flex-end;
          gap: 12px;
          grid-column: span 2;
          margin-top: 12px;
        }

        .info-cards {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
          gap: 24px;
          margin-top: 32px;
        }

        .info-card {
          background-color: #f8f9fa;
          border-radius: 8px;
          overflow: hidden;
          transition: all 0.2s ease;
          height: 100%;
        }

        .info-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
        }

        .info-card.warning {
          background-color: #fffbeb;
          border: 1px solid #fef3c7;
        }

        .info-card-header {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 16px 20px;
          border-bottom: 1px solid #e9ecef;
        }

        .info-card-icon {
          font-size: 1.5rem;
          color: var(--color-ultramarine);
          flex-shrink: 0;
        }

        .info-card-header h3 {
          font-family: var(--font-heading);
          font-size: 1.1rem;
          color: var(--color-text);
          margin: 0;
        }

        .info-card-body {
          padding: 20px;
        }

        .info-card-body p {
          margin: 0 0 16px 0;
          font-size: 0.95rem;
          line-height: 1.6;
          color: #4a5568;
        }

        .info-card-body p:last-child {
          margin-bottom: 0;
        }

        .info-link {
          display: inline-block;
          color: var(--color-ultramarine);
          text-decoration: none;
          font-weight: 500;
          margin-top: 8px;
          transition: all 0.2s ease;
        }

        .info-link:hover {
          color: #1e40af;
          text-decoration: underline;
        }

        .numbered-list {
          padding-left: 24px;
          margin: 16px 0;
        }

        .numbered-list li {
          margin-bottom: 12px;
          font-size: 0.95rem;
          line-height: 1.5;
          color: #4a5568;
        }

        .numbered-list li:last-child {
          margin-bottom: 0;
        }

        .test-card-info {
          background-color: white;
          border-radius: 6px;
          padding: 16px;
          margin-top: 12px;
          border: 1px solid #e2e8f0;
        }

        .test-card-row {
          display: flex;
          justify-content: space-between;
          padding: 8px 0;
          border-bottom: 1px solid #f0f0f0;
        }

        .test-card-row:last-child {
          border-bottom: none;
        }

        .test-card-label {
          font-weight: 500;
          color: #4a5568;
        }

        .test-card-value {
          color: #2d3748;
        }

        code {
          background-color: #edf2f7;
          padding: 2px 6px;
          border-radius: 4px;
          font-family: monospace;
          font-size: 0.9rem;
        }

        .btn {
          padding: 10px 20px;
          border: none;
          border-radius: 8px;
          font-family: var(--font-body);
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s ease;
          font-size: 0.9rem;
          text-decoration: none;
          display: inline-block;
          text-align: center;
        }

        .btn:hover:not(:disabled) {
          transform: translateY(-1px);
          box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
        }

        .btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
          transform: none !important;
          box-shadow: none !important;
        }

        .btn-primary {
          background-color: var(--color-ultramarine);
          color: white;
          box-shadow: 0 2px 4px rgba(47, 62, 156, 0.2);
        }

        .btn-secondary {
          background-color: #e2e8f0;
          color: #4a5568;
        }
        
        .btn-success {
          background-color: #48bb78;
          color: white;
          box-shadow: 0 2px 4px rgba(72, 187, 120, 0.2);
        }
        
        .btn-warning {
          background-color: #ed8936;
          color: white;
          box-shadow: 0 2px 4px rgba(237, 137, 54, 0.2);
        }

        .btn-small {
          padding: 4px 8px;
          font-size: 0.8rem;
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        @media (max-width: 1024px) {
          .config-form {
            grid-template-columns: 1fr;
          }
          
          .config-summary {
            grid-template-columns: 1fr;
          }
          
          .info-cards {
            grid-template-columns: 1fr;
          }
        }

        @media (max-width: 768px) {
          .settings-header {
            flex-direction: column;
            align-items: flex-start;
            gap: 16px;
          }
          
          .back-link {
            align-self: flex-start;
          }
          
          .payment-settings-container {
            padding: 24px 16px;
          }

          .status-actions {
            flex-direction: column;
            gap: 8px;
          }

          .btn {
            width: 100%;
          }
        }
      `}</style>
    </AdminLayout>
  )
}

export default PaymentSettings