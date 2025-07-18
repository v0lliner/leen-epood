/*
  # Stripe Product Synchronization Schema

  1. New Tables
    - `stripe_sync_log` - Tracks all sync operations and their status
    - Updates to `products` table to add Stripe-related fields

  2. New Functions
    - `sync_product_to_stripe()` - Handles product synchronization
    - `handle_product_sync()` - Trigger function for automatic sync

  3. Triggers
    - Auto-sync products when created/updated
    - Log all sync operations

  4. Security
    - Enable RLS on new tables
    - Add appropriate policies
*/

-- Add Stripe-related fields to products table
DO $$
BEGIN
  -- Add stripe_product_id if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'products' AND column_name = 'stripe_product_id'
  ) THEN
    ALTER TABLE products ADD COLUMN stripe_product_id text UNIQUE;
  END IF;

  -- Add stripe_price_id if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'products' AND column_name = 'stripe_price_id'
  ) THEN
    ALTER TABLE products ADD COLUMN stripe_price_id text UNIQUE;
  END IF;

  -- Add sync_status if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'products' AND column_name = 'sync_status'
  ) THEN
    ALTER TABLE products ADD COLUMN sync_status text DEFAULT 'pending';
  END IF;

  -- Add last_synced_at if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'products' AND column_name = 'last_synced_at'
  ) THEN
    ALTER TABLE products ADD COLUMN last_synced_at timestamptz;
  END IF;
END $$;

-- Create indexes for Stripe fields
CREATE INDEX IF NOT EXISTS products_stripe_product_id_idx ON products(stripe_product_id);
CREATE INDEX IF NOT EXISTS products_stripe_price_id_idx ON products(stripe_price_id);
CREATE INDEX IF NOT EXISTS products_sync_status_idx ON products(sync_status);
CREATE INDEX IF NOT EXISTS products_last_synced_at_idx ON products(last_synced_at);

-- Create stripe_sync_log table
CREATE TABLE IF NOT EXISTS stripe_sync_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid REFERENCES products(id) ON DELETE CASCADE,
  operation text NOT NULL CHECK (operation IN ('create', 'update', 'delete', 'migrate')),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'success', 'failed', 'retrying')),
  stripe_product_id text,
  stripe_price_id text,
  error_message text,
  retry_count integer DEFAULT 0,
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS on stripe_sync_log
ALTER TABLE stripe_sync_log ENABLE ROW LEVEL SECURITY;

-- Create policy for stripe_sync_log
CREATE POLICY "Authenticated users can view sync logs"
  ON stripe_sync_log
  FOR SELECT
  TO authenticated
  USING (true);

-- Create indexes for sync log
CREATE INDEX IF NOT EXISTS stripe_sync_log_product_id_idx ON stripe_sync_log(product_id);
CREATE INDEX IF NOT EXISTS stripe_sync_log_status_idx ON stripe_sync_log(status);
CREATE INDEX IF NOT EXISTS stripe_sync_log_operation_idx ON stripe_sync_log(operation);
CREATE INDEX IF NOT EXISTS stripe_sync_log_created_at_idx ON stripe_sync_log(created_at);

-- Create updated_at trigger for sync log
CREATE OR REPLACE FUNCTION update_stripe_sync_log_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_stripe_sync_log_updated_at
  BEFORE UPDATE ON stripe_sync_log
  FOR EACH ROW
  EXECUTE FUNCTION update_stripe_sync_log_updated_at();

-- Create function to handle product sync
CREATE OR REPLACE FUNCTION handle_product_sync()
RETURNS TRIGGER AS $$
BEGIN
  -- Only sync if product is available and has required fields
  IF NEW.available = true AND NEW.title IS NOT NULL AND NEW.price IS NOT NULL THEN
    -- Insert sync log entry
    INSERT INTO stripe_sync_log (
      product_id,
      operation,
      status,
      metadata
    ) VALUES (
      NEW.id,
      CASE 
        WHEN TG_OP = 'INSERT' THEN 'create'
        WHEN TG_OP = 'UPDATE' THEN 'update'
      END,
      'pending',
      jsonb_build_object(
        'product_title', NEW.title,
        'product_price', NEW.price,
        'trigger_operation', TG_OP
      )
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for automatic sync
DROP TRIGGER IF EXISTS trigger_product_sync ON products;
CREATE TRIGGER trigger_product_sync
  AFTER INSERT OR UPDATE ON products
  FOR EACH ROW
  EXECUTE FUNCTION handle_product_sync();