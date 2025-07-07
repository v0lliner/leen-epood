// Omniva parcel machines API utility
// Replaces the PHP implementation with JavaScript

// Use our PHP proxy instead of direct API access
const OMNIVA_API_URL = '/php/get-omniva-parcel-machines.php';

/**
 * Fetch Omniva parcel machines from their API
 * @param {string} country - Country code (EE, LV, LT)
 * @returns {Promise<Array>} Array of parcel machine locations
 */
export async function getOmnivaParcelMachines(country = 'EE') {
  try {
    console.log(`Fetching from ${OMNIVA_API_URL}...`);
    const response = await fetch(`${OMNIVA_API_URL}?country=${country.toLowerCase()}`);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();

    if (!data.success) {
      throw new Error(data.error || 'Failed to fetch parcel machines');
    }
    
    console.log(`Received ${data.parcelMachines.length} parcel machines from Omniva API`);
    
    // Return the pre-formatted parcel machines from our PHP proxy
    return data.parcelMachines;
    
  } catch (error) {
    console.error('Error fetching Omniva parcel machines:', error);
    throw new Error(`Failed to fetch parcel machine locations: ${error.message}`);
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
  const cities = machines.map(machine => machine.city);
  return [...new Set(cities)].sort();
}