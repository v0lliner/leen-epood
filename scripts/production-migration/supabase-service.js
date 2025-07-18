/**
 * Advanced Supabase Service with Connection Management
 * 
 * Handles all Supabase interactions with comprehensive error handling and connection management.
 */

import { createClient } from '@supabase/supabase-js';
import { MIGRATION_CONFIG, ERROR_CODES } from './config.js';

class SupabaseService {
  constructor(logger, retryHandler) {
    this.logger = logger;
    this.retryHandler = retryHandler;
    
    const supabaseUrl = process.env.VITE_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('VITE_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY environment variables are required');
    }
    
    this.supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      },
      global: {
        headers: {
          'X-Client-Info': 'production-migration-script'
        }
      }
    });
    
    this.logger.info('Supabase service initialized');
  }

  async testConnection() {
    try {
      const result = await this.retryHandler.retrySupabaseOperation(
        () => this.supabase.from('products').select('id').limit(1),
        { operation: 'testConnection' }
      );
      
      if (result.success) {
        this.logger.success('Supabase connection test successful');
        return true;
      } else {
        this.logger.error('Supabase connection test failed', result.error);
        return false;
      }
    } catch (error) {
      this.logger.error('Supabase connection test failed', error);
      return false;
    }
  }

  async getProducts(options = {}) {
    const {
      forceResync = false,
      limit = null,
      offset = 0,
      lastProcessedId = null
    } = options;
    
    const context = {
      operation: 'getProducts',
      forceResync,
      limit,
      offset,
      lastProcessedId
    };
    
    try {
      console.log('🔍 SupabaseService.getProducts() called with options:', options);
      
      let query = this.supabase
        .from('products')
        .select('*')
        .order('created_at', { ascending: true });
      
      // Filter logic based on migration strategy
      if (!forceResync) {
        // Only get products that haven't been synced or failed to sync
        query = query.or('stripe_product_id.is.null,sync_status.neq.synced');
        console.log('🔍 Filtering for unsynced products only');
      } else {
        console.log('🔍 Force resync enabled - getting all products');
      }
      
      // Resume from last processed ID if provided
      if (lastProcessedId) {
        query = query.gt('created_at', await this.getProductCreatedAt(lastProcessedId));
        console.log('🔍 Resuming from last processed ID:', lastProcessedId);
      }
      
      // Apply pagination
      if (limit) {
        query = query.limit(limit);
        console.log('🔍 Applying limit:', limit);
      }
      
      if (offset > 0) {
        query = query.range(offset, offset + (limit || 1000) - 1);
        console.log('🔍 Applying offset:', offset);
      }
      
      console.log('🔍 Executing Supabase query...');
      const result = await this.retryHandler.retrySupabaseOperation(
        () => query,
        context
      );
      
      if (!result.success) {
        console.error('❌ Supabase query failed:', result.error);
        throw result.error;
      }
      
      const products = result.data.data || [];
      console.log(`📦 Retrieved ${products.length} products from Supabase`);
      
      if (products.length > 0) {
        console.log('📋 Sample product:', {
          id: products[0].id,
          title: products[0].title,
          price: products[0].price,
          stripe_product_id: products[0].stripe_product_id,
          sync_status: products[0].sync_status
        });
      }
      
      this.logger.info('Products fetched from Supabase', {
        count: products.length,
        forceResync,
        hasMore: products.length === limit
      });
      
      return products;
    } catch (error) {
      console.error('❌ Error in getProducts:', error);
      this.logger.error('Failed to fetch products from Supabase', error, context);
      throw error;
    }
  }

  async getProductCreatedAt(productId) {
    try {
      const result = await this.retryHandler.retrySupabaseOperation(
        () => this.supabase
          .from('products')
          .select('created_at')
          .eq('id', productId)
          .single(),
        { operation: 'getProductCreatedAt', productId }
      );
      
      if (result.success && result.data.data) {
        return result.data.data.created_at;
      }
      
      return null;
    } catch (error) {
      this.logger.warn('Could not get product created_at timestamp', error);
      return null;
    }
  }

  async updateProductStripeData(productId, stripeData) {
    const context = {
      operation: 'updateProductStripeData',
      productId,
      stripeProductId: stripeData.stripe_product_id,
      stripePriceId: stripeData.stripe_price_id
    };
    
    const updateData = {
      stripe_product_id: stripeData.stripe_product_id,
      stripe_price_id: stripeData.stripe_price_id,
      sync_status: 'synced',
      last_synced_at: new Date().toISOString(),
      ...stripeData.additionalFields
    };
    
    try {
      const result = await this.retryHandler.retrySupabaseOperation(
        () => this.supabase
          .from('products')
          .update(updateData)
          .eq('id', productId)
          .select(),
        context
      );
      
      if (!result.success) {
        throw result.error;
      }
      
      if (!result.data.data || result.data.data.length === 0) {
        throw new Error(`Product ${productId} not found or not updated`);
      }
      
      this.logger.success('Product Stripe data updated in Supabase', {
        productId,
        stripeProductId: stripeData.stripe_product_id,
        stripePriceId: stripeData.stripe_price_id
      });
      
      return result.data.data[0];
    } catch (error) {
      this.logger.error('Failed to update product Stripe data', error, context);
      throw error;
    }
  }

  async markProductAsFailed(productId, error, attempt) {
    const context = {
      operation: 'markProductAsFailed',
      productId,
      attempt
    };
    
    const updateData = {
      sync_status: 'failed',
      last_synced_at: new Date().toISOString(),
      sync_error: error.message || 'Unknown error',
      sync_attempts: attempt
    };
    
    try {
      const result = await this.retryHandler.retrySupabaseOperation(
        () => this.supabase
          .from('products')
          .update(updateData)
          .eq('id', productId),
        context
      );
      
      if (result.success) {
        this.logger.debug('Product marked as failed in Supabase', {
          productId,
          error: error.message,
          attempt
        });
      }
    } catch (updateError) {
      this.logger.warn('Could not mark product as failed in Supabase', updateError, context);
    }
  }

  async getProductCount(forceResync = false) {
    try {
      let query = this.supabase
        .from('products')
        .select('*', { count: 'exact', head: true });
      
      if (!forceResync) {
        query = query.or('stripe_product_id.is.null,sync_status.neq.synced');
      }
      
      const result = await this.retryHandler.retrySupabaseOperation(
        () => query,
        { operation: 'getProductCount', forceResync }
      );
      
      if (result.success) {
        return result.data.count || 0;
      }
      
      return 0;
    } catch (error) {
      this.logger.error('Failed to get product count', error);
      return 0;
    }
  }

  async verifyMigration() {
    try {
      // Get products that should be synced
      const syncedResult = await this.retryHandler.retrySupabaseOperation(
        () => this.supabase
          .from('products')
          .select('id, title, stripe_product_id, stripe_price_id, sync_status')
          .eq('sync_status', 'synced')
          .not('stripe_product_id', 'is', null)
          .not('stripe_price_id', 'is', null),
        { operation: 'verifyMigration' }
      );
      
      if (!syncedResult.success) {
        throw syncedResult.error;
      }
      
      const syncedProducts = syncedResult.data.data || [];
      
      // Get failed products
      const failedResult = await this.retryHandler.retrySupabaseOperation(
        () => this.supabase
          .from('products')
          .select('id, title, sync_status, sync_error')
          .eq('sync_status', 'failed'),
        { operation: 'verifyMigrationFailed' }
      );
      
      const failedProducts = failedResult.success ? (failedResult.data.data || []) : [];
      
      return {
        syncedCount: syncedProducts.length,
        failedCount: failedProducts.length,
        syncedProducts,
        failedProducts
      };
    } catch (error) {
      this.logger.error('Failed to verify migration', error);
      throw error;
    }
  }

  async createMigrationReport() {
    try {
      const verification = await this.verifyMigration();
      
      const report = {
        timestamp: new Date().toISOString(),
        summary: {
          totalSynced: verification.syncedCount,
          totalFailed: verification.failedCount,
          successRate: verification.syncedCount + verification.failedCount > 0 
            ? ((verification.syncedCount / (verification.syncedCount + verification.failedCount)) * 100).toFixed(2) + '%'
            : '0%'
        },
        syncedProducts: verification.syncedProducts.map(p => ({
          id: p.id,
          title: p.title,
          stripeProductId: p.stripe_product_id,
          stripePriceId: p.stripe_price_id
        })),
        failedProducts: verification.failedProducts.map(p => ({
          id: p.id,
          title: p.title,
          error: p.sync_error
        }))
      };
      
      return report;
    } catch (error) {
      this.logger.error('Failed to create migration report', error);
      throw error;
    }
  }
}

export default SupabaseService;