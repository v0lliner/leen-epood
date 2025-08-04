import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import Stripe from 'npm:stripe@17.7.0';
import { createClient } from 'npm:@supabase/supabase-js@2.49.1';

// Initialize Stripe
const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', {
  apiVersion: '2023-10-16',
  appInfo: {
    name: 'Leen E-pood Product Sync',
    version: '1.0.0',
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
}

interface SyncResult {
  success: boolean;
  stripe_product_id?: string;
  stripe_price_id?: string;
  error?: string;
}

// Helper function to sanitize product names for Stripe
function sanitizeProductName(name: string): string {
  return name
    .replace(/[""'']/g, '"') // Replace smart quotes with regular quotes
    .replace(/[^\w\s\-\.\(\)]/g, '') // Remove special characters except basic ones
    .trim();
}

// Helper function to parse price from string
function parsePrice(priceString: string): number {
  const cleanPrice = priceString.replace(/[€$£¥₹,]/g, '').trim();
  const price = parseFloat(cleanPrice);
  return isNaN(price) ? 0 : Math.round(price * 100); // Convert to cents
}

// Create or update Stripe product
async function syncProductToStripe(product: ProductData): Promise<SyncResult> {
  try {
    console.log(`🔄 Syncing product: ${product.title} (ID: ${product.id})`);
    
    const sanitizedName = sanitizeProductName(product.title);
    const priceInCents = parsePrice(product.price);
    
    if (priceInCents <= 0) {
      throw new Error(`Invalid price: ${product.price}`);
    }

    console.log(`💰 Parsed price: ${product.price} → ${priceInCents} cents`);

    let stripeProduct: Stripe.Product;
    
    // Check if product already exists in Stripe
    if (product.stripe_product_id) {
      try {
        stripeProduct = await stripe.products.retrieve(product.stripe_product_id);
        
        // Update existing product
        stripeProduct = await stripe.products.update(product.stripe_product_id, {
          name: sanitizedName,
          description: product.description || '',
          images: product.image ? [product.image] : [],
          metadata: {
            cms_product_id: product.id,
            category: product.category || '',
            subcategory: product.subcategory || '',
            available: product.available.toString(),
          },
          active: product.available,
        });
        
        console.log(`✅ Updated Stripe product: ${stripeProduct.id}`);
      } catch (error) {
        if (error.code === 'resource_missing') {
          // Product doesn't exist in Stripe, create new one
          stripeProduct = await stripe.products.create({
            name: sanitizedName,
            description: product.description || '',
            images: product.image ? [product.image] : [],
            metadata: {
              cms_product_id: product.id,
              category: product.category || '',
              subcategory: product.subcategory || '',
              available: product.available.toString(),
            },
            active: product.available,
          });
          
          console.log(`🆕 Created new Stripe product: ${stripeProduct.id}`);
        } else {
          throw error;
        }
      }
    } else {
      // Create new product
      stripeProduct = await stripe.products.create({
        name: sanitizedName,
        description: product.description || '',
        images: product.image ? [product.image] : [],
        metadata: {
          cms_product_id: product.id,
          category: product.category || '',
          subcategory: product.subcategory || '',
          available: product.available.toString(),
        },
        active: product.available,
      });
      
      console.log(`🆕 Created new Stripe product: ${stripeProduct.id}`);
    }

    // Handle price
    let stripePrice: Stripe.Price;
    
    if (product.stripe_price_id) {
      try {
        stripePrice = await stripe.prices.retrieve(product.stripe_price_id);
        
        // Check if price needs updating
        if (stripePrice.unit_amount !== priceInCents || !stripePrice.active) {
          // Deactivate old price
          await stripe.prices.update(product.stripe_price_id, { active: false });
          
          // Create new price
          stripePrice = await stripe.prices.create({
            product: stripeProduct.id,
            unit_amount: priceInCents,
            currency: 'eur',
            metadata: {
              cms_product_id: product.id,
            },
          });
          
          console.log(`💸 Created new Stripe price: ${stripePrice.id}`);
        } else {
          console.log(`💸 Price unchanged: ${stripePrice.id}`);
        }
      } catch (error) {
        if (error.code === 'resource_missing') {
          // Price doesn't exist, create new one
          stripePrice = await stripe.prices.create({
            product: stripeProduct.id,
            unit_amount: priceInCents,
            currency: 'eur',
            metadata: {
              cms_product_id: product.id,
            },
          });
          
          console.log(`💸 Created new Stripe price: ${stripePrice.id}`);
        } else {
          throw error;
        }
      }
    } else {
      // Create new price
      stripePrice = await stripe.prices.create({
        product: stripeProduct.id,
        unit_amount: priceInCents,
        currency: 'eur',
        metadata: {
          cms_product_id: product.id,
        },
      });
      
      console.log(`💸 Created new Stripe price: ${stripePrice.id}`);
    }

    return {
      success: true,
      stripe_product_id: stripeProduct.id,
      stripe_price_id: stripePrice.id,
    };
  } catch (error) {
    console.error(`❌ Error syncing product ${product.id}:`, error);
    return {
      success: false,
      error: error.message,
    };
  }
}

