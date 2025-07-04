import { MAKSEKESKUS_API, parsePriceToAmount } from '../maksekeskus-config';

/**
 * Fetch available payment methods
 * @param {number} amount - Order amount
 * @returns {Promise<Array>} Available payment methods
 */
export async function getPaymentMethods(amount) {
  try {
    const response = await fetch(`${MAKSEKESKUS_API.PAYMENT_METHODS}?amount=${amount}`);
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to fetch payment methods');
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
      ...item,
      price: parsePriceToAmount(item.price)
    }));
    
    // Calculate total
    const total = items.reduce((sum, item) => sum + (item.price * (item.quantity || 1)), 0);
    
    // Prepare request data
    const requestData = {
      orderData: {
        ...orderData,
        items,
        total
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
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to create payment');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error creating payment:', error);
    throw error;
  }
}