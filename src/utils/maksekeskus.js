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
      console.warn('Invalid amount provided:', amount, typeof amount);
      // Use a minimum amount to avoid validation errors
      amount = 0.01;
    }
    
    // Format amount to ensure it uses dot as decimal separator
    let formattedAmount = typeof amount === 'number' 
      ? amount.toFixed(2)
      : parseFloat(amount.toString().replace(',', '.')).toFixed(2);

    console.log(`Requesting payment methods for amount: ${formattedAmount}€`);

    // Ensure amount is a valid number with 2 decimal places
    amount = parseFloat(formattedAmount);
    
    // Add a timestamp to prevent caching issues
    const timestamp = Date.now();
    const url = `/api/payment-methods?amount=${encodeURIComponent(formattedAmount)}&_=${timestamp}`;
    
    const response = await fetch(url, {
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
      }
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`API error (${response.status}):`, errorText);
      throw new Error(`Failed to load payment methods (${response.status})`);
    }
    
    const data = await response.json();
    
    if (!data.success) {
      console.error('API error:', data.error || 'Unknown error');
      throw new Error(data.error || 'Payment service unavailable');
    }
    
    if (!data.methods || !Array.isArray(data.methods)) {
      console.warn('Invalid response format:', data);
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
      total: requestData.orderData.total,
      items: requestData.orderData.items.length,
      paymentMethod: requestData.paymentMethod
    });
    
    // Send request to API
    const response = await fetch(`/api/create-payment`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache'
      }
      body: JSON.stringify(requestData)
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Create payment API error (${response.status}):`, errorText);
      throw new Error(`Failed to create payment (${response.status})`);
    }
    
    const data = await response.json();
    
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