import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import Stripe from 'npm:stripe@17.7.0';
import { createClient } from 'npm:@supabase/supabase-js@2.49.1';

// Initialize Stripe with secret key from environment variables
const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', {
  apiVersion: '2023-10-16',
  appInfo: {
    name: 'Leen E-pood Migration',
    version: '1.0.0',
  },
});

// Initialize Supabase client
const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// CORS headers for all responses
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

interface MigrationOptions {
  dryRun?: boolean;
  batchSize?: number;
  forceResync?: boolean;
}

interface MigrationResult {
  success: boolean;
  processed: number;
  created: number;
  updated: number;
  skipped: number;
  failed: number;
  errors: Array<{ productId: string; error: string }>;
  summary: string;
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: corsHeaders,
    });
  }

  // Only allow POST requests
  if (req.method !== 'POST') {
    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      {
        status: 405,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }

  try {
    // Parse request body for options
    const body = await req.json().catch(() => ({}));
    const options: MigrationOptions = {
      dryRun: body.dryRun || false,
      batchSize: body.batchSize || 10,
      forceResync: body.forceResync || false,
    };

    console.log('Starting product migration with options:', options);

    // Perform the migration
    const result = await migrateProductsToStripe(options);

    return new Response(
      JSON.stringify(result),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Migration failed:', error);
    
    return new Response(
      JSON.stringify({ 
        success: false,
        error: error.message || 'Migration failed' 
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});

async function migrateProductsToStripe(options: MigrationOptions): Promise<MigrationResult> {
  const result: MigrationResult = {
    success: false,
    processed: 0,
    created: 0,
    updated: 0,
    skipped: 0,
    failed: 0,
    errors: [],
    summary: '',
  };

  try {
    console.log(`🚀 Starting migration (dry run: ${options.dryRun})`);

    // Fetch products from Supabase
    let query = supabase
      .from('products')
      .select('*')
      .order('created_at', { ascending: true });

    // If not forcing resync, only get products that haven't been synced
    if (!options.forceResync) {
      query = query.or('stripe_product_id.is.null,sync_status.neq.synced');
    }

    const { data: products, error: fetchError } = await query;

    if (fetchError) {
      throw new Error(`Failed to fetch products: ${fetchError.message}`);
    }

    if (!products || products.length === 0) {
      result.summary = 'No products found to migrate';
      result.success = true;
      return result;
    }

    console.log(`📦 Found ${products.length} products to process`);

    // Process products in batches
    const batchSize = options.batchSize || 10;
    for (let i = 0; i < products.length; i += batchSize) {
      const batch = products.slice(i, i + batchSize);
      console.log(`Processing batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(products.length / batchSize)}`);

      for (const product of batch) {
        try {
          await processProduct(product, options, result);
        } catch (error) {
          console.error(`Failed to process product ${product.id}:`, error);
          result.failed++;
          result.errors.push({
            productId: product.id,
            error: error.message,
          });
        }
        result.processed++;
      }

      // Add delay between batches to respect rate limits
      if (i + batchSize < products.length) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    // Generate summary
    result.summary = `Migration completed: ${result.processed} processed, ${result.created} created, ${result.updated} updated, ${result.skipped} skipped, ${result.failed} failed`;
    result.success = result.failed === 0;

    console.log('✅ Migration completed:', result.summary);
    return result;

  } catch (error) {
    console.error('❌ Migration failed:', error);
    result.summary = `Migration failed: ${error.message}`;
    throw error;
  }
}

async function processProduct(product: any, options: MigrationOptions, result: MigrationResult): Promise<void> {
  console.log(`🔄 Processing product: ${product.title} (ID: ${product.id})`);

  // Skip if already synced and not forcing resync
  if (!options.forceResync && product.stripe_product_id && product.sync_status === 'synced') {
    console.log(`⏭️ Skipping already synced product: ${product.title}`);
    result.skipped++;
    return;
  }

  // Validate product data
  if (!product.title || !product.price) {
    throw new Error('Product missing required fields (title or price)');
  }

  // Parse price from string format (e.g., "349€" -> 34900 cents)
  const priceAmount = parsePriceToAmount(product.price);
  if (priceAmount <= 0) {
    throw new Error(`Invalid price: ${product.price}`);
  }

  let stripeProductId = product.stripe_product_id;
  let stripePriceId = product.stripe_price_id;
  let isNewProduct = false;
  let isNewPrice = false;

  // Create or update Stripe Product
  if (!stripeProductId) {
    // Check if product exists in Stripe by name
    // Use metadata search instead of name search to avoid quote issues
    const existingProducts = await stripe.products.search({
      query: `metadata["supabase_id"]:"${product.id}"`,
      limit: 1,
    });

    if (existingProducts.data.length > 0) {
      stripeProductId = existingProducts.data[0].id;
      console.log(`📋 Found existing Stripe product: ${stripeProductId}`);
    } else {
      // Create new product in Stripe
      if (!options.dryRun) {
        const stripeProduct = await stripe.products.create({
          name: product.title,
          description: product.description || '',
          metadata: {
            supabase_id: product.id,
            category: product.category || '',
            subcategory: product.subcategory || '',
          }
          images: product.image ? [product.image] : [],
        });
        stripeProductId = stripeProduct.id;
        isNewProduct = true;
        console.log(`✨ Created new Stripe product: ${stripeProductId}`);
      } else {
        console.log(`🔍 [DRY RUN] Would create new Stripe product for: ${product.title}`);
        result.created++;
        return;
      }
    }
  }

  // Create or update Stripe Price
  if (!stripePriceId && stripeProductId) {
    // Check if price exists for this product
    const existingPrices = await stripe.prices.list({
      product: stripeProductId,
      active: true,
      limit: 1,
    });

    if (existingPrices.data.length > 0) {
      const existingPrice = existingPrices.data[0];
      if (existingPrice.unit_amount === priceAmount) {
        stripePriceId = existingPrice.id;
        console.log(`📋 Found existing Stripe price: ${stripePriceId}`);
      }
    }

    if (!stripePriceId && !options.dryRun) {
      // Create new price
      const stripePrice = await stripe.prices.create({
        product: stripeProductId,
        unit_amount: priceAmount,
        currency: 'eur',
        metadata: {
          supabase_id: product.id,
        },
      });
      stripePriceId = stripePrice.id;
      isNewPrice = true;
      console.log(`✨ Created new Stripe price: ${stripePriceId}`);
    }
  }

  // Update Supabase product with Stripe IDs
  if (!options.dryRun && (stripeProductId || stripePriceId)) {
    const updates: any = {
      sync_status: 'synced',
      last_synced_at: new Date().toISOString(),
    };

    if (stripeProductId) {
      updates.stripe_product_id = stripeProductId;
    }
    if (stripePriceId) {
      updates.stripe_price_id = stripePriceId;
    }

    const { error: updateError } = await supabase
      .from('products')
      .update(updates)
      .eq('id', product.id);

    if (updateError) {
      throw new Error(`Failed to update product in Supabase: ${updateError.message}`);
    }

    console.log(`💾 Updated Supabase product with Stripe IDs`);
  }

  // Update result counters
  if (isNewProduct || isNewPrice) {
    result.created++;
  } else {
    result.updated++;
  }
     query: `name:'${product.title}'`,
}

function parsePriceToAmount(priceString: string): number {
  if (typeof priceString === 'number') {
    return Math.round(priceString * 100);
  }
  
  if (!priceString || typeof priceString !== 'string') {
    return 0;
  }
  
  // Remove currency symbols and whitespace
  const cleanPrice = priceString.replace(/[€$£¥₹]/g, '').trim();
  
  // Replace comma with dot for decimal parsing
  const normalizedPrice = cleanPrice.replace(',', '.');
  
  // Parse as float and convert to cents
  const amount = parseFloat(normalizedPrice);
  
  return isNaN(amount) ? 0 : Math.round(amount * 100);
}