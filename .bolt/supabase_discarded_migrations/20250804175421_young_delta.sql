/*
  # Add Sync Columns to Products Table

  1. Changes
    - Add `sync_status` column to track sync state
    - Add `last_synced_at` column to track when last synced

  2. Indexes
    - Add index on `sync_status` for efficient filtering
    - Add index on `last_synced_at` for sorting and filtering

  3. Purpose
    - Enable tracking of product sync status
    - Support efficient queries for products needing sync
*/

-- Add sync columns to products table if they don't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'products' AND column_name = 'sync_status'
  ) THEN
    ALTER TABLE public.products ADD COLUMN sync_status text DEFAULT 'pending';
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'products' AND column_name = 'last_synced_at'
  ) THEN
    ALTER TABLE public.products ADD COLUMN last_synced_at timestamp with time zone;
  END IF;
END $$;

-- Add indexes for performance if they don't exist
CREATE INDEX IF NOT EXISTS idx_products_sync_status ON public.products (sync_status);
CREATE INDEX IF NOT EXISTS products_last_synced_at_idx ON public.products (last_synced_at);