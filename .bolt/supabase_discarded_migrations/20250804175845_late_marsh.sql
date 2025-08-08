/*
  # Recreate Product Sync Trigger

  1. Function
    - `handle_product_sync_event()` - Handles INSERT/UPDATE/DELETE on products
    - Automatically adds sync jobs to queue when products change
    - Only queues updates when relevant fields change

  2. Trigger
    - `products_stripe_sync_trigger` - Fires after product changes
    - Calls the sync function for each row

  3. Logic
    - INSERT: Queue 'create' operation
    - UPDATE: Queue 'update' operation (only if relevant fields changed)
    - DELETE: Queue 'delete' operation with metadata
*/

-- Create or replace the sync function
CREATE OR REPLACE FUNCTION public.handle_product_sync_event()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.stripe_sync_queue (product_id, operation_type, status)
    VALUES (NEW.id, 'create', 'pending');
    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' THEN
    -- Only queue an update if relevant fields have changed
    IF NEW.title IS DISTINCT FROM OLD.title OR
       NEW.description IS DISTINCT FROM OLD.description OR
       NEW.price IS DISTINCT FROM OLD.price OR
       NEW.available IS DISTINCT FROM OLD.available OR
       NEW.image IS DISTINCT FROM OLD.image OR
       NEW.category IS DISTINCT FROM OLD.category OR
       NEW.subcategory IS DISTINCT FROM OLD.subcategory
    THEN
      INSERT INTO public.stripe_sync_queue (product_id, operation_type, status)
      VALUES (NEW.id, 'update', 'pending');
    END IF;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    -- Queue a delete operation with Stripe IDs in metadata
    INSERT INTO public.stripe_sync_queue (product_id, operation_type, status, metadata)
    VALUES (
      OLD.id, 
      'delete', 
      'pending', 
      jsonb_build_object(
        'stripe_product_id', OLD.stripe_product_id, 
        'stripe_price_id', OLD.stripe_price_id,
        'title', OLD.title
      )
    );
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing trigger if it exists to avoid conflicts
DROP TRIGGER IF EXISTS products_stripe_sync_trigger ON public.products;

-- Create the trigger
CREATE TRIGGER products_stripe_sync_trigger
AFTER INSERT OR UPDATE OR DELETE ON public.products
FOR EACH ROW EXECUTE FUNCTION public.handle_product_sync_event();