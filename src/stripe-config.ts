/**
 * Stripe configuration
 * This file contains configuration for Stripe integration
 */

export const STRIPE_CURRENCY = 'eur';

/**
 * Parse price string to cents
 * @param priceString - Price string (e.g. "349€", "10.99€")
 * @returns Price in cents
 */
export function parsePriceToAmount(priceString: string): number {
  // Remove currency symbol and any whitespace
  const cleanPrice = priceString.replace(/[^\d.,]/g, '').trim();
  
  // Replace comma with dot for decimal point (European format)
  const normalizedPrice = cleanPrice.replace(',', '.');
  
  // Parse to float and convert to cents
  const priceInCents = Math.round(parseFloat(normalizedPrice) * 100);
  
  return priceInCents;
}