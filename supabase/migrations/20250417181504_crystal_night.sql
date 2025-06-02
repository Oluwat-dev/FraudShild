/*
  # Add P2P Transaction Support

  1. New Columns
    - Add recipient_id to transactions table
    - Add transfer_type to transactions table

  2. Security
    - Update RLS policies for P2P transactions
    - Add function to validate recipient email
*/

-- Add new columns to transactions table
ALTER TABLE transactions
ADD COLUMN IF NOT EXISTS recipient_id uuid REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS transfer_type text CHECK (transfer_type IN ('payment', 'p2p_transfer'));

-- Create a function to validate recipient email
CREATE OR REPLACE FUNCTION validate_recipient_email(recipient_email text)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  recipient_id uuid;
BEGIN
  -- Get recipient's ID from auth.users
  SELECT id INTO recipient_id
  FROM auth.users
  WHERE email = recipient_email;

  IF recipient_id IS NULL THEN
    RAISE EXCEPTION 'Recipient not found';
  END IF;

  RETURN recipient_id;
END;
$$;

-- Update RLS policies
DROP POLICY IF EXISTS "Users can view own transactions" ON transactions;
CREATE POLICY "Users can view own transactions"
ON transactions
FOR SELECT
TO authenticated
USING (
  auth.uid() = user_id OR 
  auth.uid() = recipient_id
);

-- Add policy for creating P2P transfers
CREATE POLICY "Users can create P2P transfers"
ON transactions
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = user_id AND
  (recipient_id IS NULL OR EXISTS (
    SELECT 1 FROM auth.users WHERE id = recipient_id
  ))
);