/*
  # Recreate Stripe Sync Queue Table

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

  2. Security
    - Enable RLS on `stripe_sync_queue` table
    - Add policy for service role to manage sync queue

  3. Performance
    - Add indexes for efficient querying
*/

-- Create stripe_sync_queue table
CREATE TABLE IF NOT EXISTS public.stripe_sync_queue (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  operation_type public.stripe_operation_type NOT NULL,
  status public.stripe_sync_status NOT NULL DEFAULT 'pending',
  retry_count integer NOT NULL DEFAULT 0,
  error_message text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  processed_at timestamp with time zone,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS stripe_sync_queue_product_id_idx ON public.stripe_sync_queue (product_id);
CREATE INDEX IF NOT EXISTS stripe_sync_queue_status_idx ON public.stripe_sync_queue (status);
CREATE INDEX IF NOT EXISTS stripe_sync_queue_created_at_idx ON public.stripe_sync_queue (created_at);
CREATE INDEX IF NOT EXISTS stripe_sync_queue_retry_count_idx ON public.stripe_sync_queue (retry_count);

-- Enable Row Level Security (RLS)
ALTER TABLE public.stripe_sync_queue ENABLE ROW LEVEL SECURITY;

-- Policy for service role to manage the queue
CREATE POLICY "Service role can manage sync queue" ON public.stripe_sync_queue
FOR ALL TO service_role
USING (true) WITH CHECK (true);

-- Policy for authenticated users to view sync queue (read-only)
CREATE POLICY "Authenticated users can view sync queue" ON public.stripe_sync_queue
FOR SELECT TO authenticated
USING (true);