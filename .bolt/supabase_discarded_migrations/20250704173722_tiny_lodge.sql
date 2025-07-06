/*
  # Maksekeskus Integration Schema

  1. New Tables
    - `order_payments` - Stores payment information for orders
    - Updates to existing order tables to support Maksekeskus integration

  2. Security
    - Enable RLS on new tables
    - Add policies for authenticated and public users
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

-- Create RLS policies for order_payments
CREATE POLICY "Users can view their own order payments"
  ON order_payments
  FOR SELECT
  TO authenticated
  USING (order_id IN (
    SELECT orders.id
    FROM orders
    WHERE orders.user_id = auth.uid()
  ));

-- Create trigger to update updated_at
CREATE OR REPLACE FUNCTION update_order_payments_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_order_payments_updated_at
BEFORE UPDATE ON order_payments
FOR EACH ROW
EXECUTE FUNCTION update_order_payments_updated_at();

-- Grant permissions
GRANT SELECT ON order_payments TO anon, authenticated;