// Omniva parcel machines API utility
// Replaces the PHP implementation with JavaScript

const OMNIVA_API_URL = 'https://www.omniva.ee/locationsfull.json';

/**
 * Fetch Omniva parcel machines from their API
 * @param {string} country - Country code (EE, LV, LT)
 * @returns {Promise<Array>} Array of parcel machine locations
 */
export async function getOmnivaParcelMachines(country = 'EE') {
  try {
    console.log(`Fetching from ${OMNIVA_API_URL}...`);
    const response = await fetch(OMNIVA_API_URL);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    
    console.log(`Received ${data.length} locations from Omniva API`);
    
    // Filter by country and only return parcel machines (TYPE === 0)
    const parcelMachines = data.filter(location => 
      location.A0_NAME?.toUpperCase() === country.toUpperCase() && 
      (location.TYPE === 0 || location.TYPE === '0')
    );
    
    console.log(`Filtered to ${parcelMachines.length} parcel machines for ${country}`);
    
    // Transform to a more usable format
    return parcelMachines.map(machine => ({
      id: machine.ZIP,
      name: machine.NAME,
      address: `${machine.A1_NAME || ''}, ${machine.A2_NAME || ''}`,
      city: machine.A1_NAME || '',
      county: machine.A2_NAME || '',
      coordinates: {
        lat: parseFloat(machine.Y_COORDINATE || 0),
        lng: parseFloat(machine.X_COORDINATE || 0)
      },
      openingHours: machine.SERVICE_HOURS || '',
      comment: machine.COMMENT_EST || machine.COMMENT_ENG || '',
      disabled: machine.DISABLED === '1' || machine.DISABLED === 1
    })).filter(machine => !machine.disabled && machine.id);
    
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