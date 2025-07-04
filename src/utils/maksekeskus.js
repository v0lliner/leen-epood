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
      throw new Error('Invalid amount');
    }
    
    const response = await fetch(`/api/payment-methods?amount=${amount}`);
    
    if (!response.ok) {
      throw new Error(`HTTP error ${response.status}`);
    }
    
    const data = await response.json();
    
    if (!data.success) {
      throw new Error(data.error || 'Failed to load payment methods');
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
    
    // Send request to API
    const response = await fetch('/api/create-payment', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestData)
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error ${response.status}`);
    }
    
    const data = await response.json();
    
    if (!data.success) {
      throw new Error(data.error || 'Failed to create payment');
    }
    
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