/*
  # Add display order to portfolio items

  1. Changes
    - Add `display_order` column to `portfolio_items` table
    - Set default values for existing items
    - Add index for better performance

  2. Security
    - No changes to existing RLS policies needed
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

-- Set initial display_order values based on creation date
UPDATE portfolio_items 
SET display_order = row_number() OVER (ORDER BY created_at)
WHERE display_order = 0 OR display_order IS NULL;

-- Add index for better performance
CREATE INDEX IF NOT EXISTS portfolio_items_display_order_idx 
ON portfolio_items (display_order);