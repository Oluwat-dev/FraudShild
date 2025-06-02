/*
  # Add insert policy for fraud cases

  1. Changes
    - Add RLS policy to allow authenticated users to create fraud cases for their own transactions
  
  2. Security
    - Users can only create fraud cases for transactions where they are either the sender or recipient
    - System role retains full access through existing policy
*/

CREATE POLICY "Users can create fraud cases for their transactions"
  ON fraud_cases
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM transactions
      WHERE transactions.id = fraud_cases.transaction_id
      AND (transactions.user_id = auth.uid() OR transactions.recipient_id = auth.uid())
    )
  );