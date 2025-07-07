/**
 * Utility to get the base API URL for backend requests
 * Works in both development (with Vite proxy) and production (zone.ee)
 */

/**
 * Returns the base URL for API requests
 * In development, this will be an empty string (relative path) which works with Vite's proxy
 * In production, this will be the current domain
 */
export const getApiBaseUrl = () => {
  // In production (zone.ee), use the current domain
  // In development, use relative paths which will be handled by Vite's proxy
  return '';
};

/**
 * Constructs a full API URL for a given endpoint
 * @param {string} endpoint - The API endpoint (e.g., '/php/get-omniva-parcel-machines.php')
 * @returns {string} The complete URL
 */
export const getApiUrl = (endpoint) => {
  return `${getApiBaseUrl()}${endpoint}`;
};

/**
 * Fetches Omniva parcel machines
 * @param {string} country - Country code (e.g., 'EE', 'LV', 'LT')
 * @returns {Promise} Promise that resolves to the parcel machines data
 */
export const fetchOmnivaParcelMachines = async (country = 'EE') => {
  try {
    const response = await fetch(getApiUrl(`/php/get-omniva-parcel-machines.php?country=${country}`));
    
    if (!response.ok) {
      throw new Error(`Failed to fetch parcel machines: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error fetching Omniva parcel machines:', error);
    throw error;
  }
};

/**
 * Registers a shipment with Omniva
 * @param {Object} shipmentData - The shipment data
 * @returns {Promise} Promise that resolves to the registration result
 */
export const registerOmnivaShipment = async (shipmentData) => {
  try {
    const response = await fetch(getApiUrl('/php/omniva-shipment-registration.php'), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(shipmentData)
    });
    
    if (!response.ok) {
      throw new Error(`Failed to register shipment: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error registering Omniva shipment:', error);
    throw error;
  }
};