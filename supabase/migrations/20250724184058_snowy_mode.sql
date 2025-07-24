/*
  # New Queue-Based Stripe Sync System

  1. New Tables
    - `stripe_sync_queue` - Queue for Stripe sync operations
      - `id` (uuid, primary key)
      - `product_id` (uuid, references products)
      - `operation_type` (enum: create, update, delete)
      - `status` (enum: pending, processing, completed, failed, retrying)
      - `retry_count` (integer, default 0)
      - `error_message` (text)
      - `created_at` (timestamp)
      - `processed_at` (timestamp)
      - `metadata` (jsonb)

  2. Enums
    - `stripe_operation_type` - Operation types for sync queue
    - `stripe_sync_status` - Status types for sync operations

  3. Functions
    - `handle_product_sync_event()` - Trigger function for product changes
    - `cleanup_old_sync_queue()` - Cleanup function for old completed operations

  4. Triggers
    - `products_stripe_sync_trigger` - Trigger on products table changes

  5. Security
    - Enable RLS on `stripe_sync_queue` table
    - Add policies for authenticated users and service role
*/

-- Create enums for operation types and statuses
CREATE TYPE stripe_operation_type AS ENUM ('create', 'update', 'delete');
CREATE TYPE stripe_sync_status AS ENUM ('pending', 'processing', 'completed', 'failed', 'retrying');

-- Create the stripe_sync_queue table
CREATE TABLE IF NOT EXISTS stripe_sync_queue (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  operation_type stripe_operation_type NOT NULL,
  status stripe_sync_status NOT NULL DEFAULT 'pending',
  retry_count integer NOT NULL DEFAULT 0,
  error_message text,
  created_at timestamptz NOT NULL DEFAULT now(),
  processed_at timestamptz,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS stripe_sync_queue_status_idx ON stripe_sync_queue(status);
CREATE INDEX IF NOT EXISTS stripe_sync_queue_product_id_idx ON stripe_sync_queue(product_id);
CREATE INDEX IF NOT EXISTS stripe_sync_queue_created_at_idx ON stripe_sync_queue(created_at);
CREATE INDEX IF NOT EXISTS stripe_sync_queue_retry_count_idx ON stripe_sync_queue(retry_count);

-- Enable RLS
ALTER TABLE stripe_sync_queue ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Authenticated users can view sync queue"
  ON stripe_sync_queue
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Service role can manage sync queue"
  ON stripe_sync_queue
  FOR ALL
  TO service_role
  USING (true);

-- Function to handle product sync events
CREATE OR REPLACE FUNCTION handle_product_sync_event()
RETURNS TRIGGER AS $$
DECLARE
  should_sync boolean := false;
  op_type stripe_operation_type;
  old_metadata jsonb := '{}'::jsonb;
BEGIN
  -- Determine operation type and whether sync is needed
  IF TG_OP = 'INSERT' THEN
    should_sync := true;
    op_type := 'create';
  ELSIF TG_OP = 'UPDATE' THEN
    -- Only sync if relevant fields changed
    IF NEW.title IS DISTINCT FROM OLD.title OR
       NEW.description IS DISTINCT FROM OLD.description OR
       NEW.price IS DISTINCT FROM OLD.price OR
       NEW.available IS DISTINCT FROM OLD.available OR
       NEW.image IS DISTINCT FROM OLD.image OR
       NEW.category IS DISTINCT FROM OLD.category OR
       NEW.subcategory IS DISTINCT FROM OLD.subcategory OR
       NEW.dimensions IS DISTINCT FROM OLD.dimensions
    THEN
      should_sync := true;
      op_type := 'update';
      
      -- Store old values for comparison in metadata
      old_metadata := jsonb_build_object(
        'old_price', OLD.price,
        'old_available', OLD.available,
        'old_title', OLD.title
      );
    END IF;
  ELSIF TG_OP = 'DELETE' THEN
    -- Only sync delete if product had Stripe IDs
    IF OLD.stripe_product_id IS NOT NULL THEN
      should_sync := true;
      op_type := 'delete';
      
      old_metadata := jsonb_build_object(
        'stripe_product_id', OLD.stripe_product_id,
        'stripe_price_id', OLD.stripe_price_id
      );
    END IF;
  END IF;

  -- Add to sync queue if needed
  IF should_sync THEN
    INSERT INTO stripe_sync_queue (
      product_id, 
      operation_type, 
      status, 
      metadata
    ) VALUES (
      COALESCE(NEW.id, OLD.id),
      op_type,
      'pending',
      old_metadata
    );
    
    -- Update product sync status to pending (except for delete)
    IF TG_OP != 'DELETE' THEN
      UPDATE products 
      SET sync_status = 'pending' 
      WHERE id = NEW.id;
    END IF;
  END IF;

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger on products table
DROP TRIGGER IF EXISTS products_stripe_sync_trigger ON products;
CREATE TRIGGER products_stripe_sync_trigger
  AFTER INSERT OR UPDATE OR DELETE ON products
  FOR EACH ROW EXECUTE FUNCTION handle_product_sync_event();

-- Function to cleanup old completed sync operations (older than 30 days)
CREATE OR REPLACE FUNCTION cleanup_old_sync_queue()
RETURNS void AS $$
BEGIN
  DELETE FROM stripe_sync_queue 
  WHERE status = 'completed' 
    AND created_at < now() - interval '30 days';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a view for easy queue monitoring
CREATE OR REPLACE VIEW stripe_sync_queue_stats AS
SELECT 
  status,
  COUNT(*) as count,
  MIN(created_at) as oldest_operation,
  MAX(created_at) as newest_operation
FROM stripe_sync_queue 
GROUP BY status;

-- Grant permissions
GRANT SELECT ON stripe_sync_queue_stats TO authenticated;
GRANT SELECT ON stripe_sync_queue_stats TO service_role;