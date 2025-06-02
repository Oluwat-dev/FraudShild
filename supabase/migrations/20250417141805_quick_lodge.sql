/*
  # Fix users table and policies

  1. Changes
    - Create users table if it doesn't exist
    - Add policies for data access and updates
    - Add triggers for automatic updates
  
  2. Security
    - Enable RLS on users table
    - Add policies for authenticated users
    - Add policies for service role
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

-- Drop existing policies if they exist
DO $$ 
BEGIN
  -- Drop policies if they exist
  IF EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'users' AND policyname = 'Users can insert own record'
  ) THEN
    DROP POLICY "Users can insert own record" ON users;
  END IF;

  IF EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'users' AND policyname = 'Users can view own data'
  ) THEN
    DROP POLICY "Users can view own data" ON users;
  END IF;

  IF EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'users' AND policyname = 'System can insert users'
  ) THEN
    DROP POLICY "System can insert users" ON users;
  END IF;

  IF EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'users' AND policyname = 'System can update user balance'
  ) THEN
    DROP POLICY "System can update user balance" ON users;
  END IF;
END $$;

-- Create policies
CREATE POLICY "Users can insert own record"
  ON users
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can view own data"
  ON users
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "System can insert users"
  ON users
  FOR INSERT
  TO service_role
  WITH CHECK (true);

CREATE POLICY "System can update user balance"
  ON users
  FOR UPDATE
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Create or replace trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Drop and recreate trigger
DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Create or replace user creation trigger function
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id)
  VALUES (NEW.id)
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ language plpgsql security definer;

-- Drop and recreate auth trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();