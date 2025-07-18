#!/usr/bin/env node

/**
 * Production-Ready Stripe Migration Script
 * 
 * A comprehensive, fault-tolerant migration system for transferring CMS data to Stripe.
 * 
 * Features:
 * - Advanced error handling and retry mechanisms
 * - Rate limiting and adaptive throttling
 * - Checkpoint/recovery system for resumable migrations
 * - Comprehensive logging and monitoring
 * - Data validation and transformation
 * - Rollback capabilities
 * - Health checks and progress tracking
 * 
 * Usage:
 *   node scripts/production-migration/index.js [options]
 * 
 * Options:
 *   --dry-run              Run without making changes (default: false)
 *   --force-resync         Resync all products, even if already synced (default: false)
 *   --batch-size=N         Process N products at a time (default: 5)
 *   --no-checkpoint        Don't resume from checkpoint (default: false)
 *   --skip-validation      Skip data validation (default: false)
 *   --log-level=LEVEL      Set log level: DEBUG, INFO, WARN, ERROR (default: INFO)
 *   --help                 Show this help message
 * 
 * Environment Variables:
 *   VITE_SUPABASE_URL           - Your Supabase project URL
 *   SUPABASE_SERVICE_ROLE_KEY   - Your Supabase service role key
 *   STRIPE_SECRET_KEY           - Your Stripe secret key
 * 
 * Examples:
 *   # Preview what would be migrated (safe)
 *   node scripts/production-migration/index.js --dry-run
 * 
 *   # Migrate new products only
 *   node scripts/production-migration/index.js
 * 
 *   # Force resync all products with debug logging
 *   node scripts/production-migration/index.js --force-resync --log-level=DEBUG
 * 
 *   # Resume interrupted migration
 *   node scripts/production-migration/index.js
 * 
 *   # Process in smaller batches for rate limiting
 *   node scripts/production-migration/index.js --batch-size=3
 */

import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import MigrationEngine from './migration-engine.js';
import { MIGRATION_CONFIG } from './config.js';

// Load environment variables
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: join(__dirname, '../../.env') });

// Parse command line arguments
const args = process.argv.slice(2);
const options = {
  dryRun: args.includes('--dry-run'),
  forceResync: args.includes('--force-resync'),
  batchSize: parseInt(args.find(arg => arg.startsWith('--batch-size='))?.split('=')[1] || MIGRATION_CONFIG.BATCH_SIZE),
  resumeFromCheckpoint: !args.includes('--no-checkpoint'),
  skipValidation: args.includes('--skip-validation'),
  logLevel: args.find(arg => arg.startsWith('--log-level='))?.split('=')[1] || MIGRATION_CONFIG.LOG_LEVEL,
  help: args.includes('--help'),
};

// Update config with CLI options
if (options.logLevel) {
  MIGRATION_CONFIG.LOG_LEVEL = options.logLevel.toUpperCase();
}

