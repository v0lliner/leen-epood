/**
 * Stripe service for product and price management
 */

import Stripe from 'stripe';
import { StripeProductData, StripePriceData, MigrationConfig } from '../types';
import { Logger } from '../logger';
import { ErrorHandler, RetryManager } from '../error-handler';

export class StripeService {
  private stripe: Stripe;
  private logger: Logger;
  private errorHandler: ErrorHandler;
  private retryManager: RetryManager;
  private config: MigrationConfig;
  private rateLimiter: RateLimiter;

  constructor(config: MigrationConfig, logger: Logger, errorHandler: ErrorHandler) {
    this.config = config;
    this.logger = logger.createChildLogger('stripe');
    this.errorHandler = errorHandler;
    this.retryManager = new RetryManager(this.logger);
    
    this.stripe = new Stripe(config.stripe.apiKey, {
      apiVersion: config.stripe.apiVersion as any,
      typescript: true,
      telemetry: false,
      appInfo: {
        name: 'CMS Migration Script',
        version: '1.0.0',
      },
    });

    this.rateLimiter = new RateLimiter(
      config.stripe.maxRequestsPerSecond,
      this.logger
    );

    this.logger.info('Stripe service initialized', {
      apiVersion: config.stripe.apiVersion,
      maxRps: config.stripe.maxRequestsPerSecond,
    });
  }

  public async testConnection(): Promise<void> {
    try {
      this.logger.debug('Testing Stripe connection');
      
      await this.rateLimiter.waitForSlot();
      const account = await this.stripe.accounts.retrieve();
      
      this.logger.info('Stripe connection test successful', {
        accountId: account.id,
        country: account.country,
        currency: account.default_currency,
      });
    } catch (error) {
      const migrationError = this.errorHandler.handleError(error, 'stripe-connection-test');
      throw new Error(`Stripe connection failed: ${migrationError.message}`);
    }
  }

  public async createProduct(productData: StripeProductData): Promise<string> {
    if (this.config.dryRun) {
      this.logger.info('DRY RUN: Would create Stripe product', { productData });
      return `prod_dry_run_${Date.now()}`;
    }

    return this.retryManager.executeWithRetry(async () => {
      this.logger.debug('Creating Stripe product', { name: productData.name });

      await this.rateLimiter.waitForSlot();
      
      const product = await this.stripe.products.create({
        name: productData.name,
        description: productData.description,
        metadata: productData.metadata,
        images: productData.images,
        active: productData.active,
      });

      this.logger.debug('Stripe product created', {
        id: product.id,
        name: product.name,
      });

      this.errorHandler.recordSuccess('stripe-create-product');
      return product.id;
    }, 'create-stripe-product');
  }

  public async createPrice(priceData: StripePriceData): Promise<string> {
    if (this.config.dryRun) {
      this.logger.info('DRY RUN: Would create Stripe price', { priceData });
      return `price_dry_run_${Date.now()}`;
    }

    return this.retryManager.executeWithRetry(async () => {
      this.logger.debug('Creating Stripe price', {
        product: priceData.product,
        amount: priceData.unit_amount,
      });

      await this.rateLimiter.waitForSlot();
      
      const price = await this.stripe.prices.create({
        product: priceData.product,
        unit_amount: priceData.unit_amount,
        currency: priceData.currency,
        metadata: priceData.metadata,
        active: priceData.active,
      });

      this.logger.debug('Stripe price created', {
        id: price.id,
        amount: price.unit_amount,
      });

      this.errorHandler.recordSuccess('stripe-create-price');
      return price.id;
    }, 'create-stripe-price');
  }

  public async checkProductExists(cmsId: string): Promise<string | null> {
    return this.retryManager.executeWithRetry(async () => {
      this.logger.debug('Checking if product exists in Stripe', { cmsId });

      await this.rateLimiter.waitForSlot();
      
      const products = await this.stripe.products.search({
        query: `metadata['cms_id']:'${cmsId}'`,
        limit: 1,
      });

      if (products.data.length > 0) {
        this.logger.debug('Product found in Stripe', {
          cmsId,
          stripeId: products.data[0].id,
        });
        return products.data[0].id;
      }

      return null;
    }, 'check-product-exists');
  }

  public async updateProduct(productId: string, updates: Partial<StripeProductData>): Promise<void> {
    if (this.config.dryRun) {
      this.logger.info('DRY RUN: Would update Stripe product', { productId, updates });
      return;
    }

    return this.retryManager.executeWithRetry(async () => {
      this.logger.debug('Updating Stripe product', { productId });

      await this.rateLimiter.waitForSlot();
      
      await this.stripe.products.update(productId, {
        name: updates.name,
        description: updates.description,
        metadata: updates.metadata,
        images: updates.images,
        active: updates.active,
      });

      this.logger.debug('Stripe product updated', { productId });
      this.errorHandler.recordSuccess('stripe-update-product');
    }, 'update-stripe-product');
  }

  public async deactivateProduct(productId: string): Promise<void> {
    if (this.config.dryRun) {
      this.logger.info('DRY RUN: Would deactivate Stripe product', { productId });
      return;
    }

    return this.retryManager.executeWithRetry(async () => {
      this.logger.debug('Deactivating Stripe product', { productId });

      await this.rateLimiter.waitForSlot();
      
      await this.stripe.products.update(productId, {
        active: false,
      });

      this.logger.debug('Stripe product deactivated', { productId });
      this.errorHandler.recordSuccess('stripe-deactivate-product');
    }, 'deactivate-stripe-product');
  }

  public getRemainingRequests(): number {
    return this.rateLimiter.getRemainingRequests();
  }
}

class RateLimiter {
  private requests: number[] = [];
  private maxRequestsPerSecond: number;
  private logger: Logger;

  constructor(maxRequestsPerSecond: number, logger: Logger) {
    this.maxRequestsPerSecond = maxRequestsPerSecond;
    this.logger = logger;
  }

  public async waitForSlot(): Promise<void> {
    const now = Date.now();
    
    // Remove requests older than 1 second
    this.requests = this.requests.filter(timestamp => now - timestamp < 1000);

    if (this.requests.length >= this.maxRequestsPerSecond) {
      const oldestRequest = Math.min(...this.requests);
      const waitTime = 1000 - (now - oldestRequest) + 10; // Add 10ms buffer
      
      this.logger.debug(`Rate limit reached, waiting ${waitTime}ms`);
      await new Promise(resolve => setTimeout(resolve, waitTime));
      
      return this.waitForSlot(); // Recursive call to check again
    }

    this.requests.push(now);
  }

  public getRemainingRequests(): number {
    const now = Date.now();
    this.requests = this.requests.filter(timestamp => now - timestamp < 1000);
    return Math.max(0, this.maxRequestsPerSecond - this.requests.length);
  }
}