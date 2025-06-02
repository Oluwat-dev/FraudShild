/*
  # Update transfer_money function

  1. Changes
    - Update transfer_money function to handle balance updates
    - Ensure proper balance updates for both sender and recipient
    - Fix notification and balance tracking
*/

CREATE OR REPLACE FUNCTION transfer_money(
  p_sender_id uuid,
  p_recipient_id uuid,
  p_amount numeric
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_sender_email text;
  v_recipient_email text;
BEGIN
  -- Get sender and recipient emails
  SELECT email INTO v_sender_email FROM auth.users WHERE id = p_sender_id;
  SELECT email INTO v_recipient_email FROM auth.users WHERE id = p_recipient_id;

  -- Check if sender has sufficient funds
  IF NOT EXISTS (
    SELECT 1 FROM users 
    WHERE id = p_sender_id AND balance >= p_amount
  ) THEN
    RAISE EXCEPTION 'Insufficient funds';
  END IF;

  -- Deduct from sender
  UPDATE users 
  SET balance = balance - p_amount
  WHERE id = p_sender_id;

  -- Add to recipient
  UPDATE users 
  SET balance = balance + p_amount
  WHERE id = p_recipient_id;

  -- Record the transfer transaction for sender
  INSERT INTO transactions (
    user_id,
    recipient_id,
    amount,
    merchant,
    category,
    status,
    risk_score,
    is_fraudulent,
    location,
    transfer_type,
    email
  ) VALUES (
    p_sender_id,
    p_recipient_id,
    p_amount,
    'Money Transfer',
    'money_transfer',
    'approved',
    0,
    false,
    'Internal Transfer',
    'p2p_transfer',
    v_recipient_email
  );

  -- Record the received transaction for recipient
  INSERT INTO transactions (
    user_id,
    recipient_id,
    amount,
    merchant,
    category,
    status,
    risk_score,
    is_fraudulent,
    location,
    transfer_type,
    email
  ) VALUES (
    p_recipient_id,
    p_sender_id,
    p_amount,
    'Money Received',
    'money_transfer',
    'approved',
    0,
    false,
    'Internal Transfer',
    'p2p_transfer',
    v_sender_email
  );
END;
$$;