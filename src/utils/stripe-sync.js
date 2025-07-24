/**
 * Stripe Product Synchronization Utilities
 * 
 * This module provides functions to sync products between the CMS and Stripe,
 * including migration of existing products and ongoing synchronization.
 */

/**
 * Migrate all products to Stripe
 * @param {number} batchSize - Number of products to process in each batch
 * @returns {Promise<{success: boolean, migrated: number, failed: number, results: Array}>}
 */
export const migrateAllProducts = async (batchSize = 10) => {
  try {
    const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/stripe-product-sync`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
      },
      body: JSON.stringify({
        action: 'migrate_all',
        batch_size: batchSize,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Migration failed');
    }

    return await response.json();
  } catch (error) {
    console.error('Migration error:', error);
    throw error;
  }
};

/**
 * Sync a single product to Stripe
 * @param {string} productId - Product ID to sync
 * @returns {Promise<{success: boolean, stripe_product_id?: string, stripe_price_id?: string, error?: string}>}
 */
export const syncSingleProduct = async (productId) => {
  try {
    const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/stripe-product-sync`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
      },
      body: JSON.stringify({
        action: 'sync_product',
        product_id: productId,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Sync failed');
    }

    return await response.json();
  } catch (error) {
    console.error('Sync error:', error);
    throw error;
  }
};

/**
 * Process pending sync operations
 * @param {number} batchSize - Number of operations to process
 * @returns {Promise<{success: boolean, processed: number, results: Array}>}
 */
export const processPendingSync = async (batchSize = 10) => {
  try {
    const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/stripe-product-sync`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
      },
      body: JSON.stringify({
        action: 'process_pending',
        batch_size: batchSize,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Processing failed');
    }

    return await response.json();
  } catch (error) {
    console.error('Processing error:', error);
    throw error;
  }
};

/**
 * Get sync status for products
 * @returns {Promise<{synced: number, pending: number, failed: number}>}
 */
export const getSyncStatus = async () => {
  try {
    const { createClient } = await import('@supabase/supabase-js');
    const supabase = createClient(
      import.meta.env.VITE_SUPABASE_URL,
      import.meta.env.VITE_SUPABASE_ANON_KEY
    );

    // Get product sync status - check if sync_status column exists
    const { data: products, error: productsError } = await supabase
      .from('products')
      .select('id, sync_status, stripe_product_id, stripe_price_id, available')
      .eq('available', true);

    if (productsError) {
      console.warn('Error fetching products for sync status:', productsError);
      // If sync_status column doesn't exist, assume all products need syncing
      const { data: allProducts } = await supabase
        .from('products')
        .select('id, stripe_product_id, stripe_price_id, available')
        .eq('available', true);
      
      const needSync = allProducts?.filter(p => !p.stripe_product_id || !p.stripe_price_id).length || 0;
      
      return {
        synced: 0,
        pending: needSync,
        failed: 0,
      };
    }

    // Get sync log status - check if table exists
    const { data: logs, error: logsError } = await supabase
      .from('stripe_sync_log')
      .select('status')
      .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()); // Last 24 hours

    if (logsError) {
      console.warn('Error fetching sync logs:', logsError);
      // If sync log table doesn't exist, calculate from products
      const syncedProducts = products?.filter(p => p.sync_status === 'synced' || (p.stripe_product_id && p.stripe_price_id)).length || 0;
      const pendingProducts = products?.filter(p => !p.stripe_product_id || !p.stripe_price_id).length || 0;
      
      return {
        synced: syncedProducts,
        pending: pendingProducts,
        failed: 0,
      };
    }

    const syncedProducts = products?.filter(p => p.sync_status === 'synced').length || 0;
    const pendingProducts = products?.filter(p => p.sync_status === 'pending').length || 0;
    const failedLogs = logs?.filter(l => l.status === 'failed').length || 0;

    return {
      synced: syncedProducts,
      pending: pendingProducts,
      failed: failedLogs,
    };
  } catch (error) {
    console.error('Error getting sync status:', error);
    return {
      synced: 0,
      pending: 0,
      failed: 0,
    };
  }
};