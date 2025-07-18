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
    priceId: 'price_1RfOoRP1VBbJ3P2LKofFkMPc', // Replace with your actual Stripe Price ID
    name: 'Kuju "Kärp"',
    description: 'Kõrgkuumuskeraamika.',
    mode: 'payment'
  },
  {
    priceId: 'price_example_ceramic_vase', // Replace with your actual Stripe Price ID
    name: 'Keraamika vaas',
    description: 'Käsitsi vormitud keraamika vaas, glasuuritud.',
    mode: 'payment'
  },
  {
    priceId: 'price_example_coffee_cups', // Replace with your actual Stripe Price ID
    name: 'Kohvitasside komplekt',
    description: 'Dreitud tasside komplekt 4 tükki, mattkasiin.',
    mode: 'payment'
  },
  {
    priceId: 'price_example_linen_dress', // Replace with your actual Stripe Price ID
    name: 'Linane suvekleit',
    description: 'Käsitsi õmmeldud kleit looduslikust linasest kangast.',
    mode: 'payment'
  },
  {
    priceId: 'price_example_wool_vest', // Replace with your actual Stripe Price ID
    name: 'Villane vest',
    description: 'Käsitööna kootud vest looduslikust villast.',
    mode: 'payment'
  },
  {
    priceId: 'price_example_ceramic_bowls', // Replace with your actual Stripe Price ID
    name: 'Savikausid komplekt',
    description: 'Käsitsi vormitud kausid, komplektis 3 erinevat suurust.',
    mode: 'payment'
  },
  {
    priceId: 'price_example_ceramic_coasters', // Replace with your actual Stripe Price ID
    name: 'Keraamika alused',
    description: 'Käsitsi valmistatud alused kuumade nõude jaoks.',
    mode: 'payment'
  },
  {
    priceId: 'price_example_kimono', // Replace with your actual Stripe Price ID
    name: 'Villane kimono',
    description: 'Käsitööna kootud kimono looduslikust villast.',
    mode: 'payment'
  },
  {
    priceId: 'price_example_earrings', // Replace with your actual Stripe Price ID
    name: 'Käsitööehed kõrvarõngad',
    description: 'Keraamikast kõrvarõngad, käsitsi vormitud ja maalitud.',
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
}