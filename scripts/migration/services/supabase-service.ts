/**
 * Supabase service for CMS data operations
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { CMSProduct, MigrationConfig } from '../types';
import { Logger } from '../logger';
import { ErrorHandler, RetryManager } from '../error-handler';

export class SupabaseService {
  private client: SupabaseClient;
  private logger: Logger;
  private errorHandler: ErrorHandler;
  private retryManager: RetryManager;
  private config: MigrationConfig;

  constructor(config: MigrationConfig, logger: Logger, errorHandler: ErrorHandler) {
    this.config = config;
    this.logger = logger.createChildLogger('supabase');
    this.errorHandler = errorHandler;
    this.retryManager = new RetryManager(this.logger);
    
    this.client = createClient(
      config.supabase.url,
      config.supabase.serviceKey,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
        db: {
          schema: 'public',
        },
        global: {
          headers: {
            'X-Client-Info': 'migration-script',
          },
        },
      }
    );

    this.logger.info('Supabase service initialized', {
      url: config.supabase.url,
      poolSize: config.supabase.connectionPoolSize,
    });
  }

  public async testConnection(): Promise<void> {
    try {
      this.logger.debug('Testing Supabase connection');
      
      const { data, error } = await this.client
        .from('products')
        .select('count(*)')
        .limit(1);

      if (error) {
        throw error;
      }

      this.logger.info('Supabase connection test successful');
    } catch (error) {
      const migrationError = this.errorHandler.handleError(error, 'supabase-connection-test');
      throw new Error(`Supabase connection failed: ${migrationError.message}`);
    }
  }

  public async getProductsCount(filters?: any): Promise<number> {
    return this.retryManager.executeWithRetry(async () => {
      this.logger.debug('Getting products count', { filters });

      let query = this.client
        .from('products')
        .select('*', { count: 'exact', head: true });

      // Apply filters based on migration strategy
      if (this.config.migration.strategy === 'incremental') {
        if (this.config.migration.startDate) {
          query = query.gte('created_at', this.config.migration.startDate);
        }
        if (this.config.migration.endDate) {
          query = query.lte('created_at', this.config.migration.endDate);
        }
      }

      if (this.config.migration.strategy === 'selective' && this.config.migration.productIds) {
        query = query.in('id', this.config.migration.productIds);
      }

      if (this.config.migration.skipExisting) {
        query = query.is('stripe_product_id', null);
      }

      const { count, error } = await query;

      if (error) {
        throw error;
      }

      this.logger.debug('Products count retrieved', { count });
      return count || 0;
    }, 'get-products-count');
  }

  public async getProductsBatch(offset: number, limit: number): Promise<CMSProduct[]> {
    return this.retryManager.executeWithRetry(async () => {
      this.logger.debug('Fetching products batch', { offset, limit });

      let query = this.client
        .from('products')
        .select('*')
        .range(offset, offset + limit - 1)
        .order('created_at', { ascending: true });

      // Apply same filters as count query
      if (this.config.migration.strategy === 'incremental') {
        if (this.config.migration.startDate) {
          query = query.gte('created_at', this.config.migration.startDate);
        }
        if (this.config.migration.endDate) {
          query = query.lte('created_at', this.config.migration.endDate);
        }
      }

      if (this.config.migration.strategy === 'selective' && this.config.migration.productIds) {
        query = query.in('id', this.config.migration.productIds);
      }

      if (this.config.migration.skipExisting) {
        query = query.is('stripe_product_id', null);
      }

      const { data, error } = await query;

      if (error) {
        throw error;
      }

      this.logger.debug('Products batch retrieved', { 
        count: data?.length || 0,
        offset,
        limit 
      });

      return data || [];
    }, 'get-products-batch');
  }

  public async updateProductStripeIds(
    productId: string,
    stripeProductId: string,
    stripePriceId: string
  ): Promise<void> {
    if (this.config.dryRun) {
      this.logger.info('DRY RUN: Would update product Stripe IDs', {
        productId,
        stripeProductId,
        stripePriceId,
      });
      return;
    }

    return this.retryManager.executeWithRetry(async () => {
      this.logger.debug('Updating product Stripe IDs', {
        productId,
        stripeProductId,
        stripePriceId,
      });

      const { error } = await this.client
        .from('products')
        .update({
          stripe_product_id: stripeProductId,
          stripe_price_id: stripePriceId,
          sync_status: 'synced',
          last_synced_at: new Date().toISOString(),
        })
        .eq('id', productId);

      if (error) {
        throw error;
      }

      this.logger.debug('Product Stripe IDs updated successfully', { productId });
    }, 'update-product-stripe-ids');
  }

  public async markProductSyncFailed(productId: string, errorMessage: string): Promise<void> {
    if (this.config.dryRun) {
      this.logger.info('DRY RUN: Would mark product sync as failed', {
        productId,
        errorMessage,
      });
      return;
    }

    try {
      const { error } = await this.client
        .from('products')
        .update({
          sync_status: 'failed',
          last_synced_at: new Date().toISOString(),
        })
        .eq('id', productId);

      if (error) {
        this.logger.warn('Failed to mark product sync as failed', { productId }, error);
      }
    } catch (error) {
      this.logger.warn('Error marking product sync as failed', { productId }, error);
    }
  }

  public async createBackup(): Promise<string> {
    this.logger.info('Creating data backup');

    const { data, error } = await this.client
      .from('products')
      .select('*');

    if (error) {
      throw error;
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupPath = `backups/products-backup-${timestamp}.json`;
    
    const backupData = {
      timestamp: new Date(),
      products: data,
      checksum: this.calculateChecksum(JSON.stringify(data)),
      version: '1.0.0',
    };

    // Ensure backup directory exists
    const fs = await import('fs');
    const path = await import('path');
    
    const backupDir = path.dirname(backupPath);
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true });
    }

    fs.writeFileSync(backupPath, JSON.stringify(backupData, null, 2));

    this.logger.info('Backup created successfully', {
      path: backupPath,
      recordCount: data?.length || 0,
      checksum: backupData.checksum,
    });

    return backupPath;
  }

  private calculateChecksum(data: string): string {
    const crypto = require('crypto');
    return crypto.createHash('sha256').update(data).digest('hex');
  }

  public async close(): Promise<void> {
    this.logger.info('Closing Supabase connections');
    // Supabase client doesn't have explicit close method
    // Connection pooling is handled automatically
  }
}