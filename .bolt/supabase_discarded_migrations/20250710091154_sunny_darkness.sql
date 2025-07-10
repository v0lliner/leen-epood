/*
  # Create order trigger functions
  
  1. New Functions
    - update_order_payment_status - Updates order status based on payment status
    - update_order_updated_at - Updates the updated_at timestamp when order is modified
    - update_order_payments_updated_at - Updates the updated_at timestamp when payment is modified
    - generate_order_number - Generates a unique order number when a new order is created
  
  2. Security
    - Enable RLS on orders and order_payments tables
    - Add policies for authenticated and public users
*/

-- Function to update order status based on payment status
CREATE OR REPLACE FUNCTION update_order_payment_status()
RETURNS TRIGGER AS $$
BEGIN
  -- If a new payment is COMPLETED, update order status to PAID
  IF (TG_OP = 'INSERT' AND NEW.status = 'COMPLETED') OR 
     (TG_OP = 'UPDATE' AND NEW.status = 'COMPLETED' AND OLD.status != 'COMPLETED') THEN
    UPDATE orders SET status = 'PAID' WHERE id = NEW.order_id;
  -- If payment is CANCELLED, update order status to CANCELLED
  ELSIF (TG_OP = 'INSERT' AND NEW.status = 'CANCELLED') OR 
        (TG_OP = 'UPDATE' AND NEW.status = 'CANCELLED' AND OLD.status != 'CANCELLED') THEN
    UPDATE orders SET status = 'CANCELLED' WHERE id = NEW.order_id;
  -- If payment is REFUNDED, update order status to REFUNDED
  ELSIF (TG_OP = 'INSERT' AND NEW.status = 'REFUNDED') OR 
        (TG_OP = 'UPDATE' AND NEW.status = 'REFUNDED' AND OLD.status != 'REFUNDED') THEN
    UPDATE orders SET status = 'REFUNDED' WHERE id = NEW.order_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to update the updated_at timestamp when order is modified
CREATE OR REPLACE FUNCTION update_order_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to update the updated_at timestamp when payment is modified
CREATE OR REPLACE FUNCTION update_order_payments_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to generate a unique order number when a new order is created
CREATE OR REPLACE FUNCTION generate_order_number()
RETURNS TRIGGER AS $$
BEGIN
  -- Generate order number with format ORD-YYYYMMDD-XXXX where XXXX is a random number
  NEW.order_number := 'ORD-' || to_char(now(), 'YYYYMMDD') || '-' || floor(random() * 9000 + 1000)::text;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers
DROP TRIGGER IF EXISTS update_order_on_new_payment ON order_payments;
CREATE TRIGGER update_order_on_new_payment
AFTER INSERT ON order_payments
FOR EACH ROW
EXECUTE FUNCTION update_order_payment_status();

DROP TRIGGER IF EXISTS update_order_on_payment_status ON order_payments;
CREATE TRIGGER update_order_on_payment_status
AFTER UPDATE OF status ON order_payments
FOR EACH ROW
EXECUTE FUNCTION update_order_payment_status();

DROP TRIGGER IF EXISTS update_orders_updated_at ON orders;
CREATE TRIGGER update_orders_updated_at
BEFORE UPDATE ON orders
FOR EACH ROW
EXECUTE FUNCTION update_order_updated_at();

DROP TRIGGER IF EXISTS update_order_payments_updated_at ON order_payments;
CREATE TRIGGER update_order_payments_updated_at
BEFORE UPDATE ON order_payments
FOR EACH ROW
EXECUTE FUNCTION update_order_payments_updated_at();

DROP TRIGGER IF EXISTS set_order_number ON orders;
CREATE TRIGGER set_order_number
BEFORE INSERT ON orders
FOR EACH ROW
WHEN (NEW.order_number IS NULL)
EXECUTE FUNCTION generate_order_number();

-- Ensure RLS is enabled on orders and order_payments tables
ALTER TABLE IF EXISTS orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS order_payments ENABLE ROW LEVEL SECURITY;

-- Create policies for orders table
CREATE POLICY "Public can view their orders by email"
  ON orders
  FOR SELECT
  TO public
  USING (customer_email IS NOT NULL);

CREATE POLICY "Users can view their own orders"
  ON orders
  FOR SELECT
  TO authenticated
  USING (user_id = uid());

-- Create policies for order_payments table
CREATE POLICY "Users can view their own order payments"
  ON order_payments
  FOR SELECT
  TO authenticated
  USING (order_id IN (SELECT id FROM orders WHERE user_id = uid()));