/*
  # Stripe Product Synchronization Setup

  1. Database Schema Updates
    - Add Stripe product and price ID fields to products table
    - Create stripe_sync_log table for tracking operations
    - Set up triggers for automatic synchronization

  2. Security
    - Enable RLS on stripe_sync_log table
    - Add policies for authenticated users

  3. Initial Setup
    - Mark existing products as pending sync
    - Create necessary indexes for performance
*/

-- Enable uuid-ossp extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Add Stripe product and price IDs to products table if they don't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='products' AND column_name='stripe_product_id') THEN
        ALTER TABLE products ADD COLUMN stripe_product_id TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='products' AND column_name='stripe_price_id') THEN
        ALTER TABLE products ADD COLUMN stripe_price_id TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='products' AND column_name='sync_status') THEN
        ALTER TABLE products ADD COLUMN sync_status TEXT DEFAULT 'pending';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='products' AND column_name='last_synced_at') THEN
        ALTER TABLE products ADD COLUMN last_synced_at TIMESTAMPTZ;
    END IF;
END $$;

-- Create stripe_sync_log table if it doesn't exist
CREATE TABLE IF NOT EXISTS stripe_sync_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id UUID REFERENCES products(id) ON DELETE CASCADE,
    operation TEXT NOT NULL, -- 'migrate', 'create', 'update', 'delete'
    status TEXT NOT NULL, -- 'pending', 'success', 'failed'
    stripe_product_id TEXT,
    stripe_price_id TEXT,
    error_message TEXT,
    retry_count INT DEFAULT 0,
    metadata JSONB,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS on stripe_sync_log table
ALTER TABLE stripe_sync_log ENABLE ROW LEVEL SECURITY;

-- Create policy for authenticated users to read sync logs
CREATE POLICY "Authenticated users can read sync logs"
  ON stripe_sync_log
  FOR SELECT
  TO authenticated
  USING (true);

-- Create policy for service role to manage sync logs
CREATE POLICY "Service role can manage sync logs"
  ON stripe_sync_log
  FOR ALL
  TO service_role
  USING (true);

-- Drop existing trigger if it exists to ensure we have the latest version
DROP TRIGGER IF EXISTS products_after_insert_update_delete ON products;
DROP FUNCTION IF EXISTS log_product_sync_trigger();

-- Create function to log product changes for Stripe sync
CREATE OR REPLACE FUNCTION log_product_sync_trigger()
RETURNS TRIGGER AS $$
BEGIN
    IF (TG_OP = 'INSERT') THEN
        INSERT INTO stripe_sync_log (product_id, operation, status, metadata)
        VALUES (NEW.id, 'create', 'pending', jsonb_build_object('new_data', to_jsonb(NEW)));
        RETURN NEW;
    ELSIF (TG_OP = 'UPDATE') THEN
        -- Only log if relevant fields have changed
        IF (NEW.title IS DISTINCT FROM OLD.title OR
            NEW.description IS DISTINCT FROM OLD.description OR
            NEW.price IS DISTINCT FROM OLD.price OR
            NEW.image IS DISTINCT FROM OLD.image OR
            NEW.category IS DISTINCT FROM OLD.category OR
            NEW.subcategory IS DISTINCT FROM OLD.subcategory OR
            NEW.available IS DISTINCT FROM OLD.available) THEN
            
            INSERT INTO stripe_sync_log (product_id, operation, status, metadata)
            VALUES (NEW.id, 'update', 'pending', jsonb_build_object('old_data', to_jsonb(OLD), 'new_data', to_jsonb(NEW)));
        END IF;
        RETURN NEW;
    ELSIF (TG_OP = 'DELETE') THEN
        INSERT INTO stripe_sync_log (product_id, operation, status, metadata)
        VALUES (OLD.id, 'delete', 'pending', jsonb_build_object('old_data', to_jsonb(OLD)));
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for product changes
CREATE TRIGGER products_after_insert_update_delete
    AFTER INSERT OR UPDATE OR DELETE ON products
    FOR EACH ROW EXECUTE FUNCTION log_product_sync_trigger();

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_products_stripe_product_id ON products(stripe_product_id);
CREATE INDEX IF NOT EXISTS idx_products_stripe_price_id ON products(stripe_price_id);
CREATE INDEX IF NOT EXISTS idx_products_sync_status ON products(sync_status);
CREATE INDEX IF NOT EXISTS idx_stripe_sync_log_status ON stripe_sync_log(status);
CREATE INDEX IF NOT EXISTS idx_stripe_sync_log_product_id ON stripe_sync_log(product_id);

-- Update existing products to 'pending' sync status if they don't have Stripe IDs
UPDATE products
SET sync_status = 'pending'
WHERE (stripe_product_id IS NULL OR stripe_price_id IS NULL) AND available = true;

-- Insert initial sync log entries for existing products that need migration
INSERT INTO stripe_sync_log (product_id, operation, status, metadata)
SELECT 
    id,
    'migrate',
    'pending',
    jsonb_build_object('initial_migration', true, 'product_data', to_jsonb(products.*))
FROM products
WHERE (stripe_product_id IS NULL OR stripe_price_id IS NULL) 
  AND available = true
  AND NOT EXISTS (
    SELECT 1 FROM stripe_sync_log 
    WHERE stripe_sync_log.product_id = products.id 
    AND stripe_sync_log.operation = 'migrate'
  );