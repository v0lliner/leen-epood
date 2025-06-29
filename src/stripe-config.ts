/**
 * Stripe product configuration
 * This file contains all the product information for Stripe integration
 */

export interface StripeProduct {
  id: string;
  priceId: string;
  name: string;
  description: string;
  mode: 'payment' | 'subscription';
}

export const stripeProducts: StripeProduct[] = [
  {
    id: 'prod_SaZyOGVZJ6Yosm',
    priceId: 'price_1RfOoRP1VBbJ3P2LKofFkMPc',
    name: 'Kuju "Kärp"',
    description: 'Kõrgkuumuskeraamika.',
    mode: 'payment'
  }
];

/**
 * Get product by ID
 */
export function getStripeProduct(id: string): StripeProduct | undefined {
  return stripeProducts.find(product => product.id === id);
}

/**
 * Get product by price ID
 */
export function getStripeProductByPriceId(priceId: string): StripeProduct | undefined {
  return stripeProducts.find(product => product.priceId === priceId);
}