/*
  # Fix P2P transfer location

  1. Changes
    - Update transfer_money function to use actual location instead of hardcoded value
    - Maintain all existing functionality
    - Ensure proper transaction recording
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
  v_sender_balance numeric;
  v_location text;
BEGIN
  -- Get sender and recipient emails
  SELECT email INTO v_sender_email FROM auth.users WHERE id = p_sender_id;
  SELECT email INTO v_recipient_email FROM auth.users WHERE id = p_recipient_id;
  
  -- Get sender's current balance
  SELECT balance INTO v_sender_balance
  FROM users 
  WHERE id = p_sender_id;

  -- Get the most recent location from sender's transactions
  SELECT location INTO v_location
  FROM transactions
  WHERE user_id = p_sender_id
  ORDER BY created_at DESC
  LIMIT 1;

  -- Default to 'Unknown' if no location found
  IF v_location IS NULL THEN
    v_location := 'Unknown';
  END IF;

  -- Check if sender has sufficient funds
  IF v_sender_balance < p_amount THEN
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
    'P2P Transfer',
    'money_transfer',
    'approved',
    0,
    false,
    v_location,
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
    v_location,
    'p2p_transfer',
    v_sender_email
  );
END;
$$;