/**
 * Maksekeskus configuration for the frontend
 */

// Currency
export const CURRENCY = 'EUR';

/**
 * Parse price string to amount
 * @param {string} priceString - Price string (e.g. "349€", "10.99€")
 * @returns {number} Price as float or NaN if invalid
 */
export function parsePriceToAmount(priceString) {
  if (!priceString) return NaN;
  
  // Log input for debugging
  console.log('parsePriceToAmount input:', priceString, typeof priceString);
  
  // If already a number, return it
  if (typeof priceString === 'number') {
    return priceString;
  }
  
  // Remove currency symbol and any whitespace
  const cleanPrice = priceString.toString().replace(/[^\d.,]/g, '').trim();
  
  // Replace comma with dot for decimal point (European format)
  const normalizedPrice = cleanPrice.replace(',', '.');
  
  // Parse to float and ensure it's a valid number
  const result = parseFloat(normalizedPrice);
  
  // Log the parsing result for debugging
  console.log(`Parsed price: "${priceString}" → "${cleanPrice}" → "${normalizedPrice}" → ${result} (${typeof result})`);
  
  return result;
}

/**
 * Format price for display
 * @param {number} amount - Price amount
 * @param {string} currency - Currency code (default: EUR)
 * @returns {string} Formatted price
 */
export function formatPrice(amount, currency = CURRENCY) {
  return new Intl.NumberFormat('et-EE', {
    style: 'currency',
    currency: currency,
  }).format(amount);
}