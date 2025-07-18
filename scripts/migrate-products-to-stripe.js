#!/usr/bin/env node

/**
 * Stripe Product Migration Script (Edge Function Client)
 * 
 * This script triggers the Supabase Edge Function to perform the actual migration.
 * All heavy lifting is done server-side for better reliability and performance.
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
 *   SUPABASE_SERVICE_ROLE_KEY   - Your Supabase service role key (for Edge Function auth)
 */

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
Stripe Product Migration Script (Edge Function Client)

This script triggers the Supabase Edge Function to perform the actual migration.
All heavy lifting is done server-side for better reliability and performance.

Usage:
  node scripts/migrate-products-to-stripe.js [options]

Options:
  --dry-run          Run without making changes (default: false)
  --batch-size=N     Process N products at a time (default: 10)
  --force-resync     Resync all products, even if already synced (default: false)
  --help             Show this help message

Environment Variables:
  VITE_SUPABASE_URL           - Your Supabase project URL
  SUPABASE_SERVICE_ROLE_KEY   - Your Supabase service role key (for Edge Function auth)

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

async function main() {
  console.log('🚀 Starting Stripe Product Migration (via Edge Function)');
  console.log('Options:', options);
  console.log('');

  if (options.dryRun) {
    console.log('🔍 DRY RUN MODE - No changes will be made');
    console.log('');
  }

  try {
    console.log('📡 Triggering Edge Function migration...');
    
    const result = await triggerEdgeFunctionMigration(options);
    
    console.log('\n📊 Migration Summary:');
    console.log(`   Processed: ${result.processed}`);
    console.log(`   Created: ${result.created}`);
    console.log(`   Updated: ${result.updated}`);
    console.log(`   Skipped: ${result.skipped}`);
    console.log(`   Failed: ${result.failed}`);
    
    if (result.errors && result.errors.length > 0) {
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

async function triggerEdgeFunctionMigration(options) {
  const edgeFunctionUrl = `${requiredEnvVars.VITE_SUPABASE_URL}/functions/v1/migrate-products-to-stripe`;
  
  console.log(`🔗 Edge Function URL: ${edgeFunctionUrl}`);
  
  try {
    const response = await fetch(edgeFunctionUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${requiredEnvVars.SUPABASE_SERVICE_ROLE_KEY}`,
      },
      body: JSON.stringify({
        dryRun: options.dryRun,
        batchSize: options.batchSize,
        forceResync: options.forceResync,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      let errorMessage;
      
      try {
        const errorData = JSON.parse(errorText);
        errorMessage = errorData.error || errorData.message || 'Unknown error';
      } catch {
        errorMessage = errorText || `HTTP ${response.status}: ${response.statusText}`;
      }
      
      throw new Error(`Edge Function failed (${response.status}): ${errorMessage}`);
    }

    const result = await response.json();
    
    if (!result.success && result.error) {
      throw new Error(`Edge Function error: ${result.error}`);
    }
    
    return result;
  } catch (error) {
    if (error.name === 'TypeError' && error.message.includes('fetch')) {
      throw new Error(`Failed to connect to Edge Function. Please check:\n  - Supabase URL is correct\n  - Edge Function is deployed\n  - Network connectivity\n  Original error: ${error.message}`);
    }
    
    throw error;
  }
}

// Run the migration
main().catch(error => {
  console.error('💥 Unexpected error:', error);
  process.exit(1);
});