if (options.help) {
  console.log(`
Production-Ready Stripe Migration Script

A comprehensive, fault-tolerant migration system for transferring CMS data to Stripe.

Usage:
  node scripts/production-migration/index.js [options]

Options:
  --dry-run              Run without making changes (default: false)
  --force-resync         Resync all products, even if already synced (default: false)
  --batch-size=N         Process N products at a time (default: ${MIGRATION_CONFIG.BATCH_SIZE})
  --no-checkpoint        Don't resume from checkpoint (default: false)
  --skip-validation      Skip data validation (default: false)
  --log-level=LEVEL      Set log level: DEBUG, INFO, WARN, ERROR (default: ${MIGRATION_CONFIG.LOG_LEVEL})
  --help                 Show this help message

Environment Variables:
  VITE_SUPABASE_URL           - Your Supabase project URL
  SUPABASE_SERVICE_ROLE_KEY   - Your Supabase service role key
  STRIPE_SECRET_KEY           - Your Stripe secret key

Examples:
  # Preview what would be migrated (safe)
  node scripts/production-migration/index.js --dry-run

  # Migrate new products only
  node scripts/production-migration/index.js

  # Force resync all products with debug logging
  node scripts/production-migration/index.js --force-resync --log-level=DEBUG

  # Resume interrupted migration
  node scripts/production-migration/index.js

  # Process in smaller batches for rate limiting
  node scripts/production-migration/index.js --batch-size=3

Features:
  ✅ Advanced error handling and retry mechanisms
  ✅ Rate limiting and adaptive throttling
  ✅ Checkpoint/recovery system for resumable migrations
  ✅ Comprehensive logging and monitoring
  ✅ Data validation and transformation
  ✅ Rollback capabilities
  ✅ Health checks and progress tracking
  ✅ Production-ready fault tolerance
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
  console.error('See the documentation for setup instructions.');
  process.exit(1);
}

// Validate options
if (options.batchSize < 1 || options.batchSize > 50) {
  console.error('❌ Batch size must be between 1 and 50');
  process.exit(1);
}

async function main() {
  let migrationEngine;
  
  try {
    console.log('🚀 Production Stripe Migration System');
    console.log('=====================================');
    console.log('Options:', options);
    console.log('');
    
    if (options.dryRun) {
      console.log('🔍 DRY RUN MODE - No changes will be made');
      console.log('');
    }
    
    // Initialize migration engine
    migrationEngine = new MigrationEngine(options);
    
    // Run migration
    const report = await migrationEngine.run();
    
    // Display final results
    console.log('\n📊 Migration Summary:');
    console.log('=====================');
    console.log(`   Total Processed: ${report.summary.totalProcessed}`);
    console.log(`   Successful: ${report.summary.successful}`);
    console.log(`   Failed: ${report.summary.failed}`);
    console.log(`   Skipped: ${report.summary.skipped}`);
    console.log(`   Success Rate: ${report.summary.successRate}`);
    console.log(`   Duration: ${report.summary.duration}`);
    console.log(`   Average Rate: ${report.summary.averageRate}`);
    
    if (report.errors.length > 0) {
      console.log('\n❌ Errors:');
      report.errors.slice(0, 10).forEach(error => {
        console.log(`   ${error.productTitle} (${error.productId}): ${error.error}`);
      });
      
      if (report.errors.length > 10) {
        console.log(`   ... and ${report.errors.length - 10} more errors (see log file for details)`);
      }
    }
    
    // Exit with appropriate code
    const exitCode = report.summary.failed > 0 ? 1 : 0;
    
    if (exitCode === 0) {
      console.log('\n✅ Migration completed successfully!');
    } else {
      console.log('\n⚠️  Migration completed with errors. Check the logs for details.');
    }
    
    process.exit(exitCode);
    
  } catch (error) {
    console.error('\n💥 Migration failed with critical error:');
    console.error(error.message);
    
    if (error.stack && options.logLevel === 'DEBUG') {
      console.error('\nStack trace:');
      console.error(error.stack);
    }
    
    console.error('\nTroubleshooting:');
    console.error('1. Check your environment variables');
    console.error('2. Verify Supabase and Stripe connectivity');
    console.error('3. Check the log file for detailed error information');
    console.error('4. Try running with --dry-run first');
    console.error('5. Use --log-level=DEBUG for more detailed output');
    
    if (migrationEngine) {
      const status = migrationEngine.getStatus();
      console.error('\nMigration status at failure:');
      console.error(`   Processed: ${status.processedCount}`);
      console.error(`   Successful: ${status.successCount}`);
      console.error(`   Failed: ${status.errorCount}`);
      
      if (status.processedCount > 0) {
        console.error('\nYou can resume the migration by running the script again.');
        console.error('The checkpoint system will continue from where it left off.');
      }
    }
    
    process.exit(1);
  }
}

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('💥 Unhandled Promise Rejection:', reason);
  process.exit(1);
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('💥 Uncaught Exception:', error);
  process.exit(1);
});

// Run the migration
main().catch(error => {
  console.error('💥 Unexpected error in main:', error);
  process.exit(1);
});