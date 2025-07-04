/*
  # Remove Stripe tables and create Maksekeskus tables

  1. Changes
    - Drop Stripe-related tables and views
    - Create new tables for Maksekeskus integration
  
  2. Security
    - Maintain existing RLS policies for products
    - Add new RLS policies for order tables
*/

-- Drop Stripe-related views
DROP VIEW IF EXISTS stripe_user_subscriptions;
DROP VIEW IF EXISTS stripe_user_orders;

-- Drop Stripe-related tables
DROP TABLE IF EXISTS stripe_orders;
DROP TABLE IF EXISTS stripe_subscriptions;
DROP TABLE IF EXISTS stripe_customers;

-- Drop Stripe-related enums
DROP TYPE IF EXISTS stripe_subscription_status;
DROP TYPE IF EXISTS stripe_order_status;

-- Create order status enum
CREATE TYPE order_status AS ENUM (
  'PENDING',
  'PAID',
  'PROCESSING',
  'SHIPPED',
  'COMPLETED',
  'CANCELLED',
  'REFUNDED'
);

-- Create payment status enum
CREATE TYPE payment_status AS ENUM (
  'PENDING',
  'COMPLETED',
  'CANCELLED',
  'EXPIRED',
  'REFUNDED',
  'PART_REFUNDED'
);

-- Create orders table
CREATE TABLE IF NOT EXISTS orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_name TEXT NOT NULL,
  customer_email TEXT NOT NULL,
  customer_phone TEXT NOT NULL,
  shipping_address TEXT NOT NULL,
  shipping_city TEXT NOT NULL,
  shipping_postal_code TEXT NOT NULL,
  shipping_country TEXT NOT NULL,
  total_amount DECIMAL(10, 2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'EUR',
  status order_status NOT NULL DEFAULT 'PENDING',
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  user_id uuid REFERENCES auth.users(id)
);

-- Create order items table
CREATE TABLE IF NOT EXISTS order_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id uuid NOT NULL REFERENCES products(id),
  product_title TEXT NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  price DECIMAL(10, 2) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create order payments table
CREATE TABLE IF NOT EXISTS order_payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  transaction_id TEXT NOT NULL UNIQUE,
  payment_method TEXT NOT NULL,
  amount DECIMAL(10, 2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'EUR',
  status payment_status NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS on new tables
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_payments ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for orders
CREATE POLICY "Users can view their own orders"
  ON orders
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Public can view their orders by email"
  ON orders
  FOR SELECT
  TO public
  USING (customer_email IS NOT NULL);

-- Create RLS policies for order items
CREATE POLICY "Users can view their own order items"
  ON order_items
  FOR SELECT
  TO authenticated
  USING (order_id IN (
    SELECT id FROM orders WHERE user_id = auth.uid()
  ));

CREATE POLICY "Public can view order items by order"
  ON order_items
  FOR SELECT
  TO public
  USING (order_id IN (
    SELECT id FROM orders WHERE customer_email IS NOT NULL
  ));

-- Create RLS policies for order payments
CREATE POLICY "Users can view their own order payments"
  ON order_payments
  FOR SELECT
  TO authenticated
  USING (order_id IN (
    SELECT id FROM orders WHERE user_id = auth.uid()
  ));

-- Create trigger to update updated_at
CREATE OR REPLACE FUNCTION update_order_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_orders_updated_at
BEFORE UPDATE ON orders
FOR EACH ROW
EXECUTE FUNCTION update_order_updated_at();

CREATE TRIGGER update_order_payments_updated_at
BEFORE UPDATE ON order_payments
FOR EACH ROW
EXECUTE FUNCTION update_order_updated_at();

-- Grant permissions
GRANT SELECT ON orders TO anon, authenticated;
GRANT SELECT ON order_items TO anon, authenticated;
GRANT SELECT ON order_payments TO anon, authenticated;