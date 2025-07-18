#!/usr/bin/env node

/**
 * Stripe Product Migration Script
 * 
 * This script synchronizes product data between Supabase and Stripe.
 * It creates Stripe Products and Prices for each product in your Supabase database.
 * 
 * Usage:
 *   node scripts/migrate-products-to-stripe.js [options]
 * 
 * Options:
 *   --dry-run          Run without making changes (default: false)
 *   --batch-size=N     Process N products at a time (default: 10)
 *   --force-resync     Resync all products, even if already synced (default: false)
 *   --help             Show this help message
 * 
 * Environment Variables:
 *   VITE_SUPABASE_URL           - Your Supabase project URL
 *   SUPABASE_SERVICE_ROLE_KEY   - Your Supabase service role key
 *   STRIPE_SECRET_KEY           - Your Stripe secret key
 */

import { createClient } from '@supabase/supabase-js';
import Stripe from 'stripe';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Load environment variables
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: join(__dirname, '../.env') });

// Parse command line arguments
const args = process.argv.slice(2);
const options = {
  dryRun: args.includes('--dry-run'),
  batchSize: parseInt(args.find(arg => arg.startsWith('--batch-size='))?.split('=')[1] || '10'),
  forceResync: args.includes('--force-resync'),
  help: args.includes('--help'),
};

if (options.help) {
  console.log(`
Stripe Product Migration Script

This script synchronizes product data between Supabase and Stripe.

Usage:
  node scripts/migrate-products-to-stripe.js [options]

Options:
  --dry-run          Run without making changes (default: false)
  --batch-size=N     Process N products at a time (default: 10)
  --force-resync     Resync all products, even if already synced (default: false)
  --help             Show this help message

Environment Variables:
  VITE_SUPABASE_URL           - Your Supabase project URL
  SUPABASE_SERVICE_ROLE_KEY   - Your Supabase service role key
  STRIPE_SECRET_KEY           - Your Stripe secret key

Examples:
  # Dry run to see what would be migrated
  node scripts/migrate-products-to-stripe.js --dry-run

  # Migrate products in smaller batches
  node scripts/migrate-products-to-stripe.js --batch-size=5

  # Force resync all products
  node scripts/migrate-products-to-stripe.js --force-resync
  `);
  process.exit(0);
}

// Validate environment variables
const requiredEnvVars = {
  VITE_SUPABASE_URL: process.env.VITE_SUPABASE_URL,
  SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
  STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY,
};

const missingVars = Object.entries(requiredEnvVars)
  .filter(([key, value]) => !value)
  .map(([key]) => key);

if (missingVars.length > 0) {
  console.error('❌ Missing required environment variables:');
  missingVars.forEach(varName => console.error(`   ${varName}`));
  console.error('\nPlease check your .env file and ensure all required variables are set.');
  process.exit(1);
}

// Initialize clients
const supabase = createClient(
  requiredEnvVars.VITE_SUPABASE_URL,
  requiredEnvVars.SUPABASE_SERVICE_ROLE_KEY
);

const stripe = new Stripe(requiredEnvVars.STRIPE_SECRET_KEY, {
  apiVersion: '2023-10-16',
  appInfo: {
    name: 'Leen E-pood Migration Script',
    version: '1.0.0',
  },
});

// Migration result interface
class MigrationResult {
  constructor() {
    this.success = false;
    this.processed = 0;
    this.created = 0;
    this.updated = 0;
    this.skipped = 0;
    this.failed = 0;
    this.errors = [];
    this.summary = '';
  }
}

async function main() {
  console.log('🚀 Starting Stripe Product Migration');
  console.log('Options:', options);
  console.log('');

  if (options.dryRun) {
    console.log('🔍 DRY RUN MODE - No changes will be made');
    console.log('');
  }

  try {
    const result = await migrateProductsToStripe(options);
    
    console.log('\n📊 Migration Summary:');
    console.log(`   Processed: ${result.processed}`);
    console.log(`   Created: ${result.created}`);
    console.log(`   Updated: ${result.updated}`);
    console.log(`   Skipped: ${result.skipped}`);
    console.log(`   Failed: ${result.failed}`);
    
    if (result.errors.length > 0) {
      console.log('\n❌ Errors:');
      result.errors.forEach(error => {
        console.log(`   Product ${error.productId}: ${error.error}`);
      });
    }
    
    console.log(`\n${result.success ? '✅' : '❌'} ${result.summary}`);
    
    process.exit(result.success ? 0 : 1);
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    process.exit(1);
  }
}

