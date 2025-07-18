/**
 * Main migration engine that orchestrates the entire process
 */

import { 
  MigrationConfig, 
  CMSProduct, 
  MigrationResult, 
  MigrationProgress,
  CheckpointData 
} from './types';
import { Logger, ProgressLogger } from './logger';
import { ErrorHandler } from './error-handler';
import { SupabaseService } from './services/supabase-service';
import { StripeService } from './services/stripe-service';
import { DataTransformer } from './data-transformer';
import { CheckpointManager } from './checkpoint-manager';

export class MigrationEngine {
  private config: MigrationConfig;
  private logger: Logger;
  private progressLogger: ProgressLogger;
  private errorHandler: ErrorHandler;
  private supabaseService: SupabaseService;
  private stripeService: StripeService;
  private dataTransformer: DataTransformer;
  private checkpointManager: CheckpointManager;
  
  private progress: MigrationProgress;
  private results: MigrationResult[] = [];
  private isRunning = false;
  private shouldStop = false;

  constructor(config: MigrationConfig) {
    this.config = config;
    this.logger = new Logger(config.logLevel);
    this.progressLogger = new ProgressLogger(this.logger);
    this.errorHandler = new ErrorHandler(this.logger);
    
    this.supabaseService = new SupabaseService(config, this.logger, this.errorHandler);
    this.stripeService = new StripeService(config, this.logger, this.errorHandler);
    this.dataTransformer = new DataTransformer(this.logger);
    this.checkpointManager = new CheckpointManager(this.logger, config.checkpointInterval);

    this.progress = this.initializeProgress();

    // Setup graceful shutdown
    this.setupGracefulShutdown();
  }

  private initializeProgress(): MigrationProgress {
    return {
      totalRecords: 0,
      processedRecords: 0,
      successfulRecords: 0,
      failedRecords: 0,
      skippedRecords: 0,
      currentBatch: 0,
      totalBatches: 0,
      startTime: new Date(),
      averageProcessingTime: 0,
    };
  }

  private setupGracefulShutdown(): void {
    const shutdown = () => {
      if (this.isRunning) {
        this.logger.info('Shutdown signal received, stopping migration gracefully...');
        this.shouldStop = true;
      } else {
        process.exit(0);
      }
    };

    process.on('SIGINT', shutdown);
    process.on('SIGTERM', shutdown);
  }

  public async run(): Promise<void> {
    try {
      this.isRunning = true;
      this.logger.info('Starting CMS to Stripe migration', {
        environment: this.config.environment,
        dryRun: this.config.dryRun,
        strategy: this.config.migration.strategy,
        batchSize: this.config.batchSize,
      });

      // Pre-flight checks
      await this.performPreflightChecks();

      // Check for existing checkpoint
      const checkpoint = await this.loadCheckpointIfValid();

      // Create backup if enabled
      if (this.config.backupEnabled && !checkpoint) {
        await this.createBackup();
      }

      // Initialize or resume migration
      if (checkpoint) {
        await this.resumeMigration(checkpoint);
      } else {
        await this.startNewMigration();
      }

      // Post-migration tasks
      await this.performPostMigrationTasks();

      this.logger.info('Migration completed successfully', {
        totalProcessed: this.progress.processedRecords,
        successful: this.progress.successfulRecords,
        failed: this.progress.failedRecords,
        skipped: this.progress.skippedRecords,
        duration: this.calculateDuration(),
      });

    } catch (error) {
      this.logger.error('Migration failed', {}, error);
      throw error;
    } finally {
      this.isRunning = false;
      await this.cleanup();
    }
  }

  private async performPreflightChecks(): Promise<void> {
    this.logger.info('Performing pre-flight checks');

    // Test connections
    await this.supabaseService.testConnection();
    await this.stripeService.testConnection();

    // Validate configuration
    if (this.config.environment === 'production' && this.config.dryRun) {
      this.logger.warn('Running in dry-run mode in production environment');
    }

    // Check available resources
    const totalProducts = await this.supabaseService.getProductsCount();
    if (totalProducts === 0) {
      throw new Error('No products found to migrate');
    }

    this.progress.totalRecords = totalProducts;
    this.progress.totalBatches = Math.ceil(totalProducts / this.config.batchSize);

    this.logger.info('Pre-flight checks completed', {
      totalProducts,
      totalBatches: this.progress.totalBatches,
      estimatedDuration: this.estimateCompletionTime(totalProducts),
    });
  }

