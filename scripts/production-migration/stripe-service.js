/**
 * Advanced Stripe Service with Error Handling and Optimization
 * 
 * Handles all Stripe API interactions with comprehensive error handling.
 */

import Stripe from 'stripe';
import { MIGRATION_CONFIG, ERROR_CODES, STRIPE_PRODUCT_METADATA_KEYS } from './config.js';

class StripeService {
  constructor(logger, retryHandler, dataValidator) {
    this.logger = logger;
    this.retryHandler = retryHandler;
    this.dataValidator = dataValidator;
    
    const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
    if (!stripeSecretKey) {
      throw new Error('STRIPE_SECRET_KEY environment variable is required');
    }
    
    this.stripe = new Stripe(stripeSecretKey, {
      apiVersion: '2023-10-16',
      appInfo: {
        name: 'Production Migration System',
        version: '1.0.0',
      },
      timeout: MIGRATION_CONFIG.STRIPE_TIMEOUT_MS,
    });
    
    this.logger.info('Stripe service initialized');
  }

  async findExistingProduct(product) {
    const context = {
      operation: 'findExistingProduct',
      productId: product.id,
      productTitle: product.title
    };
    
    try {
      // First, try to find by metadata (most reliable)
      const metadataResult = await this.retryHandler.retryStripeOperation(
        () => this.stripe.products.search({
          query: `metadata["${STRIPE_PRODUCT_METADATA_KEYS.SUPABASE_ID}"]:"${product.id}"`,
          limit: 1,
        }),
        context
      );
      
      if (metadataResult.success && metadataResult.data.data.length > 0) {
        this.logger.debug('Found existing product by metadata', {
          productId: product.id,
          stripeProductId: metadataResult.data.data[0].id
        });
        return metadataResult.data.data[0];
      }
      
      // Fallback: search by name (less reliable due to potential duplicates)
      const escapedTitle = this.escapeForStripeSearch(product.title);
      const nameResult = await this.retryHandler.retryStripeOperation(
        () => this.stripe.products.search({
          query: `name:"${escapedTitle}"`,
          limit: 5, // Get multiple results to handle potential duplicates
        }),
        context
      );
      
      if (nameResult.success && nameResult.data.data.length > 0) {
        // If multiple products found, try to find the best match
        const bestMatch = this.findBestNameMatch(product.title, nameResult.data.data);
        
        if (bestMatch) {
          this.logger.debug('Found existing product by name', {
            productId: product.id,
            stripeProductId: bestMatch.id,
            confidence: 'medium'
          });
          return bestMatch;
        }
      }
      
      return null;
    } catch (error) {
      this.logger.error('Error searching for existing product', error, context);
      throw error;
    }
  }

  findBestNameMatch(targetName, stripeProducts) {
    // Simple exact match first
    const exactMatch = stripeProducts.find(p => p.name === targetName);
    if (exactMatch) return exactMatch;
    
    // If no exact match, return the first one (could be improved with fuzzy matching)
    return stripeProducts[0];
  }

  async createProduct(validatedProduct) {
    const context = {
      operation: 'createProduct',
      productId: validatedProduct.id,
      productTitle: validatedProduct.title
    };
    
    const productData = {
      name: validatedProduct.title,
      description: validatedProduct.description || '',
      metadata: validatedProduct.metadata,
      active: true,
    };
    
    this.logger.debug('Creating Stripe product', { productData, context });
    
    const result = await this.retryHandler.retryStripeOperation(
      () => this.stripe.products.create(productData),
      context
    );
    
    if (!result.success) {
      throw result.error;
    }
    
    // Validate the created product
    this.dataValidator.validateStripeProduct(result.data);
    
    this.logger.success('Stripe product created', {
      productId: validatedProduct.id,
      stripeProductId: result.data.id,
      productName: result.data.name
    });
    
    return result.data;
  }

  async createPrice(stripeProduct, validatedProduct) {
    const context = {
      operation: 'createPrice',
      productId: validatedProduct.id,
      stripeProductId: stripeProduct.id,
      amount: validatedProduct.price
    };
    
    const priceData = {
      product: stripeProduct.id,
      unit_amount: validatedProduct.price,
      currency: validatedProduct.currency,
      metadata: {
        [STRIPE_PRODUCT_METADATA_KEYS.SUPABASE_ID]: validatedProduct.id,
      },
    };
    
    this.logger.debug('Creating Stripe price', { priceData, context });
    
    const result = await this.retryHandler.retryStripeOperation(
      () => this.stripe.prices.create(priceData),
      context
    );
    
    if (!result.success) {
      throw result.error;
    }
    
    // Validate the created price
    this.dataValidator.validateStripePrice(result.data);
    
    this.logger.success('Stripe price created', {
      productId: validatedProduct.id,
      stripePriceId: result.data.id,
      amount: result.data.unit_amount,
      currency: result.data.currency
    });
    
    return result.data;
  }

  async findExistingPrice(stripeProduct, validatedProduct) {
    const context = {
      operation: 'findExistingPrice',
      stripeProductId: stripeProduct.id,
      targetAmount: validatedProduct.price,
      targetCurrency: validatedProduct.currency
    };
    
    try {
      const result = await this.retryHandler.retryStripeOperation(
        () => this.stripe.prices.list({
          product: stripeProduct.id,
          active: true,
          limit: 10,
        }),
        context
      );
      
      if (!result.success) {
        throw result.error;
      }
      
      // Find price with matching amount and currency
      const matchingPrice = result.data.data.find(price => 
        price.unit_amount === validatedProduct.price && 
        price.currency === validatedProduct.currency
      );
      
      if (matchingPrice) {
        this.logger.debug('Found existing matching price', {
          stripePriceId: matchingPrice.id,
          amount: matchingPrice.unit_amount,
          currency: matchingPrice.currency
        });
      }
      
      return matchingPrice || null;
    } catch (error) {
      this.logger.error('Error searching for existing price', error, context);
      throw error;
    }
  }

  async updateProductMetadata(stripeProductId, metadata) {
    const context = {
      operation: 'updateProductMetadata',
      stripeProductId
    };
    
    const result = await this.retryHandler.retryStripeOperation(
      () => this.stripe.products.update(stripeProductId, { metadata }),
      context
    );
    
    if (!result.success) {
      throw result.error;
    }
    
    this.logger.debug('Product metadata updated', {
      stripeProductId,
      metadata
    });
    
    return result.data;
  }

  escapeForStripeSearch(str) {
    if (!str) return '';
    // Escape double quotes and backslashes for Stripe search query
    return str.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
  }

  async testConnection() {
    try {
      const result = await this.retryHandler.retryStripeOperation(
        () => this.stripe.products.list({ limit: 1 }),
        { operation: 'testConnection' }
      );
      
      if (result.success) {
        this.logger.success('Stripe connection test successful');
        return true;
      } else {
        this.logger.error('Stripe connection test failed', result.error);
        return false;
      }
    } catch (error) {
      this.logger.error('Stripe connection test failed', error);
      return false;
    }
  }

  async getAccountInfo() {
    try {
      const result = await this.retryHandler.retryStripeOperation(
        () => this.stripe.accounts.retrieve(),
        { operation: 'getAccountInfo' }
      );
      
      if (result.success) {
        return {
          id: result.data.id,
          country: result.data.country,
          defaultCurrency: result.data.default_currency,
          chargesEnabled: result.data.charges_enabled,
          payoutsEnabled: result.data.payouts_enabled
        };
      }
      
      return null;
    } catch (error) {
      this.logger.warn('Could not retrieve Stripe account info', error);
      return null;
    }
  }
}

export default StripeService;