/**
 * Production Migration Configuration
 * 
 * This file contains all configuration options for the Stripe migration system.
 * Modify these settings based on your environment and requirements.
 */

export const MIGRATION_CONFIG = {
  // Batch Processing
  BATCH_SIZE: 5, // Process 5 products at a time to respect rate limits
  MAX_CONCURRENT_REQUESTS: 3, // Maximum concurrent API requests
  
  // Rate Limiting (Stripe allows 100 req/sec, we use conservative limits)
  STRIPE_RATE_LIMIT_PER_SECOND: 25, // Conservative rate limit
  RATE_LIMIT_WINDOW_MS: 1000, // 1 second window
  
  // Retry Configuration
  MAX_RETRIES: 5, // Maximum retry attempts per operation
  INITIAL_RETRY_DELAY_MS: 1000, // Initial delay between retries
  MAX_RETRY_DELAY_MS: 30000, // Maximum delay between retries
  RETRY_BACKOFF_MULTIPLIER: 2, // Exponential backoff multiplier
  
  // Timeout Configuration
  SUPABASE_TIMEOUT_MS: 30000, // 30 second timeout for Supabase operations
  STRIPE_TIMEOUT_MS: 30000, // 30 second timeout for Stripe operations
  
  // Data Validation
  MIN_PRICE_CENTS: 50, // Minimum price in cents (0.50€)
  MAX_PRICE_CENTS: 100000000, // Maximum price in cents (1,000,000€)
  MAX_TITLE_LENGTH: 250, // Stripe product name limit
  MAX_DESCRIPTION_LENGTH: 5000, // Stripe description limit
  
  // Migration Strategy
  ENABLE_ROLLBACK: true, // Enable rollback capabilities
  BACKUP_BEFORE_MIGRATION: true, // Create backup before migration
  VERIFY_AFTER_MIGRATION: true, // Verify data after migration
  
  // Logging
  LOG_LEVEL: 'INFO', // DEBUG, INFO, WARN, ERROR
  LOG_TO_FILE: true, // Write logs to file
  LOG_FILE_PATH: './logs/migration.log',
  
  // Recovery
  CHECKPOINT_INTERVAL: 10, // Save progress every N products
  CHECKPOINT_FILE: './logs/migration-checkpoint.json',
  
  // Monitoring
  PROGRESS_REPORT_INTERVAL: 5, // Report progress every N products
  HEALTH_CHECK_INTERVAL: 50, // Check system health every N operations
};

export const ERROR_CODES = {
  // Supabase Errors
  SUPABASE_CONNECTION_FAILED: 'SUPABASE_CONNECTION_FAILED',
  SUPABASE_QUERY_TIMEOUT: 'SUPABASE_QUERY_TIMEOUT',
  SUPABASE_RLS_DENIED: 'SUPABASE_RLS_DENIED',
  SUPABASE_INVALID_RESPONSE: 'SUPABASE_INVALID_RESPONSE',
  
  // Stripe Errors
  STRIPE_RATE_LIMITED: 'STRIPE_RATE_LIMITED',
  STRIPE_INVALID_REQUEST: 'STRIPE_INVALID_REQUEST',
  STRIPE_AUTHENTICATION_FAILED: 'STRIPE_AUTHENTICATION_FAILED',
  STRIPE_NETWORK_ERROR: 'STRIPE_NETWORK_ERROR',
  STRIPE_DUPLICATE_PRODUCT: 'STRIPE_DUPLICATE_PRODUCT',
  
  // Data Validation Errors
  INVALID_PRODUCT_DATA: 'INVALID_PRODUCT_DATA',
  PRICE_OUT_OF_RANGE: 'PRICE_OUT_OF_RANGE',
  MISSING_REQUIRED_FIELD: 'MISSING_REQUIRED_FIELD',
  INVALID_CURRENCY: 'INVALID_CURRENCY',
  
  // Migration Errors
  MIGRATION_INTERRUPTED: 'MIGRATION_INTERRUPTED',
  ROLLBACK_FAILED: 'ROLLBACK_FAILED',
  CHECKPOINT_CORRUPTED: 'CHECKPOINT_CORRUPTED',
  VERIFICATION_FAILED: 'VERIFICATION_FAILED',
};

export const SUPPORTED_CURRENCIES = ['eur', 'usd', 'gbp'];

export const STRIPE_PRODUCT_METADATA_KEYS = {
  SUPABASE_ID: 'supabase_id',
  MIGRATION_BATCH: 'migration_batch',
  MIGRATION_TIMESTAMP: 'migration_timestamp',
  ORIGINAL_CATEGORY: 'original_category',
  ORIGINAL_SUBCATEGORY: 'original_subcategory',
};