  private async loadCheckpointIfValid(): Promise<CheckpointData | null> {
    const checkpoint = this.checkpointManager.loadCheckpoint();
    
    if (!checkpoint) {
      return null;
    }

    const configHash = require('./config').ConfigManager.prototype.getConfigHash.call({
      config: this.config
    });

    if (!this.checkpointManager.validateCheckpoint(checkpoint, configHash)) {
      this.logger.warn('Invalid checkpoint found, starting fresh migration');
      this.checkpointManager.clearCheckpoint();
      return null;
    }

    this.logger.info('Valid checkpoint found, migration will resume', {
      lastProcessedId: checkpoint.lastProcessedId,
      processedRecords: checkpoint.progress.processedRecords,
    });

    return checkpoint;
  }

  private async createBackup(): Promise<void> {
    this.logger.info('Creating data backup before migration');
    const backupPath = await this.supabaseService.createBackup();
    this.logger.info('Backup created successfully', { path: backupPath });
  }

  private async startNewMigration(): Promise<void> {
    this.logger.info('Starting new migration');
    this.progress.startTime = new Date();
    await this.processBatches(0);
  }

  private async resumeMigration(checkpoint: CheckpointData): Promise<void> {
    this.logger.info('Resuming migration from checkpoint');
    this.progress = checkpoint.progress;
    
    // Calculate starting batch based on processed records
    const startingBatch = Math.floor(this.progress.processedRecords / this.config.batchSize);
    await this.processBatches(startingBatch);
  }

  private async processBatches(startingBatch: number): Promise<void> {
    for (let batchIndex = startingBatch; batchIndex < this.progress.totalBatches; batchIndex++) {
      if (this.shouldStop) {
        this.logger.info('Migration stopped by user request');
        break;
      }

      this.progress.currentBatch = batchIndex + 1;
      
      try {
        await this.processBatch(batchIndex);
      } catch (error) {
        this.logger.error(`Batch ${batchIndex + 1} failed`, { batchIndex }, error);
        
        // Decide whether to continue or stop based on error severity
        const migrationError = this.errorHandler.handleError(error, 'batch-processing');
        if (migrationError.severity === 'CRITICAL') {
          throw error;
        }
        
        // Continue with next batch for non-critical errors
        continue;
      }

      // Save checkpoint periodically
      if (this.checkpointManager.shouldSaveCheckpoint(this.progress.processedRecords)) {
        this.saveCheckpoint();
      }

      // Rate limiting between batches
      await this.sleep(100); // Small delay between batches
    }
  }

  private async processBatch(batchIndex: number): Promise<void> {
    const offset = batchIndex * this.config.batchSize;
    const products = await this.supabaseService.getProductsBatch(offset, this.config.batchSize);

    this.logger.debug(`Processing batch ${batchIndex + 1}`, {
      batchSize: products.length,
      offset,
    });

    // Process products in parallel with concurrency limit
    const semaphore = new Semaphore(this.config.maxConcurrency);
    const batchPromises = products.map(product => 
      semaphore.acquire().then(async (release) => {
        try {
          return await this.processProduct(product);
        } finally {
          release();
        }
      })
    );

    const batchResults = await Promise.allSettled(batchPromises);
    
    // Process results
    batchResults.forEach((result, index) => {
      if (result.status === 'fulfilled') {
        this.results.push(result.value);
        this.updateProgress(result.value);
      } else {
        this.logger.error(`Product processing failed`, {
          productId: products[index]?.id,
        }, result.reason);
        
        const failedResult: MigrationResult = {
          success: false,
          cmsId: products[index]?.id || 'unknown',
          error: result.reason.message,
          retryCount: 0,
          processingTime: 0,
        };
        
        this.results.push(failedResult);
        this.updateProgress(failedResult);
      }
    });

    this.progressLogger.logProgress(
      this.progress.processedRecords,
      this.progress.totalRecords,
      this.progress.successfulRecords,
      this.progress.failedRecords,
      `Batch ${batchIndex + 1}/${this.progress.totalBatches}`
    );
  }

