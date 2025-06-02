/*
  # Add users table and balance feature
  
  1. New Tables
    - Create users table if it doesn't exist
    - Add balance column with default of 10,000,000,000,000,000,000
  
  2. Changes
    - Add function to update balance on transaction completion
    - Add trigger to automatically update balance
  
  3. Security
    - Enable RLS on users table
    - Add policy for users to view their own balance
*/

-- Create users table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.users (
  id uuid PRIMARY KEY REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now(),
  balance numeric DEFAULT 10000000000000000000 CHECK (balance >= 0)
);

-- Enable RLS
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Create function to update balance
CREATE OR REPLACE FUNCTION update_user_balance()
RETURNS TRIGGER AS $$
BEGIN
  -- Only update balance for approved transactions
  IF NEW.status = 'approved' THEN
    UPDATE public.users
    SET balance = balance - NEW.amount
    WHERE id = NEW.user_id;
    
    -- If balance would go below 0, reject the transaction
    IF NOT FOUND OR (SELECT balance FROM public.users WHERE id = NEW.user_id) < 0 THEN
      RAISE EXCEPTION 'Insufficient funds';
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for balance updates
DROP TRIGGER IF EXISTS update_balance_on_transaction ON public.transactions;
CREATE TRIGGER update_balance_on_transaction
  AFTER INSERT OR UPDATE ON public.transactions
  FOR EACH ROW
  EXECUTE FUNCTION update_user_balance();

-- Add RLS policies
CREATE POLICY "Users can view own balance"
  ON public.users
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update own balance"
  ON public.users
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);