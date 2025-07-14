/**
 * Utility functions for Stripe integration
 */

/**
 * Creates a payment intent on the server
 * @param {Object} orderData - Order data including amount, currency, etc.
 * @returns {Promise<{clientSecret: string}>} - Client secret for the payment intent
 */
export const createPaymentIntent = async (orderData) => {
  try {
    // In a real implementation, this would call a serverless function
    // For now, we'll simulate a response for frontend development
    
    // Log the order data for debugging
    console.log('Creating payment intent for order:', orderData);
    
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 800));
    
    // Generate a fake client secret that looks like a real one
    // In production, this would come from your backend
    const fakeClientSecret = `pi_${Math.random().toString(36).substring(2, 15)}_secret_${Math.random().toString(36).substring(2, 15)}`;
    
    return {
      clientSecret: fakeClientSecret,
      // Include any other data your backend would return
    };
  } catch (error) {
    console.error('Error creating payment intent:', error);
    throw new Error('Failed to create payment intent');
  }
};

/**
 * Processes a successful payment
 * @param {Object} paymentIntent - The payment intent object from Stripe
 * @param {Object} orderData - Order data
 * @returns {Promise<Object>} - Processed order data
 */
export const processSuccessfulPayment = async (paymentIntent, orderData) => {
  try {
    // In a real implementation, this would update the order in your database
    console.log('Processing successful payment:', paymentIntent, orderData);
    
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    return {
      success: true,
      orderId: `order_${Math.random().toString(36).substring(2, 10)}`,
      paymentId: paymentIntent.id,
    };
  } catch (error) {
    console.error('Error processing payment:', error);
    throw new Error('Failed to process payment');
  }
};

/**
 * Handles a payment error
 * @param {Object} error - The error object from Stripe
 * @returns {Promise<Object>} - Error details
 */
export const handlePaymentError = async (error) => {
  // Log the error for debugging
  console.error('Payment error:', error);
  
  // Map Stripe error codes to user-friendly messages
  const errorMessages = {
    'card_declined': 'Your card was declined. Please try another payment method.',
    'expired_card': 'Your card has expired. Please try another card.',
    'incorrect_cvc': 'The security code is incorrect. Please check and try again.',
    'processing_error': 'An error occurred while processing your card. Please try again.',
    'insufficient_funds': 'Your card has insufficient funds. Please try another card.',
  };
  
  return {
    success: false,
    message: errorMessages[error.code] || 'An error occurred with your payment. Please try again.',
    code: error.code,
  };
};

/**
 * Checks if the browser supports Apple Pay
 * @returns {Promise<boolean>} - Whether Apple Pay is supported
 */
export const isApplePaySupported = async () => {
  if (!window.ApplePaySession) {
    return false;
  }
  
  return ApplePaySession.canMakePayments();
};

/**
 * Checks if the browser supports Google Pay
 * @returns {Promise<boolean>} - Whether Google Pay is supported
 */
export const isGooglePaySupported = async () => {
  // This is a simplified check
  // In a real implementation, you would use the Google Pay API
  return !!window.PaymentRequest;
};