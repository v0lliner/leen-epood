/**
 * Maksekeskus configuration for the frontend
 */

// API endpoints
export const MAKSEKESKUS_API = {
  PAYMENT_METHODS: '/api/payment-methods.php',
  CREATE_PAYMENT: '/server/api/create-payment.php',
};

// Payment status mapping
export const PAYMENT_STATUS = {
  PENDING: 'PENDING',
  COMPLETED: 'COMPLETED',
  CANCELLED: 'CANCELLED',
  EXPIRED: 'EXPIRED',
};

// Bank logos (for display in checkout)
export const BANK_LOGOS = {
  'swedbank': '/assets/banks/swedbank.png',
  'seb': '/assets/banks/seb.png',
  'lhv': '/assets/banks/lhv.png',
  'coop': '/assets/banks/coop.png',
  'luminor': '/assets/banks/luminor.png',
};

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
export function formatPrice(amount, currency = 'EUR') {
  return new Intl.NumberFormat('et-EE', {
    style: 'currency',
    currency: currency,
  }).format(amount);
}