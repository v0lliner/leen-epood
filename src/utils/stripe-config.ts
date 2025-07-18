/**
 * Stripe product configuration
 * 
 * This file contains the configuration for all products available for purchase
 * through Stripe. Each product must include:
 * - priceId: The Stripe Price ID
 * - name: The product name
 * - description: A description of the product
 * - mode: The checkout mode ('payment' or 'subscription')
 */

export const products = [
  {
    priceId: 'price_1RfOoRP1VBbJ3P2LKofFkMPc',
    name: 'Kuju "Kärp"',
    description: 'Kõrgkuumuskeraamika.',
    mode: 'payment'
  }
];

/**
 * Get a product by its price ID
 * @param priceId The Stripe Price ID
 * @returns The product configuration or undefined if not found
 */
export const getProductByPriceId = (priceId: string) => {
  return products.find(product => product.priceId === priceId);
};