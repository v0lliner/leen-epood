// Omniva parcel machines API utility
// Replaces the PHP implementation with JavaScript

// Import API utilities
import { getApiUrl } from './api';

// Use our PHP proxy instead of direct API access
const OMNIVA_API_URL = getApiUrl('/php/get-omniva-parcel-machines.php');

/**
 * Fetch Omniva parcel machines from their API
 * @param {string} country - Country code (EE, LV, LT)
 * @returns {Promise<Array>} Array of parcel machine locations
 */
export async function getOmnivaParcelMachines(country = 'EE') {
  try {
    console.log(`Fetching from ${OMNIVA_API_URL}...`);
    const response = await fetch(`${OMNIVA_API_URL}?country=${country.toLowerCase()}`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Cache-Control': 'no-cache'
      }
    });
    
    if (!response.ok) {
      // Log the HTTP status and text if response is not OK
      const errorText = await response.text();
      console.error(`HTTP error! Status: ${response.status}, Response Text:`, errorText);
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    // Get the raw response text first to check for any issues
    const rawResponseText = await response.text();
    
    // Check if the response is empty
    if (!rawResponseText || rawResponseText.trim() === '') {
      console.error('Empty response received from Omniva API');
      throw new Error('Empty response from server');
    }
    
    // Log the first 200 characters of the response for debugging
    console.log('Response preview (first 200 chars):', 
      rawResponseText.length > 200 ? rawResponseText.substring(0, 200) + '...' : rawResponseText);
    
    // Try to parse the JSON
    let data;
    try {
      data = JSON.parse(rawResponseText);
    } catch (parseError) {
      console.error('JSON parse error:', parseError);
      console.error('Invalid JSON response:', rawResponseText);
      throw new Error(`Failed to parse JSON response: ${parseError.message}`);
    }

    if (!data.success) {
      console.error('API returned success: false', data.error || 'No error message provided');
      throw new Error(data.error || 'Failed to load parcel machines');
    }
    
    if (!data.parcelMachines || !Array.isArray(data.parcelMachines)) {
      console.error('Invalid parcel machines data:', data);
      throw new Error('Invalid parcel machines data received');
    }
    
    console.log(`Successfully received ${data.parcelMachines.length} parcel machines from Omniva API`);
    
    // Return the pre-formatted parcel machines from our PHP proxy
    return data.parcelMachines;
    
  } catch (error) {
    console.error('Error loading parcel machines:', error);
    throw new Error('Failed to load parcel machines');
  }
}

/**
 * Search parcel machines by city or name
 * @param {Array} machines - Array of parcel machines
 * @param {string} query - Search query
 * @returns {Array} Filtered array of parcel machines
 */
export function searchParcelMachines(machines, query) {
  if (!query || query.length < 2) {
    return machines;
  }
  
  if (!machines || !Array.isArray(machines)) {
    console.warn('Invalid machines array provided to searchParcelMachines:', machines);
    return [];
  }
  
  const searchTerm = query.toLowerCase();
  
  return machines.filter(machine => 
    machine.name.toLowerCase().includes(searchTerm) ||
    machine.city.toLowerCase().includes(searchTerm) ||
    machine.address.toLowerCase().includes(searchTerm)
  );
}

/**
 * Get parcel machines by city
 * @param {Array} machines - Array of parcel machines
 * @param {string} city - City name
 * @returns {Array} Filtered array of parcel machines
 */
export function getParcelMachinesByCity(machines, city) {
  if (!machines || !Array.isArray(machines)) {
    console.warn('Invalid machines array provided to getParcelMachinesByCity:', machines);
    return [];
  }
  
  if (!city) {
    return machines;
  }
  
  return machines.filter(machine => 
    machine.city.toLowerCase() === city.toLowerCase()
  );
}

/**
 * Get unique cities from parcel machines
 * @param {Array} machines - Array of parcel machines
 * @returns {Array} Array of unique city names
 */
export function getUniqueCities(machines) {
  if (!machines || !Array.isArray(machines)) {
    console.warn('Invalid machines array provided to getUniqueCities:', machines);
    return [];
  }
  
  const cities = machines.map(machine => machine.city);
  return [...new Set(cities)].sort();
}