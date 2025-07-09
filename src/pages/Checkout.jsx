import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useCart } from '../context/CartContext';
import SEOHead from '../components/Layout/SEOHead';
import FadeInSection from '../components/UI/FadeInSection';
import { shippingSettingsService } from '../utils/supabase/shippingSettings';

const Checkout = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { items, getTotalPrice, clearCart } = useCart();
  
  // Form state
  const [formData, setFormData] = useState({
    email: '',
    firstName: '',
    lastName: '',
    phone: '',
    companyName: '',
    notes: '',
    country: 'estonia',
    deliveryMethod: 'pickup',
    omnivaParcelMachineId: '',
    omnivaParcelMachineName: '',
    bankCountry: 'estonia',
    bank: '',
    termsAccepted: false
  });
  
  // UI state
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [parcelMachines, setParcelMachines] = useState([]);
  const [loadingParcelMachines, setLoadingParcelMachines] = useState(false);
  const [parcelMachinesError, setParcelMachinesError] = useState('');
  const [omnivaShippingPrice, setOmnivaShippingPrice] = useState(0.1);
  const [loadingShippingPrice, setLoadingShippingPrice] = useState(true);
  const [omnivaShippingPrice, setOmnivaShippingPrice] = useState(3.99);
  const [loadingShippingPrice, setLoadingShippingPrice] = useState(true);
  
  // Banks data
  const banks = {
    estonia: [
      { id: 'swedbank', name: 'Swedbank', logo: '/assets/banks/placeholder.svg' },
      { id: 'seb', name: 'SEB', logo: '/assets/banks/placeholder.svg' },
      { id: 'lhv', name: 'LHV', logo: '/assets/banks/placeholder.svg' },
      { id: 'luminor', name: 'Luminor', logo: '/assets/banks/placeholder.svg' },
      { id: 'coop', name: 'Coop Pank', logo: '/assets/banks/placeholder.svg' },
      { id: 'citadele', name: 'Citadele', logo: '/assets/banks/placeholder.svg' },
      { id: 'n26', name: 'N26', logo: '/assets/banks/placeholder.svg' },
      { id: 'revolut', name: 'Revolut', logo: '/assets/banks/placeholder.svg' },
      { id: 'wise', name: 'Wise', logo: '/assets/banks/placeholder.svg' }
    ],
    latvia: [
      { id: 'swedbank', name: 'Swedbank', logo: '/assets/banks/placeholder.svg' },
      { id: 'seb', name: 'SEB', logo: '/assets/banks/placeholder.svg' },
      { id: 'citadele', name: 'Citadele', logo: '/assets/banks/placeholder.svg' }
    ],
    lithuania: [
      { id: 'swedbank', name: 'Swedbank', logo: '/assets/banks/placeholder.svg' },
      { id: 'seb', name: 'SEB', logo: '/assets/banks/placeholder.svg' },
      { id: 'luminor', name: 'Luminor', logo: '/assets/banks/placeholder.svg' }
    ],
    finland: [
      { id: 'nordea', name: 'Nordea', logo: '/assets/banks/placeholder.svg' },
      { id: 'osuuspankki', name: 'OP', logo: '/assets/banks/placeholder.svg' },
      { id: 'danskebank', name: 'Danske Bank', logo: '/assets/banks/placeholder.svg' }
    ]
  };

  // Load Omniva shipping price from database
  useEffect(() => {
    const loadShippingPrice = async () => {
      setLoadingShippingPrice(true);
      try {
        const { data, error } = await shippingSettingsService.getOmnivaShippingSettings();
        
        if (error) {
          console.error('Error loading Omniva shipping price:', error);
          // Keep default price if error
        } else if (data && data.price) {
          console.log('Loaded Omniva shipping price:', data.price);
          setOmnivaShippingPrice(parseFloat(data.price));
        }
      } catch (err) {
        console.error('Exception loading Omniva shipping price:', err);
        // Keep default price if exception
      } finally {
        setLoadingShippingPrice(false);
      }
    };
    
    loadShippingPrice();
  }, []);

  // Load Omniva shipping price from database
  useEffect(() => {
    const loadShippingPrice = async () => {
      setLoadingShippingPrice(true);
      try {
        const { data, error } = await shippingSettingsService.getOmnivaShippingSettings();
        
        if (error) {
          console.error('Error loading Omniva shipping price:', error);
          // Keep default price if error
        } else if (data && data.price) {
          console.log('Loaded Omniva shipping price:', data.price);
          setOmnivaShippingPrice(parseFloat(data.price));
        }
      } catch (err) {
        console.error('Exception loading Omniva shipping price:', err);
        // Keep default price if exception
      } finally {
        setLoadingShippingPrice(false);
      }
    };
    
    loadShippingPrice();
  }, []);

  // Load parcel machines when country or delivery method changes
  useEffect(() => {
    if (formData.deliveryMethod === 'omniva') {
      loadParcelMachines(formData.country);
    }
  }, [formData.country, formData.deliveryMethod]);

  // Redirect to shop if cart is empty
  useEffect(() => {
    if (items.length === 0) {
      navigate('/epood');
    }
  }, [items, navigate]);

  const loadParcelMachines = async (country) => {
    setLoadingParcelMachines(true);
    setParcelMachinesError('');
    
    try {
      const response = await fetch(`/php/get-omniva-parcel-machines.php?country=${country}`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.success) {
        setParcelMachines(data.parcelMachines || []);
      } else {
        setParcelMachinesError(data.error || 'Failed to load parcel machines');
        setParcelMachines([]);
      }
    } catch (error) {
      console.error('Error loading parcel machines:', error);
      setParcelMachinesError('Network error occurred');
      setParcelMachines([]);
    } finally {
      setLoadingParcelMachines(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    
    // Reset error when user types
    if (error) setError('');
    
    // Reset parcel machine selection when delivery method changes
    if (name === 'deliveryMethod' && value !== 'omniva') {
      setFormData(prev => ({
        ...prev,
        omnivaParcelMachineId: '',
        omnivaParcelMachineName: ''
      }));
    }
  };

  const handleParcelMachineChange = (e) => {
    const selectedId = e.target.value;
    const selectedMachine = parcelMachines.find(machine => machine.id === selectedId);
    
    setFormData(prev => ({
      ...prev,
      omnivaParcelMachineId: selectedId,
      omnivaParcelMachineName: selectedMachine ? selectedMachine.name : ''
    }));
  };

  const validateForm = () => {
    // Basic validation
    if (!formData.email || !formData.firstName || !formData.lastName || !formData.phone) {
      setError(t('checkout.error.required_fields'));
      return false;
    }
    
    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setError(t('checkout.error.invalid_email'));
      return false;
    }
    
    // Delivery method validation
    if (formData.deliveryMethod === 'omniva' && !formData.omnivaParcelMachineId) {
      setError(t('checkout.shipping.omniva.required'));
      return false;
    }
    
    // Bank selection validation
    if (!formData.bank) {
      setError('Palun valige pank');
      return false;
    }
    
    // Terms acceptance validation
    if (!formData.termsAccepted) {
      setError(t('checkout.terms.required'));
      return false;
    }
    
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setIsSubmitting(true);
    setError('');
    
    try {
      // Generate a unique reference for this order
      const reference = `ORD-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
      
      // Prepare payment data
      const paymentData = {
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        phone: formData.phone,
        reference: reference,
        amount: calculateTotalWithShipping(),
        paymentMethod: formData.bank,
        items: items.map(item => ({
          id: item.id,
          title: item.title,
          price: parseFloat(item.price.replace('€', '')),
          quantity: 1
        })),
        deliveryMethod: formData.deliveryMethod,
        omnivaParcelMachineId: formData.omnivaParcelMachineId,
        omnivaParcelMachineName: formData.omnivaParcelMachineName
      };
      
      // Call payment processing endpoint
      const response = await fetch('/php/process-payment.php', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(paymentData)
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result = await response.json();
      
      if (result.error) {
        throw new Error(result.error);
      }
      
      // Clear cart and redirect to payment URL
      clearCart();
      window.location.href = result.paymentUrl;
      
    } catch (error) {
      console.error('Payment processing error:', error);
      setError(error.message || t('checkout.error.network_error'));
      setIsSubmitting(false);
    }
  };

  const calculateTotalWithShipping = () => {
    const subtotal = getTotalPrice();
    let shippingCost = 0;
    
    if (formData.deliveryMethod === 'omniva') {
      shippingCost = omnivaShippingPrice;
    }
    
    return subtotal + shippingCost;
  };

  const formatPrice = (price) => {
    return price.toFixed(2).replace('.', ',') + '€';
  };

  // If cart is empty, don't render the component
  if (items.length === 0) {
    return null;
  }

  return (
    <>
      <SEOHead page="shop" />
      <main>
        <section className="section-large">
          <div className="container">
            <FadeInSection>
              <h1 className="text-center">{t('checkout.title')}</h1>
            </FadeInSection>

            <form onSubmit={handleSubmit} className="checkout-form">
              <div className="checkout-layout">
                {/* Left Column - Form */}
                <div className="checkout-main">
                  {/* Step 1: Order Summary */}
                  <div className="checkout-section">
                    <h2 className="section-title">1. Tellimuse kokkuvõte</h2>
                    <div className="order-items">
                      {items.map((item) => (
                        <div key={item.id} className="order-item">
                          <div className="item-image">
                            <img src={item.image} alt={item.title} />
                          </div>
                          <div className="item-details">
                            <h3 className="item-title">{item.title}</h3>
                            <div className="item-meta">
                              <span className="item-category">{item.category}</span>
                              {item.dimensions && (
                                <span className="item-dimensions">
                                  {item.dimensions.height && `${item.dimensions.height}×`}
                                  {item.dimensions.width && `${item.dimensions.width}×`}
                                  {item.dimensions.depth && `${item.dimensions.depth}`}cm
                                </span>
                              )}
                              <span className="item-quantity">1 tk</span>
                            </div>
                            <span className="item-price">{item.price}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Step 2: Delivery Method */}
                  <div className="checkout-section">
                    <h2 className="section-title">2. Tarneviis</h2>
                    
                    <div className="form-group">
                      <label>Riik</label>
                      <select
                        name="country"
                        value={formData.country}
                        onChange={handleInputChange}
                        className="form-input"
                      >
                        <option value="estonia">Eesti (Estonia)</option>
                        <option value="finland">Soome (Finland)</option>
                        <option value="latvia">Läti (Latvia)</option>
                        <option value="lithuania">Leedu (Lithuania)</option>
                      </select>
                    </div>
                    
                    <div className="delivery-options">
                      <label className="delivery-option">
                        <input
                          type="radio"
                          name="deliveryMethod"
                          value="pickup"
                          checked={formData.deliveryMethod === 'pickup'}
                          onChange={handleInputChange}
                        />
                        <div className="delivery-option-content">
                          <div className="delivery-option-header">
                            <span className="delivery-option-title">Tulen ise järele</span>
                            <span className="delivery-option-price">Tasuta</span>
                          </div>
                          <p className="delivery-option-description">
                            Jõeääre, Märjamaa, Märjamaa vald 78218
                          </p>
                        </div>
                      </label>
                      
                      <label className="delivery-option">
                        <input
                          type="radio"
                          name="deliveryMethod"
                          value="omniva"
                          checked={formData.deliveryMethod === 'omniva'}
                          onChange={handleInputChange}
                        />
                        <div className="delivery-option-content">
                          <div className="delivery-option-header">
                            <span className="delivery-option-title">Omniva pakiautomaati</span>
                            <span className="delivery-option-price">
                              {loadingShippingPrice ? 'Laadin...' : `${omnivaShippingPrice.toFixed(2).replace('.', ',')}€`}
                            </span>
                          </div>
                          <p className="delivery-option-description">
                            Toode saadetakse valitud pakiautomaati
                          </p>
                          
                          {formData.deliveryMethod === 'omniva' && (
                            <div className="parcel-machine-selector">
                              <label htmlFor="omnivaParcelMachineId">Vali pakiautomaat</label>
                              {loadingParcelMachines ? (
                                <div className="loading-text">Laadin pakiautomaate...</div>
                              ) : parcelMachinesError ? (
                                <div className="error-text">{parcelMachinesError}</div>
                              ) : parcelMachines.length === 0 ? (
                                <div className="info-text">Valitud riigis pole pakiautomaate saadaval</div>
                              ) : (
                                <select
                                  id="omnivaParcelMachineId"
                                  name="omnivaParcelMachineId"
                                  value={formData.omnivaParcelMachineId}
                                  onChange={handleParcelMachineChange}
                                  className="form-input"
                                >
                                  <option value="">Vali pakiautomaat...</option>
                                  {parcelMachines.map(machine => (
                                    <option key={machine.id} value={machine.id}>
                                      {machine.name} - {machine.address}
                                    </option>
                                  ))}
                                </select>
                              )}
                            </div>
                          )}
                        </div>
                      </label>
                    </div>
                  </div>

                  {/* Step 3: Customer Information */}
                  <div className="checkout-section">
                    <h2 className="section-title">3. Andmed</h2>
                    
                    <div className="form-row">
                      <div className="form-group">
                        <label htmlFor="email">E-post *</label>
                        <input
                          type="email"
                          id="email"
                          name="email"
                          value={formData.email}
                          onChange={handleInputChange}
                          className="form-input"
                          placeholder="teie@email.ee"
                          required
                        />
                      </div>
                    </div>
                    
                    <div className="form-row">
                      <div className="form-group">
                        <label htmlFor="firstName">Eesnimi *</label>
                        <input
                          type="text"
                          id="firstName"
                          name="firstName"
                          value={formData.firstName}
                          onChange={handleInputChange}
                          className="form-input"
                          placeholder="Eesnimi"
                          required
                        />
                      </div>
                      
                      <div className="form-group">
                        <label htmlFor="lastName">Perekonnanimi *</label>
                        <input
                          type="text"
                          id="lastName"
                          name="lastName"
                          value={formData.lastName}
                          onChange={handleInputChange}
                          className="form-input"
                          placeholder="Perekonnanimi"
                          required
                        />
                      </div>
                    </div>
                    
                    <div className="form-row">
                      <div className="form-group">
                        <label htmlFor="phone">Telefon *</label>
                        <input
                          type="tel"
                          id="phone"
                          name="phone"
                          value={formData.phone}
                          onChange={handleInputChange}
                          className="form-input"
                          placeholder="+372 5xxx xxxx"
                          required
                        />
                      </div>
                      
                      <div className="form-group">
                        <label htmlFor="companyName">Firma nimi (pole kohustuslik)</label>
                        <input
                          type="text"
                          id="companyName"
                          name="companyName"
                          value={formData.companyName}
                          onChange={handleInputChange}
                          className="form-input"
                          placeholder="Firma nimi"
                        />
                      </div>
                    </div>
                    
                    <div className="form-group">
                      <label htmlFor="notes">Märkused tellimuse kohta</label>
                      <textarea
                        id="notes"
                        name="notes"
                        value={formData.notes}
                        onChange={handleInputChange}
                        className="form-input"
                        placeholder="Soovid või märkused tellimuse kohta"
                        rows="3"
                      ></textarea>
                    </div>
                  </div>

                  {/* Step 4: Payment */}
                  <div className="checkout-section">
                    <h2 className="section-title">4. Vormista tellimus</h2>
                    
                    <div className="form-group">
                      <label>Vali panga riik</label>
                      <div className="bank-country-options">
                        <label className={`bank-country-option ${formData.bankCountry === 'estonia' ? 'active' : ''}`}>
                          <input
                            type="radio"
                            name="bankCountry"
                            value="estonia"
                            checked={formData.bankCountry === 'estonia'}
                            onChange={handleInputChange}
                          />
                          <span>Eesti</span>
                        </label>
                        
                        <label className={`bank-country-option ${formData.bankCountry === 'latvia' ? 'active' : ''}`}>
                          <input
                            type="radio"
                            name="bankCountry"
                            value="latvia"
                            checked={formData.bankCountry === 'latvia'}
                            onChange={handleInputChange}
                          />
                          <span>Läti</span>
                        </label>
                        
                        <label className={`bank-country-option ${formData.bankCountry === 'lithuania' ? 'active' : ''}`}>
                          <input
                            type="radio"
                            name="bankCountry"
                            value="lithuania"
                            checked={formData.bankCountry === 'lithuania'}
                            onChange={handleInputChange}
                          />
                          <span>Leedu</span>
                        </label>
                        
                        <label className={`bank-country-option ${formData.bankCountry === 'finland' ? 'active' : ''}`}>
                          <input
                            type="radio"
                            name="bankCountry"
                            value="finland"
                            checked={formData.bankCountry === 'finland'}
                            onChange={handleInputChange}
                          />
                          <span>Soome</span>
                        </label>
                      </div>
                    </div>
                    
                    <div className="form-group">
                      <label>Vali pank</label>
                      <div className="bank-options">
                        {banks[formData.bankCountry]?.map(bank => (
                          <label 
                            key={bank.id} 
                            className={`bank-option ${formData.bank === bank.id ? 'active' : ''}`}
                          >
                            <input
                              type="radio"
                              name="bank"
                              value={bank.id}
                              checked={formData.bank === bank.id}
                              onChange={handleInputChange}
                            />
                            <div className="bank-option-content">
                              <span className="bank-name">{bank.name}</span>
                              <span className="bank-check">✓</span>
                            </div>
                          </label>
                        ))}
                      </div>
                    </div>
                    
                    <div className="terms-acceptance">
                      <label className="terms-label">
                        <input
                          type="checkbox"
                          name="termsAccepted"
                          checked={formData.termsAccepted}
                          onChange={handleInputChange}
                          required
                        />
                        <span>
                          Nõustun <Link to="/muugitingimused" target="_blank" className="terms-link">müügitingimustega</Link>
                        </span>
                      </label>
                    </div>
                    
                    {error && (
                      <div className="error-message">
                        {error}
                      </div>
                    )}
                    
                    <button 
                      type="submit" 
                      className="checkout-button"
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? 'TÖÖTLEN...' : 'VORMISTA OST'}
                    </button>
                  </div>
                </div>

                {/* Right Column - Order Summary */}
                <div className="checkout-sidebar">
                  <div className="order-summary">
                    <h3 className="summary-title">Tellimuse kokkuvõte</h3>
                    
                    <div className="summary-row">
                      <span>Vahesumma</span>
                      <span>{formatPrice(getTotalPrice())}</span>
                    </div>
                    
                    <div className="summary-row">
                      <span>Tarne</span>
                      <span>
                        {formData.deliveryMethod === 'omniva' 
                          ? (loadingShippingPrice ? 'Laadin...' : formatPrice(omnivaShippingPrice)) 
                          : 'Tasuta'}
                          ? (loadingShippingPrice ? 'Laadin...' : formatPrice(omnivaShippingPrice)) 
                          : 'Tasuta'}
                      </span>
                    </div>
                    
                    <div className="summary-row total">
                      <span>Kokku</span>
                      <span>{formatPrice(calculateTotalWithShipping())}</span>
                    </div>
                    
                    <div className="summary-info">
                      <div className="info-item">
                        <span className="info-icon">🔒</span>
                        <span>Turvaline makse Maksekeskuse kaudu</span>
                      </div>
                      
                      <div className="info-item">
                        <span className="info-icon">🚚</span>
                        <span>Tarne 2-4 tööpäeva jooksul</span>
                      </div>
                      
                      <div className="info-item">
                        <span className="info-icon">💌</span>
                        <span>Iga tellimuse juurde käib isiklik märge</span>
                      </div>
                    </div>
                    
                    <div className="back-to-shop">
                      <Link to="/epood" className="back-link">← Tagasi poodi</Link>
                    </div>
                  </div>
                </div>
              </div>
            </form>
          </div>
        </section>
      </main>

      <style jsx>{`
        .checkout-form {
          margin-top: 48px;
        }

        .checkout-layout {
          display: grid;
          grid-template-columns: 1fr 320px;
          gap: 48px;
          align-items: start;
        }

        .checkout-main {
          display: flex;
          flex-direction: column;
          gap: 48px;
        }

        .checkout-section {
          background: white;
          border-radius: 8px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
          padding: 32px;
        }

        .section-title {
          font-family: var(--font-heading);
          font-size: 1.25rem;
          font-weight: 500;
          color: var(--color-ultramarine);
          margin-bottom: 24px;
          padding-bottom: 16px;
          border-bottom: 1px solid #f0f0f0;
        }

        /* Order Items */
        .order-items {
          display: flex;
          flex-direction: column;
          gap: 24px;
        }

        .order-item {
          display: flex;
          gap: 16px;
        }

        .item-image {
          width: 80px;
          height: 80px;
          border-radius: 4px;
          overflow: hidden;
          flex-shrink: 0;
        }

        .item-image img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .item-details {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .item-title {
          font-family: var(--font-heading);
          font-size: 1.125rem;
          font-weight: 400;
          color: var(--color-text);
          margin: 0;
        }

        .item-meta {
          display: flex;
          flex-wrap: wrap;
          gap: 12px;
          font-size: 0.875rem;
          color: #666;
        }

        .item-category {
          text-transform: capitalize;
        }

        .item-price {
          font-family: var(--font-heading);
          font-weight: 500;
          color: var(--color-ultramarine);
          margin-top: 8px;
        }

        /* Form Styles */
        .form-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
          margin-bottom: 16px;
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
          font-size: 0.9rem;
          color: var(--color-text);
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
        }

        textarea.form-input {
          resize: vertical;
          min-height: 80px;
        }

        /* Delivery Options */
        .delivery-options {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .delivery-option {
          display: flex;
          align-items: flex-start;
          gap: 12px;
          padding: 16px;
          border: 1px solid #ddd;
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .delivery-option:hover {
          border-color: var(--color-ultramarine);
          background-color: rgba(47, 62, 156, 0.02);
        }

        .delivery-option input[type="radio"] {
          margin-top: 4px;
          accent-color: var(--color-ultramarine);
        }

        .delivery-option-content {
          flex: 1;
        }

        .delivery-option-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 8px;
        }

        .delivery-option-title {
          font-weight: 500;
          color: var(--color-text);
        }

        .delivery-option-price {
          font-family: var(--font-heading);
          font-weight: 500;
          color: var(--color-ultramarine);
        }

        .delivery-option-description {
          font-size: 0.9rem;
          color: #666;
          margin: 0;
        }

        .parcel-machine-selector {
          margin-top: 16px;
        }

        .loading-text, .error-text, .info-text {
          font-size: 0.9rem;
          padding: 8px 0;
          color: #666;
        }

        .error-text {
          color: #c33;
        }

        /* Bank Selection */
        .bank-country-options {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          margin-bottom: 16px;
        }

        .bank-country-option {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 8px 16px;
          border: 1px solid #ddd;
          border-radius: 4px;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .bank-country-option:hover {
          border-color: var(--color-ultramarine);
        }

        .bank-country-option.active {
          border-color: var(--color-ultramarine);
          background-color: rgba(47, 62, 156, 0.05);
        }

        .bank-country-option input[type="radio"] {
          display: none;
        }

        .bank-options {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
          gap: 16px;
        }

        .bank-option {
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: 16px;
          border: 1px solid #ddd;
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.2s ease;
          position: relative;
        }

        .bank-option:hover {
          border-color: var(--color-ultramarine);
        }

        .bank-option.active {
          border-color: var(--color-ultramarine);
          background-color: rgba(47, 62, 156, 0.05);
        }

        .bank-option input[type="radio"] {
          display: none;
        }

        .bank-option-content {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 8px;
        }

        .bank-name {
          font-size: 0.9rem;
          text-align: center;
        }

        .bank-check {
          position: absolute;
          top: 8px;
          right: 8px;
          width: 16px;
          height: 16px;
          background-color: var(--color-ultramarine);
          color: white;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 0.7rem;
          opacity: 0;
          transition: opacity 0.2s ease;
        }

        .bank-option.active .bank-check {
          opacity: 1;
        }

        /* Terms Acceptance */
        .terms-acceptance {
          margin: 24px 0;
        }

        .terms-label {
          display: flex;
          align-items: center;
          gap: 8px;
          cursor: pointer;
        }

        .terms-label input[type="checkbox"] {
          accent-color: var(--color-ultramarine);
        }

        .terms-link {
          color: var(--color-ultramarine);
          text-decoration: underline;
          transition: opacity 0.2s ease;
        }

        .terms-link:hover {
          opacity: 0.8;
        }

        /* Error Message */
        .error-message {
          background-color: #fee;
          color: #c33;
          padding: 12px 16px;
          border-radius: 4px;
          margin: 16px 0;
          font-size: 0.9rem;
        }

        /* Checkout Button */
        .checkout-button {
          width: 100%;
          padding: 16px;
          background-color: var(--color-ultramarine);
          color: white;
          border: none;
          border-radius: 4px;
          font-family: var(--font-body);
          font-weight: 600;
          font-size: 1rem;
          cursor: pointer;
          transition: opacity 0.2s ease;
          margin-top: 16px;
        }

        .checkout-button:hover:not(:disabled) {
          opacity: 0.9;
        }

        .checkout-button:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        /* Order Summary */
        .checkout-sidebar {
          position: sticky;
          top: 32px;
        }

        .order-summary {
          background: white;
          border-radius: 8px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
          padding: 24px;
        }

        .summary-title {
          font-family: var(--font-heading);
          font-size: 1.125rem;
          font-weight: 500;
          color: var(--color-ultramarine);
          margin-bottom: 24px;
          padding-bottom: 16px;
          border-bottom: 1px solid #f0f0f0;
        }

        .summary-row {
          display: flex;
          justify-content: space-between;
          padding: 12px 0;
          border-bottom: 1px solid #f0f0f0;
          font-size: 0.95rem;
        }

        .summary-row.total {
          font-family: var(--font-heading);
          font-weight: 500;
          font-size: 1.125rem;
          color: var(--color-ultramarine);
          border-bottom: none;
          padding-top: 16px;
        }

        .summary-info {
          margin-top: 24px;
          padding-top: 24px;
          border-top: 1px solid #f0f0f0;
        }

        .info-item {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 12px;
          font-size: 0.85rem;
          color: #666;
        }

        .info-item:last-child {
          margin-bottom: 0;
        }

        .info-icon {
          font-size: 1.25rem;
        }

        .back-to-shop {
          margin-top: 24px;
          padding-top: 24px;
          border-top: 1px solid #f0f0f0;
          text-align: center;
        }

        .back-link {
          color: var(--color-text);
          text-decoration: none;
          font-size: 0.9rem;
          transition: color 0.2s ease;
        }

        .back-link:hover {
          color: var(--color-ultramarine);
        }

        @media (max-width: 1024px) {
          .checkout-layout {
            grid-template-columns: 1fr 280px;
            gap: 32px;
          }
        }

        @media (max-width: 768px) {
          .checkout-layout {
            grid-template-columns: 1fr;
          }

          .checkout-sidebar {
            position: static;
            order: -1;
            margin-bottom: 32px;
          }

          .form-row {
            grid-template-columns: 1fr;
            gap: 16px;
          }

          .bank-options {
            grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
          }
        }
      `}</style>
    </>
  );
};

export default Checkout;