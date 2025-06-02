-- Create a function to handle money transfers
CREATE OR REPLACE FUNCTION transfer_money(
  p_sender_id uuid,
  p_recipient_id uuid,
  p_amount numeric
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
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

  -- Record the transfer transaction
  INSERT INTO transactions (
    user_id,
    amount,
    merchant,
    category,
    status,
    risk_score,
    is_fraudulent,
    location
  ) VALUES (
    p_sender_id,
    p_amount,
    'Money Transfer',
    'money_transfer',
    'approved',
    0,
    false,
    'Internal Transfer'
  );

  -- Record the received transaction
  INSERT INTO transactions (
    user_id,
    amount,
    merchant,
    category,
    status,
    risk_score,
    is_fraudulent,
    location
  ) VALUES (
    p_recipient_id,
    p_amount,
    'Money Received',
    'money_transfer',
    'approved',
    0,
    false,
    'Internal Transfer'
  );
END;
$$;