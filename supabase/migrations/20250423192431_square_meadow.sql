/*
  # Add Fraud Case Management

  1. New Tables
    - `fraud_cases` table for tracking fraud investigations
      - `id` (uuid, primary key)
      - `transaction_id` (uuid, references transactions)
      - `status` (enum: open, investigating, resolved, disputed, closed)
      - `assigned_to` (uuid, references auth.users)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
      - `notes` (text)
      - `resolution` (text)
    
  2. Changes
    - Add `dispute_reason` to transactions table
    - Add policies for fraud case access
    
  3. Security
    - Enable RLS
    - Add policies for:
      - Users viewing their own cases
      - System role managing cases
*/

-- Create fraud case status enum
CREATE TYPE fraud_case_status AS ENUM (
  'open',
  'investigating',
  'resolved',
  'disputed',
  'closed'
);

-- Create fraud_cases table
CREATE TABLE IF NOT EXISTS fraud_cases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_id uuid REFERENCES transactions(id) NOT NULL,
  status fraud_case_status DEFAULT 'open' NOT NULL,
  assigned_to uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL,
  notes text,
  resolution text,
  CONSTRAINT valid_status CHECK (status IN ('open', 'investigating', 'resolved', 'disputed', 'closed'))
);

-- Add dispute_reason to transactions
ALTER TABLE transactions
ADD COLUMN IF NOT EXISTS dispute_reason text;

-- Enable RLS
ALTER TABLE fraud_cases ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view own cases"
  ON fraud_cases
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM transactions
      WHERE transactions.id = fraud_cases.transaction_id
      AND (transactions.user_id = auth.uid() OR transactions.recipient_id = auth.uid())
    )
  );

CREATE POLICY "System can manage cases"
  ON fraud_cases
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Create updated_at trigger
CREATE TRIGGER update_fraud_cases_updated_at
  BEFORE UPDATE ON fraud_cases
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();