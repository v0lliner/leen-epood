import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import SEOHead from '../components/Layout/SEOHead';
import FadeInSection from '../components/UI/FadeInSection';
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
  
  // Omniva parcel machine states
  const [parcelMachines, setParcelMachines] = useState([]);
  const [loadingParcelMachines, setLoadingParcelMachines] = useState(false);
  const [selectedParcelMachine, setSelectedParcelMachine] = useState('');
  const [parcelMachineError, setParcelMachineError] = useState('');
  const [omnivaParcelMachines, setOmnivaParcelMachines] = useState([]);
  const [selectedOmnivaParcelMachine, setSelectedOmnivaParcelMachine] = useState(null);
  
  const [formData, setFormData] = useState({
    email: '',
    firstName: '',
    lastName: '',
    phone: '',
    companyName: '',
    country: 'Estonia',
    notes: ''
  });

  // Define country code mapping
  const countryCodeMap = {
    'Estonia': 'ee',
    'Latvia': 'lv',
    'Lithuania': 'lt',
    'Finland': 'fi'
  };

  // Update total price whenever cart items change
  useEffect(() => {
    const total = getTotalPrice();
    setTotalPrice(total.toFixed(2));
    setFormattedTotalPrice(total.toFixed(2) + '€');
  }, [items, getTotalPrice]);

  useEffect(() => {
    // If cart is empty, redirect to shop
    if (items.length === 0) {
      navigate('/epood');
    }
  }, [items, navigate]);

  // Fetch Omniva parcel machines when delivery method is set to 'omniva-parcel-machine'
  useEffect(() => {
    if (deliveryMethod === 'omniva-parcel-machine') {
      const fetchParcelMachines = async () => {
        setLoadingParcelMachines(true);
        setParcelMachineError('');
        setOmnivaParcelMachines([]);
        setSelectedOmnivaParcelMachine(null);
        
        try {
          // Get country code from the mapping
          const countryCode = countryCodeMap[selectedCountry] || 'ee';
          console.log('Fetching Omniva parcel machines for country:', selectedCountry, 'code:', countryCode);
          
          const url = `/php/get-omniva-parcel-machines.php?country=${countryCode}`;
          console.log('Fetch URL:', url);
          
          const response = await fetch(url);
          console.log('Omniva API response status:', response.status);
          
          // Log the raw response text for debugging
          const responseText = await response.text();
          console.log('Omniva API response text:', responseText);
          
          // Parse the response text back to JSON
          let data;
          try {
            data = JSON.parse(responseText);
          } catch (parseError) {
            console.error('Error parsing JSON response:', parseError);
            throw new Error('Invalid response format');
          }
          
          console.log('Parsed Omniva API response:', data);
          
          if (data.success && Array.isArray(data.parcelMachines)) {
            console.log('Successfully fetched', data.parcelMachines.length, 'parcel machines');
            setOmnivaParcelMachines(data.parcelMachines);
            
            // If there are parcel machines, select the first one by default
            if (data.parcelMachines.length > 0) {
              setSelectedOmnivaParcelMachine(data.parcelMachines[0]);
              console.log('Selected first parcel machine by default:', data.parcelMachines[0]);
            }
          } else {
            console.error('Invalid response format or no parcel machines returned:', data);
            setParcelMachineError(t('checkout.shipping.omniva.no_machines'));
          }
        } catch (error) {
          console.error('Error fetching Omniva parcel machines:', error);
          setParcelMachineError(t('checkout.shipping.omniva.fetch_error'));
        } finally {
          setLoadingParcelMachines(false);
        }
      };
      
      fetchParcelMachines();
    }
  }, [deliveryMethod, selectedCountry, t]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error when user types
    if (error) setError('');
  };
  
  // Function to scroll to top of page
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
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
    
    // Load parcel machines if Omniva is selected
    if (method === 'omniva-parcel-machine') {
      loadParcelMachines(formData.country);
    }
  };

  const handleParcelMachineChange = (e) => {
    const machineId = e.target.value;
    const machine = omnivaParcelMachines.find(m => m.id === machineId);
    console.log('Selected parcel machine:', machine);
    setSelectedOmnivaParcelMachine(machine || null);
    setSelectedParcelMachine(e.target.value);
    if (e.target.value) {
      setParcelMachineError('');
    }
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
    
    // If delivery method is parcel machine, reload parcel machines for new country
    if (deliveryMethod === 'omniva-parcel-machine') {
      loadParcelMachines(country);
    }
  };
  
  // Function to load Omniva parcel machines
  const loadParcelMachines = async (country) => {
    setLoadingParcelMachines(true);
    setParcelMachines([]);
    setSelectedParcelMachine('');
    
    try {
      // Convert country name to country code
      const countryMap = {
        'Estonia': 'ee',
        'Latvia': 'lv',
        'Lithuania': 'lt',
        'Finland': 'fi'
      };
      
      const countryCode = countryMap[country] || 'ee';
      
      const response = await fetch(`/php/get-omniva-parcel-machines.php?country=${countryCode}`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.success && data.parcelMachines) {
        setParcelMachines(data.parcelMachines);
      } else {
        throw new Error(data.error || 'Failed to load parcel machines');
      }
    } catch (error) {
      console.error('Error loading parcel machines:', error);
      setError('Pakiautomaatide laadimine ebaõnnestus: ' + error.message);
    } finally {
      setLoadingParcelMachines(false);
    }
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
    
    // Check parcel machine selection if Omniva is selected
    if (deliveryMethod === 'omniva-parcel-machine' && !selectedParcelMachine) {
      setParcelMachineError('Palun valige pakiautomaat');
      return false;
    }

    // Validate Omniva parcel machine selection if that delivery method is chosen
    if (deliveryMethod === 'omniva-parcel-machine' && !selectedOmnivaParcelMachine) {
      setError(t('checkout.shipping.omniva.required'));
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
      const deliveryCost = deliveryMethod === 'omniva-parcel-machine' ? 3.99 : 0;
      const finalAmount = (parseFloat(totalPrice) + deliveryCost).toFixed(2);
      
      // Generate a unique order reference
      const orderReference = generateOrderReference();
      
      // Get selected parcel machine name if applicable
      let omnivaParcelMachineId = null;
      let omnivaParcelMachineName = null;
      
      if (deliveryMethod === 'omniva-parcel-machine' && selectedParcelMachine) {
        omnivaParcelMachineId = selectedParcelMachine;
        const selectedMachine = parcelMachines.find(pm => pm.id === selectedParcelMachine);
        if (selectedMachine) {
          omnivaParcelMachineName = `${selectedMachine.name} (${selectedMachine.address})`;
        }
      }
      
      // Prepare merchant data with appropriate delivery information
      const merchantData = {
        customer_name: `${formData.firstName} ${formData.lastName}`,
        customer_email: formData.email,
        customer_phone: formData.phone,
        items: items.map(item => ({
          id: item.id,
          title: item.title,
          price: parseFloat(item.price.replace('€', '')),
          quantity: 1
        })),
        deliveryMethod: deliveryMethod,
        notes: formData.notes
      };

      // Add appropriate shipping address based on delivery method
      if (deliveryMethod === 'courier') {
        merchantData.shipping_address = formData.address;
        merchantData.shipping_city = formData.city;
        merchantData.shipping_postal_code = formData.postalCode;
        merchantData.shipping_country = selectedCountry;
      } else if (deliveryMethod === 'omniva-parcel-machine' && selectedOmnivaParcelMachine) {
        // Add Omniva parcel machine details
        merchantData.omnivaParcelMachineId = selectedOmnivaParcelMachine.id;
        merchantData.omnivaParcelMachineName = selectedOmnivaParcelMachine.name;
        merchantData.shipping_address = selectedOmnivaParcelMachine.address;
        merchantData.shipping_city = selectedOmnivaParcelMachine.city;
        merchantData.shipping_postal_code = ''; // Omniva doesn't provide postal codes
        merchantData.shipping_country = selectedCountry;
      }

      console.log('Merchant data for payment processing:', merchantData);
      
      // Prepare order data to send to PHP backend
      const orderData = {
        amount: finalAmount,
        reference: orderReference,
        email: formData.email,
        firstName: formData.firstName,
        lastName: formData.lastName,
        phone: formData.phone,
        country: selectedCountry, // Full country name
        countryCode: countryCodeMap[selectedCountry] || 'ee', // ISO country code
        paymentMethod: selectedPaymentMethod,
        deliveryMethod: deliveryMethod,
        omnivaParcelMachineId: omnivaParcelMachineId,
        omnivaParcelMachineName: omnivaParcelMachineName,
        items: items.map(item => ({
          id: item.id,
          title: item.title,
          price: parsePriceToAmount(item.price),
          quantity: 1
        })),
        // Include all merchant data
        ...merchantData,
        return_url: `${window.location.origin}/checkout/success`,
        cancel_url: `${window.location.origin}/checkout`
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
          customerName: `${formData.firstName} ${formData.lastName}`,
          customerPhone: formData.phone,
          omnivaParcelMachineId: omnivaParcelMachineId,
          omnivaParcelMachineName: omnivaParcelMachineName,
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
                          <button
                            type="button"
                            className={`delivery-method ${deliveryMethod === 'courier' ? 'active' : ''}`}
                            onClick={() => handleDeliveryMethodChange('courier')}
                          >
                            <img src="/icons/pickup.svg" alt="" className="delivery-icon" />
                            {t('checkout.shipping.courier.title')}
                          </button>
                          <button
                            type="button"
                            className={`delivery-method ${deliveryMethod === 'omniva-parcel-machine' ? 'active' : ''}`}
                            onClick={() => handleDeliveryMethodChange('omniva-parcel-machine')}
                          >
                            <img src="/icons/omniva-parcel-machine.svg" alt="" className="delivery-icon" />
                            {t('checkout.shipping.omniva.title')}
                          </button>
                          <button
                            type="button"
                            className={`delivery-method ${deliveryMethod === 'pickup' ? 'active' : ''}`}
                            onClick={() => handleDeliveryMethodChange('pickup')}
                          >
                            <img src="/icons/pickup.svg" alt="" className="delivery-icon" />
                            {t('checkout.pickup')}
                          </button>
                        </div>
                        
                        {deliveryMethodError && (
                          <div className="field-error">
                            {deliveryMethodError}
                          </div>
                        )}

                        {/* Courier address form */}
                        {deliveryMethod === 'courier' && (
                          <div className="address-form">
                            <div className="form-group">
                              <label htmlFor="address">{t('checkout.shipping.courier.address')}</label>
                              <input
                                type="text"
                                id="address"
                                name="address"
                                value={formData.address}
                                onChange={handleInputChange}
                                placeholder={t('checkout.shipping.courier.address_placeholder')}
                                className="form-input"
                                required={deliveryMethod === 'courier'}
                              />
                            </div>
                            <div className="form-row">
                              <div className="form-group">
                                <label htmlFor="city">{t('checkout.shipping.courier.city')}</label>
                                <input
                                  type="text"
                                  id="city"
                                  name="city"
                                  value={formData.city}
                                  onChange={handleInputChange}
                                  placeholder={t('checkout.shipping.courier.city_placeholder')}
                                  className="form-input"
                                  required={deliveryMethod === 'courier'}
                                />
                              </div>
                              <div className="form-group">
                                <label htmlFor="postalCode">{t('checkout.shipping.courier.postal_code')}</label>
                                <input
                                  type="text"
                                  id="postalCode"
                                  name="postalCode"
                                  value={formData.postalCode}
                                  onChange={handleInputChange}
                                  placeholder={t('checkout.shipping.courier.postal_code_placeholder')}
                                  className="form-input"
                                  required={deliveryMethod === 'courier'}
                                />
                              </div>
                            </div>
                            <div className="form-group">
                              <label htmlFor="country">{t('checkout.shipping.courier.country')}</label>
                              <select
                                id="country"
                                name="country"
                                value={selectedCountry}
                                onChange={(e) => setSelectedCountry(e.target.value)}
                                className="form-input"
                                required
                              >
                                <option value="Estonia">{t('checkout.shipping.address.countries.estonia')}</option>
                                <option value="Finland">{t('checkout.shipping.address.countries.finland')}</option>
                                <option value="Latvia">{t('checkout.shipping.address.countries.latvia')}</option>
                                <option value="Lithuania">{t('checkout.shipping.address.countries.lithuania')}</option>
                              </select>
                            </div>
                          </div>
                        )}

                        {deliveryMethod === 'omniva-parcel-machine' && (
                          <div className="parcel-machine-form">
                            <div className="form-group">
                              <label htmlFor="country">{t('checkout.shipping.courier.country')}</label>
                              <select
                                id="country"
                                name="country"
                                value={selectedCountry}
                                onChange={(e) => setSelectedCountry(e.target.value)}
                                className="form-input"
                                required
                              >
                                <option value="Estonia">{t('checkout.shipping.address.countries.estonia')}</option>
                                <option value="Finland">{t('checkout.shipping.address.countries.finland')}</option>
                                <option value="Latvia">{t('checkout.shipping.address.countries.latvia')}</option>
                                <option value="Lithuania">{t('checkout.shipping.address.countries.lithuania')}</option>
                              </select>
                            </div>
                            
                            <div className="form-group">
                              <label htmlFor="parcelMachine">{t('checkout.shipping.omniva.select_machine')}</label>
                              {loadingParcelMachines ? (
                                <div className="loading-parcel-machines">
                                  <div className="loading-spinner-small"></div>
                                  <span>{t('checkout.shipping.omniva.loading')}</span>
                                </div>
                              ) : parcelMachineError ? (
                                <div className="parcel-machine-error">
                                  {parcelMachineError}
                                </div>
                              ) : omnivaParcelMachines.length > 0 ? (
                                <select
                                  id="parcelMachine"
                                  name="parcelMachine"
                                  value={selectedOmnivaParcelMachine?.id || ''}
                                  onChange={handleParcelMachineChange}
                                  className="form-input"
                                  required={deliveryMethod === 'omniva-parcel-machine'}
                                >
                                  <option value="">{t('checkout.shipping.omniva.select_placeholder')}</option>
                                  {omnivaParcelMachines.map(machine => (
                                    <option key={machine.id} value={machine.id}>
                                      {machine.name} - {machine.address}
                                    </option>
                                  ))}
                                </select>
                              ) : (
                                <div className="no-parcel-machines">
                                  {t('checkout.shipping.omniva.no_machines')}
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                        
                        {/* Parcel machine selection */}
                        {deliveryMethod === 'omniva-parcel-machine' && (
                          <div className="parcel-machine-section">
                            <div className="form-group">
                              <label htmlFor="parcel-machine">Valige pakiautomaat</label>
                              {loadingParcelMachines ? (
                                <div className="loading-parcel-machines">
                                  <div className="loading-spinner-small"></div>
                                  <span>Laadin pakiautomaate...</span>
                                </div>
                              ) : (
                                <>
                                  <select
                                    id="parcel-machine"
                                    value={selectedParcelMachine}
                                    onChange={handleParcelMachineChange}
                                    className="form-input"
                                  >
                                    <option value="">Valige pakiautomaat</option>
                                    {parcelMachines.map(machine => (
                                      <option key={machine.id} value={machine.id}>
                                        {machine.name} ({machine.address})
                                      </option>
                                    ))}
                                  </select>
                                  {parcelMachineError && (
                                    <div className="field-error">
                                      {parcelMachineError}
                                    </div>
                                  )}
                                </>
                              )}
                            </div>
                          </div>
                        )}
                        
                        {deliveryMethod === 'pickup' && (
                          <div className="pickup-info">
                            <p>Jõeääre, Märjamaa, Märjamaa vald 78218</p>
                            <p>Palun võtke ühendust enne tulekut: +372 5xxx xxxx</p>
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
                  <div className="summary-card">
                    <div className="summary-header">
                      <h3>{t('checkout.summary.title')}</h3>
                    </div>
                    
                    <div className="summary-content">
                      <div className="summary-items">
                        {items.map((item) => (
                          <div key={item.id} className="summary-item">
                            <div className="item-info">
                              <h4>{item.title}</h4>
                              <p className="item-price">{item.price}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                      
                      <div className="summary-totals">
                        <div className="summary-row">
                          <span>{t('checkout.summary.subtotal')}</span>
                          <span>{getTotalPrice().toFixed(2)}€</span>
                        </div>
                        <div className="summary-row">
                          <span>{t('checkout.summary.shipping')}</span>
                          <span>
                            {deliveryMethod === 'pickup' 
                              ? '0.00€' 
                              : deliveryMethod === 'courier' 
                                ? t('checkout.shipping.courier.price')
                                : t('checkout.shipping.omniva.price')}
                          </span>
                        </div>
                        <div className="summary-row total">
                          <span>{t('checkout.summary.total')}</span>
                          <span>
                            {(getTotalPrice() + (deliveryMethod === 'pickup' 
                              ? 0 
                              : deliveryMethod === 'courier' 
                                ? parseFloat(t('checkout.shipping.courier.price').replace('€', '')) 
                                : parseFloat(t('checkout.shipping.omniva.price').replace('€', ''))
                              )).toFixed(2)}€
                          </span>
                        </div>
                      </div>
                      
                      <div className="terms-checkbox">
                        <label className="checkbox-label">
                          <input type="checkbox" checked={termsAgreed} onChange={(e) => setTermsAgreed(e.target.checked)} />
                          <span>{t('checkout.terms.agree')} <a href="/muugitingimused" target="_blank" rel="noopener noreferrer">{t('checkout.terms.terms_link')}</a></span>
                        </label>
                        {termsError && <div className="form-error">{termsError}</div>}
                      </div>
                      
                      <button 
                        type="submit" 
                        className="checkout-button"
                        disabled={isProcessing}
                      >
                        {isProcessing ? t('checkout.summary.processing') : t('checkout.summary.pay')}
                      </button>
                      
                      <div className="checkout-info">
                        <div className="info-item">
                          <span className="info-icon">🔒</span>
                          <span>{t('checkout.summary.info.secure')}</span>
                        </div>
                        <div className="info-item">
                          <span className="info-icon">🚚</span>
                          <span>{t('checkout.summary.info.shipping')}</span>
                        </div>
                        <div className="info-item">
                          <span className="info-icon">✉️</span>
                          <span>{t('checkout.summary.info.personal')}</span>
                        </div>
                      </div>
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
          gap: 16px;
          margin-bottom: 24px;
        }

        .delivery-method {
          flex: 1;
          padding: 16px;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          background: none;
          border: 1px solid #ddd;
          border-radius: 4px;
          cursor: pointer;
          transition: all 0.2s ease;
          font-family: var(--font-body);
          font-size: 0.9rem;
          color: var(--color-text);
        }

        .delivery-method:hover {
          border-color: var(--color-ultramarine);
        }

        .delivery-method.active {
          background-color: rgba(47, 62, 156, 0.1);
          border-color: var(--color-ultramarine);
        }
        
        .delivery-icon {
          width: 20px;
          height: 20px;
          flex-shrink: 0;
        }

        .address-form,
        .pickup-info,
        .parcel-machine-form {
          margin-top: 24px;
        }
        
        .parcel-machine-section {
          margin-top: 24px;
          padding: 16px;
          background-color: #f8f9fa;
          border-radius: 8px;
          border: 1px solid #e9ecef;
        }
        
        .loading-parcel-machines {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px;
          background-color: white;
          border-radius: 4px;
          border: 1px solid #ddd;
          color: #666;
        }
        
        .loading-spinner-small {
          width: 16px;
          height: 16px;
          border: 2px solid #f3f3f3;
          border-top: 2px solid var(--color-ultramarine);
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }

        .parcel-machine-error,
        .no-parcel-machines {
          padding: 12px;
          background: #fff5f5;
          border: 1px solid #fed7d7;
          border-radius: 4px;
          color: #c53030;
          margin-top: 8px;
        }

        .no-parcel-machines {
          background: #f8f9fa;
          border: 1px solid #e2e8f0;
          color: #666;
        }

        .pickup-info {
          padding: 16px;
          background: #f8f9fa;
          border-radius: 4px;
          border: 1px solid #e2e8f0;
        }

        .pickup-info p {
          margin: 0 0 8px 0;
          color: #666;
        }

        .pickup-info p:last-child {
          margin-bottom: 0;
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

          .delivery-methods {
            flex-direction: column;
            gap: 12px;
          }

          .delivery-method {
            padding: 12px;
            font-size: 0.9rem;
          }
          
          .delivery-icon {
            width: 16px;
            height: 16px;
          }

          .form-row {
            flex-direction: column;
            gap: 16px;
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