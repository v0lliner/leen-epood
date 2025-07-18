# Stripe Product Migration & Synchronization Guide

## Overview

This guide explains how to migrate existing products to Stripe and maintain ongoing synchronization between your CMS and Stripe.

## Architecture

### Components

1. **Database Schema**
   - `products` table with Stripe-related fields
   - `stripe_sync_log` table for tracking operations
   - Triggers for automatic synchronization

2. **Edge Function**
   - `stripe-product-sync` - Handles all sync operations
   - Supports batch migration, single product sync, and retry logic

3. **Frontend Interface**
   - Admin panel for managing synchronization
   - Real-time status monitoring
   - Manual migration controls

## Migration Process

### Step 1: Initial Setup

1. Ensure your Stripe API keys are configured in Supabase:
   ```
   STRIPE_SECRET_KEY=sk_test_...
   STRIPE_PUBLISHABLE_KEY=pk_test_...
   ```

2. Run the database migration:
   ```sql
   -- This adds the necessary fields and triggers
   -- See: supabase/migrations/20250115_stripe_product_sync.sql
   ```

### Step 2: Product Field Mapping

| CMS Field | Stripe Product Field | Stripe Price Field | Notes |
|-----------|---------------------|-------------------|-------|
| `title` | `name` | - | Sanitized for special characters |
| `description` | `description` | - | Optional |
| `price` | - | `unit_amount` | Converted to cents |
| `image` | `images[0]` | - | Single image URL |
| `category` | `metadata.category` | - | Stored as metadata |
| `subcategory` | `metadata.subcategory` | - | Stored as metadata |
| `available` | `active` | `active` | Controls visibility |
| `id` | `metadata.cms_product_id` | `metadata.cms_product_id` | For linking |

### Step 3: Migration Execution

1. **Access the Admin Panel**
   - Navigate to `/admin/stripe-sync`
   - Review the sync status overview

2. **Run Migration**
   - Click "Start Migration" to begin batch migration
   - Monitor progress in real-time
   - Review results for any failures

3. **Handle Failures**
   - Failed products are logged with error details
   - Use "Process Pending" to retry failed operations
   - Manual intervention may be needed for complex issues

## Automatic Synchronization

### How It Works

1. **Database Triggers**
   - Automatically triggered on product INSERT/UPDATE
   - Creates entries in `stripe_sync_log` table
   - Only syncs available products with required fields

2. **Background Processing**
   - Edge function processes pending sync operations
   - Implements rate limiting to respect Stripe API limits
   - Automatic retry logic for failed operations

3. **Error Handling**
   - Failed operations are retried up to 3 times
   - Detailed error logging for troubleshooting
   - Status tracking for monitoring

### Sync Statuses

- **pending**: Waiting to be synced
- **synced**: Successfully synchronized
- **failed**: Sync failed after retries

## Constraints & Limitations

### Supabase Constraints

1. **Row Limits**
   - Free tier: 500MB database size
   - Batch processing to handle large datasets

2. **API Rate Limits**
   - Edge functions: 500,000 invocations/month (free tier)
   - Implemented batching and delays

3. **Function Timeout**
   - 30-second timeout for edge functions
   - Batch processing to stay within limits

### Stripe Constraints

1. **API Rate Limits**
   - 100 requests/second in test mode
   - 25 requests/second in live mode
   - Implemented 100ms delays between requests

2. **Product Limitations**
   - Product names: 5,000 characters max
   - Metadata: 50 keys, 500 characters per value
   - Images: 8 images max per product

3. **Price Limitations**
   - Prices are immutable once created
   - New prices created for price changes
   - Old prices are deactivated

## Error Handling

### Common Issues & Solutions

1. **Special Characters in Product Names**
   ```javascript
   // Automatic sanitization
   function sanitizeProductName(name) {
     return name
       .replace(/[""'']/g, '"') // Replace smart quotes
       .replace(/[^\w\s\-\.\(\)]/g, '') // Remove special chars
       .trim();
   }
   ```

2. **Invalid Prices**
   ```javascript
   // Price validation and conversion
   function parsePrice(priceString) {
     const cleanPrice = priceString.replace(/[€$£¥₹,]/g, '').trim();
     const price = parseFloat(cleanPrice);
     return isNaN(price) ? 0 : Math.round(price * 100);
   }
   ```

3. **Network Failures**
   - Automatic retry with exponential backoff
   - Detailed error logging
   - Manual retry options in admin panel

## Testing Strategy

### Pre-Migration Testing

1. **Validate Product Data**
   ```sql
   -- Check for products with invalid data
   SELECT id, title, price 
   FROM products 
   WHERE available = true 
   AND (title IS NULL OR price IS NULL OR price = '');
   ```

2. **Test Single Product Sync**
   - Use the admin panel to sync a single test product
   - Verify Stripe product and price creation
   - Check metadata mapping

### Post-Migration Validation

1. **Verify Sync Status**
   ```sql
   -- Check sync completion
   SELECT 
     sync_status,
     COUNT(*) as count
   FROM products 
   WHERE available = true
   GROUP BY sync_status;
   ```

2. **Validate Stripe Data**
   - Check Stripe dashboard for created products
   - Verify price accuracy and currency
   - Confirm metadata mapping

### Ongoing Monitoring

1. **Sync Log Monitoring**
   ```sql
   -- Check for recent failures
   SELECT *
   FROM stripe_sync_log
   WHERE status = 'failed'
   AND created_at > NOW() - INTERVAL '24 hours'
   ORDER BY created_at DESC;
   ```

2. **Performance Monitoring**
   - Monitor edge function execution times
   - Track API rate limit usage
   - Monitor error rates

## Rollback Procedures

### Emergency Rollback

1. **Disable Automatic Sync**
   ```sql
   -- Disable the trigger temporarily
   DROP TRIGGER IF EXISTS trigger_product_sync ON products;
   ```

2. **Clear Stripe References**
   ```sql
   -- Remove Stripe IDs (if needed)
   UPDATE products 
   SET stripe_product_id = NULL, 
       stripe_price_id = NULL, 
       sync_status = 'pending'
   WHERE stripe_product_id IS NOT NULL;
   ```

3. **Delete Stripe Products** (if necessary)
   - Use Stripe dashboard or API to remove products
   - Consider deactivating instead of deleting

## Maintenance

### Regular Tasks

1. **Monitor Sync Status**
   - Check admin panel weekly
   - Process any pending operations
   - Review failed operations

2. **Clean Up Logs**
   ```sql
   -- Clean up old sync logs (older than 30 days)
   DELETE FROM stripe_sync_log
   WHERE created_at < NOW() - INTERVAL '30 days'
   AND status IN ('success', 'failed');
   ```

3. **Performance Optimization**
   - Monitor database performance
   - Optimize queries if needed
   - Consider archiving old data

## Support & Troubleshooting

### Common Commands

```javascript
// Check sync status
const status = await getSyncStatus();

// Migrate all products
const result = await migrateAllProducts(10);

// Sync single product
const result = await syncSingleProduct('product-id');

// Process pending operations
const result = await processPendingSync(10);
```

### Debug Information

- Check browser console for client-side errors
- Review Supabase edge function logs
- Monitor Stripe webhook logs
- Check database sync log entries

For additional support, refer to:
- Stripe API documentation
- Supabase edge functions documentation
- Project-specific error logs