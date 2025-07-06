import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useNavigate } from 'react-router-dom';
import SEOHead from '../components/Layout/SEOHead';
import FadeInSection from '../components/UI/FadeInSection';
import { useCart } from '../context/CartContext';
import { formatPrice, parsePriceToAmount } from '../utils/formatPrice';

const Checkout = () => {
  const { t, i18n } = useTranslation();
  const { items, getTotalPrice } = useCart();
  const navigate = useNavigate();
  
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState('');
  const [totalPrice, setTotalPrice] = useState('0.00');
  const [formattedTotalPrice, setFormattedTotalPrice] = useState('0.00');
  const [termsAgreed, setTermsAgreed] = useState(false);
  const [termsError, setTermsError] = useState('');
  const [deliveryMethod, setDeliveryMethod] = useState('');
  const [deliveryMethodError, setDeliveryMethodError] = useState('');
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('swedbank');
  const [selectedCountry, setSelectedCountry] = useState('Estonia');
  const [cardDetails, setCardDetails] = useState({
    cardNumber: '',
    expiryMonth: '',
    expiryYear: '',
    cvc: '',
    cardHolder: ''
  });
  
  const [formData, setFormData] = useState({
    email: '',
    firstName: '',
    lastName: '',
    phone: '',
    companyName: '',
    country: 'Estonia',
    notes: ''
  });

  // Update total price whenever cart items change
  useEffect(() => {
    const total = getTotalPrice();
    setTotalPrice(total.toFixed(2));
    setFormattedTotalPrice(total.toFixed(2) + '€');
  }, [items, getTotalPrice]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error when user types
    if (error) setError('');
  };
  
  const handleCardInputChange = (e) => {
    const { name, value } = e.target;
    setCardDetails(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error when user types
    if (error) setError('');
  };

  const handleTermsChange = (e) => {
    setTermsAgreed(e.target.checked);
    if (e.target.checked) {
      setTermsError('');
    }
  };

  const handleDeliveryMethodChange = (method) => {
    setDeliveryMethod(method);
    setDeliveryMethodError('');
  };

  const handlePaymentMethodSelection = (method) => {
    // Clear any previous errors when changing payment method
    setError('');
    setSelectedPaymentMethod(method);
  };

  const handleCountryChange = (e) => {
    const country = e.target.value;
    setSelectedCountry(country);
    setFormData(prev => ({
      ...prev,
      country: country
    }));
    // Reset selected payment method when country changes
    setSelectedPaymentMethod('');
  };
  
  // Function to tokenize card details using Maksekeskus SDK
  const tokenizeCardDetails = async () => {
    try {
      // Validate card details
      if (!cardDetails.cardNumber || !cardDetails.expiryMonth || 
          !cardDetails.expiryYear || !cardDetails.cvc || !cardDetails.cardHolder) {
        throw new Error('Palun täitke kõik kaardi andmed');
      }
      
      // Check if Maksekeskus SDK is loaded
      if (!window.Maksekeskus) {
        throw new Error('Maksekeskuse SDK ei ole laaditud');
      }
      
      // Initialize Maksekeskus SDK
      const mk = new window.Maksekeskus({
        shopId: '4e2bed9a-aa24-4b87-801b-56c31c535d36',
        testMode: false // Set to false for production
      });
      
      // Tokenize card details
      const token = await mk.tokenizeCard({
        cardNumber: cardDetails.cardNumber.replace(/\s/g, ''),
        expiryMonth: cardDetails.expiryMonth,
        expiryYear: cardDetails.expiryYear,
        cvc: cardDetails.cvc,
        cardHolder: cardDetails.cardHolder
      });
      
      return token;
    } catch (err) {
      throw new Error('Kaardi andmete töötlemine ebaõnnestus: ' + err.message);
    }
  };

  const validateForm = () => {
    // Required fields
    const requiredFields = ['email', 'firstName', 'lastName', 'phone'];
    const missingFields = requiredFields.filter(field => !formData[field].trim());
    
    if (missingFields.length > 0) {
      setError('Palun täitke kõik kohustuslikud väljad');
      return false;
    }
    
    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setError('Palun sisestage korrektne e-posti aadress');
      return false;
    }

    // Check delivery method
    if (!deliveryMethod) {
      setDeliveryMethodError('Palun valige tarneviis');
      return false;
    }

    // Check terms agreement
    if (!termsAgreed) {
      setTermsError(t('checkout.terms.required'));
      return false;
    }
    
    // Check if bank is selected
    if (!selectedPaymentMethod) {
      setError('Palun valige makseviis');
      return false;
    }
    
    return true;
  };

  // Function to generate a unique order reference
  const generateOrderReference = () => {
    const timestamp = Date.now();
    const randomStr = Math.random().toString(36).substring(2, 8);
    return `order-${timestamp}-${randomStr}`;
  };

  const handleCheckout = async () => {
    if (items.length === 0) {
      setError('Ostukorv on tühi');
      return;
    }

    if (!validateForm()) {
      return;
    }

    setIsProcessing(true);
    setError('');

    try {
      // For card payments, tokenize card details
      let cardToken = null;
      if (selectedPaymentMethod === 'card') {
        try {
          cardToken = await tokenizeCardDetails();
          console.log('Card tokenized successfully');
        } catch (tokenError) {
          setError(tokenError.message);
          setIsProcessing(false);
          return;
        }
      }
      
      // Calculate final amount including delivery cost
      const deliveryCost = deliveryMethod === 'parcel-machine' ? 3.99 : 0;
      const finalAmount = (parseFloat(totalPrice) + deliveryCost).toFixed(2);
      
      // Generate a unique order reference
      const orderReference = generateOrderReference();
      
      // Prepare order data to send to PHP backend
      const orderData = {
        amount: finalAmount,
        reference: orderReference,
        email: formData.email,
        firstName: formData.firstName,
        lastName: formData.lastName,
        phone: formData.phone,
        country: formData.country,
        paymentMethod: selectedPaymentMethod,
        items: items.map(item => ({
          id: item.id,
          title: item.title,
          price: parsePriceToAmount(item.price),
          quantity: 1
        }))
      };
      
      // Prepare the final request payload
      const payload = {
        ...orderData,
        // Only include token for card payments
        ...(selectedPaymentMethod === 'card' && cardToken ? { token: cardToken } : {})
      };
      
      console.log('Sending payment request with payload:', payload);
      
      // Call the PHP endpoint to create a transaction and payment
      const response = await fetch('/php/process-payment.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        // Try to parse error response as JSON
        let errorData;
        try {
          errorData = await response.json();
          throw new Error(errorData.error || `HTTP error! Status: ${response.status}`);
        } catch (jsonError) {
          // If response is not JSON, get the raw text
          const errorText = await response.text();
          console.error('Raw error response:', errorText);
          throw new Error(`HTTP error! Status: ${response.status}, Response is not valid JSON`);
        }
      }

      let data;
      try {
        data = await response.json();
        console.log('Payment response:', data);
      } catch (jsonError) {
        console.error('Error parsing response JSON:', jsonError);
        const rawResponse = await response.text();
        console.error('Raw response:', rawResponse);
        throw new Error('Invalid JSON response from server');
      }
      
      if (data.error) {
        throw new Error(data.error);
      }
      
      if (data.transactionId && data.paymentUrl) {
        // Store order info in localStorage before redirecting
        localStorage.setItem('pendingOrder', JSON.stringify({
          orderReference: orderReference,
          orderAmount: finalAmount,
          orderItems: items,
          customerEmail: formData.email,
          timestamp: Date.now()
        }));
        
        // Redirect to payment URL provided by Maksekeskus
        window.location.href = data.paymentUrl;
      } else {
        throw new Error('Maksekeskuse vastuses puudub tehingu ID või makse URL');
      }
    } catch (err) {
      console.error('Error during checkout:', err);
      setError('Tellimuse vormistamine ebaõnnestus: ' + (err.message || 'Tundmatu viga'));
      setIsProcessing(false);
    }
  };

  // Payment methods by country
  const paymentMethodsByCountry = {
    'Estonia': [
      { id: 'swedbank', name: 'Swedbank', logo: 'https://static.maksekeskus.ee/img/channel/lnd/swedbank.png' },
      { id: 'seb', name: 'SEB', logo: 'https://static.maksekeskus.ee/img/channel/lnd/seb.png' },
      { id: 'lhv', name: 'LHV', logo: 'https://static.maksekeskus.ee/img/channel/lnd/lhv.png' },
      { id: 'luminor', name: 'Luminor', logo: 'https://static.maksekeskus.ee/img/channel/lnd/luminor.png' },
      { id: 'coop', name: 'Coop Pank', logo: 'https://static.maksekeskus.ee/img/channel/lnd/coop.png' },
      { id: 'citadele', name: 'Citadele', logo: 'https://static.maksekeskus.ee/img/channel/lnd/citadele.png' },
      { id: 'n26', name: 'N26', logo: 'https://static.maksekeskus.ee/img/channel/lnd/n26.png' },
      { id: 'revolut', name: 'Revolut', logo: 'https://static.maksekeskus.ee/img/channel/lnd/revolut.png' },
      { id: 'wise', name: 'Wise', logo: 'https://static.maksekeskus.ee/img/channel/lnd/wise.png' }
    ],
    'Latvia': [
      { id: 'swedbank-lv', name: 'Swedbank', logo: 'https://static.maksekeskus.ee/img/channel/lnd/swedbank.png' },
      { id: 'seb-lv', name: 'SEB', logo: 'https://static.maksekeskus.ee/img/channel/lnd/seb.png' },
      { id: 'citadele-lv', name: 'Citadele', logo: 'https://static.maksekeskus.ee/img/channel/lnd/citadele.png' },
      { id: 'luminor-lv', name: 'Luminor', logo: 'https://static.maksekeskus.ee/img/channel/lnd/luminor.png' },
      { id: 'revolut-lv', name: 'Revolut', logo: 'https://static.maksekeskus.ee/img/channel/lnd/revolut.png' },
      { id: 'wise-lv', name: 'Wise', logo: 'https://static.maksekeskus.ee/img/channel/lnd/wise.png' }
    ],
    'Lithuania': [
      { id: 'swedbank-lt', name: 'Swedbank', logo: 'https://static.maksekeskus.ee/img/channel/lnd/swedbank.png' },
      { id: 'seb-lt', name: 'SEB', logo: 'https://static.maksekeskus.ee/img/channel/lnd/seb.png' },
      { id: 'luminor-lt', name: 'Luminor', logo: 'https://static.maksekeskus.ee/img/channel/lnd/luminor.png' },
      { id: 'citadele-lt', name: 'Citadele', logo: 'https://static.maksekeskus.ee/img/channel/lnd/citadele.png' },
      { id: 'revolut-lt', name: 'Revolut', logo: 'https://static.maksekeskus.ee/img/channel/lnd/revolut.png' },
      { id: 'wise-lt', name: 'Wise', logo: 'https://static.maksekeskus.ee/img/channel/lnd/wise.png' }
    ],
    'Finland': [
      { id: 'nordea', name: 'Nordea', logo: 'https://static.maksekeskus.ee/img/channel/lnd/nordea.png' },
      { id: 'op', name: 'OP', logo: 'https://static.maksekeskus.ee/img/channel/lnd/op.png' },
      { id: 'danske', name: 'Danske Bank', logo: 'https://static.maksekeskus.ee/img/channel/lnd/danske.png' }
    ]
  };

  if (items.length === 0) {
    return (
      <>
        <SEOHead page="shop" />
        <main>
          <section className="section-large">
            <div className="container">
              <FadeInSection>
                <div className="empty-cart">
                  <h1>{t('cart.empty')}</h1>
                  <Link to="/epood" className="btn btn-primary">
                    {t('cart.back_to_shop')}
                  </Link>
                </div>
              </FadeInSection>
            </div>
          </section>
        </main>

        <style jsx>{`
          .empty-cart {
            text-align: center;
            max-width: 600px;
            margin: 0 auto;
            padding: 64px 0;
          }

          .empty-cart h1 {
            margin-bottom: 32px;
            color: var(--color-text);
          }

          .btn-primary {
            display: inline-block;
            background-color: var(--color-ultramarine);
            color: white;
            padding: 12px 24px;
            border-radius: 4px;
            font-weight: 500;
            transition: opacity 0.2s ease;
          }

          .btn-primary:hover {
            opacity: 0.9;
          }
        `}</style>
      </>
    );
  }

  return (
    <>
      <SEOHead page="shop" />
      <main>
        <section className="section-large">
          <div className="container">
            <FadeInSection>
              <div className="checkout-header">
                <h1>{t('checkout.title')}</h1>
              </div>
            </FadeInSection>

            <div className="checkout-container">
              {/* Main Checkout Form */}
              <div className="checkout-main">
                <FadeInSection>
                  <div className="checkout-form-container">
                    {error && (
                      <div className="error-message">
                        {error}
                      </div>
                    )}
                    
                    <form className="checkout-form">
                      {/* Order Summary Section */}
                      <div className="form-section">
                        <h3>1. Tellimuse kokkuvõte</h3>
                        <div className="order-items">
                          {items.map((item) => (
                            <div key={item.id} className="order-item">
                              <div className="item-image">
                                {item.image ? (
                                  <img src={item.image} alt={item.title} />
                                ) : (
                                  <div className="no-image">
                                    <span>📷</span>
                                  </div>
                                )}
                              </div>
                              <div className="item-details">
                                <h4 className="item-title">{item.title}</h4>
                                <div className="item-meta">
                                  {item.category && (
                                    <span className="item-category">{item.category}</span>
                                  )}
                                  {item.dimensions && item.dimensions.height && (
                                    <span className="item-dimensions">
                                      {item.dimensions.height}×{item.dimensions.width}×{item.dimensions.depth}cm
                                    </span>
                                  )}
                                </div>
                                <div className="item-price-row">
                                  <span className="item-quantity">1 tk</span>
                                  <span className="item-price">{item.price}</span>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                      
                      {/* Delivery Method Section */}
                      <div className="form-section">
                        <h3>2. Tarneviis</h3>
                        
                        <div className="form-row">
                          <div className="form-group">
                            <label htmlFor="country">Riik</label>
                            <select
                              id="country"
                              name="country"
                              value={formData.country}
                              onChange={handleCountryChange}
                              className="form-input"
                            >
                              <option value="Estonia">Eesti (Estonia)</option>
                              <option value="Latvia">Läti (Latvia)</option>
                              <option value="Lithuania">Leedu (Lithuania)</option>
                              <option value="Finland">Soome (Finland)</option>
                            </select>
                          </div>
                        </div>
                        
                        <div className="delivery-methods">
                          <div 
                            className={`delivery-method ${deliveryMethod === 'self-pickup' ? 'selected' : ''}`}
                            onClick={() => handleDeliveryMethodChange('self-pickup')}
                          >
                            <div className="delivery-method-radio">
                              <div className={`radio-indicator ${deliveryMethod === 'self-pickup' ? 'active' : ''}`}></div>
                            </div>
                            <div className="delivery-method-content">
                              <h4>Tulen ise järele</h4>
                              <p>Jõeääre, Märjamaa, Märjamaa vald 78218</p>
                              <p className="delivery-price">Tasuta</p>
                            </div>
                          </div>
                          
                          <div 
                            className={`delivery-method ${deliveryMethod === 'parcel-machine' ? 'selected' : ''}`}
                            onClick={() => handleDeliveryMethodChange('parcel-machine')}
                          >
                            <div className="delivery-method-radio">
                              <div className={`radio-indicator ${deliveryMethod === 'parcel-machine' ? 'active' : ''}`}></div>
                            </div>
                            <div className="delivery-method-content">
                              <h4>Pakiautomaati</h4>
                              <p>Toode saadetakse valitud pakiautomaati</p>
                              <p className="delivery-price">3.99€</p>
                            </div>
                          </div>
                        </div>
                        
                        {deliveryMethodError && (
                          <div className="field-error">
                            {deliveryMethodError}
                          </div>
                        )}
                      </div>
                      
                      {/* Customer Information Section */}
                      <div className="form-section">
                        <h3>3. Andmed</h3>
                        
                        <div className="form-row">
                          <div className="form-group">
                            <label htmlFor="email">E-post *</label>
                            <input
                              type="email"
                              id="email"
                              name="email"
                              value={formData.email}
                              onChange={handleInputChange}
                              required
                              className="form-input"
                              placeholder="teie@email.ee"
                            />
                          </div>
                        </div>
                        
                        <div className="form-row two-columns">
                          <div className="form-group">
                            <label htmlFor="firstName">Eesnimi *</label>
                            <input
                              type="text"
                              id="firstName"
                              name="firstName"
                              value={formData.firstName}
                              onChange={handleInputChange}
                              required
                              className="form-input"
                              placeholder="Eesnimi"
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
                              required
                              className="form-input"
                              placeholder="Perekonnanimi"
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
                              required
                              className="form-input"
                              placeholder="+372 5xxx xxxx"
                            />
                          </div>
                        </div>
                        
                        <div className="form-row">
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
                        
                        <div className="form-row">
                          <div className="form-group">
                            <label htmlFor="notes">Märkused tellimuse kohta</label>
                            <textarea
                              id="notes"
                              name="notes"
                              value={formData.notes}
                              onChange={handleInputChange}
                              className="form-input"
                              rows="3"
                              placeholder="Soovid või märkused tellimuse kohta"
                            ></textarea>
                          </div>
                        </div>
                      </div>
                      
                      {/* Payment Section */}
                      <div className="form-section">
                        <h3>4. Vormista tellimus</h3>
                        
                        <div className="payment-section">
                          <div className="payment-country-selector">
                            <h4>Vali panga riik</h4>
                            <div className="country-buttons">
                              {Object.keys(paymentMethodsByCountry).map(country => (
                                <button
                                  key={country}
                                  type="button"
                                  className={`country-button ${selectedCountry === country ? 'active' : ''}`}
                                  onClick={() => setSelectedCountry(country)}
                                >
                                  {i18n.language === 'et' ? {
                                    'Estonia': 'Eesti',
                                    'Latvia': 'Läti',
                                    'Lithuania': 'Leedu',
                                    'Finland': 'Soome'
                                  }[country] : country}
                                </button>
                              ))}
                            </div>
                          </div>
                          
                          <div className="bank-selection">
                            <h4>Vali pank</h4>
                            <div className="bank-grid">
                              {paymentMethodsByCountry[selectedCountry].map(method => (
                                <div 
                                  key={method.id}
                                  className={`bank-option ${selectedPaymentMethod === method.id ? 'selected' : ''}`}
                                  onClick={() => handlePaymentMethodSelection(method.id)}
                                >
                                  <img src={method.logo} alt={method.name} className="bank-logo" />
                                  <div className="bank-name">{method.name}</div>
                                  <div className={`bank-check ${selectedPaymentMethod === method.id ? 'visible' : ''}`}>✓</div>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      
                      {/* Card Payment Fields - Only show when card is selected */}
                      {selectedPaymentMethod === 'card' && (
                        <div className="card-payment-section">
                          <h4>Sisestage kaardi andmed</h4>
                          <div className="card-fields">
                            <div className="form-group">
                              <label htmlFor="cardNumber">Kaardi number</label>
                              <input
                                type="text"
                                id="cardNumber"
                                name="cardNumber"
                                value={cardDetails.cardNumber}
                                onChange={handleCardInputChange}
                                className="form-input"
                                placeholder="1234 5678 9012 3456"
                                maxLength="19"
                              />
                            </div>
                            
                            <div className="card-expiry-cvc">
                              <div className="form-group">
                                <label htmlFor="expiryMonth">Kuu</label>
                                <input
                                  type="text"
                                  id="expiryMonth"
                                  name="expiryMonth"
                                  value={cardDetails.expiryMonth}
                                  onChange={handleCardInputChange}
                                  className="form-input"
                                  placeholder="MM"
                                  maxLength="2"
                                />
                              </div>
                              
                              <div className="form-group">
                                <label htmlFor="expiryYear">Aasta</label>
                                <input
                                  type="text"
                                  id="expiryYear"
                                  name="expiryYear"
                                  value={cardDetails.expiryYear}
                                  onChange={handleCardInputChange}
                                  className="form-input"
                                  placeholder="YY"
                                  maxLength="2"
                                />
                              </div>
                              
                              <div className="form-group">
                                <label htmlFor="cvc">CVC</label>
                                <input
                                  type="text"
                                  id="cvc"
                                  name="cvc"
                                  value={cardDetails.cvc}
                                  onChange={handleCardInputChange}
                                  className="form-input"
                                  placeholder="123"
                                  maxLength="4"
                                />
                              </div>
                            </div>
                            
                            <div className="form-group">
                              <label htmlFor="cardHolder">Kaardi omanik</label>
                              <input
                                type="text"
                                id="cardHolder"
                                name="cardHolder"
                                value={cardDetails.cardHolder}
                                onChange={handleCardInputChange}
                                className="form-input"
                                placeholder="EESNIMI PEREKONNANIMI"
                              />
                            </div>
                          </div>
                        </div>
                      )}
                        
                        {/* Terms Agreement */}
                        <div className="terms-agreement">
                          <label className="terms-checkbox-label">
                            <input
                              type="checkbox"
                              checked={termsAgreed}
                              onChange={handleTermsChange}
                              className="terms-checkbox"
                            />
                            <span className="terms-text">
                              <strong>{t('checkout.terms.agree')} <Link to="/muugitingimused" className="terms-link" onClick={scrollToTop}>{t('checkout.terms.terms_link')}</Link></strong>
                            </span>
                          </label>
                          {termsError && (
                            <div className="field-error">
                              {termsError}
                            </div>
                          )}
                        </div>
                        
                        <button 
                          type="button"
                          onClick={handleCheckout}
                          disabled={isProcessing}
                          className="checkout-button"
                        >
                          {isProcessing ? 'Töötlemine...' : 'VORMISTA OST'}
                        </button>
                      </div>
                    </form>
                  </div>
                </FadeInSection>
              </div>

              {/* Sidebar - Order Summary */}
              <FadeInSection className="checkout-sidebar">
                <div className="checkout-summary">
                  <h3>Tellimuse kokkuvõte</h3>
                  
                  <div className="summary-items">
                    {items.map((item) => (
                      <div key={item.id} className="summary-item">
                        <span className="summary-item-name">{item.title}</span>
                        <span className="summary-item-price">{item.price}</span>
                      </div>
                    ))}
                  </div>
                  
                  <div className="summary-divider"></div>
                  
                  <div className="summary-row">
                    <span>Vahesumma</span>
                    <span>{formattedTotalPrice}</span>
                  </div>
                  
                  <div className="summary-row">
                    <span>Tarne</span>
                    <span>{deliveryMethod === 'parcel-machine' ? '3.99€' : '0.00€'}</span>
                  </div>
                  
                  <div className="summary-total">
                    <span>Kokku</span>
                    <span>
                      {deliveryMethod === 'parcel-machine' 
                        ? (parseFloat(totalPrice) + 3.99).toFixed(2) + '€' 
                        : formattedTotalPrice}
                    </span>
                  </div>
                  
                  <div className="checkout-info">
                    <div className="info-item">
                      <div className="info-icon">🔒</div>
                      <p>{i18n.language === 'et' ? 'Turvaline tellimuse vormistamine' : 'Secure checkout'}</p>
                    </div>
                    <div className="info-item">
                      <div className="info-icon">🚚</div>
                      <p>{i18n.language === 'et' ? 'Tarne 2-4 tööpäeva jooksul' : 'Delivery within 2-4 business days'}</p>
                    </div>
                    <div className="info-item">
                      <div className="info-icon">💌</div>
                      <p>{i18n.language === 'et' ? 'Iga tellimuse juurde käib isiklik märge' : 'Each order includes a personal note'}</p>
                    </div>
                  </div>
                </div>
              </FadeInSection>
            </div>
          </div>
        </section>
      </main>

      <style jsx>{`
        .checkout-header {
          text-align: center;
          margin-bottom: 48px;
        }

        .checkout-header h1 {
          color: var(--color-ultramarine);
        }

        .checkout-container {
          display: grid;
          grid-template-columns: 1fr 380px;
          gap: 64px;
          align-items: start;
        }

        .checkout-main {
          min-height: 400px;
        }

        .checkout-form-container {
          background: white;
          border-radius: 8px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
          padding: 32px;
        }

        .error-message {
          background-color: #fee;
          color: #c33;
          padding: 12px 16px;
          border-radius: 4px;
          border: 1px solid #fcc;
          margin-bottom: 24px;
          font-size: 0.9rem;
        }

        .field-error {
          color: #c33;
          font-size: 0.85rem;
          margin-top: 8px;
        }

        .form-section {
          margin-bottom: 40px;
          padding-bottom: 40px;
          border-bottom: 1px solid #f0f0f0;
        }

        .form-section:last-child {
          margin-bottom: 0;
          padding-bottom: 0;
          border-bottom: none;
        }

        .form-section h3 {
          font-family: var(--font-heading);
          font-size: 1.25rem;
          font-weight: 500;
          margin-bottom: 24px;
          color: var(--color-ultramarine);
        }

        .form-row {
          margin-bottom: 16px;
        }

        .form-row:last-child {
          margin-bottom: 0;
        }

        .form-row.two-columns {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
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
          min-height: 80px;
        }

        .order-items {
          margin-bottom: 16px;
        }

        .order-item {
          display: flex;
          gap: 16px;
          padding: 16px 0;
          border-bottom: 1px solid #f0f0f0;
        }

        .order-item:last-child {
          border-bottom: none;
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

        .no-image {
          width: 100%;
          height: 100%;
          background-color: #f5f5f5;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #999;
          font-size: 1.5rem;
        }

        .item-details {
          flex: 1;
          display: flex;
          flex-direction: column;
        }

        .item-title {
          font-family: var(--font-heading);
          font-size: 1rem;
          font-weight: 500;
          margin-bottom: 8px;
          color: var(--color-text);
        }

        .item-meta {
          display: flex;
          flex-wrap: wrap;
          gap: 12px;
          margin-bottom: 8px;
        }

        .item-category {
          font-size: 0.8rem;
          color: #666;
          background-color: #f0f0f0;
          padding: 2px 8px;
          border-radius: 12px;
        }

        .item-dimensions {
          font-size: 0.8rem;
          color: #666;
        }

        .item-price-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-top: auto;
        }

        .item-quantity {
          font-size: 0.9rem;
          color: #666;
        }

        .item-price {
          font-family: var(--font-heading);
          font-weight: 500;
          color: var(--color-ultramarine);
          font-size: 1.125rem;
        }

        .delivery-methods {
          display: flex;
          flex-direction: column;
          gap: 16px;
          margin-bottom: 24px;
        }

        .delivery-method {
          display: flex;
          align-items: flex-start;
          gap: 16px;
          padding: 16px;
          border: 1px solid #ddd;
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .delivery-method:hover {
          border-color: var(--color-ultramarine);
          background-color: rgba(47, 62, 156, 0.05);
        }

        .delivery-method.selected {
          border-color: var(--color-ultramarine);
          background-color: rgba(47, 62, 156, 0.1);
        }

        .delivery-method-radio {
          width: 24px;
          height: 24px;
          border: 2px solid #ddd;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          margin-top: 4px;
          transition: all 0.2s ease;
        }

        .delivery-method.selected .delivery-method-radio {
          border-color: var(--color-ultramarine);
        }

        .radio-indicator {
          width: 12px;
          height: 12px;
          border-radius: 50%;
          background-color: transparent;
          transition: all 0.2s ease;
        }

        .radio-indicator.active {
          background-color: var(--color-ultramarine);
        }

        .delivery-method-content {
          flex: 1;
        }

        .delivery-method-content h4 {
          font-family: var(--font-heading);
          font-size: 1rem;
          font-weight: 500;
          margin-bottom: 4px;
          color: var(--color-text);
        }

        .delivery-method-content p {
          font-size: 0.9rem;
          color: #666;
          margin: 0;
          margin-bottom: 4px;
        }

        .delivery-method-content p:last-child {
          margin-bottom: 0;
        }

        .delivery-price {
          font-weight: 500;
          color: var(--color-ultramarine) !important;
        }

        .payment-section {
          margin-bottom: 24px;
        }

        .payment-country-selector {
          margin-bottom: 24px;
        }

        .payment-country-selector h4 {
          font-family: var(--font-heading);
          font-size: 1rem;
          font-weight: 500;
          margin-bottom: 16px;
          color: var(--color-text);
        }

        .country-buttons {
          display: flex;
          flex-wrap: wrap;
          gap: 12px;
        }

        .country-button {
          padding: 8px 16px;
          border: 1px solid #ddd;
          border-radius: 4px;
          background-color: white;
          color: var(--color-text);
          font-family: var(--font-body);
          font-size: 0.9rem;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .country-button:hover {
          border-color: var(--color-ultramarine);
        }

        .country-button.active {
          border-color: var(--color-ultramarine);
          background-color: var(--color-ultramarine);
          color: white;
        }

        .bank-selection h4 {
          font-family: var(--font-heading);
          font-size: 1rem;
          font-weight: 500;
          margin-bottom: 16px;
          color: var(--color-text);
        }

        .bank-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
          gap: 16px;
        }

        .bank-option {
          position: relative;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 8px;
          padding: 16px;
          border: 1px solid #ddd;
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .bank-option:hover {
          border-color: var(--color-ultramarine);
          background-color: rgba(47, 62, 156, 0.05);
        }

        .bank-option.selected {
          border-color: var(--color-ultramarine);
          background-color: rgba(47, 62, 156, 0.1);
        }

        .bank-logo {
          height: 32px;
          width: auto;
          object-fit: contain;
        }

        .bank-name {
          font-size: 0.8rem;
          color: var(--color-text);
          text-align: center;
        }

        .bank-check {
          position: absolute;
          top: 8px;
          right: 8px;
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background-color: var(--color-ultramarine);
          color: white;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 0.8rem;
          opacity: 0;
          transition: all 0.2s ease;
        }

        .bank-check.visible {
          opacity: 1;
        }

        .card-payment-section {
          margin: 24px 0;
          padding: 20px;
          border: 1px solid #e9ecef;
          border-radius: 8px;
          background: #fafbfc;
        }

        .card-payment-section h4 {
          font-family: var(--font-heading);
          color: var(--color-ultramarine);
          margin-bottom: 16px;
          font-size: 1rem;
        }

        .card-fields {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .card-expiry-cvc {
          display: grid;
          grid-template-columns: 1fr 1fr 1fr;
          gap: 12px;
        }

        .terms-agreement {
          margin: 24px 0;
        }

        .terms-checkbox-label {
          display: flex;
          align-items: flex-start;
          gap: 8px;
          cursor: pointer;
        }

        .terms-checkbox {
          margin-top: 3px;
          width: 18px;
          height: 18px;
          accent-color: var(--color-ultramarine);
        }

        .terms-text {
          font-size: 0.95rem;
          line-height: 1.4;
        }

        .terms-link {
          color: var(--color-ultramarine);
          text-decoration: underline;
          transition: opacity 0.2s ease;
        }

        .terms-link:hover {
          opacity: 0.8;
        }

        .terms-link {
          color: var(--color-ultramarine);
          text-decoration: underline;
          transition: opacity 0.2s ease;
        }

        .terms-link:hover {
          opacity: 0.8;
        }

        .checkout-button {
          width: 100%;
          padding: 16px 24px;
          background-color: var(--color-ultramarine);
          color: white;
          border: none;
          border-radius: 4px;
          font-family: var(--font-heading);
          font-weight: 600;
          font-size: 1.1rem;
          cursor: pointer;
          transition: all 0.2s ease;
          margin-top: 24px;
        }

        .checkout-button:hover:not(:disabled) {
          opacity: 0.9;
          transform: translateY(-1px);
        }

        .checkout-button:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .checkout-summary {
          background: white;
          border-radius: 8px;
          padding: 32px;
          box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
          position: sticky;
          top: 32px;
        }

        .checkout-summary h3 {
          font-family: var(--font-heading);
          font-size: 1.25rem;
          font-weight: 500;
          margin-bottom: 24px;
          color: var(--color-ultramarine);
        }

        .summary-items {
          margin-bottom: 24px;
        }

        .summary-item {
          display: flex;
          justify-content: space-between;
          margin-bottom: 12px;
        }

        .summary-item-name {
          font-size: 0.9rem;
          color: var(--color-text);
          max-width: 70%;
        }

        .summary-item-price {
          font-family: var(--font-heading);
          font-weight: 500;
          color: var(--color-text);
          font-size: 0.9rem;
        }

        .summary-divider {
          height: 1px;
          background-color: #f0f0f0;
          margin: 16px 0;
        }

        .summary-row {
          display: flex;
          justify-content: space-between;
          margin-bottom: 12px;
          font-size: 0.9rem;
          color: #666;
        }

        .summary-total {
          display: flex;
          justify-content: space-between;
          margin: 24px 0;
          font-family: var(--font-heading);
          font-weight: 600;
          font-size: 1.125rem;
          color: var(--color-text);
        }

        .checkout-info {
          margin-top: 24px;
          padding-top: 24px;
          border-top: 1px solid #f0f0f0;
        }

        .info-item {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 12px;
        }

        .info-item:last-child {
          margin-bottom: 0;
        }

        .info-icon {
          font-size: 1.25rem;
          color: var(--color-ultramarine);
        }

        .info-item p {
          font-size: 0.85rem;
          color: #666;
          margin: 0;
        }

        @media (max-width: 1024px) {
          .checkout-container {
            grid-template-columns: 1fr;
            gap: 48px;
          }

          .checkout-sidebar {
            order: -1;
          }

          .checkout-summary {
            position: static;
          }
        }

        @media (max-width: 768px) {
          .checkout-header {
            margin-bottom: 32px;
          }

          .checkout-form-container {
            padding: 24px;
          }

          .form-row.two-columns {
            grid-template-columns: 1fr;
            gap: 16px;
          }

          .order-item {
            flex-direction: column;
            gap: 12px;
          }

          .item-image {
            width: 100%;
            height: 160px;
          }

          .bank-grid {
            grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
            gap: 12px;
          }

          .bank-option {
            padding: 12px;
          }

          .bank-logo {
            height: 24px;
          }

          .bank-name {
            font-size: 0.7rem;
          }
          
          .card-expiry-cvc {
            grid-template-columns: 1fr 1fr;
            gap: 8px;
          }
          
          .card-expiry-cvc .form-group:last-child {
            grid-column: span 2;
          }
        }
      `}</style>
    </>
  );
};

export default Checkout;