  private async processProduct(product: CMSProduct): Promise<MigrationResult> {
    const startTime = Date.now();
    let retryCount = 0;

    this.logger.debug('Processing product', {
      id: product.id,
      title: product.title,
    });

    // Validate product data
    const validationErrors = this.dataTransformer.validateCMSProduct(product);
    if (validationErrors.length > 0) {
      return {
        success: false,
        cmsId: product.id,
        error: `Validation failed: ${validationErrors.join(', ')}`,
        retryCount: 0,
        processingTime: Date.now() - startTime,
      };
    }

    // Check if product already exists in Stripe
    if (this.config.migration.skipExisting) {
      const existingProductId = await this.stripeService.checkProductExists(product.id);
      if (existingProductId) {
        this.logger.debug('Product already exists in Stripe, skipping', {
          cmsId: product.id,
          stripeId: existingProductId,
        });
        
        return {
          success: true,
          cmsId: product.id,
          stripeProductId: existingProductId,
          retryCount: 0,
          processingTime: Date.now() - startTime,
        };
      }
    }

    // Transform data
    const stripeProductData = this.dataTransformer.transformProduct(product);
    
    try {
      // Create Stripe product
      const stripeProductId = await this.stripeService.createProduct(stripeProductData);
      
      // Create Stripe price
      const stripePriceData = this.dataTransformer.transformPrice(product, stripeProductId);
      const stripePriceId = await this.stripeService.createPrice(stripePriceData);
      
      // Update CMS with Stripe IDs
      await this.supabaseService.updateProductStripeIds(
        product.id,
        stripeProductId,
        stripePriceId
      );

      return {
        success: true,
        cmsId: product.id,
        stripeProductId,
        stripePriceId,
        retryCount,
        processingTime: Date.now() - startTime,
      };

    } catch (error) {
      // Mark as failed in CMS
      await this.supabaseService.markProductSyncFailed(product.id, error.message);
      
      return {
        success: false,
        cmsId: product.id,
        error: error.message,
        retryCount,
        processingTime: Date.now() - startTime,
      };
    }
  }

  private updateProgress(result: MigrationResult): void {
    this.progress.processedRecords++;
    
    if (result.success) {
      this.progress.successfulRecords++;
    } else {
      this.progress.failedRecords++;
    }

    // Update average processing time
    const totalTime = this.results.reduce((sum, r) => sum + r.processingTime, 0);
    this.progress.averageProcessingTime = totalTime / this.results.length;

    // Update ETA
    const remaining = this.progress.totalRecords - this.progress.processedRecords;
    if (remaining > 0 && this.progress.averageProcessingTime > 0) {
      const etaMs = remaining * this.progress.averageProcessingTime;
      this.progress.estimatedCompletion = new Date(Date.now() + etaMs);
    }
  }

  private saveCheckpoint(): void {
    const lastProcessedProduct = this.results[this.results.length - 1];
    if (lastProcessedProduct) {
      const configHash = require('./config').ConfigManager.prototype.getConfigHash.call({
        config: this.config
      });
      
      this.checkpointManager.saveCheckpoint(
        lastProcessedProduct.cmsId,
        this.progress,
        configHash
      );
    }
  }

  private async performPostMigrationTasks(): Promise<void> {
    this.logger.info('Performing post-migration tasks');

    // Generate migration report
    await this.generateMigrationReport();

    // Clear checkpoint on successful completion
    if (this.progress.failedRecords === 0) {
      this.checkpointManager.clearCheckpoint();
    }

    // Validate data integrity
    await this.validateDataIntegrity();
  }

