/*
  # Update transactions table and policies

  1. Changes
    - Add conditional checks for table and policy creation
    - Ensure indexes are created only if they don't exist
    - Maintain all existing constraints and defaults

  2. Security
    - Enable RLS
    - Add policies for:
      - Users viewing their own transactions
      - System role inserting transactions
      - System role updating transaction status
*/

DO $$ BEGIN
  -- Create transactions table if it doesn't exist
  CREATE TABLE IF NOT EXISTS transactions (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES auth.users NOT NULL,
    amount numeric NOT NULL,
    merchant text NOT NULL,
    category text NOT NULL,
    status text NOT NULL DEFAULT 'pending',
    risk_score numeric DEFAULT 0,
    is_fraudulent boolean DEFAULT false,
    created_at timestamptz DEFAULT now(),
    ip_address text,
    device_id text,
    location text,
    CONSTRAINT valid_status CHECK (status IN ('pending', 'completed', 'failed', 'flagged')),
    CONSTRAINT valid_risk_score CHECK (risk_score >= 0 AND risk_score <= 1)
  );
EXCEPTION
  WHEN duplicate_table THEN
    NULL;
END $$;

-- Enable RLS if not already enabled
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist and recreate them
DO $$ BEGIN
  DROP POLICY IF EXISTS "Users can view own transactions" ON transactions;
  DROP POLICY IF EXISTS "System can insert transactions" ON transactions;
  DROP POLICY IF EXISTS "System can update transaction status" ON transactions;
EXCEPTION
  WHEN undefined_object THEN
    NULL;
END $$;

-- Recreate policies
CREATE POLICY "Users can view own transactions"
  ON transactions
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "System can insert transactions"
  ON transactions
  FOR INSERT
  TO service_role
  WITH CHECK (true);

CREATE POLICY "System can update transaction status"
  ON transactions
  FOR UPDATE
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Create indexes if they don't exist
DO $$ BEGIN
  CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON transactions(user_id);
EXCEPTION
  WHEN duplicate_table THEN NULL;
END $$;

DO $$ BEGIN
  CREATE INDEX IF NOT EXISTS idx_transactions_created_at ON transactions(created_at);
EXCEPTION
  WHEN duplicate_table THEN NULL;
END $$;

DO $$ BEGIN
  CREATE INDEX IF NOT EXISTS idx_transactions_status ON transactions(status);
EXCEPTION
  WHEN duplicate_table THEN NULL;
END $$;