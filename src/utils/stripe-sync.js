/**
 * 🏆 NEW QUEUE-BASED STRIPE SYNC UTILITIES
 * 
 * This module provides functions for the new queue-based Stripe synchronization system.
 * Instead of direct sync operations, this system uses a queue for better reliability and scalability.
 */

/**
 * Queue all products for Stripe sync
 * @param {boolean} forceAll - Force queue all products regardless of current sync status
 * @returns {Promise<{success: boolean, queued: number, message: string}>}
 */
export const queueAllProducts = async (forceAll = false) => {
  try {
    const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/process-stripe-queue`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
      },
      body: JSON.stringify({
        action: 'queue_all_products',
        force_all: forceAll,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to queue products');
    }

    return await response.json();
  } catch (error) {
    console.error('Queue all products error:', error);
    throw error;
  }
};

/**
 * Process the Stripe sync queue
 * @param {number} batchSize - Number of items to process in this batch
 * @returns {Promise<{success: boolean, processed: number, successful: number, failed: number, results: Array}>}
 */
export const processStripeQueue = async (batchSize = 10) => {
  try {
    const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/process-stripe-queue`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
      },
      body: JSON.stringify({
        action: 'process_queue',
        batch_size: batchSize,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to process queue');
    }

    return await response.json();
  } catch (error) {
    console.error('Process queue error:', error);
    throw error;
  }
};

/**
 * Get queue statistics and recent items
 * @returns {Promise<{success: boolean, stats: Array, recent_items: Array}>}
 */
export const getQueueStats = async () => {
  try {
    const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/process-stripe-queue`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
      },
      body: JSON.stringify({
        action: 'get_queue_stats',
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to get queue stats');
    }

    return await response.json();
  } catch (error) {
    console.error('Get queue stats error:', error);
    throw error;
  }
};

/**
 * Clean up old completed queue items
 * @returns {Promise<{success: boolean, message: string}>}
 */
export const cleanupQueue = async () => {
  try {
    const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/process-stripe-queue`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
      },
      body: JSON.stringify({
        action: 'cleanup_queue',
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to cleanup queue');
    }

    return await response.json();
  } catch (error) {
    console.error('Cleanup queue error:', error);
    throw error;
  }
};

/**
 * Get sync status for products (legacy compatibility)
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

    // Get queue stats
    const queueStats = await getQueueStats();

    const syncedProducts = products?.filter(p => p.sync_status === 'synced').length || 0;
    const pendingProducts = products?.filter(p => p.sync_status === 'pending').length || 0;
    const failedProducts = products?.filter(p => p.sync_status === 'failed').length || 0;

    // Add queue pending items to pending count
    const queuePending = queueStats.stats?.find(s => s.status === 'pending')?.count || 0;
    const queueFailed = queueStats.stats?.find(s => s.status === 'failed')?.count || 0;

    return {
      synced: syncedProducts,
      pending: pendingProducts + queuePending,
      failed: failedProducts + queueFailed,
    };
  } catch (error) {
    console.error('Error getting sync status:', error);
    throw error;
  }
};

// Legacy functions for backward compatibility
export const migrateAllProducts = async (batchSize = 10) => {
  console.log('🔄 Using new queue-based migration...');
  
  // First queue all products
  const queueResult = await queueAllProducts();
  
  if (!queueResult.success) {
    throw new Error(queueResult.message || 'Failed to queue products');
  }

  // Then process the queue
  const processResult = await processStripeQueue(batchSize);
  
  return {
    success: processResult.success,
    migrated: processResult.successful || 0,
    failed: processResult.failed || 0,
    results: processResult.results || [],
    message: `Migration completed using new queue system! ${processResult.successful || 0} products synced successfully.`
  };
};

export const syncSingleProduct = async (productId) => {
  console.log('🎯 Queueing single product for sync...');
  
  try {
    const { createClient } = await import('@supabase/supabase-js');
    const supabase = createClient(
      import.meta.env.VITE_SUPABASE_URL,
      import.meta.env.VITE_SUPABASE_ANON_KEY
    );

    // Add product to queue
    const { error: queueError } = await supabase
      .from('stripe_sync_queue')
      .insert({
        product_id: productId,
        operation_type: 'update',
        status: 'pending'
      });

    if (queueError) {
      throw new Error(queueError.message);
    }

    // Process the queue with batch size 1
    const result = await processStripeQueue(1);
    
    return {
      success: result.success,
      product_id: productId,
      message: 'Product queued and processed successfully'
    };
  } catch (error) {
    console.error('Sync single product error:', error);
    throw error;
  }
};

export const processPendingSync = async (batchSize = 10) => {
  console.log('⚡ Processing pending sync operations...');
  return await processStripeQueue(batchSize);
};

export const debugProducts = async () => {
  console.log('🐛 Getting queue stats for debugging...');
  return await getQueueStats();
};