/*
  # Payment System Schema Update

  1. New Types
    - Adds payment_status enum if it doesn't exist
  
  2. New Tables
    - Creates order_payments table for tracking payment transactions
  
  3. Security
    - Enables RLS on order_payments table
    - Adds policy for authenticated users to view their own payments
    - Grants SELECT permission to anon and authenticated roles
  
  4. Automation
    - Adds trigger to update updated_at timestamp on order_payments
*/

-- Create payment status enum if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'payment_status') THEN
    CREATE TYPE payment_status AS ENUM (
      'PENDING',
      'COMPLETED',
      'CANCELLED',
      'EXPIRED',
      'REFUNDED',
      'PART_REFUNDED'
    );
  END IF;
END$$;

-- Create order_payments table if it doesn't exist
CREATE TABLE IF NOT EXISTS order_payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  transaction_id text NOT NULL UNIQUE,
  payment_method text NOT NULL,
  amount numeric(10,2) NOT NULL,
  currency text NOT NULL DEFAULT 'EUR',
  status payment_status NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS on order_payments
ALTER TABLE order_payments ENABLE ROW LEVEL SECURITY;

-- Check if policy exists before creating it
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'order_payments' 
    AND policyname = 'Users can view their own order payments'
  ) THEN
    -- Create RLS policy for order_payments
    EXECUTE 'CREATE POLICY "Users can view their own order payments"
      ON order_payments
      FOR SELECT
      TO authenticated
      USING (order_id IN (
        SELECT orders.id
        FROM orders
        WHERE orders.user_id = auth.uid()
      ))';
  END IF;
END$$;

-- Create trigger function if it doesn't exist
CREATE OR REPLACE FUNCTION update_order_payments_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop trigger if it exists to avoid errors on recreation
DROP TRIGGER IF EXISTS update_order_payments_updated_at ON order_payments;

-- Create trigger
CREATE TRIGGER update_order_payments_updated_at
BEFORE UPDATE ON order_payments
FOR EACH ROW
EXECUTE FUNCTION update_order_payments_updated_at();

-- Grant permissions
GRANT SELECT ON order_payments TO anon, authenticated;