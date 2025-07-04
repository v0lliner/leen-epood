/**
 * Utility functions for Maksekeskus payment integration
 */

import { parsePriceToAmount } from '../maksekeskus-config';

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
    
    // For now, we'll simulate a successful payment
    // In a real implementation, this would call the backend API
    
    // Simulate a successful payment
    return {
      success: true,
      payment_url: `/makse/korras?transaction=MOCK_${Date.now()}`,
      transaction_id: `MOCK_${Date.now()}`,
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