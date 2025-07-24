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

    // Get product sync status
    const { data: products, error: productsError } = await supabase
      .from('products')
      .select('sync_status')
      .eq('available', true);

    if (productsError) {
      throw new Error(productsError.message);
    }

    // Get sync log status
    const { data: logs, error: logsError } = await supabase
      .from('stripe_sync_log')
      .select('status')
      .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()); // Last 24 hours

    if (logsError) {
      throw new Error(logsError.message);
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
    throw error;
  }
};

/**
 * 🐛 Debug products to see what's happening
 * @returns {Promise<{debug_info: object}>}
 */
export const debugProducts = async () => {
  try {
    const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/stripe-product-sync`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
      },
      body: JSON.stringify({
        action: 'debug_products',
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Debug failed');
    }

    return await response.json();
  } catch (error) {
    console.error('Debug error:', error);
    throw error;
  }
};