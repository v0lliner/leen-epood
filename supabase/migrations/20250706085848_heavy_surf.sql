/*
  # Create order payment status trigger

  1. New Functions
    - `update_order_payment_status()` - Updates order status based on payment status
  
  2. Triggers
    - Add trigger on order_payments table to update order status
    
  3. Security
    - No changes to security settings
*/

-- Function to update order status when payment status changes
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

-- Create trigger on order_payments table for new payments
CREATE TRIGGER update_order_on_new_payment
AFTER INSERT ON order_payments
FOR EACH ROW
EXECUTE FUNCTION update_order_payment_status();

-- Create trigger on order_payments table for payment status updates
CREATE TRIGGER update_order_on_payment_status
AFTER UPDATE OF status ON order_payments
FOR EACH ROW
EXECUTE FUNCTION update_order_payment_status();