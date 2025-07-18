/**
 * Main Migration Engine
 * 
 * Orchestrates the entire migration process with comprehensive error handling and recovery.
 */

import MigrationLogger from './logger.js';
import RateLimiter from './rate-limiter.js';
import RetryHandler from './retry-handler.js';
import DataValidator from './data-validator.js';
import CheckpointManager from './checkpoint-manager.js';
import StripeService from './stripe-service.js';
import SupabaseService from './supabase-service.js';
import { MIGRATION_CONFIG, ERROR_CODES } from './config.js';

class MigrationEngine {
  constructor(options = {}) {
    // Initialize core services
    this.logger = new MigrationLogger();
    this.rateLimiter = new RateLimiter(this.logger);
    this.retryHandler = new RetryHandler(this.logger, this.rateLimiter);
    this.dataValidator = new DataValidator(this.logger);
    this.checkpointManager = new CheckpointManager(this.logger);
    
    // Initialize API services
    this.stripeService = new StripeService(this.logger, this.retryHandler, this.dataValidator);
    this.supabaseService = new SupabaseService(this.logger, this.retryHandler);
    
    // Migration options
    this.options = {
      dryRun: options.dryRun || false,
      forceResync: options.forceResync || false,
      batchSize: options.batchSize || MIGRATION_CONFIG.BATCH_SIZE,
      resumeFromCheckpoint: options.resumeFromCheckpoint !== false,
      skipValidation: options.skipValidation || false,
      ...options
    };
    
    // Migration state
    this.state = {
      processedCount: 0,
      successCount: 0,
      errorCount: 0,
      skippedCount: 0,
      lastProcessedId: null,
      errors: [],
      startTime: new Date(),
      isRunning: false,
      isPaused: false
    };
    
    // Setup signal handlers for graceful shutdown
    this.setupSignalHandlers();
    
    this.logger.info('Migration engine initialized', {
      options: this.options,
      config: {
        batchSize: MIGRATION_CONFIG.BATCH_SIZE,
        maxRetries: MIGRATION_CONFIG.MAX_RETRIES,
        rateLimit: MIGRATION_CONFIG.STRIPE_RATE_LIMIT_PER_SECOND
      }
    });
  }

