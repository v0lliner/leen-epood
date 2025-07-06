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