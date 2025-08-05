/*
  # Complete Stripe Product Sync System Removal

  This migration completely removes all Stripe product synchronization functionality:

  1. Database Cleanup
     - Drop all sync-related triggers from products table
     - Drop all sync-related functions
     - Drop stripe_sync_queue and stripe_sync_log tables
     - Remove Stripe-related columns from products table
     - Drop custom ENUM types used for sync

  2. Complete System Reset
     - Removes all traces of the sync system
     - Products table will be clean of Stripe references
     - No more automatic sync triggers

  IMPORTANT: This will break the "Buy Now with Stripe" button on product detail pages
  since it relies on stripe_price_id column which will be removed.
*/

-- Step 1: Drop all triggers related to Stripe sync
DROP TRIGGER IF EXISTS products_after_insert_update_delete ON public.products;
DROP TRIGGER IF EXISTS products_stripe_sync_trigger ON public.products;
DROP TRIGGER IF EXISTS trigger_product_sync ON public.products;

-- Step 2: Drop all trigger functions
DROP FUNCTION IF EXISTS public.log_product_sync_trigger();
DROP FUNCTION IF EXISTS public.handle_product_sync_event();
DROP FUNCTION IF EXISTS public.handle_product_sync();
DROP FUNCTION IF EXISTS public.update_stripe_sync_log_updated_at();

-- Step 3: Drop sync-related tables (order matters due to foreign keys)
DROP TABLE IF EXISTS public.stripe_sync_queue;
DROP TABLE IF EXISTS public.stripe_sync_log;

-- Step 4: Remove Stripe-related columns from products table
ALTER TABLE public.products
DROP COLUMN IF EXISTS stripe_product_id,
DROP COLUMN IF EXISTS stripe_price_id,
DROP COLUMN IF EXISTS sync_status,
DROP COLUMN IF EXISTS last_synced_at;

-- Step 5: Drop custom ENUM types used for sync
DROP TYPE IF EXISTS public.stripe_operation_type;
DROP TYPE IF EXISTS public.stripe_sync_status;

-- Step 6: Verification query to confirm cleanup
SELECT 
  'Cleanup completed successfully!' as status,
  (SELECT COUNT(*) FROM public.products) as total_products,
  (SELECT COUNT(*) FROM information_schema.columns 
   WHERE table_name = 'products' 
   AND column_name IN ('stripe_product_id', 'stripe_price_id', 'sync_status', 'last_synced_at')) as remaining_stripe_columns,
  (SELECT COUNT(*) FROM information_schema.tables 
   WHERE table_name IN ('stripe_sync_queue', 'stripe_sync_log')) as remaining_sync_tables;