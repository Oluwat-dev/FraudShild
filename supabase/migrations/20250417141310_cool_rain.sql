/*
  # Create users table with balance

  1. New Tables
    - `users` table with:
      - `id` (uuid, primary key)
      - `balance` (numeric, default 100,000,000,000,000)
      - `created_at` (timestamp with time zone)
      - `updated_at` (timestamp with time zone)

  2. Security
    - Enable RLS on users table
    - Add policy for users to view their own data
    - Add policy for system to update balances
*/

-- Create users table if it doesn't exist
CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  balance numeric DEFAULT 100000000000000 NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Allow users to view their own data
CREATE POLICY "Users can view own data"
  ON users
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

-- Allow system to update user balance
CREATE POLICY "System can update user balance"
  ON users
  FOR UPDATE
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();