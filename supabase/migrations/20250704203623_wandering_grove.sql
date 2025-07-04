-- Create function to update order payment status
CREATE OR REPLACE FUNCTION update_order_payment_status()
RETURNS TRIGGER AS $$
BEGIN
  -- If payment status is COMPLETED, update order status to PAID
  IF NEW.status = 'COMPLETED' AND 
     (SELECT status FROM orders WHERE id = NEW.order_id) = 'PENDING' THEN
    UPDATE orders SET status = 'PAID' WHERE id = NEW.order_id;
  END IF;
  
  -- If payment status is CANCELLED or EXPIRED, update order status to CANCELLED
  IF (NEW.status = 'CANCELLED' OR NEW.status = 'EXPIRED') AND 
     (SELECT status FROM orders WHERE id = NEW.order_id) = 'PENDING' THEN
    UPDATE orders SET status = 'CANCELLED' WHERE id = NEW.order_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for payment status updates
DROP TRIGGER IF EXISTS update_order_on_payment_status ON order_payments;

CREATE TRIGGER update_order_on_payment_status
AFTER UPDATE OF status ON order_payments
FOR EACH ROW
EXECUTE FUNCTION update_order_payment_status();

-- Create trigger for new payments
DROP TRIGGER IF EXISTS update_order_on_new_payment ON order_payments;

CREATE TRIGGER update_order_on_new_payment
AFTER INSERT ON order_payments
FOR EACH ROW
EXECUTE FUNCTION update_order_payment_status();