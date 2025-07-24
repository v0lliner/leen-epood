import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import Stripe from 'npm:stripe@17.7.0';
import { createClient } from 'npm:@supabase/supabase-js@2.49.1';

// Initialize Stripe
const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', {
  apiVersion: '2023-10-16',
  appInfo: {
    name: 'Leen E-pood Queue Processor',
    version: '2.0.0',
  },
});

// Initialize Supabase
const supabase = createClient(
  Deno.env.get('SUPABASE_URL') || '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
);

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

interface QueueItem {
  id: string;
  product_id: string;
  operation_type: 'create' | 'update' | 'delete';
  status: string;
  retry_count: number;
  metadata: any;
  created_at: string;
}

interface ProductData {
  id: string;
  title: string;
  description?: string;
  price: string;
  image?: string;
  category?: string;
  subcategory?: string;
  available: boolean;
  stripe_product_id?: string;
  stripe_price_id?: string;
  dimensions?: any;
}

// Helper function to sanitize product names for Stripe
function sanitizeProductName(name: string): string {
  return name
    .replace(/[""'']/g, '"')
    .replace(/[^\w\s\-\.\(\)]/g, '')
    .trim();
}

// Helper function to parse price from string
function parsePrice(priceString: string): number {
  const cleanPrice = priceString.replace(/[€$£¥₹,]/g, '').trim();
  const price = parseFloat(cleanPrice);
  return isNaN(price) ? 0 : Math.round(price * 100);
}

// Create Stripe product
async function createStripeProduct(product: ProductData): Promise<{ success: boolean; stripe_product_id?: string; stripe_price_id?: string; error?: string }> {
  try {
    console.log(`🆕 Creating Stripe product: ${product.title}`);
    
    const sanitizedName = sanitizeProductName(product.title);
    const priceInCents = parsePrice(product.price);
    
    if (priceInCents <= 0) {
      throw new Error(`Invalid price: ${product.price}`);
    }

    // Create product
    const stripeProduct = await stripe.products.create({
      name: sanitizedName,
      description: product.description || '',
      images: product.image ? [product.image] : [],
      metadata: {
        cms_product_id: product.id,
        category: product.category || '',
        subcategory: product.subcategory || '',
      },
      active: product.available,
    });

    console.log(`✅ Created Stripe product: ${stripeProduct.id}`);

    // Create price
    const stripePrice = await stripe.prices.create({
      product: stripeProduct.id,
      unit_amount: priceInCents,
      currency: 'eur',
      metadata: {
        cms_product_id: product.id,
      },
    });

    console.log(`💰 Created Stripe price: ${stripePrice.id}`);

    return {
      success: true,
      stripe_product_id: stripeProduct.id,
      stripe_price_id: stripePrice.id,
    };
  } catch (error) {
    console.error(`❌ Error creating Stripe product ${product.id}:`, error);
    return {
      success: false,
      error: error.message,
    };
  }
}

// Update Stripe product
async function updateStripeProduct(product: ProductData): Promise<{ success: boolean; stripe_product_id?: string; stripe_price_id?: string; error?: string }> {
  try {
    console.log(`🔄 Updating Stripe product: ${product.title}`);
    
    if (!product.stripe_product_id) {
      // If no Stripe product ID, create instead
      return await createStripeProduct(product);
    }

    const sanitizedName = sanitizeProductName(product.title);
    const priceInCents = parsePrice(product.price);
    
    if (priceInCents <= 0) {
      throw new Error(`Invalid price: ${product.price}`);
    }

    // Update product
    const stripeProduct = await stripe.products.update(product.stripe_product_id, {
      name: sanitizedName,
      description: product.description || '',
      images: product.image ? [product.image] : [],
      metadata: {
        cms_product_id: product.id,
        category: product.category || '',
        subcategory: product.subcategory || '',
      },
      active: product.available,
    });

    console.log(`✅ Updated Stripe product: ${stripeProduct.id}`);

    // Handle price update
    let stripePriceId = product.stripe_price_id;
    
    if (product.stripe_price_id) {
      try {
        const existingPrice = await stripe.prices.retrieve(product.stripe_price_id);
        
        // If price amount changed, create new price and deactivate old one
        if (existingPrice.unit_amount !== priceInCents) {
          console.log(`💸 Price changed, creating new price for ${product.title}`);
          
          // Deactivate old price
          await stripe.prices.update(product.stripe_price_id, { active: false });
          
          // Create new price
          const newPrice = await stripe.prices.create({
            product: stripeProduct.id,
            unit_amount: priceInCents,
            currency: 'eur',
            metadata: {
              cms_product_id: product.id,
            },
          });
          
          stripePriceId = newPrice.id;
          console.log(`💰 Created new Stripe price: ${stripePriceId}`);
        } else {
          console.log(`💰 Price unchanged: ${stripePriceId}`);
        }
      } catch (error) {
        if (error.code === 'resource_missing') {
          // Price doesn't exist, create new one
          const newPrice = await stripe.prices.create({
            product: stripeProduct.id,
            unit_amount: priceInCents,
            currency: 'eur',
            metadata: {
              cms_product_id: product.id,
            },
          });
          
          stripePriceId = newPrice.id;
          console.log(`💰 Created new Stripe price: ${stripePriceId}`);
        } else {
          throw error;
        }
      }
    } else {
      // No existing price, create new one
      const newPrice = await stripe.prices.create({
        product: stripeProduct.id,
        unit_amount: priceInCents,
        currency: 'eur',
        metadata: {
          cms_product_id: product.id,
        },
      });
      
      stripePriceId = newPrice.id;
      console.log(`💰 Created new Stripe price: ${stripePriceId}`);
    }

    return {
      success: true,
      stripe_product_id: stripeProduct.id,
      stripe_price_id: stripePriceId,
    };
  } catch (error) {
    console.error(`❌ Error updating Stripe product ${product.id}:`, error);
    return {
      success: false,
      error: error.message,
    };
  }
}

