/*
  # Recreate Stripe Sync Enums

  1. Enums
    - `stripe_operation_type` - Types of operations (create, update, delete)
    - `stripe_sync_status` - Status of sync operations (pending, processing, completed, failed, retrying)

  2. Purpose
    - Support simple and foolproof product sync to Stripe
    - Enable automatic queue-based processing
*/

-- Create stripe_operation_type enum
CREATE TYPE IF NOT EXISTS public.stripe_operation_type AS ENUM ('create', 'update', 'delete');

-- Create stripe_sync_status enum  
CREATE TYPE IF NOT EXISTS public.stripe_sync_status AS ENUM ('pending', 'processing', 'completed', 'failed', 'retrying');