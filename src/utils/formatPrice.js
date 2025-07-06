/**
 * Format price for display
 * @param {number} amount - Price amount
 * @param {string} currency - Currency code (default: EUR)
 * @returns {string} Formatted price
 */
export function formatPrice(amount, currency = 'EUR') {
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

/**
 * Parse price string to numeric amount
 * @param {string} priceString - Price string (e.g., "25.50€", "25,50", "25.50")
 * @returns {number} Numeric amount
 */
export function parsePriceToAmount(priceString) {
  if (typeof priceString === 'number') {
    return priceString;
  }
  
  if (!priceString || typeof priceString !== 'string') {
    return 0;
  }
  
  // Remove currency symbols and whitespace
  const cleanPrice = priceString.replace(/[€$£¥₹]/g, '').trim();
  
  // Replace comma with dot for decimal parsing
  const normalizedPrice = cleanPrice.replace(',', '.');
  
  // Parse as float
  const amount = parseFloat(normalizedPrice);
  
  return isNaN(amount) ? 0 : amount;
}