// Delete Stripe product
async function deleteStripeProduct(metadata: any): Promise<{ success: boolean; error?: string }> {
  try {
    const stripeProductId = metadata.stripe_product_id;
    
    if (!stripeProductId) {
      console.log(`⚠️ No Stripe product ID to delete`);
      return { success: true }; // Nothing to delete
    }

    console.log(`🗑️ Deleting Stripe product: ${stripeProductId}`);

    // Deactivate the product instead of deleting (Stripe best practice)
    await stripe.products.update(stripeProductId, {
      active: false,
    });

    console.log(`✅ Deactivated Stripe product: ${stripeProductId}`);

    return { success: true };
  } catch (error) {
    console.error(`❌ Error deleting Stripe product:`, error);
    return {
      success: false,
      error: error.message,
    };
  }
}

// Process a single queue item
async function processQueueItem(queueItem: QueueItem): Promise<{ success: boolean; error?: string; stripe_product_id?: string; stripe_price_id?: string }> {
  try {
    console.log(`🔄 Processing queue item ${queueItem.id}: ${queueItem.operation_type} for product ${queueItem.product_id}`);

    if (queueItem.operation_type === 'delete') {
      // For delete operations, use metadata
      const result = await deleteStripeProduct(queueItem.metadata);
      return result;
    } else {
      // For create/update operations, fetch current product data
      const { data: product, error: productError } = await supabase
        .from('products')
        .select('*')
        .eq('id', queueItem.product_id)
        .single();

      if (productError || !product) {
        throw new Error(`Product not found: ${queueItem.product_id}`);
      }

      if (queueItem.operation_type === 'create') {
        return await createStripeProduct(product);
      } else if (queueItem.operation_type === 'update') {
        return await updateStripeProduct(product);
      }
    }

    throw new Error(`Unknown operation type: ${queueItem.operation_type}`);
  } catch (error) {
    console.error(`❌ Error processing queue item ${queueItem.id}:`, error);
    return {
      success: false,
      error: error.message,
    };
  }
}

// Update queue item status
async function updateQueueItem(
  queueItemId: string,
  status: string,
  result: any,
  retryCount: number = 0
) {
  const updateData: any = {
    status,
    processed_at: new Date().toISOString(),
    retry_count: retryCount,
  };

  if (result.success) {
    if (result.stripe_product_id) updateData.stripe_product_id = result.stripe_product_id;
    if (result.stripe_price_id) updateData.stripe_price_id = result.stripe_price_id;
  } else {
    updateData.error_message = result.error;
  }

  const { error } = await supabase
    .from('stripe_sync_queue')
    .update(updateData)
    .eq('id', queueItemId);

  if (error) {
    console.error(`❌ Failed to update queue item ${queueItemId}:`, error);
  }
}

