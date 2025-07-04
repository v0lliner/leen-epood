-- Add order_number column to orders table if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'orders' AND column_name = 'order_number'
  ) THEN
    ALTER TABLE orders ADD COLUMN order_number text UNIQUE;
  END IF;
END$$;

-- Create function to generate sequential order numbers
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

-- Drop trigger if it exists
DROP TRIGGER IF EXISTS set_order_number ON orders;

-- Create trigger to automatically generate order numbers
CREATE TRIGGER set_order_number
BEFORE INSERT ON orders
FOR EACH ROW
WHEN (NEW.order_number IS NULL)
EXECUTE FUNCTION generate_order_number();

-- Update existing orders without order numbers
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN SELECT id FROM orders WHERE order_number IS NULL ORDER BY created_at
  LOOP
    UPDATE orders SET order_number = NULL WHERE id = r.id;
  END LOOP;
END$$;