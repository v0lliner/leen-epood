# Stripe Product Migration Guide

This guide explains how to synchronize your Supabase product data with Stripe using the provided migration tools.

## Overview

The migration system creates Stripe Products and Prices for each product in your Supabase database, enabling seamless payment processing. It supports both one-time execution via Edge Functions and batch processing via Node.js scripts.

## Prerequisites

1. **Environment Variables**: Ensure these are set in your `.env` file:
   ```env
   VITE_SUPABASE_URL=your_supabase_url
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
   STRIPE_SECRET_KEY=your_stripe_secret_key
   ```

2. **Database Migration**: Run the database migration to add required fields:
   ```bash
   # This adds stripe_product_id, stripe_price_id, sync_status, and last_synced_at columns
   supabase db push
   ```

## Migration Methods

### Method 1: Supabase Edge Function (Recommended for Production)

The Edge Function provides a secure, serverless approach to migration.

#### Deploy the Function
```bash
# Deploy the migration function
supabase functions deploy migrate-products-to-stripe
```

#### Execute Migration
```bash
# Call the Edge Function via HTTP
curl -X POST \
  "https://your-project.supabase.co/functions/v1/migrate-products-to-stripe" \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "dryRun": false,
    "batchSize": 10,
    "forceResync": false
  }'
```

### Method 2: Node.js Script (Recommended for Development)

The Node.js script provides more detailed logging and is easier to debug.

#### Setup
```bash
# Navigate to scripts directory
cd scripts

# Install dependencies
npm install
```

#### Usage Examples

**Dry Run (Preview Changes)**
```bash
# See what would be migrated without making changes
node migrate-products-to-stripe.js --dry-run
```

**Standard Migration**
```bash
# Migrate only products that haven't been synced yet
node migrate-products-to-stripe.js
```

**Force Resync All Products**
```bash
# Resync all products, even if already synced
node migrate-products-to-stripe.js --force-resync
```

**Custom Batch Size**
```bash
# Process products in smaller batches (useful for rate limiting)
node migrate-products-to-stripe.js --batch-size=5
```

**Combined Options**
```bash
# Dry run with force resync and custom batch size
node migrate-products-to-stripe.js --dry-run --force-resync --batch-size=3
```

## Migration Process

The migration follows these steps for each product:

1. **Validation**: Checks that the product has required fields (title, price)
2. **Price Parsing**: Converts price strings (e.g., "349€") to Stripe format (cents)
3. **Duplicate Check**: Searches for existing Stripe products by name
4. **Product Creation**: Creates Stripe Product if it doesn't exist
5. **Price Creation**: Creates Stripe Price linked to the product
6. **Database Update**: Updates Supabase with Stripe IDs and sync status

## Data Mapping

| Supabase Field | Stripe Field | Notes |
|----------------|--------------|-------|
| `title` | `product.name` | Product name in Stripe |
| `description` | `product.description` | Product description |
| `price` | `price.unit_amount` | Converted to cents (349€ → 34900) |
| `id` | `metadata.supabase_id` | Links Stripe objects back to Supabase |
| `category` | `product.metadata.category` | Stored as metadata |
| `image` | `product.images[0]` | Primary product image |

## Error Handling

The migration includes comprehensive error handling:

- **Rate Limiting**: Automatic retry with exponential backoff
- **Network Errors**: Retry logic for temporary failures
- **Data Validation**: Skips products with invalid data
- **Duplicate Prevention**: Checks existing Stripe products before creating
- **Partial Failures**: Continues processing even if some products fail

## Monitoring and Logging

### Console Output
The script provides detailed logging:
```
🚀 Starting Stripe Product Migration
📦 Fetching products from Supabase...
📋 Found 5 products to process

🔄 Processing batch 1/1 (5 products)
🔄 Processing: Kuju "Kärp" (ID: 123)
   🔍 Checking for existing Stripe product...
   ✨ Creating new Stripe product...
   ✅ Created Stripe product: prod_ABC123
   ✨ Creating new Stripe price...
   ✅ Created Stripe price: price_DEF456 (34900 cents)
   💾 Updating Supabase product...
   ✅ Updated Supabase product with Stripe IDs
   🎉 Successfully created new Stripe resources

📊 Migration Summary:
   Processed: 5
   Created: 5
   Updated: 0
   Skipped: 0
   Failed: 0

✅ Migration completed: 5 processed, 5 created, 0 updated, 0 skipped, 0 failed
```

### Database Tracking
Each product tracks its sync status:
- `sync_status`: 'pending', 'synced', 'failed'
- `last_synced_at`: Timestamp of last successful sync
- `stripe_product_id`: Stripe Product ID
- `stripe_price_id`: Stripe Price ID

## Troubleshooting

### Common Issues

**Missing Environment Variables**
```
❌ Missing required environment variables:
   STRIPE_SECRET_KEY
```
Solution: Check your `.env` file and ensure all required variables are set.

**Rate Limiting**
```
⏳ Rate limit hit, waiting 5 seconds...
```
Solution: The script automatically handles this. Consider reducing batch size with `--batch-size=5`.

**Invalid Price Format**
```
❌ Failed to process product 123: Invalid price: invalid_price
```
Solution: Ensure all products have valid price formats (e.g., "349€", "25.50", "100").

**Duplicate Stripe Products**
The migration prevents duplicates by:
1. Checking existing `stripe_product_id` in Supabase
2. Searching Stripe products by name
3. Using unique constraints on Stripe ID fields

### Manual Cleanup

If you need to reset the migration:

```sql
-- Reset sync status for all products
UPDATE products SET 
  stripe_product_id = NULL,
  stripe_price_id = NULL,
  sync_status = 'pending',
  last_synced_at = NULL;
```

## Best Practices

1. **Always run dry-run first**: Use `--dry-run` to preview changes
2. **Start with small batches**: Use `--batch-size=5` for initial runs
3. **Monitor Stripe dashboard**: Verify products are created correctly
4. **Keep backups**: Export your product data before migration
5. **Test payments**: Verify checkout flow works with migrated products

## Integration with Checkout

After migration, your products will have `stripe_price_id` values that can be used with the Stripe checkout system:

```javascript
// Example: Using migrated product in checkout
const product = await supabase
  .from('products')
  .select('*, stripe_price_id')
  .eq('id', productId)
  .single();

if (product.stripe_price_id) {
  // Use with Stripe checkout
  const session = await stripe.checkout.sessions.create({
    line_items: [{
      price: product.stripe_price_id,
      quantity: 1,
    }],
    mode: 'payment',
    success_url: 'https://yoursite.com/success',
    cancel_url: 'https://yoursite.com/cancel',
  });
}
```

## Support

If you encounter issues:
1. Check the console output for detailed error messages
2. Verify your environment variables are correct
3. Ensure your Stripe account is properly configured
4. Review the Stripe dashboard for any created products/prices