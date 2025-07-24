# Stripe Migration Troubleshooting Guide

## Quick Diagnosis Steps

### 1. Check Database Schema
First, verify that the required columns exist in your `products` table:

```sql
-- Run this in Supabase SQL Editor to check if columns exist
SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'products' 
AND column_name IN ('stripe_product_id', 'stripe_price_id', 'sync_status', 'last_synced_at');
```

### 2. Check Products Data
Verify you have products in the database:

```sql
-- Check products count and their sync status
SELECT 
    COUNT(*) as total_products,
    COUNT(CASE WHEN available = true THEN 1 END) as available_products,
    COUNT(CASE WHEN stripe_product_id IS NOT NULL THEN 1 END) as products_with_stripe_id,
    COUNT(CASE WHEN stripe_price_id IS NOT NULL THEN 1 END) as products_with_price_id
FROM products;
```

### 3. Check Environment Variables
In your Supabase project settings, verify these environment variables are set:
- `STRIPE_SECRET_KEY` (starts with `sk_test_` or `sk_live_`)
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`

### 4. Manual Product Creation Test
Test creating a single product in Stripe manually:

```sql
-- Insert a test product to trigger sync
INSERT INTO products (title, price, description, category, available) 
VALUES ('Test Product', '10.00€', 'Test description', 'keraamika', true);
```

## Common Issues and Solutions

### Issue 1: "0 products synced" but products exist
**Cause**: Database schema not updated or products don't meet sync criteria
**Solution**: 
1. Run the database migration SQL script
2. Ensure products have `available = true`
3. Check that `sync_status` column exists and is set to 'pending'

### Issue 2: Edge Function not found
**Cause**: Edge Function not deployed
**Solution**: Deploy the function using Supabase CLI or check if it exists in your project

### Issue 3: Stripe API errors
**Cause**: Invalid API key or rate limiting
**Solution**: 
1. Verify `STRIPE_SECRET_KEY` is correct
2. Check Stripe dashboard for API usage
3. Reduce batch size in migration

### Issue 4: Database permission errors
**Cause**: RLS policies or insufficient permissions
**Solution**: Ensure service role key is used and RLS policies allow operations

## Step-by-Step Recovery

If migration completely fails, follow these steps:

1. **Reset sync status**:
```sql
UPDATE products SET sync_status = 'pending' WHERE available = true;
DELETE FROM stripe_sync_log;
```

2. **Test with single product**:
Use the "Debug Products" button first, then try migrating just one product

3. **Check logs**:
- Browser console for frontend errors
- Supabase Edge Functions logs for backend errors
- Network tab for API call failures

4. **Manual verification**:
Check your Stripe dashboard to see if any products were actually created

## Success Indicators

✅ Database has required columns
✅ Products exist with `available = true`
✅ Edge Function responds to debug calls
✅ Environment variables are set
✅ Stripe products appear in dashboard
✅ `stripe_sync_log` table has entries