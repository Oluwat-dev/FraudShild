/*
  # Add missing transaction fields

  1. Changes
    - Add missing columns to transactions table:
      - `device_id` (text, nullable)
      - `ip_address` (text, nullable)
      - `merchant` (text, not null)
      - `location` (text, nullable)
      - `is_fraudulent` (boolean, not null, default false)

  2. Notes
    - All new columns are added safely without data loss
    - Default values ensure backward compatibility
*/

DO $$ 
BEGIN
  -- Add device_id column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'transactions' AND column_name = 'device_id'
  ) THEN
    ALTER TABLE transactions ADD COLUMN device_id text;
  END IF;

  -- Add ip_address column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'transactions' AND column_name = 'ip_address'
  ) THEN
    ALTER TABLE transactions ADD COLUMN ip_address text;
  END IF;

  -- Add merchant column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'transactions' AND column_name = 'merchant'
  ) THEN
    ALTER TABLE transactions ADD COLUMN merchant text NOT NULL DEFAULT 'Unknown Merchant';
  END IF;

  -- Add location column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'transactions' AND column_name = 'location'
  ) THEN
    ALTER TABLE transactions ADD COLUMN location text;
  END IF;

  -- Add is_fraudulent column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'transactions' AND column_name = 'is_fraudulent'
  ) THEN
    ALTER TABLE transactions ADD COLUMN is_fraudulent boolean NOT NULL DEFAULT false;
  END IF;
END $$;