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
    console.log(`Syncing product: ${product.title} (ID: ${product.id})`);
    
    const sanitizedName = sanitizeProductName(product.title);
    const priceInCents = parsePrice(product.price);
    
    if (priceInCents <= 0) {
      throw new Error(`Invalid price: ${product.price}`);
    }

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
        
        console.log(`Updated Stripe product: ${stripeProduct.id}`);
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
          
          console.log(`Created new Stripe product: ${stripeProduct.id}`);
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
      
      console.log(`Created new Stripe product: ${stripeProduct.id}`);
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
          
          console.log(`Created new Stripe price: ${stripePrice.id}`);
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
          
          console.log(`Created new Stripe price: ${stripePrice.id}`);
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
      
      console.log(`Created new Stripe price: ${stripePrice.id}`);
    }

    return {
      success: true,
      stripe_product_id: stripeProduct.id,
      stripe_price_id: stripePrice.id,
    };
  } catch (error) {
    console.error(`Error syncing product ${product.id}:`, error);
    return {
      success: false,
      error: error.message,
    };
  }
}

// Update sync log
async function updateSyncLog(
  logId: string,
  status: 'success' | 'failed',
  result: SyncResult,
  retryCount: number = 0
) {
  const updateData: any = {
    status,
    updated_at: new Date().toISOString(),
    retry_count: retryCount,
  };

  if (result.success) {
    updateData.stripe_product_id = result.stripe_product_id;
    updateData.stripe_price_id = result.stripe_price_id;
  } else {
    updateData.error_message = result.error;
  }

  await supabase
    .from('stripe_sync_log')
    .update(updateData)
    .eq('id', logId);
}

// Update product with Stripe IDs
async function updateProductStripeIds(
  productId: string,
  stripeProductId: string,
  stripePriceId: string
) {
  await supabase
    .from('products')
    .update({
      stripe_product_id: stripeProductId,
      stripe_price_id: stripePriceId,
      sync_status: 'synced',
      last_synced_at: new Date().toISOString(),
    })
    .eq('id', productId);
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
    const { action, product_id, batch_size = 10 } = await req.json();

    if (action === 'migrate_all') {
      // Migrate all products
      console.log('Starting bulk migration...');
      
      const { data: products, error: fetchError } = await supabase
        .from('products')
        .select('*')
        .eq('available', true)
        .is('stripe_product_id', null)
        .limit(batch_size);

      if (fetchError) {
        throw new Error(`Failed to fetch products: ${fetchError.message}`);
      }

      const results = [];
      let successCount = 0;
      let failureCount = 0;

      for (const product of products || []) {
        // Create sync log entry
        const { data: logEntry } = await supabase
          .from('stripe_sync_log')
          .insert({
            product_id: product.id,
            operation: 'migrate',
            status: 'pending',
            metadata: { batch_migration: true },
          })
          .select()
          .single();

        // Sync to Stripe
        const result = await syncProductToStripe(product);
        
        if (result.success) {
          await updateProductStripeIds(
            product.id,
            result.stripe_product_id!,
            result.stripe_price_id!
          );
          await updateSyncLog(logEntry.id, 'success', result);
          successCount++;
        } else {
          await updateSyncLog(logEntry.id, 'failed', result);
          failureCount++;
        }

        results.push({
          product_id: product.id,
          product_title: product.title,
          success: result.success,
          error: result.error,
        });

        // Rate limiting: wait 100ms between requests
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      return new Response(
        JSON.stringify({
          success: true,
          migrated: successCount,
          failed: failureCount,
          results,
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (action === 'sync_product' && product_id) {
      // Sync single product
      console.log(`Syncing single product: ${product_id}`);
      
      const { data: product, error: fetchError } = await supabase
        .from('products')
        .select('*')
        .eq('id', product_id)
        .single();

      if (fetchError || !product) {
        throw new Error(`Product not found: ${product_id}`);
      }

      // Get or create sync log entry
      let { data: logEntry } = await supabase
        .from('stripe_sync_log')
        .select('*')
        .eq('product_id', product_id)
        .eq('status', 'pending')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (!logEntry) {
        const { data: newLogEntry } = await supabase
          .from('stripe_sync_log')
          .insert({
            product_id: product.id,
            operation: 'create',
            status: 'pending',
          })
          .select()
          .single();
        
        logEntry = newLogEntry;
      }

      // Sync to Stripe
      const result = await syncProductToStripe(product);
      
      if (result.success) {
        await updateProductStripeIds(
          product.id,
          result.stripe_product_id!,
          result.stripe_price_id!
        );
        await updateSyncLog(logEntry.id, 'success', result);
      } else {
        await updateSyncLog(logEntry.id, 'failed', result);
      }

      return new Response(
        JSON.stringify({
          success: result.success,
          product_id,
          stripe_product_id: result.stripe_product_id,
          stripe_price_id: result.stripe_price_id,
          error: result.error,
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (action === 'process_pending') {
      // Process pending sync operations
      console.log('Processing pending sync operations...');
      
      const { data: pendingLogs, error: fetchError } = await supabase
        .from('stripe_sync_log')
        .select('*, products(*)')
        .eq('status', 'pending')
        .lt('retry_count', 3)
        .order('created_at', { ascending: true })
        .limit(batch_size);

      if (fetchError) {
        throw new Error(`Failed to fetch pending operations: ${fetchError.message}`);
      }

      const results = [];
      let processedCount = 0;

      for (const log of pendingLogs || []) {
        if (!log.products) {
          await updateSyncLog(log.id, 'failed', { success: false, error: 'Product not found' });
          continue;
        }

        const result = await syncProductToStripe(log.products);
        
        if (result.success) {
          await updateProductStripeIds(
            log.products.id,
            result.stripe_product_id!,
            result.stripe_price_id!
          );
          await updateSyncLog(log.id, 'success', result);
        } else {
          await updateSyncLog(log.id, 'failed', result, log.retry_count + 1);
        }

        results.push({
          log_id: log.id,
          product_id: log.products.id,
          success: result.success,
          error: result.error,
        });

        processedCount++;

        // Rate limiting
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      return new Response(
        JSON.stringify({
          success: true,
          processed: processedCount,
          results,
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ error: 'Invalid action' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Sync error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});