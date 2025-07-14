/*
  # Add Payment Intent fields to orders table

  1. New Fields
    - `payment_intent_id` (text): Stores the Stripe Payment Intent ID
    - `client_secret` (text): Stores the client secret for the Payment Intent
    - `payment_method_id` (text): Stores the ID of the payment method used
    - `payment_method_type` (text): Stores the type of payment method (card, google_pay, etc.)
    - `payment_method_details` (jsonb): Stores additional details about the payment method

  2. Security
    - Enable RLS on orders table
    - Add policy for authenticated users to update their own orders
*/

-- Add new fields to orders table
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'orders' AND column_name = 'payment_intent_id'
  ) THEN
    ALTER TABLE orders ADD COLUMN payment_intent_id text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'orders' AND column_name = 'client_secret'
  ) THEN
    ALTER TABLE orders ADD COLUMN client_secret text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'orders' AND column_name = 'payment_method_id'
  ) THEN
    ALTER TABLE orders ADD COLUMN payment_method_id text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'orders' AND column_name = 'payment_method_type'
  ) THEN
    ALTER TABLE orders ADD COLUMN payment_method_type text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'orders' AND column_name = 'payment_method_details'
  ) THEN
    ALTER TABLE orders ADD COLUMN payment_method_details jsonb DEFAULT '{}'::jsonb;
  END IF;
END $$;

-- Create index on payment_intent_id for faster lookups
CREATE INDEX IF NOT EXISTS orders_payment_intent_id_idx ON orders(payment_intent_id);

-- Create policy for authenticated users to update their own orders
CREATE POLICY IF NOT EXISTS "Users can update their own orders" 
  ON orders 
  FOR UPDATE 
  TO authenticated 
  USING (customer_email = auth.jwt() ->> 'email');