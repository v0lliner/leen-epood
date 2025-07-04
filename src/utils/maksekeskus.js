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
      throw new Error('Amount must be greater than zero');
    }
    
    // Format amount to ensure it uses dot as decimal separator
    const formattedAmount = amount.toString().replace(',', '.');
    
    console.log(`Requesting payment methods for amount: ${formattedAmount}€`);
    
    // Add a timestamp to prevent caching issues
    const timestamp = Date.now();
    const response = await fetch(`/api/payment-methods?amount=${formattedAmount}&_=${timestamp}`, {
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Payment methods API error (${response.status}):`, errorText);
      throw new Error(`Failed to load payment methods (${response.status})`);
    }
    
    let data;
    try {
      data = await response.json();
    } catch (parseError) {
      console.error('Failed to parse payment methods response:', parseError);
      throw new Error('Invalid response from payment service');
    }
    
    if (!data.success) {
      throw new Error(data.error || 'Failed to load payment methods');
    }
    
    if (!data.methods || !Array.isArray(data.methods)) {
      console.warn('Payment methods response has invalid format:', data);
      return [];
    }
    
    return data.methods || [];
  } catch (error) {
    console.error('Error loading payment methods:', error);
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
        total
      },
      paymentMethod
    };
    
    console.log('Creating payment with data:', {
      ...requestData,
      orderData: {
        ...requestData.orderData,
        // Don't log sensitive customer data
        name: '***',
        email: '***',
        phone: '***',
        address: '***'
      }
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
      console.error(`Create payment API error (${response.status}):`, errorText);
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