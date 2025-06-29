/*
  # Add display_order to portfolio_items

  1. Changes
    - Add display_order column to portfolio_items table
    - Set initial display_order values based on creation date
    - Add index for better performance

  2. Security
    - No RLS changes needed as existing policies apply
*/

-- Add display_order column to portfolio_items
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'portfolio_items' AND column_name = 'display_order'
  ) THEN
    ALTER TABLE portfolio_items ADD COLUMN display_order integer DEFAULT 0;
  END IF;
END $$;

-- Set initial display_order values based on creation date using a subquery approach
DO $$
DECLARE
  item_record RECORD;
  order_counter INTEGER := 1;
BEGIN
  FOR item_record IN 
    SELECT id FROM portfolio_items 
    WHERE display_order = 0 OR display_order IS NULL
    ORDER BY created_at ASC
  LOOP
    UPDATE portfolio_items 
    SET display_order = order_counter 
    WHERE id = item_record.id;
    
    order_counter := order_counter + 1;
  END LOOP;
END $$;

-- Add index for better performance
CREATE INDEX IF NOT EXISTS portfolio_items_display_order_idx 
ON portfolio_items (display_order);