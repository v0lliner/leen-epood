-- Create order_number generation function if it doesn't exist
CREATE OR REPLACE FUNCTION generate_order_number()
RETURNS TRIGGER AS $$
DECLARE
  year_prefix text;
  next_number integer;
  new_order_number text;
BEGIN
  -- Get current year
  year_prefix := to_char(CURRENT_DATE, 'YYYY');
  
  -- Find the highest number for the current year
  SELECT COALESCE(MAX(NULLIF(regexp_replace(order_number, '^' || year_prefix || '-', '', 'g'), '')), 0)::integer
  INTO next_number
  FROM orders
  WHERE order_number LIKE year_prefix || '-%';
  
  -- Increment the number
  next_number := next_number + 1;
  
  -- Format the new order number (YYYY-XXXXX)
  new_order_number := year_prefix || '-' || LPAD(next_number::text, 5, '0');
  
  -- Set the order number
  NEW.order_number := new_order_number;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically generate order numbers if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger 
    WHERE tgname = 'set_order_number'
  ) THEN
    CREATE TRIGGER set_order_number
    BEFORE INSERT ON orders
    FOR EACH ROW
    WHEN (NEW.order_number IS NULL)
    EXECUTE FUNCTION generate_order_number();
  END IF;
END$$;

-- Create admin API views for order management
CREATE OR REPLACE VIEW admin_orders_view AS
SELECT 
  o.id,
  o.order_number,
  o.customer_name,
  o.customer_email,
  o.customer_phone,
  o.shipping_address,
  o.shipping_city,
  o.shipping_postal_code,
  o.shipping_country,
  o.total_amount,
  o.currency,
  o.status,
  o.notes,
  o.created_at,
  o.updated_at,
  o.user_id,
  COUNT(oi.id) AS item_count,
  COALESCE(MAX(op.status), 'PENDING'::payment_status) AS payment_status
FROM 
  orders o
LEFT JOIN 
  order_items oi ON o.id = oi.order_id
LEFT JOIN 
  order_payments op ON o.id = op.order_id
GROUP BY 
  o.id
ORDER BY 
  o.created_at DESC;

-- Create view for order statistics
CREATE OR REPLACE VIEW admin_order_stats AS
SELECT
  COUNT(*) AS total_orders,
  SUM(CASE WHEN status = 'PENDING' THEN 1 ELSE 0 END) AS pending_orders,
  SUM(CASE WHEN status = 'PAID' THEN 1 ELSE 0 END) AS paid_orders,
  SUM(CASE WHEN status = 'PROCESSING' THEN 1 ELSE 0 END) AS processing_orders,
  SUM(CASE WHEN status = 'SHIPPED' THEN 1 ELSE 0 END) AS shipped_orders,
  SUM(CASE WHEN status = 'COMPLETED' THEN 1 ELSE 0 END) AS completed_orders,
  SUM(CASE WHEN status = 'CANCELLED' THEN 1 ELSE 0 END) AS cancelled_orders,
  SUM(CASE WHEN status = 'REFUNDED' THEN 1 ELSE 0 END) AS refunded_orders,
  SUM(total_amount) AS total_revenue,
  SUM(CASE WHEN status IN ('PAID', 'PROCESSING', 'SHIPPED', 'COMPLETED') THEN total_amount ELSE 0 END) AS confirmed_revenue
FROM
  orders;

-- Grant access to views
GRANT SELECT ON admin_orders_view TO authenticated;
GRANT SELECT ON admin_order_stats TO authenticated;

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