  setupSignalHandlers() {
    const gracefulShutdown = (signal) => {
      this.logger.warn(`Received ${signal}, initiating graceful shutdown...`);
      this.state.isPaused = true;
      
      // Save checkpoint before exit
      if (this.state.isRunning) {
        this.checkpointManager.saveCheckpoint(this.state);
      }
      
      setTimeout(() => {
        this.logger.error('Forced shutdown after timeout');
        process.exit(1);
      }, 30000); // 30 second timeout for graceful shutdown
    };
    
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));
    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
  }

  async run() {
    try {
      this.state.isRunning = true;
      this.logger.info('🚀 Starting production migration', this.options);
      
      // Pre-flight checks
      await this.performPreflightChecks();
      
      // Load checkpoint if resuming
      if (this.options.resumeFromCheckpoint) {
        await this.loadCheckpointIfExists();
      }
      
      // Get products to migrate
      const products = await this.getProductsToMigrate();
      
      if (products.length === 0) {
        this.logger.info('No products found to migrate');
        return this.generateFinalReport();
      }
      
      // Create backup
      this.checkpointManager.createMigrationBackup(products);
      
      // Process products in batches
      await this.processBatches(products);
      
      // Verify migration if enabled
      if (MIGRATION_CONFIG.VERIFY_AFTER_MIGRATION && !this.options.dryRun) {
        await this.verifyMigration();
      }
      
      // Generate final report
      const report = await this.generateFinalReport();
      
      // Cleanup
      if (this.state.errorCount === 0) {
        this.checkpointManager.clearCheckpoint();
      }
      
      return report;
      
    } catch (error) {
      this.logger.error('Migration failed with critical error', error);
      this.state.isRunning = false;
      throw error;
    } finally {
      this.state.isRunning = false;
      this.logger.summary();
    }
  }

  async performPreflightChecks() {
    this.logger.info('🔍 Performing pre-flight checks...');
    
    // Test Supabase connection
    const supabaseOk = await this.supabaseService.testConnection();
    if (!supabaseOk) {
      throw new Error('Supabase connection test failed');
    }
    
    // Test Stripe connection
    const stripeOk = await this.stripeService.testConnection();
    if (!stripeOk) {
      throw new Error('Stripe connection test failed');
    }
    
    // Get Stripe account info
    const accountInfo = await this.stripeService.getAccountInfo();
    if (accountInfo) {
      this.logger.info('Stripe account info', accountInfo);
    }
    
    // Validate environment
    this.validateEnvironment();
    
    this.logger.success('Pre-flight checks completed successfully');
  }

  validateEnvironment() {
    const required = [
      'VITE_SUPABASE_URL',
      'SUPABASE_SERVICE_ROLE_KEY',
      'STRIPE_SECRET_KEY'
    ];
    
    const missing = required.filter(key => !process.env[key]);
    
    if (missing.length > 0) {
      throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
    }
    
    this.logger.debug('Environment validation passed');
  }

  async loadCheckpointIfExists() {
    const checkpoint = this.checkpointManager.loadCheckpoint();
    
    if (checkpoint) {
      this.state = { ...this.state, ...checkpoint };
      this.logger.info('Resuming from checkpoint', {
        processedCount: this.state.processedCount,
        lastProcessedId: this.state.lastProcessedId
      });
    }
  }

  async getProductsToMigrate() {
    this.logger.info('📦 Fetching products to migrate...');
    
    const products = await this.supabaseService.getProducts({
      forceResync: this.options.forceResync,
      lastProcessedId: this.state.lastProcessedId
    });
    
    this.logger.info(`Found ${products.length} products to process`);
    return products;
  }

  async processBatches(products) {
    const totalBatches = Math.ceil(products.length / this.options.batchSize);
    
    this.logger.info(`Processing ${products.length} products in ${totalBatches} batches of ${this.options.batchSize}`);
    
    for (let i = 0; i < products.length; i += this.options.batchSize) {
      if (this.state.isPaused) {
        this.logger.warn('Migration paused, saving checkpoint...');
        this.checkpointManager.saveCheckpoint(this.state);
        break;
      }
      
      const batch = products.slice(i, i + this.options.batchSize);
      const batchNumber = Math.floor(i / this.options.batchSize) + 1;
      
      this.logger.info(`🔄 Processing batch ${batchNumber}/${totalBatches} (${batch.length} products)`);
      
      await this.processBatch(batch, batchNumber);
      
      // Save checkpoint periodically
      if (this.checkpointManager.shouldSaveCheckpoint(this.state.processedCount)) {
        this.checkpointManager.saveCheckpoint(this.state);
      }
      
      // Progress report
      if (this.state.processedCount % MIGRATION_CONFIG.PROGRESS_REPORT_INTERVAL === 0) {
        this.reportProgress(products.length);
      }
      
      // Health check
      if (this.state.processedCount % MIGRATION_CONFIG.HEALTH_CHECK_INTERVAL === 0) {
        await this.performHealthCheck();
      }
    }
  }

  async processBatch(batch, batchNumber) {
    // Validate batch if validation is enabled
    if (!this.options.skipValidation) {
      const validationResult = this.dataValidator.validateBatch(batch);
      
      if (validationResult.invalid.length > 0) {
        this.logger.warn(`Batch ${batchNumber} has ${validationResult.invalid.length} invalid products`, {
          invalidProducts: validationResult.invalid.map(p => ({
            id: p.product.id,
            title: p.product.title,
            error: p.error
          }))
        });
      }
      
      // Process only valid products
      batch = validationResult.valid.map(vp => {
        // Find original product and merge with validated data
        const original = batch.find(p => p.id === vp.id);
        return { ...original, ...vp };
      });
    }
    
    // Process products in parallel (with concurrency limit)
    const promises = batch.map(product => this.processProduct(product));
    const results = await Promise.allSettled(promises);
    
    // Analyze batch results
    let batchSuccess = 0;
    let batchErrors = 0;
    
    results.forEach((result, index) => {
      if (result.status === 'fulfilled') {
        batchSuccess++;
      } else {
        batchErrors++;
        this.state.errors.push({
          productId: batch[index].id,
          productTitle: batch[index].title,
          error: result.reason.message,
          batchNumber
        });
      }
    });
    
    this.logger.info(`Batch ${batchNumber} completed: ${batchSuccess} success, ${batchErrors} errors`);
  }

  async processProduct(product) {
    const context = {
      productId: product.id,
      productTitle: product.title
    };
    
    try {
      this.logger.debug(`Processing product: ${product.title}`, context);
      
      // Skip if already synced and not forcing resync
      if (!this.options.forceResync && product.stripe_product_id && product.sync_status === 'synced') {
        this.logger.debug('Product already synced, skipping', context);
        this.state.skippedCount++;
        this.state.processedCount++;
        return { skipped: true };
      }
      
      // Validate product data
      const validatedProduct = this.dataValidator.validateProduct(product);
      
      if (this.options.dryRun) {
        this.logger.info(`[DRY RUN] Would migrate product: ${validatedProduct.title}`, {
          price: `${validatedProduct.price} cents`,
          currency: validatedProduct.currency
        });
        this.state.successCount++;
        this.state.processedCount++;
        return { dryRun: true };
      }
      
      // Find or create Stripe product
      let stripeProduct = await this.stripeService.findExistingProduct(validatedProduct);
      
      if (!stripeProduct) {
        stripeProduct = await this.stripeService.createProduct(validatedProduct);
      } else {
        this.logger.debug('Using existing Stripe product', {
          productId: validatedProduct.id,
          stripeProductId: stripeProduct.id
        });
      }
      
      // Find or create Stripe price
      let stripePrice = await this.stripeService.findExistingPrice(stripeProduct, validatedProduct);
      
      if (!stripePrice) {
        stripePrice = await this.stripeService.createPrice(stripeProduct, validatedProduct);
      } else {
        this.logger.debug('Using existing Stripe price', {
          productId: validatedProduct.id,
          stripePriceId: stripePrice.id
        });
      }
      
      // Update Supabase with Stripe IDs
      await this.supabaseService.updateProductStripeData(product.id, {
        stripe_product_id: stripeProduct.id,
        stripe_price_id: stripePrice.id
      });
      
      this.state.successCount++;
      this.state.processedCount++;
      this.state.lastProcessedId = product.id;
      
      this.logger.success(`Product migrated successfully: ${product.title}`, {
        productId: product.id,
        stripeProductId: stripeProduct.id,
        stripePriceId: stripePrice.id
      });
      
      return {
        success: true,
        stripeProductId: stripeProduct.id,
        stripePriceId: stripePrice.id
      };
      
    } catch (error) {
      this.state.errorCount++;
      this.state.processedCount++;
      
      this.logger.error(`Failed to process product: ${product.title}`, error, context);
      
      // Mark product as failed in Supabase
      if (!this.options.dryRun) {
        await this.supabaseService.markProductAsFailed(product.id, error, 1);
      }
      
      throw error;
    }
  }

  reportProgress(totalProducts) {
    const percentage = ((this.state.processedCount / totalProducts) * 100).toFixed(1);
    const elapsed = Date.now() - this.state.startTime.getTime();
    const rate = this.state.processedCount / (elapsed / 1000);
    const eta = totalProducts > this.state.processedCount 
      ? ((totalProducts - this.state.processedCount) / rate) 
      : 0;
    
    this.logger.progress(this.state.processedCount, totalProducts, 
      `Rate: ${rate.toFixed(1)}/s, ETA: ${Math.round(eta)}s`);
    
    // Rate limiter stats
    const rateLimiterStats = this.rateLimiter.getStats();
    this.logger.debug('Rate limiter stats', rateLimiterStats);
  }

  async performHealthCheck() {
    this.logger.debug('Performing health check...');
    
    try {
      // Test connections
      const supabaseOk = await this.supabaseService.testConnection();
      const stripeOk = await this.stripeService.testConnection();
      
      if (!supabaseOk || !stripeOk) {
        this.logger.warn('Health check failed, connections may be unstable', {
          supabase: supabaseOk,
          stripe: stripeOk
        });
      }
      
      // Check error rate
      const errorRate = this.state.processedCount > 0 
        ? (this.state.errorCount / this.state.processedCount) * 100 
        : 0;
      
      if (errorRate > 50) {
        this.logger.warn(`High error rate detected: ${errorRate.toFixed(1)}%`);
      }
      
    } catch (error) {
      this.logger.warn('Health check failed', error);
    }
  }

  async verifyMigration() {
    this.logger.info('🔍 Verifying migration results...');
    
    try {
      const verification = await this.supabaseService.verifyMigration();
      
      this.logger.info('Migration verification completed', {
        syncedProducts: verification.syncedCount,
        failedProducts: verification.failedCount
      });
      
      if (verification.failedCount > 0) {
        this.logger.warn('Some products failed to migrate', {
          failedProducts: verification.failedProducts.slice(0, 5) // Show first 5
        });
      }
      
      return verification;
    } catch (error) {
      this.logger.error('Migration verification failed', error);
      throw error;
    }
  }

  async generateFinalReport() {
    const duration = Date.now() - this.state.startTime.getTime();
    const rate = this.state.processedCount / (duration / 1000);
    
    const report = {
      summary: {
        totalProcessed: this.state.processedCount,
        successful: this.state.successCount,
        failed: this.state.errorCount,
        skipped: this.state.skippedCount,
        successRate: this.state.processedCount > 0 
          ? ((this.state.successCount / this.state.processedCount) * 100).toFixed(1) + '%'
          : '0%',
        duration: `${(duration / 1000).toFixed(2)}s`,
        averageRate: `${rate.toFixed(2)} products/second`
      },
      rateLimiter: this.rateLimiter.getStats(),
      errors: this.state.errors,
      options: this.options,
      timestamp: new Date().toISOString()
    };
    
    this.logger.info('📊 Migration completed', report.summary);
    
    if (this.state.errorCount > 0) {
      this.logger.warn(`${this.state.errorCount} products failed to migrate`, {
        errors: this.state.errors.slice(0, 10) // Show first 10 errors
      });
    }
    
    return report;
  }

  // Public methods for external control
  pause() {
    this.state.isPaused = true;
    this.logger.info('Migration paused by user request');
  }

  resume() {
    this.state.isPaused = false;
    this.logger.info('Migration resumed by user request');
  }

  getStatus() {
    return {
      isRunning: this.state.isRunning,
      isPaused: this.state.isPaused,
      processedCount: this.state.processedCount,
      successCount: this.state.successCount,
      errorCount: this.state.errorCount,
      skippedCount: this.state.skippedCount
    };
  }
}

export default MigrationEngine;