// Delete Stripe product
async function deleteProductFromStripe(stripeProductId?: string): Promise<SyncResult> {
  if (!stripeProductId) {
    console.log('No Stripe Product ID provided for deletion. Skipping.');
    return { success: true };
  }
  
  try {
    await stripe.products.update(stripeProductId, { active: false });
    console.log(`✅ Deactivated Stripe product: ${stripeProductId}`);
    return { success: true };
  } catch (error) {
    console.error(`❌ Error deactivating Stripe product ${stripeProductId}:`, error);
    return { success: false, error: error.message };
  }
}

// Update product with Stripe IDs and sync status
async function updateProductSyncStatus(
  productId: string,
  status: 'synced' | 'failed',
  stripeProductId?: string,
  stripePriceId?: string
) {
  const updateData: any = {
    sync_status: status,
    last_synced_at: new Date().toISOString(),
  };
  
  if (stripeProductId) updateData.stripe_product_id = stripeProductId;
  if (stripePriceId) updateData.stripe_price_id = stripePriceId;

  const { error } = await supabase
    .from('products')
    .update(updateData)
    .eq('id', productId);
    
  if (error) {
    console.error(`❌ Failed to update product ${productId} sync status:`, error);
  } else {
    console.log(`✅ Successfully updated product ${productId} sync status to ${status}`);
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
    const { batch_size = 5 } = await req.json(); // Process a small batch at a time
    console.log(`🚀 Starting processing of Stripe sync queue (batch size: ${batch_size})`);

    // 1. Fetch pending or retrying jobs
    const { data: syncJobs, error: fetchError } = await supabase
      .from('stripe_sync_queue')
      .select(`
        *,
        product:products (*)
      `)
      .in('status', ['pending', 'retrying'])
      .order('created_at', { ascending: true })
      .limit(batch_size);

    if (fetchError) {
      console.error('❌ Failed to fetch sync jobs:', fetchError);
      throw new Error(`Failed to fetch sync jobs: ${fetchError.message}`);
    }

    console.log(`📋 Found ${syncJobs?.length || 0} jobs to process`);

    if (!syncJobs || syncJobs.length === 0) {
      return new Response(
        JSON.stringify({ success: true, processed: 0, message: 'No pending jobs to process.' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    let processedCount = 0;

    for (const job of syncJobs) {
      // Mark job as processing
      await supabase
        .from('stripe_sync_queue')
        .update({ status: 'processing', processed_at: new Date().toISOString() })
        .eq('id', job.id);

      let result: SyncResult = { success: false };
      let productData: ProductData | undefined = job.product;

      if (!productData && job.operation_type !== 'delete') {
        // Product might have been deleted from products table before sync job was processed
        result.error = 'Product not found in CMS.';
        console.warn(`Product ${job.product_id} not found for job ${job.id}. Marking as failed.`);
      } else if (job.operation_type === 'delete') {
        // For delete operations, productData might be null if product was already removed from CMS
        // We need stripe_product_id from metadata
        const stripeProductIdToDelete = job.metadata?.stripe_product_id as string | undefined;
        result = await deleteProductFromStripe(stripeProductIdToDelete);
      } else {
        // Sync create/update operations
        result = await syncProductToStripe(productData!);
      }

      // Update job status and product sync status
      if (result.success) {
        await supabase
          .from('stripe_sync_queue')
          .update({ status: 'completed', error_message: null, processed_at: new Date().toISOString() })
          .eq('id', job.id);
        
        if (job.operation_type !== 'delete') {
          await updateProductSyncStatus(
            job.product_id,
            'synced',
            result.stripe_product_id,
            result.stripe_price_id
          );
        } else {
          // For delete, product is already gone, no need to update its sync_status
          console.log(`Product ${job.product_id} successfully deleted from Stripe.`);
        }
        processedCount++;
      } else {
        const newRetryCount = job.retry_count + 1;
        const newStatus = newRetryCount >= 5 ? 'failed' : 'retrying'; // Max 5 retries
        
        await supabase
          .from('stripe_sync_queue')
          .update({
            status: newStatus,
            error_message: result.error,
            retry_count: newRetryCount,
            processed_at: new Date().toISOString(),
          })
          .eq('id', job.id);
        
        if (job.operation_type !== 'delete') {
          await updateProductSyncStatus(
            job.product_id,
            'failed'
          );
        }
        console.error(`❌ Job ${job.id} failed (retry ${newRetryCount}): ${result.error}`);
      }

      // Add a small delay to avoid Stripe API rate limits
      await new Promise(resolve => setTimeout(resolve, 200));
    }

    return new Response(
      JSON.stringify({ success: true, processed: processedCount, message: 'Queue processing completed.' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('💥 Error processing Stripe sync queue:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Failed to process Stripe sync queue' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});