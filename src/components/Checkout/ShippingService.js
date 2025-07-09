/**
 * Service for fetching shipping-related data
 */
import { shippingSettingsService } from '../../utils/supabase/shippingSettings';

/**
 * Fetch Omniva parcel machines for a specific country
 * @param {string} country - Country code (e.g., 'ee', 'lv', 'lt')
 * @returns {Promise<Array>} List of parcel machines
 */
export const fetchOmnivaParcelMachines = async (country) => {
  try {
    const response = await fetch(`/php/get-omniva-parcel-machines.php?country=${country}`);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch parcel machines: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (!data.success) {
      throw new Error(data.error || 'Failed to fetch parcel machines');
    }
    
    return data.parcelMachines || [];
  } catch (error) {
    console.error('Error fetching Omniva parcel machines:', error);
    throw error;
  }
};

/**
 * Get Omniva shipping price from database
 * @returns {Promise<number>} Shipping price
 */
export const getOmnivaShippingPrice = async () => {
  try {
    const { data, error } = await shippingSettingsService.getOmnivaShippingSettings();
    
    if (error) {
      console.error('Error fetching Omniva shipping price:', error);
      return 3.99; // Default fallback price
    }
    
    return data?.price || 3.99;
  } catch (error) {
    console.error('Exception fetching Omniva shipping price:', error);
    return 3.99; // Default fallback price
  }
};

/**
 * Process payment through Maksekeskus
 * @param {Object} paymentData - Payment data
 * @returns {Promise<Object>} Payment result
 */
export const processPayment = async (paymentData) => {
  try {
    const response = await fetch('/php/process-payment.php', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(paymentData)
    });
    
    if (!response.ok) {
      throw new Error(`Payment processing failed: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error processing payment:', error);
    throw error;
  }
};