import { MAKSEKESKUS_API, parsePriceToAmount, MAKSEKESKUS_URLS } from '../maksekeskus-config';

/**
 * Fetch available payment methods
 * @param {number} amount - Order amount
 * @returns {Promise<Array>} Available payment methods
 */
export async function getPaymentMethods(amount) {
  try {
    const response = await fetch(`${MAKSEKESKUS_API.PAYMENT_METHODS}?amount=${amount}`);
    
    if (!response.ok) {
      const errorText = await response.text();
      let errorMessage = 'Failed to fetch payment methods';
      
      try {
        const errorData = JSON.parse(errorText);
        if (errorData.error) {
          errorMessage = errorData.error;
        }
      } catch (e) {
        // If the response is not JSON, use the text as the error message
        errorMessage = errorText || errorMessage;
      }
      
      throw new Error(errorMessage);
    }
    
    const data = await response.json();
    return data.methods || [];
  } catch (error) {
    console.error('Error fetching payment methods:', error);
    throw error;
  }
}

/**
 * Create payment transaction
 * @param {Object} orderData - Order data
 * @param {string} paymentMethod - Selected payment method
 * @returns {Promise<Object>} Transaction data
 */
export async function createPayment(orderData, paymentMethod) {
  try {
    // Prepare items with correct price format
    const items = orderData.items.map(item => ({
      id: item.id,
      title: item.title,
      price: parsePriceToAmount(item.price),
      quantity: 1
    }));
    
    // Calculate total
    const total = items.reduce((sum, item) => sum + (item.price * (item.quantity || 1)), 0);
    
    // Prepare request data
    const requestData = {
      orderData: {
        ...orderData,
        items,
        total,
        returnUrl: MAKSEKESKUS_URLS.RETURN_URL,
        cancelUrl: MAKSEKESKUS_URLS.CANCEL_URL,
        notificationUrl: MAKSEKESKUS_URLS.NOTIFICATION_URL
      },
      paymentMethod
    };
    
    const response = await fetch(MAKSEKESKUS_API.CREATE_PAYMENT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestData)
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      let errorMessage = 'Failed to create payment';
      
      try {
        const errorData = JSON.parse(errorText);
        if (errorData.error) {
          errorMessage = errorData.error;
        }
      } catch (e) {
        // If the response is not JSON, use the text as the error message
        errorMessage = errorText || errorMessage;
      }
      
      throw new Error(errorMessage);
    }
    
    const data = await response.json();
    
    return {
      success: data.success,
      payment_url: data.payment_url,
      transaction_id: data.transaction_id,
      error: data.error || null
    };
  } catch (error) {
    console.error('Error creating payment:', error);
    return {
      success: false,
      error: error.message
    };
  }
}