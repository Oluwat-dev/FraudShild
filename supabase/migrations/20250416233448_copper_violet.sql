/*
  # Add category column to transactions table

  1. Changes
    - Add `category` column to `transactions` table with default value 'other'
    - Add index on `category` column for improved query performance
    
  2. Notes
    - Using text type for flexibility in category values
    - Adding default value to ensure backward compatibility
    - Index added to optimize queries filtering or grouping by category
*/

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'transactions' 
    AND column_name = 'category'
  ) THEN
    ALTER TABLE transactions 
    ADD COLUMN category text NOT NULL DEFAULT 'other';

    CREATE INDEX IF NOT EXISTS idx_transactions_category 
    ON transactions(category);
  END IF;
END $$;