  private async generateMigrationReport(): Promise<void> {
    const report = {
      summary: {
        totalRecords: this.progress.totalRecords,
        processedRecords: this.progress.processedRecords,
        successfulRecords: this.progress.successfulRecords,
        failedRecords: this.progress.failedRecords,
        skippedRecords: this.progress.skippedRecords,
        successRate: ((this.progress.successfulRecords / this.progress.processedRecords) * 100).toFixed(2),
        duration: this.calculateDuration(),
        averageProcessingTime: this.progress.averageProcessingTime,
      },
      configuration: {
        environment: this.config.environment,
        dryRun: this.config.dryRun,
        strategy: this.config.migration.strategy,
        batchSize: this.config.batchSize,
        maxConcurrency: this.config.maxConcurrency,
      },
      failures: this.results
        .filter(r => !r.success)
        .map(r => ({
          cmsId: r.cmsId,
          error: r.error,
          retryCount: r.retryCount,
        })),
      timestamp: new Date().toISOString(),
    };

    const reportPath = `reports/migration-report-${Date.now()}.json`;
    const fs = await import('fs');
    const path = await import('path');
    
    const reportDir = path.dirname(reportPath);
    if (!fs.existsSync(reportDir)) {
      fs.mkdirSync(reportDir, { recursive: true });
    }

    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));

    this.logger.info('Migration report generated', {
      path: reportPath,
      successRate: report.summary.successRate,
      failureCount: report.failures.length,
    });
  }

  private async validateDataIntegrity(): Promise<void> {
    this.logger.info('Validating data integrity');

    const successfulMigrations = this.results.filter(r => r.success);
    let validationErrors = 0;

    for (const result of successfulMigrations.slice(0, 10)) { // Sample validation
      try {
        const existingProduct = await this.stripeService.checkProductExists(result.cmsId);
        if (!existingProduct) {
          validationErrors++;
          this.logger.error('Data integrity check failed', {
            cmsId: result.cmsId,
            expectedStripeId: result.stripeProductId,
          });
        }
      } catch (error) {
        this.logger.warn('Could not validate product', { cmsId: result.cmsId }, error);
      }
    }

    if (validationErrors > 0) {
      this.logger.warn(`Data integrity issues found: ${validationErrors} products`);
    } else {
      this.logger.info('Data integrity validation passed');
    }
  }

  private calculateDuration(): string {
    const durationMs = Date.now() - this.progress.startTime.getTime();
    const hours = Math.floor(durationMs / (1000 * 60 * 60));
    const minutes = Math.floor((durationMs % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((durationMs % (1000 * 60)) / 1000);

    return `${hours}h ${minutes}m ${seconds}s`;
  }

  private estimateCompletionTime(totalProducts: number): string {
    // Rough estimate: 2 seconds per product (including API calls and rate limiting)
    const estimatedSeconds = totalProducts * 2;
    const hours = Math.floor(estimatedSeconds / 3600);
    const minutes = Math.floor((estimatedSeconds % 3600) / 60);

    return `${hours}h ${minutes}m`;
  }

  private async cleanup(): Promise<void> {
    this.logger.info('Cleaning up resources');
    
    try {
      await this.supabaseService.close();
    } catch (error) {
      this.logger.warn('Error during cleanup', {}, error);
    }
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  public stop(): void {
    this.shouldStop = true;
    this.logger.info('Stop signal sent to migration engine');
  }

  public getProgress(): MigrationProgress {
    return { ...this.progress };
  }

  public getResults(): MigrationResult[] {
    return [...this.results];
  }
}

// Semaphore for controlling concurrency
class Semaphore {
  private permits: number;
  private waitQueue: (() => void)[] = [];

  constructor(permits: number) {
    this.permits = permits;
  }

  async acquire(): Promise<() => void> {
    return new Promise((resolve) => {
      if (this.permits > 0) {
        this.permits--;
        resolve(() => this.release());
      } else {
        this.waitQueue.push(() => {
          this.permits--;
          resolve(() => this.release());
        });
      }
    });
  }

  private release(): void {
    this.permits++;
    if (this.waitQueue.length > 0) {
      const next = this.waitQueue.shift()!;
      next();
    }
  }
}