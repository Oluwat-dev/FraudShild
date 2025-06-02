/*
  # Add email field to transactions table

  1. Changes
    - Add email column to transactions table
    - Update transactions with user emails from auth.users
*/

-- Add email column to transactions table if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'transactions' 
    AND column_name = 'email'
  ) THEN
    ALTER TABLE transactions 
    ADD COLUMN email text;
  END IF;
END $$;

-- Update transactions with user emails from auth.users
UPDATE transactions t
SET email = au.email
FROM auth.users au
WHERE t.user_id = au.id
AND t.email IS NULL;