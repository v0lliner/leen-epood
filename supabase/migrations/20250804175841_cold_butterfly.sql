/*
  # Add Sync Columns to Products Table

  1. Changes
    - Add `sync_status` column to track sync state
    - Add `last_synced_at` column to track last sync time

  2. Performance
    - Add indexes for efficient querying by sync status
*/

-- Add sync columns to products table
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

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_products_sync_status ON public.products (sync_status);
CREATE INDEX IF NOT EXISTS products_last_synced_at_idx ON public.products (last_synced_at);