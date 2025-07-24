import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import Stripe from 'npm:stripe@17.7.0';
import { createClient } from 'npm:@supabase/supabase-js@2.49.1';

// Initialize Stripe
const stripeSecret = Deno.env.get('STRIPE_SECRET_KEY');
const stripe = new Stripe(stripeSecret || '', {
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
  console.log(`💰 Parsing price: "${priceString}"`);
  const cleanPrice = priceString.replace(/[€$£¥₹,]/g, '').trim();
  const price = parseFloat(cleanPrice);
  const priceInCents = isNaN(price) ? 0 : Math.round(price * 100);
  console.log(`💰 Price conversion: "${priceString}" → ${cleanPrice} → ${price} → ${priceInCents} cents`);
  return priceInCents;
}

// Create or update Stripe product
async function syncProductToStripe(product: ProductData): Promise<SyncResult> {
  try {
    console.log(`🔄 Starting sync for product: "${product.title}" (ID: ${product.id})`);
    console.log(`📊 Product data:`, {
      title: product.title,
      price: product.price,
      available: product.available,
      stripe_product_id: product.stripe_product_id,
      stripe_price_id: product.stripe_price_id
    });
    
    // Validate Stripe API key
    if (!stripeSecret) {
      throw new Error('STRIPE_SECRET_KEY environment variable is not set');
    }
    
    const sanitizedName = sanitizeProductName(product.title);
    const priceInCents = parsePrice(product.price);
    
    if (priceInCents <= 0) {
      throw new Error(`Invalid price: ${product.price} → ${priceInCents} cents`);
    }

    console.log(`🏷️ Sanitized name: "${sanitizedName}"`);
    console.log(`💰 Price in cents: ${priceInCents}`);

    let stripeProduct: Stripe.Product;
    
    // Check if product already exists in Stripe
    if (product.stripe_product_id) {
      console.log(`🔍 Checking existing Stripe product: ${product.stripe_product_id}`);
      try {
        stripeProduct = await stripe.products.retrieve(product.stripe_product_id);
        console.log(`✅ Found existing Stripe product: ${stripeProduct.id}`);
        
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
      } catch (error: any) {
        if (error.code === 'resource_missing') {
          console.log(`⚠️ Stripe product ${product.stripe_product_id} not found, creating new one`);
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
          
          console.log(`✅ Created new Stripe product: ${stripeProduct.id}`);
        } else {
          console.error(`❌ Error retrieving/updating Stripe product:`, error);
          throw error;
        }
      }
    } else {
      console.log(`🆕 Creating new Stripe product for: "${sanitizedName}"`);
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
      
      console.log(`✅ Created new Stripe product: ${stripeProduct.id}`);
    }

    // Handle price
    let stripePrice: Stripe.Price;
    
    if (product.stripe_price_id) {
      console.log(`🔍 Checking existing Stripe price: ${product.stripe_price_id}`);
      try {
        stripePrice = await stripe.prices.retrieve(product.stripe_price_id);
        console.log(`✅ Found existing Stripe price: ${stripePrice.id} (${stripePrice.unit_amount} cents)`);
        
        // Check if price needs updating
        if (stripePrice.unit_amount !== priceInCents || !stripePrice.active) {
          console.log(`🔄 Price needs updating: ${stripePrice.unit_amount} → ${priceInCents} cents`);
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
          
          console.log(`✅ Created new Stripe price: ${stripePrice.id}`);
        }
      } catch (error: any) {
        if (error.code === 'resource_missing') {
          console.log(`⚠️ Stripe price ${product.stripe_price_id} not found, creating new one`);
          // Price doesn't exist, create new one
          stripePrice = await stripe.prices.create({
            product: stripeProduct.id,
            unit_amount: priceInCents,
            currency: 'eur',
            metadata: {
              cms_product_id: product.id,
            },
          });
          
          console.log(`✅ Created new Stripe price: ${stripePrice.id}`);
        } else {
          console.error(`❌ Error retrieving/updating Stripe price:`, error);
          throw error;
        }
      }
    } else {
      console.log(`🆕 Creating new Stripe price for product: ${stripeProduct.id}`);
      // Create new price
      stripePrice = await stripe.prices.create({
        product: stripeProduct.id,
        unit_amount: priceInCents,
        currency: 'eur',
        metadata: {
          cms_product_id: product.id,
        },
      });
      
      console.log(`✅ Created new Stripe price: ${stripePrice.id}`);
    }

    console.log(`🎉 Successfully synced product "${product.title}"`);
    console.log(`📋 Final result: Product ID: ${stripeProduct.id}, Price ID: ${stripePrice.id}`);

    return {
      success: true,
      stripe_product_id: stripeProduct.id,
      stripe_price_id: stripePrice.id,
    };
  } catch (error: any) {
    console.error(`❌ Error syncing product "${product.title}" (${product.id}):`, error);
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
  console.log(`📝 Updating sync log ${logId}: ${status}`);
  
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

  const { error } = await supabase
    .from('stripe_sync_log')
    .update(updateData)
    .eq('id', logId);

  if (error) {
    console.error('❌ Error updating sync log:', error);
  } else {
    console.log(`✅ Updated sync log ${logId}`);
  }
}

// Update product with Stripe IDs
async function updateProductStripeIds(
  productId: string,
  stripeProductId: string,
  stripePriceId: string
) {
  console.log(`📝 Updating product ${productId} with Stripe IDs`);
  
  const { error } = await supabase
    .from('products')
    .update({
      stripe_product_id: stripeProductId,
      stripe_price_id: stripePriceId,
      sync_status: 'synced',
      last_synced_at: new Date().toISOString(),
    })
    .eq('id', productId);

  if (error) {
    console.error('❌ Error updating product Stripe IDs:', error);
  } else {
    console.log(`✅ Updated product ${productId} with Stripe IDs`);
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
    const { action, product_id, batch_size = 3 } = await req.json();
    console.log(`📥 Received request: action="${action}", batch_size=${batch_size}`);

    // Check environment variables
    console.log(`🔧 Environment check:`);
    console.log(`- STRIPE_SECRET_KEY: ${stripeSecret ? 'SET' : 'MISSING'}`);
    console.log(`- SUPABASE_URL: ${Deno.env.get('SUPABASE_URL') ? 'SET' : 'MISSING'}`);
    console.log(`- SUPABASE_SERVICE_ROLE_KEY: ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ? 'SET' : 'MISSING'}`);

    if (action === 'debug_products') {
      console.log(`🔍 Debug: Fetching products from database...`);
      
      // Get all products to see what we have
      const { data: allProducts, error: allError } = await supabase
        .from('products')
        .select('id, title, price, available, stripe_product_id, stripe_price_id, sync_status')
        .limit(20);

      console.log(`📊 Database query result:`, { 
        error: allError, 
        count: allProducts?.length || 0,
        products: allProducts 
      });

      if (allError) {
        console.error(`❌ Database error:`, allError);
        return new Response(
          JSON.stringify({ 
            success: false, 
            error: `Database error: ${allError.message}`,
            products: [],
            count: 0 
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      return new Response(
        JSON.stringify({
          success: true,
          products: allProducts || [],
          count: allProducts?.length || 0,
          debug_info: {
            stripe_key_present: !!stripeSecret,
            supabase_url_present: !!Deno.env.get('SUPABASE_URL'),
            service_key_present: !!Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
          }
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (action === 'migrate_all') {
      console.log(`🚀 Starting migration of all products...`);
      
      // First check what products we have
      const { data: allProducts, error: allError } = await supabase
        .from('products')
        .select('*')
        .limit(50);

      console.log(`📊 Total products in database: ${allProducts?.length || 0}`);
      
      if (allError) {
        console.error(`❌ Error fetching all products:`, allError);
        throw new Error(`Database error: ${allError.message}`);
      }

      if (allProducts) {
        allProducts.forEach((p, index) => {
          console.log(`📦 Product ${index + 1}: "${p.title}" - Available: ${p.available} - Stripe Product: ${p.stripe_product_id || 'MISSING'} - Stripe Price: ${p.stripe_price_id || 'MISSING'}`);
        });
      }

      // Get products that need syncing - be more aggressive in finding them
      const { data: products, error: fetchError } = await supabase
        .from('products')
        .select('*')
        .eq('available', true) // Only sync available products
        .limit(batch_size);

      console.log(`🔍 Query for available products returned: ${products?.length || 0} products`);

      if (fetchError) {
        console.error('❌ Error fetching products for migration:', fetchError);
        throw new Error(`Failed to fetch products: ${fetchError.message}`);
      }

      if (!products || products.length === 0) {
        console.log(`⚠️ No available products found in database`);
        return new Response(
          JSON.stringify({
            success: true,
            migrated: 0,
            failed: 0,
            message: 'No available products found in database',
            results: [],
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Filter products that actually need syncing
      const productsToSync = products.filter(p => !p.stripe_product_id || !p.stripe_price_id);
      console.log(`🎯 Products that need syncing: ${productsToSync.length} out of ${products.length}`);

      if (productsToSync.length === 0) {
        console.log(`✅ All available products are already synced`);
        return new Response(
          JSON.stringify({
            success: true,
            migrated: 0,
            failed: 0,
            message: 'All available products are already synced to Stripe',
            results: [],
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const results = [];
      let successCount = 0;
      let failureCount = 0;

      for (const product of productsToSync) {
        console.log(`\n🔄 Processing product ${successCount + failureCount + 1}/${productsToSync.length}: "${product.title}"`);
        
        // Create sync log entry
        const { data: logEntry, error: logError } = await supabase
          .from('stripe_sync_log')
          .insert({
            product_id: product.id,
            operation: 'migrate',
            status: 'pending',
            metadata: { batch_migration: true },
          })
          .select()
          .single();

        if (logError) {
          console.error(`❌ Error creating log entry for "${product.title}":`, logError);
          failureCount++;
          results.push({
            product_id: product.id,
            product_title: product.title,
            success: false,
            error: `Failed to create log entry: ${logError.message}`,
          });
          continue;
        }

        console.log(`📝 Created sync log entry: ${logEntry.id}`);

        // Sync to Stripe
        const result = await syncProductToStripe(product);
        
        console.log(`📊 Sync result for "${product.title}":`, result);
        
        if (result.success) {
          await updateProductStripeIds(
            product.id,
            result.stripe_product_id!,
            result.stripe_price_id!
          );
          await updateSyncLog(logEntry.id, 'success', result);
          successCount++;
          console.log(`✅ Successfully synced: "${product.title}"`);
        } else {
          await updateSyncLog(logEntry.id, 'failed', result);
          failureCount++;
          console.log(`❌ Failed to sync: "${product.title}" - ${result.error}`);
        }

        results.push({
          product_id: product.id,
          product_title: product.title,
          success: result.success,
          error: result.error,
          stripe_product_id: result.stripe_product_id,
          stripe_price_id: result.stripe_price_id,
        });

        // Rate limiting: wait 500ms between requests to be safe
        console.log(`⏱️ Waiting 500ms before next product...`);
        await new Promise(resolve => setTimeout(resolve, 500));
      }

      console.log(`\n🎯 Migration completed:`);
      console.log(`✅ Success: ${successCount}`);
      console.log(`❌ Failed: ${failureCount}`);
      console.log(`📊 Total processed: ${successCount + failureCount}`);

      return new Response(
        JSON.stringify({
          success: true,
          migrated: successCount,
          failed: failureCount,
          total_available: products.length,
          total_processed: productsToSync.length,
          results,
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (action === 'sync_product' && product_id) {
      console.log(`🔄 Syncing single product: ${product_id}`);
      
      const { data: product, error: fetchError } = await supabase
        .from('products')
        .select('*')
        .eq('id', product_id)
        .single();

      if (fetchError || !product) {
        console.error(`❌ Product not found: ${product_id}`, fetchError);
        throw new Error(`Product not found: ${product_id}`);
      }

      console.log(`📦 Found product: "${product.title}"`);

      // Create sync log entry
      const { data: logEntry } = await supabase
        .from('stripe_sync_log')
        .insert({
          product_id: product.id,
          operation: 'create',
          status: 'pending',
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
      } else {
        await updateSyncLog(logEntry.id, 'failed', result);
      }

      return new Response(
        JSON.stringify({
          success: result.success,
          product_id,
          product_title: product.title,
          stripe_product_id: result.stripe_product_id,
          stripe_price_id: result.stripe_price_id,
          error: result.error,
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ error: 'Invalid action. Supported actions: migrate_all, sync_product, debug_products' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('❌ Function error:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message,
        stack: error.stack 
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});