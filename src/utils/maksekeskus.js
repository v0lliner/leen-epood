/**
 * Maksekeskus payment gateway integration utility
 * This utility provides functions to interact with the Maksekeskus payment gateway
 * through our Supabase Edge Function.
 */

/**
 * Create a new payment transaction
 * @param {Object} orderData - Order data
 * @param {string} orderData.amount - Order amount (e.g. "10.00")
 * @param {string} orderData.currency - Order currency (e.g. "EUR")
 * @param {string} orderData.orderId - Order reference ID
 * @param {string} orderData.customerEmail - Customer email
 * @param {string} orderData.customerName - Customer name
 * @returns {Promise<Object>} Transaction data including transaction ID and payment URL
 */
export async function createTransaction(orderData) {
  try {
    const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/payment-gateway/create-transaction`;

    // The Edge Function will extract the client IP from request headers
    // No need to send it from the client side
    
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`
      },
      body: JSON.stringify(orderData)
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to create transaction: ${response.status} ${errorText}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error creating transaction:', error);
    throw error;
  }
}

/**
 * Initialize the Maksekeskus checkout process
 * @param {Object} transactionData - Transaction data from createTransaction
 * @param {Object} orderDetails - Additional order details
 * @returns {Promise<void>}
 */
export async function initializeCheckout(transactionData, orderDetails) {
  try {
    // Load the Maksekeskus checkout script if not already loaded
    if (!window.Maksekeskus) {
      await loadCheckoutScript();
    }
    
    // Initialize the checkout
    window.Maksekeskus.Checkout.initialize({
      key: transactionData.publishableKey,
      transaction: transactionData.transactionId,
      amount: orderDetails.amount,
      currency: orderDetails.currency,
      email: orderDetails.customerEmail,
      clientName: orderDetails.customerName,
      locale: 'et',
      name: 'Leen.ee',
      description: `Tellimus nr. ${orderDetails.orderId}`
    });
  } catch (error) {
    console.error('Error initializing checkout:', error);
    throw error;
  }
}

/**
 * Load the Maksekeskus checkout script
 * @returns {Promise<void>}
 */
function loadCheckoutScript() {
  return new Promise((resolve, reject) => {
    if (window.Maksekeskus) {
      resolve();
      return;
    }
    
    const script = document.createElement('script');
    script.src = 'https://payment.maksekeskus.ee/checkout/dist/checkout.js';
    script.async = true;
    script.onload = resolve;
    script.onerror = (e) => {
      console.error('Failed to load Maksekeskus checkout script:', e);
      reject(new Error('Failed to load Maksekeskus checkout script'));
    };
    document.head.appendChild(script);
  });
}

/**
 * Get bank payment methods for display
 * @returns {Array} Array of bank payment methods with logos
 */
export function getBankPaymentMethods() {
  return [
    { id: 'swedbank', name: 'Swedbank', logo: 'https://static.maksekeskus.ee/img/channel/lnd/swedbank.png' },
    { id: 'seb', name: 'SEB', logo: 'https://static.maksekeskus.ee/img/channel/lnd/seb.png' },
    { id: 'lhv', name: 'LHV', logo: 'https://static.maksekeskus.ee/img/channel/lnd/lhv.png' },
    { id: 'luminor', name: 'Luminor', logo: 'https://static.maksekeskus.ee/img/channel/lnd/luminor.png' },
    { id: 'coop', name: 'Coop Pank', logo: 'https://static.maksekeskus.ee/img/channel/lnd/coop.png' },
    { id: 'citadele', name: 'Citadele', logo: 'https://static.maksekeskus.ee/img/channel/lnd/citadele.png' },
    { id: 'revolut', name: 'Revolut', logo: 'https://static.maksekeskus.ee/img/channel/lnd/revolut.png' },
    { id: 'wise', name: 'Wise', logo: 'https://static.maksekeskus.ee/img/channel/lnd/wise.png' }
  ];
}

/**
 * Get bank payment methods for a specific country
 * @param {string} country - Country code (e.g. 'EE', 'LV', 'LT', 'FI')
 * @returns {Array} Array of bank payment methods for the specified country
 */
export function getBanksByCountry(country) {
  const banksByCountry = {
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
      { id: 'danske', name: 'Danske Bank', logo: 'https://static.maksekeskus.ee/img/channel/lnd/danske.png' },
      { id: 'handelsbanken', name: 'Handelsbanken', logo: 'https://static.maksekeskus.ee/img/channel/lnd/handelsbanken.png' },
      { id: 'alandsbanken', name: 'Ålandsbanken', logo: 'https://static.maksekeskus.ee/img/channel/lnd/alandsbanken.png' },
      { id: 'revolut-fi', name: 'Revolut', logo: 'https://static.maksekeskus.ee/img/channel/lnd/revolut.png' },
      { id: 'wise-fi', name: 'Wise', logo: 'https://static.maksekeskus.ee/img/channel/lnd/wise.png' }
    ]
  };
  
  return banksByCountry[country] || [];
}