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
  
  // If already a number, return it (ensuring it's positive)
  if (typeof priceString === 'number') {
    const value = priceString > 0 ? priceString : 0.01;
    console.log(`parsePriceToAmount: number input ${priceString} → ${value}`);
    return value;
  }
  
  try {
    // Remove currency symbol and any whitespace
    const cleanPrice = priceString.toString().replace(/[^\d.,]/g, '').trim();
    console.log(`parsePriceToAmount: cleaned price "${priceString}" → "${cleanPrice}"`);
    
    // Replace comma with dot for decimal point (European format)
    const normalizedPrice = cleanPrice.replace(',', '.');
    console.log(`parsePriceToAmount: normalized price "${cleanPrice}" → "${normalizedPrice}"`);
    
    // Parse to float and ensure it's a valid number
    const result = parseFloat(normalizedPrice);
    console.log(`parsePriceToAmount: parsed result = ${result}, isNaN = ${isNaN(result)}`);
    
    // Return at least 0.01 to avoid validation errors
    const finalResult = isNaN(result) ? 0.01 : (result > 0 ? result : 0.01);
    console.log(`parsePriceToAmount: final result = ${finalResult}`);
    return finalResult;
  } catch (error) {
    console.error('Error parsing price:', error);
    return 0.01; // Return minimum valid amount on error
  }
}

/**
 * Format price for display
 * @param {number} amount - Price amount
 * @param {string} currency - Currency code (default: EUR)
 * @returns {string} Formatted price
 */
export function formatPrice(amount, currency = CURRENCY) {
  try {
    // Ensure amount is a number
    const numericAmount = typeof amount === 'number' ? amount : parseFloat(amount);
    
    // Format with Intl.NumberFormat
    if (!isNaN(numericAmount)) {
      return new Intl.NumberFormat('et-EE', {
        style: 'currency',
        currency: currency,
      }).format(numericAmount);
    }
    
    // Fallback for invalid numbers
    return '0,00 €';
  } catch (error) {
    console.error('Error formatting price:', error);
    return '0,00 €';
  }
}