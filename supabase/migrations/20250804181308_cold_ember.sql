/*
  # Reset Product Sync Status

  This migration resets all products' Stripe sync status to force re-synchronization.
  
  1. Changes Made
     - Set all stripe_product_id to NULL
     - Set all stripe_price_id to NULL  
     - Set all sync_status to 'pending'
     - Set all last_synced_at to NULL
  
  2. Purpose
     - Forces stripe-product-sync function to treat all products as new
     - Resolves discrepancy between Supabase data and actual Stripe state
     - Ensures all products will be re-synced to Stripe
  
  3. Next Steps
     - Run stripe-product-sync Edge Function with migrate_all action
     - Monitor sync progress in Edge Function logs
     - Verify products appear in Stripe dashboard
*/

-- Reset all products' Stripe sync status to force re-synchronization
UPDATE public.products
SET
  stripe_product_id = NULL,
  stripe_price_id = NULL,
  sync_status = 'pending',
  last_synced_at = NULL;

-- Verify the reset by showing current sync status
SELECT 
  COUNT(*) as total_products,
  COUNT(CASE WHEN sync_status = 'pending' THEN 1 END) as pending_products,
  COUNT(CASE WHEN stripe_product_id IS NULL THEN 1 END) as products_without_stripe_id
FROM public.products;