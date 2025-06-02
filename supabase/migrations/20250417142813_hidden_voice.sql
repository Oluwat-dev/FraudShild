/*
  # Add new fraud detection columns

  1. Changes
    - Add VPN/Proxy detection column
    - Add account age tracking column
    - Add indexes for new columns

  2. Security
    - Maintain existing RLS policies
*/

-- Add new columns to transactions table
ALTER TABLE transactions
ADD COLUMN IF NOT EXISTS vpn_proxy_detected boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS account_age_days integer;

-- Add indexes for new columns
CREATE INDEX IF NOT EXISTS idx_transactions_vpn_proxy ON transactions(vpn_proxy_detected);
CREATE INDEX IF NOT EXISTS idx_transactions_account_age ON transactions(account_age_days);

-- Update existing transactions with account age
DO $$
BEGIN
  UPDATE transactions t
  SET account_age_days = EXTRACT(DAY FROM (t.created_at - u.created_at))::integer
  FROM users u
  WHERE t.user_id = u.id
  AND t.account_age_days IS NULL;
END $$;