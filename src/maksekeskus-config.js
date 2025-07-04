/**
 * Maksekeskus configuration for the frontend
 */

// Currency
export const CURRENCY = 'EUR';

/**
 * Parse price string to amount
 * @param {string} priceString - Price string (e.g. "349€", "10.99€")
 * @returns {number} Price as float
 */
export function parsePriceToAmount(priceString) {
  // Remove currency symbol and any whitespace
  const cleanPrice = priceString.replace(/[^\d.,]/g, '').trim();
  
  // Replace comma with dot for decimal point (European format)
  const normalizedPrice = cleanPrice.replace(',', '.');
  
  // Parse to float
  return parseFloat(normalizedPrice);
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