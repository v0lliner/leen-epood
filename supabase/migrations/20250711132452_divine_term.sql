/*
  # Create Orders System

  1. New Tables
    - `orders`
      - `id` (uuid, primary key)
      - `customer_email` (text)
      - `customer_name` (text)
      - `customer_phone` (text)
      - `shipping_address` (jsonb)
      - `billing_address` (jsonb)
      - `items` (jsonb array of order items)
      - `subtotal` (numeric)
      - `shipping_cost` (numeric)
      - `total_amount` (numeric)
      - `status` (order_status enum)
      - `payment_status` (payment_status enum)
      - `payment_method` (text)
      - `payment_reference` (text)
      - `notes` (text)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Views
    - `admin_order_stats` - Aggregated statistics for dashboard
    - `admin_orders_view` - Detailed order view for admin

  3. Security
    - Enable RLS on `orders` table
    - Add policies for authenticated users to manage orders
    - Add policy for public to create orders (checkout)
*/

-- Create orders table
CREATE TABLE IF NOT EXISTS orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_email text NOT NULL,
  customer_name text NOT NULL,
  customer_phone text,
  shipping_address jsonb NOT NULL DEFAULT '{}',
  billing_address jsonb DEFAULT '{}',
  items jsonb NOT NULL DEFAULT '[]',
  subtotal numeric(10,2) NOT NULL DEFAULT 0,
  shipping_cost numeric(10,2) NOT NULL DEFAULT 0,
  total_amount numeric(10,2) NOT NULL DEFAULT 0,
  status order_status NOT NULL DEFAULT 'PENDING',
  payment_status payment_status NOT NULL DEFAULT 'PENDING',
  payment_method text,
  payment_reference text,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Authenticated users can manage orders"
  ON orders
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Public can create orders"
  ON orders
  FOR INSERT
  TO public
  WITH CHECK (true);

-- Create indexes
CREATE INDEX IF NOT EXISTS orders_status_idx ON orders(status);
CREATE INDEX IF NOT EXISTS orders_payment_status_idx ON orders(payment_status);
CREATE INDEX IF NOT EXISTS orders_created_at_idx ON orders(created_at);
CREATE INDEX IF NOT EXISTS orders_customer_email_idx ON orders(customer_email);

-- Create trigger for updated_at
CREATE TRIGGER update_orders_updated_at
  BEFORE UPDATE ON orders
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Create admin_order_stats view
CREATE OR REPLACE VIEW public.admin_order_stats AS
SELECT
    COUNT(id) AS total_orders,
    COUNT(CASE WHEN status = 'PENDING' THEN 1 END) AS pending_orders,
    COUNT(CASE WHEN status = 'PAID' THEN 1 END) AS paid_orders,
    COUNT(CASE WHEN status = 'PROCESSING' THEN 1 END) AS processing_orders,
    COUNT(CASE WHEN status = 'SHIPPED' THEN 1 END) AS shipped_orders,
    COUNT(CASE WHEN status = 'COMPLETED' THEN 1 END) AS completed_orders,
    COUNT(CASE WHEN status = 'CANCELLED' THEN 1 END) AS cancelled_orders,
    COUNT(CASE WHEN status = 'REFUNDED' THEN 1 END) AS refunded_orders,
    COALESCE(SUM(total_amount), 0) AS total_revenue,
    COALESCE(SUM(CASE WHEN status IN ('PAID', 'PROCESSING', 'SHIPPED', 'COMPLETED') THEN total_amount ELSE 0 END), 0) AS confirmed_revenue
FROM
    public.orders;

-- Create admin_orders_view for detailed order management
CREATE OR REPLACE VIEW public.admin_orders_view AS
SELECT
    o.id,
    o.customer_email,
    o.customer_name,
    o.customer_phone,
    o.shipping_address,
    o.billing_address,
    o.items,
    o.subtotal,
    o.shipping_cost,
    o.total_amount,
    o.status,
    o.payment_status,
    o.payment_method,
    o.payment_reference,
    o.notes,
    o.created_at,
    o.updated_at
FROM
    public.orders o
ORDER BY
    o.created_at DESC;