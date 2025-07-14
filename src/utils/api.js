/**
 * API utilities for interacting with Supabase Edge Functions
 */

/**
 * Create a payment intent for checkout
 * @param {Object} params - Payment intent parameters
 * @param {number} params.amount - Amount in euros (will be converted to cents)
 * @param {string} params.currency - Currency code (default: 'eur')
 * @param {Array} params.items - Array of items in the cart
 * @param {Object} params.customer - Customer information
 * @param {Object} params.metadata - Additional metadata
 * @returns {Promise<{clientSecret: string, paymentIntentId: string}>}
 */
export const createPaymentIntent = async (params) => {
  try {
    const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-payment-intent`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('sb-access-token') || ''}`,
      },
      body: JSON.stringify(params),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to create payment intent');
    }

    return await response.json();
  } catch (error) {
    console.error('Error creating payment intent:', error);
    throw error;
  }
};

/**
 * Save order to database
 * @param {Object} orderData - Order data
 * @returns {Promise<{data: Object, error: Object|null}>}
 */
export const saveOrder = async (orderData) => {
  try {
    const { createClient } = await import('@supabase/supabase-js');
    const supabase = createClient(
      import.meta.env.VITE_SUPABASE_URL,
      import.meta.env.VITE_SUPABASE_ANON_KEY
    );

    return await supabase
      .from('orders')
      .insert(orderData)
      .select()
      .single();
  } catch (error) {
    console.error('Error saving order:', error);
    return { data: null, error };
  }
};

/**
 * Update order in database
 * @param {string} orderId - Order ID
 * @param {Object} updates - Updates to apply
 * @returns {Promise<{data: Object, error: Object|null}>}
 */
export const updateOrder = async (orderId, updates) => {
  try {
    const { createClient } = await import('@supabase/supabase-js');
    const supabase = createClient(
      import.meta.env.VITE_SUPABASE_URL,
      import.meta.env.VITE_SUPABASE_ANON_KEY
    );

    return await supabase
      .from('orders')
      .update(updates)
      .eq('id', orderId)
      .select()
      .single();
  } catch (error) {
    console.error('Error updating order:', error);
    return { data: null, error };
  }
};