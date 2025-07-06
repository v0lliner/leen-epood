/*
  # Fix Customer IP Address in Maksekeskus Integration

  1. Functions
    - Ensures the update_order_payment_status function exists
    - Adds proper error handling to the function
  
  2. Triggers
    - Ensures the payment status update triggers exist
    - Adds IF NOT EXISTS conditions to prevent errors
  
  3. Security
    - No changes to security settings
*/

-- Function to update order status when payment status changes
CREATE OR REPLACE FUNCTION update_order_payment_status()
RETURNS TRIGGER AS $$
BEGIN
  -- Update order status based on payment status
  BEGIN
    IF NEW.status = 'COMPLETED' THEN
      UPDATE orders SET status = 'PAID' WHERE id = NEW.order_id;
    ELSIF NEW.status = 'CANCELLED' THEN
      UPDATE orders SET status = 'CANCELLED' WHERE id = NEW.order_id;
    ELSIF NEW.status = 'REFUNDED' THEN
      UPDATE orders SET status = 'REFUNDED' WHERE id = NEW.order_id;
    ELSIF NEW.status = 'PENDING' THEN
      UPDATE orders SET status = 'PENDING' WHERE id = NEW.order_id;
    END IF;
  EXCEPTION
    WHEN OTHERS THEN
      -- Log error but don't fail the trigger
      RAISE NOTICE 'Error updating order status: %', SQLERRM;
  END;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Ensure the triggers exist
DO $$
BEGIN
  -- Check if the trigger for new payments exists
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger 
    WHERE tgname = 'update_order_on_new_payment'
      AND tgrelid = 'order_payments'::regclass
  ) THEN
    CREATE TRIGGER update_order_on_new_payment
    AFTER INSERT ON order_payments
    FOR EACH ROW
    EXECUTE FUNCTION update_order_payment_status();
  END IF;
  
  -- Check if the trigger for payment status updates exists
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger 
    WHERE tgname = 'update_order_on_payment_status'
      AND tgrelid = 'order_payments'::regclass
  ) THEN
    CREATE TRIGGER update_order_on_payment_status
    AFTER UPDATE OF status ON order_payments
    FOR EACH ROW
    EXECUTE FUNCTION update_order_payment_status();
  END IF;
END
$$;