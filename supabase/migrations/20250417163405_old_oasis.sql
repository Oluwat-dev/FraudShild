/*
  # Add email column to users table

  1. Changes
    - Add `email` column to `users` table
      - Type: text
      - Not nullable
      - Unique constraint
      - References auth.users(email)

  2. Notes
    - Email column is required for transaction processing
    - Email must be unique across all users
    - Email is synchronized with auth.users table
*/

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'users' AND column_name = 'email'
  ) THEN
    ALTER TABLE users 
    ADD COLUMN email text NOT NULL UNIQUE,
    ADD CONSTRAINT users_email_fkey FOREIGN KEY (email) REFERENCES auth.users(email);
  END IF;
END $$;