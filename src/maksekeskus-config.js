/**
 * Maksekeskus configuration for the frontend
 */

// Shop credentials
export const MAKSEKESKUS_CREDENTIALS = {
  SHOP_ID: '4e2bed9a-aa24-4b87-801b-56c31c535d36',
  API_OPEN_KEY: 'wo0pLGl9D8b0Lrn2ZpT0KvQKBid4qZQg',
  // Secret key is only used on the server side
};

// API endpoints
export const MAKSEKESKUS_API = {
  PAYMENT_METHODS: '/api/payment-methods',
  CREATE_PAYMENT: '/api/create-payment',
};

// Return URLs for Maksekeskus portal
export const MAKSEKESKUS_URLS = {
  RETURN_URL: 'https://leen.ee/makse/korras',
  CANCEL_URL: 'https://leen.ee/makse/katkestatud',
  NOTIFICATION_URL: 'https://leen.ee/api/maksekeskus/notification',
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
  'swedbank': 'https://images.pexels.com/photos/4386158/pexels-photo-4386158.jpeg?auto=compress&cs=tinysrgb&w=100',
  'seb': 'https://images.pexels.com/photos/4386158/pexels-photo-4386158.jpeg?auto=compress&cs=tinysrgb&w=100',
  'lhv': 'https://images.pexels.com/photos/4386158/pexels-photo-4386158.jpeg?auto=compress&cs=tinysrgb&w=100',
  'coop': 'https://images.pexels.com/photos/4386158/pexels-photo-4386158.jpeg?auto=compress&cs=tinysrgb&w=100',
  'luminor': 'https://images.pexels.com/photos/4386158/pexels-photo-4386158.jpeg?auto=compress&cs=tinysrgb&w=100',
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