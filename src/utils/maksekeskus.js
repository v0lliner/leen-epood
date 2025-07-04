/**
 * Utility functions for Maksekeskus payment integration
 */

import { parsePriceToAmount } from '../maksekeskus-config';

/**
 * Load available payment methods
 * @param {number} amount - Order amount
 * @returns {Promise<Array>} Payment methods
 */
export async function loadPaymentMethods(amount) {
  try {
    if (!amount || amount <= 0) {
      console.error('Invalid amount provided:', amount, typeof amount);
      throw new Error('Amount must be greater than zero');
    }
    
    // Format amount to ensure it uses dot as decimal separator
    const formattedAmount = typeof amount === 'number' 
      ? amount.toFixed(2)
      : parseFloat(amount.toString().replace(',', '.')).toFixed(2);

    console.log(`Requesting payment methods for amount: ${formattedAmount}€ (${typeof formattedAmount})`);

    // Ensure amount is a valid number
    if (isNaN(parseFloat(formattedAmount))) {
      console.error('Amount is not a valid number after formatting:', formattedAmount);
      throw new Error(`Invalid amount format: ${formattedAmount}`);
    }
    
    // Add a timestamp to prevent caching issues
    const timestamp = Date.now();
    // Ensure we're sending a clean number without any currency symbols
    const cleanAmount = parseFloat(formattedAmount).toFixed(2);
    const url = `/api/payment-methods?amount=${encodeURIComponent(cleanAmount)}&_=${timestamp}`;
    console.log(`Fetching from: ${url}`);
    
    const response = await fetch(url, {
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`API error (${response.status}):`, errorText);
      throw new Error(`Failed to load payment methods (${response.status})`);
    }
    
    let data;
    try {
      data = await response.json();
    } catch (parseError) {
      console.error('Failed to parse response:', parseError.message);
      throw new Error('Invalid response from payment service');
    }
    
    if (!data.success) {
      console.error('API error:', data.error || 'Unknown error');
      if (data.debug) {
        console.log('Debug info:', data.debug);
      }
      throw new Error(data.error || 'Payment service unavailable');
    }
    
    if (!data.methods || !Array.isArray(data.methods)) {
      console.warn('Invalid response format:', JSON.stringify(data).substring(0, 100));
      return [];
    }
    
    return data.methods || [];
  } catch (error) {
    console.error('Error loading payment methods:', error.message || error);
    throw error;
  }
}

/**
 * Create a payment transaction
 * @param {Object} orderData - Order data
 * @param {string} paymentMethod - Selected payment method
 * @returns {Promise<Object>} Transaction data
 */
export async function createPayment(orderData, paymentMethod) {
  try {
    // Prepare items with correct price format
    const items = orderData.items.map(item => ({
      id: item.id,
      title: item.title || '',
      price: typeof item.price === 'number' ? item.price : parsePriceToAmount(item.price),
      quantity: item.quantity || 1
    }));
    
    // Calculate total
    const total = items.reduce((sum, item) => {
      const price = typeof item.price === 'number' ? item.price : parsePriceToAmount(item.price);
      const quantity = item.quantity || 1;
      return sum + (price * quantity);
    }, 0);
    
    // Prepare request data
    const requestData = {
      orderData: {
        ...orderData, 
        items,
        total
      },
      paymentMethod
    };
    
    console.log('Creating payment with data:', {
      ...requestData,
      // Only log non-sensitive data
      total: requestData.orderData.total,
      items: requestData.orderData.items.length,
      paymentMethod: requestData.paymentMethod
    });
    
    // Send request to API
    const response = await fetch('/api/create-payment', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      },
      body: JSON.stringify(requestData)
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Create payment API error (${response.status}):`, errorText.substring(0, 200));
      throw new Error(`Failed to create payment (${response.status})`);
    }
    
    let data;
    try {
      data = await response.json();
    } catch (parseError) {
      console.error('Failed to parse create payment response:', parseError);
      throw new Error('Invalid response from payment service');
    }
    
    if (!data.success) {
      throw new Error(data.error || 'Failed to create payment');
    }
    
    console.log('Payment created successfully:', {
      transaction_id: data.transaction_id,
      payment_url: data.payment_url ? 'Available' : 'Missing'
    });
    
    return {
      success: true,
      payment_url: data.payment_url,
      transaction_id: data.transaction_id,
      error: null
    };
  } catch (error) {
    console.error('Error creating payment:', error);
    return {
      success: false,
      error: error.message
    };
  }
}