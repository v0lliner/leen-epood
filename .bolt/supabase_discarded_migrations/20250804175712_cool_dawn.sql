/*
  # Recreate Stripe Sync Enums

  1. Enums
    - `stripe_operation_type` - Types of sync operations (create, update, delete)
    - `stripe_sync_status` - Status of sync operations (pending, processing, completed, failed, retrying)

  2. Notes
    - Uses DROP TYPE IF EXISTS with CASCADE to ensure idempotency
    - CASCADE removes any dependent objects (like table columns using these enums)
    - This allows the migration to be run multiple times safely
*/

-- Create stripe_operation_type enum
-- DROP TYPE IF EXISTS is used to ensure idempotency
DROP TYPE IF EXISTS public.stripe_operation_type CASCADE;
CREATE TYPE public.stripe_operation_type AS ENUM ('create', 'update', 'delete');

-- Create stripe_sync_status enum
-- DROP TYPE IF EXISTS is used to ensure idempotency
DROP TYPE IF EXISTS public.stripe_sync_status CASCADE;
CREATE TYPE public.stripe_sync_status AS ENUM ('pending', 'processing', 'completed', 'failed', 'retrying');