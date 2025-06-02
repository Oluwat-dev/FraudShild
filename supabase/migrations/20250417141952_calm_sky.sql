/*
  # Remove balance from users table

  1. Changes
    - Remove balance column from users table
    - Update policies to remove balance-related permissions
  
  2. Security
    - Maintain RLS on users table
    - Update policies for data access
*/

-- Drop balance column from users table
ALTER TABLE users DROP COLUMN IF EXISTS balance;

-- Drop existing policies
DROP POLICY IF EXISTS "System can update user balance" ON users;

-- Update remaining policies
DO $$ 
BEGIN
  -- Drop existing policies
  DROP POLICY IF EXISTS "Users can view own data" ON users;
  DROP POLICY IF EXISTS "Users can insert own record" ON users;
  DROP POLICY IF EXISTS "System can insert users" ON users;
  
  -- Recreate policies without balance-related permissions
  CREATE POLICY "Users can view own data"
    ON users
    FOR SELECT
    TO authenticated
    USING (auth.uid() = id);

  CREATE POLICY "Users can insert own record"
    ON users
    FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = id);

  CREATE POLICY "System can insert users"
    ON users
    FOR INSERT
    TO service_role
    WITH CHECK (true);
END $$;