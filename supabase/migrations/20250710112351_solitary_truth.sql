/*
  # Add reference column to orders table

  1. Changes
    - Add `reference` column to `orders` table with UNIQUE constraint
*/

-- Add reference column to orders table if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'orders' AND column_name = 'reference'
  ) THEN
    ALTER TABLE orders ADD COLUMN reference TEXT UNIQUE;
  END IF;
END $$;