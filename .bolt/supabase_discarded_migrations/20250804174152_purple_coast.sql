/*
  # Create Stripe Sync Queue System

  1. New Tables
    - `stripe_sync_queue`
      - `id` (uuid, primary key)
      - `product_id` (uuid, foreign key to products)
      - `operation_type` (enum: create, update, delete)
      - `status` (enum: pending, processing, completed, failed, retrying)
      - `retry_count` (integer, default 0)
      - `error_message` (text, nullable)
      - `created_at` (timestamp)
      - `processed_at` (timestamp, nullable)
      - `metadata` (jsonb, default {})

  2. Enums
    - `stripe_operation_type` (create, update, delete)
    - `stripe_sync_status` (pending, processing, completed, failed, retrying)

  3. Triggers
    - Auto-queue products for sync when they change
    - Handle INSERT, UPDATE, DELETE operations

  4. Security
    - Enable RLS on `stripe_sync_queue` table
    - Add policies for authenticated users and service role

  5. Views
    - `stripe_sync_queue_stats` for dashboard statistics

  6. Functions
    - `handle_product_sync_event()` for automatic queueing
    - `log_product_sync_trigger()` for logging
*/

-- Create enums for stripe sync operations
CREATE TYPE IF NOT EXISTS stripe_operation_type AS ENUM ('create', 'update', 'delete');
CREATE TYPE IF NOT EXISTS stripe_sync_status AS ENUM ('pending', 'processing', 'completed', 'failed', 'retrying');

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

-- Create indexes for better performance
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

-- Create a view for queue statistics
CREATE OR REPLACE VIEW stripe_sync_queue_stats AS
SELECT 
  status,
  COUNT(*) as count,
  MIN(created_at) as oldest_operation,
  MAX(created_at) as newest_operation
FROM stripe_sync_queue
GROUP BY status;

-- Function to handle product sync events (triggers)
CREATE OR REPLACE FUNCTION handle_product_sync_event()
RETURNS TRIGGER AS $$
BEGIN
  -- Handle INSERT (new product)
  IF TG_OP = 'INSERT' THEN
    INSERT INTO stripe_sync_queue (product_id, operation_type, status, metadata)
    VALUES (
      NEW.id, 
      'create', 
      'pending',
      jsonb_build_object(
        'product_title', NEW.title,
        'product_price', NEW.price,
        'product_available', NEW.available
      )
    );
    
    -- Update product sync status
    UPDATE products 
    SET sync_status = 'pending' 
    WHERE id = NEW.id;
    
    RETURN NEW;
  END IF;

  -- Handle UPDATE (product changed)
  IF TG_OP = 'UPDATE' THEN
    -- Only queue if relevant fields changed
    IF NEW.title IS DISTINCT FROM OLD.title OR
       NEW.description IS DISTINCT FROM OLD.description OR
       NEW.price IS DISTINCT FROM OLD.price OR
       NEW.available IS DISTINCT FROM OLD.available OR
       NEW.image IS DISTINCT FROM OLD.image OR
       NEW.category IS DISTINCT FROM OLD.category OR
       NEW.subcategory IS DISTINCT FROM OLD.subcategory
    THEN
      INSERT INTO stripe_sync_queue (product_id, operation_type, status, metadata)
      VALUES (
        NEW.id, 
        'update', 
        'pending',
        jsonb_build_object(
          'product_title', NEW.title,
          'product_price', NEW.price,
          'product_available', NEW.available,
          'old_title', OLD.title,
          'old_price', OLD.price,
          'old_available', OLD.available
        )
      );
      
      -- Update product sync status
      UPDATE products 
      SET sync_status = 'pending' 
      WHERE id = NEW.id;
    END IF;
    
    RETURN NEW;
  END IF;

  -- Handle DELETE (product removed)
  IF TG_OP = 'DELETE' THEN
    INSERT INTO stripe_sync_queue (product_id, operation_type, status, metadata)
    VALUES (
      OLD.id, 
      'delete', 
      'pending',
      jsonb_build_object(
        'product_title', OLD.title,
        'stripe_product_id', OLD.stripe_product_id,
        'stripe_price_id', OLD.stripe_price_id
      )
    );
    
    RETURN OLD;
  END IF;

  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function for logging product sync operations
CREATE OR REPLACE FUNCTION log_product_sync_trigger()
RETURNS TRIGGER AS $$
BEGIN
  -- This function can be used for additional logging if needed
  -- For now, it's a placeholder for future enhancements
  
  IF TG_OP = 'INSERT' THEN
    RAISE LOG 'Product sync queued: % (%) - %', NEW.product_id, NEW.operation_type, NEW.status;
    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' THEN
    RAISE LOG 'Product sync updated: % (%) - % -> %', NEW.product_id, NEW.operation_type, OLD.status, NEW.status;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    RAISE LOG 'Product sync removed: % (%)', OLD.product_id, OLD.operation_type;
    RETURN OLD;
  END IF;
  
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create triggers on products table
DROP TRIGGER IF EXISTS products_stripe_sync_trigger ON products;
CREATE TRIGGER products_stripe_sync_trigger
  AFTER INSERT OR UPDATE OR DELETE ON products
  FOR EACH ROW EXECUTE FUNCTION handle_product_sync_event();

-- Create trigger on sync queue for logging
DROP TRIGGER IF EXISTS products_after_insert_update_delete ON stripe_sync_queue;
CREATE TRIGGER products_after_insert_update_delete
  AFTER INSERT OR UPDATE OR DELETE ON stripe_sync_queue
  FOR EACH ROW EXECUTE FUNCTION log_product_sync_trigger();

-- Function to clean up old completed queue items (optional, for maintenance)
CREATE OR REPLACE FUNCTION cleanup_old_sync_queue()
RETURNS void AS $$
BEGIN
  DELETE FROM stripe_sync_queue 
  WHERE status = 'completed' 
    AND processed_at < NOW() - INTERVAL '7 days';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add comment to the table
COMMENT ON TABLE stripe_sync_queue IS 'Queue for Stripe product synchronization operations';
COMMENT ON COLUMN stripe_sync_queue.operation_type IS 'Type of operation: create, update, or delete';
COMMENT ON COLUMN stripe_sync_queue.status IS 'Current status of the sync operation';
COMMENT ON COLUMN stripe_sync_queue.retry_count IS 'Number of times this operation has been retried';
COMMENT ON COLUMN stripe_sync_queue.metadata IS 'Additional data for the sync operation (product details, old values, etc.)';