// Update product with Stripe IDs
async function updateProductStripeData(
  productId: string,
  stripeProductId?: string,
  stripePriceId?: string,
  syncStatus: string = 'synced'
) {
  const updateData: any = {
    sync_status: syncStatus,
    last_synced_at: new Date().toISOString(),
  };

  if (stripeProductId) updateData.stripe_product_id = stripeProductId;
  if (stripePriceId) updateData.stripe_price_id = stripePriceId;

  const { error } = await supabase
    .from('products')
    .update(updateData)
    .eq('id', productId);

  if (error) {
    console.error(`❌ Failed to update product ${productId}:`, error);
  } else {
    console.log(`✅ Updated product ${productId} with Stripe data`);
  }
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  try {
    const { action, batch_size = 10, force_all = false } = await req.json();
    console.log(`🚀 Starting queue processor: ${action} with batch_size: ${batch_size}`);

    if (action === 'process_queue') {
      // Get pending queue items
      const { data: queueItems, error: queueError } = await supabase
        .from('stripe_sync_queue')
        .select('*')
        .in('status', ['pending', 'retrying'])
        .lt('retry_count', 5) // Max 5 retries
        .order('created_at', { ascending: true })
        .limit(batch_size);

      if (queueError) {
        throw new Error(`Failed to fetch queue items: ${queueError.message}`);
      }

      console.log(`📋 Found ${queueItems?.length || 0} queue items to process`);

      if (!queueItems || queueItems.length === 0) {
        return new Response(
          JSON.stringify({
            success: true,
            processed: 0,
            message: 'No items in queue to process'
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Mark items as processing
      const queueItemIds = queueItems.map(item => item.id);
      await supabase
        .from('stripe_sync_queue')
        .update({ status: 'processing' })
        .in('id', queueItemIds);

      const results = [];
      let successCount = 0;
      let failureCount = 0;

      for (const queueItem of queueItems) {
        console.log(`🔄 Processing item ${queueItem.id}: ${queueItem.operation_type} for product ${queueItem.product_id}`);
        
        const result = await processQueueItem(queueItem);
        
        if (result.success) {
          await updateQueueItem(queueItem.id, 'completed', result);
          
          // Update product with Stripe data (except for delete operations)
          if (queueItem.operation_type !== 'delete') {
            await updateProductStripeData(
              queueItem.product_id,
              result.stripe_product_id,
              result.stripe_price_id,
              'synced'
            );
          }
          
          successCount++;
          console.log(`✅ Successfully processed: ${queueItem.operation_type} for product ${queueItem.product_id}`);
        } else {
          const newRetryCount = queueItem.retry_count + 1;
          const newStatus = newRetryCount >= 5 ? 'failed' : 'retrying';
          
          await updateQueueItem(queueItem.id, newStatus, result, newRetryCount);
          
          // Update product sync status to failed if max retries reached
          if (newStatus === 'failed' && queueItem.operation_type !== 'delete') {
            await updateProductStripeData(queueItem.product_id, undefined, undefined, 'failed');
          }
          
          failureCount++;
          console.error(`❌ Failed to process: ${queueItem.operation_type} for product ${queueItem.product_id} - ${result.error}`);
        }

        results.push({
          queue_item_id: queueItem.id,
          product_id: queueItem.product_id,
          operation_type: queueItem.operation_type,
          success: result.success,
          error: result.error,
          stripe_product_id: result.stripe_product_id,
          stripe_price_id: result.stripe_price_id,
        });

        // Rate limiting
        await new Promise(resolve => setTimeout(resolve, 200));
      }

      console.log(`🏁 Queue processing complete! Success: ${successCount}, Failed: ${failureCount}`);

      return new Response(
        JSON.stringify({
          success: true,
          processed: queueItems.length,
          successful: successCount,
          failed: failureCount,
          results,
          message: `Processed ${queueItems.length} items. ${successCount} successful, ${failureCount} failed.`
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (action === 'queue_all_products') {
      // Queue all products that need syncing
      console.log('📦 Queuing all products for sync...');
      
      const { data: products, error: productsError } = await supabase
        .from('products')
        .select('id, title, stripe_product_id, stripe_price_id, sync_status')
        .or('stripe_product_id.is.null,stripe_price_id.is.null,sync_status.neq.synced,sync_status.is.null');

      if (productsError) {
        throw new Error(`Failed to fetch products: ${productsError.message}`);
      }

      console.log(`📊 Found ${products?.length || 0} products to queue`);

      if (!products || products.length === 0) {
        return new Response(
          JSON.stringify({
            success: true,
            queued: 0,
            message: 'No products need syncing'
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Create queue items for all products
      const queueItems = products.map(product => ({
        product_id: product.id,
        operation_type: (!product.stripe_product_id || !product.stripe_price_id) ? 'create' : 'update',
        status: 'pending',
        metadata: {}
      }));

      const { error: insertError } = await supabase
        .from('stripe_sync_queue')
        .insert(queueItems);

      if (insertError) {
        throw new Error(`Failed to queue products: ${insertError.message}`);
      }

      console.log(`✅ Queued ${products.length} products for sync`);

      return new Response(
        JSON.stringify({
          success: true,
          queued: products.length,
          message: `Queued ${products.length} products for sync. Use 'process_queue' to start processing.`
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (action === 'get_queue_stats') {
      // Get queue statistics
      const { data: stats, error: statsError } = await supabase
        .from('stripe_sync_queue_stats')
        .select('*');

      if (statsError) {
        throw new Error(`Failed to get queue stats: ${statsError.message}`);
      }

      const { data: recentItems, error: recentError } = await supabase
        .from('stripe_sync_queue')
        .select(`
          id,
          product_id,
          operation_type,
          status,
          retry_count,
          error_message,
          created_at,
          processed_at,
          products(title)
        `)
        .order('created_at', { ascending: false })
        .limit(20);

      return new Response(
        JSON.stringify({
          success: true,
          stats: stats || [],
          recent_items: recentItems || []
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (action === 'cleanup_queue') {
      // Clean up old completed items
      const { error: cleanupError } = await supabase.rpc('cleanup_old_sync_queue');
      
      if (cleanupError) {
        throw new Error(`Cleanup failed: ${cleanupError.message}`);
      }

      return new Response(
        JSON.stringify({
          success: true,
          message: 'Old completed queue items cleaned up'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ 
        error: 'Invalid action. Available actions: process_queue, queue_all_products, get_queue_stats, cleanup_queue' 
      }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('💥 Queue processor error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});