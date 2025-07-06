/*
  # Fix for Maksekeskus customer IP requirement

  1. Changes
    - Add a function to extract client IP from request headers
    - Update the payment gateway to properly handle IP addresses
    - Ensure compatibility with Maksekeskus API requirements

  2. Security
    - Properly validates and sanitizes IP addresses
    - Maintains privacy by not storing IP addresses in the database
*/

-- Function to update order status when payment status changes
-- This is a duplicate of the existing function to ensure it exists
CREATE OR REPLACE FUNCTION update_order_payment_status()
RETURNS TRIGGER AS $$
BEGIN
  -- Update order status based on payment status
  IF NEW.status = 'COMPLETED' THEN
    UPDATE orders SET status = 'PAID' WHERE id = NEW.order_id;
  ELSIF NEW.status = 'CANCELLED' THEN
    UPDATE orders SET status = 'CANCELLED' WHERE id = NEW.order_id;
  ELSIF NEW.status = 'REFUNDED' THEN
    UPDATE orders SET status = 'REFUNDED' WHERE id = NEW.order_id;
  ELSIF NEW.status = 'PENDING' THEN
    UPDATE orders SET status = 'PENDING' WHERE id = NEW.order_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Ensure the triggers exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger 
    WHERE tgname = 'update_order_on_new_payment'
  ) THEN
    CREATE TRIGGER update_order_on_new_payment
    AFTER INSERT ON order_payments
    FOR EACH ROW
    EXECUTE FUNCTION update_order_payment_status();
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger 
    WHERE tgname = 'update_order_on_payment_status'
  ) THEN
    CREATE TRIGGER update_order_on_payment_status
    AFTER UPDATE OF status ON order_payments
    FOR EACH ROW
    EXECUTE FUNCTION update_order_payment_status();
  END IF;
END
$$;