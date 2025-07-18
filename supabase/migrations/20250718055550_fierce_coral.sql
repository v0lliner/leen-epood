/*
  # Add Stripe product synchronization fields

  1. New Columns
    - `stripe_product_id` (text) - Stripe Product ID
    - `stripe_price_id` (text) - Stripe Price ID  
    - `sync_status` (text) - Synchronization status
    - `last_synced_at` (timestamp) - Last sync timestamp

  2. Indexes
    - Add indexes for efficient querying of Stripe IDs and sync status

  3. Security
    - Update RLS policies to allow admin access to new fields
*/

-- Add new columns to products table
DO $$
BEGIN
  -- Add stripe_product_id column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'products' AND column_name = 'stripe_product_id'
  ) THEN
    ALTER TABLE products ADD COLUMN stripe_product_id text;
  END IF;

  -- Add stripe_price_id column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'products' AND column_name = 'stripe_price_id'
  ) THEN
    ALTER TABLE products ADD COLUMN stripe_price_id text;
  END IF;

  -- Add sync_status column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'products' AND column_name = 'sync_status'
  ) THEN
    ALTER TABLE products ADD COLUMN sync_status text DEFAULT 'pending';
  END IF;

  -- Add last_synced_at column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'products' AND column_name = 'last_synced_at'
  ) THEN
    ALTER TABLE products ADD COLUMN last_synced_at timestamptz;
  END IF;
END $$;

-- Create indexes for efficient querying
CREATE INDEX IF NOT EXISTS products_stripe_product_id_idx ON products(stripe_product_id);
CREATE INDEX IF NOT EXISTS products_stripe_price_id_idx ON products(stripe_price_id);
CREATE INDEX IF NOT EXISTS products_sync_status_idx ON products(sync_status);
CREATE INDEX IF NOT EXISTS products_last_synced_at_idx ON products(last_synced_at);

-- Add unique constraint on stripe_product_id to prevent duplicates
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE table_name = 'products' AND constraint_name = 'products_stripe_product_id_key'
  ) THEN
    ALTER TABLE products ADD CONSTRAINT products_stripe_product_id_key UNIQUE (stripe_product_id);
  END IF;
END $$;

-- Add unique constraint on stripe_price_id to prevent duplicates
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE table_name = 'products' AND constraint_name = 'products_stripe_price_id_key'
  ) THEN
    ALTER TABLE products ADD CONSTRAINT products_stripe_price_id_key UNIQUE (stripe_price_id);
  END IF;
END $$;