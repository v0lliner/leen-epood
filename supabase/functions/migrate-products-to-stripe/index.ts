import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import Stripe from 'npm:stripe@17.7.0';
import { createClient } from 'npm:@supabase/supabase-js@2.49.1';

// Initialize Stripe
const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', {
  apiVersion: '2023-10-16',
});

// Initialize Supabase
const supabase = createClient(
  Deno.env.get('SUPABASE_URL') || '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
);

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

Deno.serve(async (req) => {
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
    const { forceResync = false, dryRun = false } = await req.json().catch(() => ({}));
    
    console.log('🚀 Starting simple migration', { forceResync, dryRun });

    // Get products that need migration
    let query = supabase
      .from('products')
      .select('id, title, price, description, category, subcategory, image')
      .order('created_at', { ascending: true });

    if (!forceResync) {
      query = query.is('stripe_product_id', null);
    }

    const { data: products, error: fetchError } = await query;

    if (fetchError) {
      throw new Error(`Failed to fetch products: ${fetchError.message}`);
    }

    if (!products || products.length === 0) {
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'No products found to migrate',
          processed: 0,
          created: 0,
          updated: 0,
          failed: 0
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`📦 Found ${products.length} products to migrate`);

    let created = 0;
    let updated = 0;
    let failed = 0;
    const errors = [];

    // Process each product one by one
    for (const product of products) {
      try {
        console.log(`Processing: ${product.title}`);

        if (dryRun) {
          console.log(`[DRY RUN] Would create Stripe product for: ${product.title}`);
          created++;
          continue;
        }

        // Parse price to cents
        const priceAmount = parsePriceToAmount(product.price);
        if (priceAmount <= 0) {
          throw new Error(`Invalid price: ${product.price}`);
        }

        // Create Stripe product
        console.log('Creating Stripe product...');
        const stripeProduct = await stripe.products.create({
          name: product.title,
          description: product.description || '',
          metadata: {
            supabase_id: product.id,
            category: product.category || '',
            subcategory: product.subcategory || '',
          },
          images: product.image ? [product.image] : [],
        });

        console.log(`✅ Created Stripe product: ${stripeProduct.id}`);

        // Create Stripe price
        console.log('Creating Stripe price...');
        const stripePrice = await stripe.prices.create({
          product: stripeProduct.id,
          unit_amount: priceAmount,
          currency: 'eur',
          metadata: {
            supabase_id: product.id,
          },
        });

        console.log(`✅ Created Stripe price: ${stripePrice.id}`);

        // Update Supabase
        console.log('Updating Supabase...');
        const { error: updateError } = await supabase
          .from('products')
          .update({
            stripe_product_id: stripeProduct.id,
            stripe_price_id: stripePrice.id,
            sync_status: 'synced',
            last_synced_at: new Date().toISOString(),
          })
          .eq('id', product.id);

        if (updateError) {
          console.error('Supabase update error:', updateError);
          // Try to clean up Stripe objects if Supabase update fails
          try {
            await stripe.products.del(stripeProduct.id);
          } catch (cleanupError) {
            console.error('Failed to cleanup Stripe product:', cleanupError);
          }
          throw new Error(`Failed to update Supabase: ${updateError.message}`);
        }

        console.log(`✅ Updated Supabase for product: ${product.title}`);
        
        if (product.stripe_product_id) {
          updated++;
        } else {
          created++;
        }

        // Small delay to be gentle on APIs
        await new Promise(resolve => setTimeout(resolve, 200));

      } catch (error) {
        console.error(`❌ Failed to process ${product.title}:`, error.message);
        failed++;
        errors.push({
          productId: product.id,
          productTitle: product.title,
          error: error.message
        });
      }
    }

    const result = {
      success: failed === 0,
      processed: products.length,
      created,
      updated,
      failed,
      errors,
      message: `Migration completed: ${created} created, ${updated} updated, ${failed} failed`
    };

    console.log('📊 Migration result:', result);

    return new Response(
      JSON.stringify(result),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('❌ Migration failed:', error);
    return new Response(
      JSON.stringify({ 
        success: false,
        error: error.message || 'Migration failed',
        processed: 0,
        created: 0,
        updated: 0,
        failed: 0
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

function parsePriceToAmount(priceString) {
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