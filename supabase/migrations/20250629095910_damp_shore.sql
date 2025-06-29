/*
  # Fix portfolio_items display_order column

  1. Changes
    - Ensure display_order column exists in portfolio_items table
    - Set default value to 0 for existing records
    - Add index for better performance

  2. Safety
    - Uses IF NOT EXISTS to prevent errors if column already exists
    - Updates existing records to have proper display_order values
*/

-- Ensure the display_order column exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'portfolio_items' AND column_name = 'display_order'
  ) THEN
    ALTER TABLE portfolio_items ADD COLUMN display_order integer DEFAULT 0;
  END IF;
END $$;

-- Update any existing records that might have NULL display_order
UPDATE portfolio_items 
SET display_order = 0 
WHERE display_order IS NULL;

-- Ensure we have an index on display_order for performance
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE tablename = 'portfolio_items' AND indexname = 'portfolio_items_display_order_idx'
  ) THEN
    CREATE INDEX portfolio_items_display_order_idx ON portfolio_items(display_order);
  END IF;
END $$;

-- Set proper display_order values based on creation date for existing items
DO $$
DECLARE
  item_record RECORD;
  counter INTEGER := 1;
BEGIN
  FOR item_record IN 
    SELECT id FROM portfolio_items 
    ORDER BY created_at ASC
  LOOP
    UPDATE portfolio_items 
    SET display_order = counter 
    WHERE id = item_record.id;
    counter := counter + 1;
  END LOOP;
END $$;