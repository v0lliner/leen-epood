/*
  # Recreate Stripe Sync Enums

  1. Enums
    - `stripe_operation_type` (create, update, delete)
    - `stripe_sync_status` (pending, processing, completed, failed, retrying)
  
  2. Safety
    - Uses DO blocks to safely create enums only if they don't exist
    - Handles existing dependencies gracefully
*/

-- Create stripe_operation_type enum safely
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'stripe_operation_type') THEN
    CREATE TYPE public.stripe_operation_type AS ENUM ('create', 'update', 'delete');
  END IF;
END $$;

-- Create stripe_sync_status enum safely
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'stripe_sync_status') THEN
    CREATE TYPE public.stripe_sync_status AS ENUM ('pending', 'processing', 'completed', 'failed', 'retrying');
  END IF;
END $$;