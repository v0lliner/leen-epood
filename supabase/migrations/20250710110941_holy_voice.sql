/*
  # Add reference column to orders table

  1. New Columns
    - Add `reference` column to `orders` table with UNIQUE constraint
    
  2. Changes
    - This allows tracking orders by their payment reference
*/

-- Add reference column to orders table
ALTER TABLE orders ADD COLUMN IF NOT EXISTS reference TEXT;

-- Add unique constraint to reference column
ALTER TABLE orders ADD CONSTRAINT orders_reference_key UNIQUE (reference);