async function migrateProductsToStripe(options) {
  const result = new MigrationResult();

  try {
    console.log('📦 Fetching products from Supabase...');

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

    console.log(`📋 Found ${products.length} products to process\n`);

    // Process products in batches
    const batchSize = options.batchSize || 10;
    for (let i = 0; i < products.length; i += batchSize) {
      const batch = products.slice(i, i + batchSize);
      const batchNum = Math.floor(i / batchSize) + 1;
      const totalBatches = Math.ceil(products.length / batchSize);
      
      console.log(`🔄 Processing batch ${batchNum}/${totalBatches} (${batch.length} products)`);

      for (const product of batch) {
        try {
          await processProduct(product, options, result);
        } catch (error) {
          console.error(`❌ Failed to process product ${product.id} (${product.title}):`, error.message);
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
        console.log('⏳ Waiting 1 second before next batch...\n');
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    // Generate summary
    result.summary = `Migration completed: ${result.processed} processed, ${result.created} created, ${result.updated} updated, ${result.skipped} skipped, ${result.failed} failed`;
    result.success = result.failed === 0;

    return result;

  } catch (error) {
    result.summary = `Migration failed: ${error.message}`;
    throw error;
  }
}

async function processProduct(product, options, result) {
  const productLog = `${product.title} (ID: ${product.id})`;
  
  // Skip if already synced and not forcing resync
  if (!options.forceResync && product.stripe_product_id && product.sync_status === 'synced') {
    console.log(`⏭️  Skipping already synced: ${productLog}`);
    result.skipped++;
    return;
  }

  console.log(`🔄 Processing: ${productLog}`);

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
    console.log(`   🔍 Checking for existing Stripe product...`);
    
    try {
      const existingProducts = await stripe.products.search({
        query: `name:"${product.title}"`,
        limit: 1,
      });

      if (existingProducts.data.length > 0) {
        stripeProductId = existingProducts.data[0].id;
        console.log(`   📋 Found existing Stripe product: ${stripeProductId}`);
      } else {
        // Create new product in Stripe
        if (!options.dryRun) {
          console.log(`   ✨ Creating new Stripe product...`);
          
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
          
          stripeProductId = stripeProduct.id;
          isNewProduct = true;
          console.log(`   ✅ Created Stripe product: ${stripeProductId}`);
        } else {
          console.log(`   🔍 [DRY RUN] Would create new Stripe product`);
          result.created++;
          return;
        }
      }
    } catch (error) {
      if (error.code === 'rate_limit') {
        console.log(`   ⏳ Rate limit hit, waiting 5 seconds...`);
        await new Promise(resolve => setTimeout(resolve, 5000));
        // Retry the operation
        return await processProduct(product, options, result);
      }
      throw error;
    }
  }

  // Create or update Stripe Price
  if (!stripePriceId && stripeProductId) {
    console.log(`   🔍 Checking for existing Stripe price...`);
    
    try {
      // Check if price exists for this product
      const existingPrices = await stripe.prices.list({
        product: stripeProductId,
        active: true,
        limit: 10,
      });

      const matchingPrice = existingPrices.data.find(price => 
        price.unit_amount === priceAmount && price.currency === 'eur'
      );

      if (matchingPrice) {
        stripePriceId = matchingPrice.id;
        console.log(`   📋 Found existing Stripe price: ${stripePriceId}`);
      } else if (!options.dryRun) {
        // Create new price
        console.log(`   ✨ Creating new Stripe price...`);
        
        const stripePrice = await stripe.prices.create({
          product: stripeProductId,
          unit_amount: priceAmount,
          currency: 'eur',
        }
        )
        // Use metadata search instead of name search to avoid quote issues
        const existingProducts = await stripe.products.search({
          query: `metadata["supabase_id"]:"${product.id}"`,
          limit: 1,
        });
        
        stripePriceId = stripePrice.id;
        isNewPrice = true;
        console.log(`   ✅ Created Stripe price: ${stripePriceId} (${priceAmount} cents)`);
      }
    } catch (error) {
      if (error.code === 'rate_limit') {
        console.log(`   ⏳ Rate limit hit, waiting 5 seconds...`);
        await new Promise(resolve => setTimeout(resolve, 5000));
        // Retry the operation
        return await processProduct(product, options, result);
      }
      throw error;
    }
  }

  // Update Supabase product with Stripe IDs
  if (!options.dryRun && (stripeProductId || stripePriceId)) {
    console.log(`   💾 Updating Supabase product...`);
    
    const updates = {
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

    console.log(`   ✅ Updated Supabase product with Stripe IDs`);
  }

  // Update result counters
  if (isNewProduct || isNewPrice) {
    result.created++;
    console.log(`   🎉 Successfully created new Stripe resources`);
  } else {
    result.updated++;
    console.log(`   🔄 Successfully updated existing resources`);
  }
  
  console.log(''); // Add spacing between products
}

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

// Run the migration
main().catch(error => {
  console.error('💥 Unexpected error:', error);
  process.exit(1);
});