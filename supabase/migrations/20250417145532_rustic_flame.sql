/*
  # Update default balance value

  1. Changes
    - Update the default balance value for new users to 5000000000000
    - Update existing users' balances to the new value
*/

-- Update default balance for new users
ALTER TABLE public.users 
ALTER COLUMN balance SET DEFAULT 5000000000000;

-- Update existing users to new balance value
UPDATE public.users 
SET balance = 5000000000000 
WHERE balance > 5000000000000;