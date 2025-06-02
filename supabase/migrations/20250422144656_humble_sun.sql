/*
  # Update transfer_money function to handle transaction status

  1. Changes
    - Only process balance updates for approved transactions
    - Add status tracking for transactions
    - Prevent balance updates for disputed/cancelled transactions
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
BEGIN
  -- Get sender and recipient emails
  SELECT email INTO v_sender_email FROM auth.users WHERE id = p_sender_id;
  SELECT email INTO v_recipient_email FROM auth.users WHERE id = p_recipient_id;
  
  -- Get sender's current balance
  SELECT balance INTO v_sender_balance
  FROM users 
  WHERE id = p_sender_id;

  -- Check if sender has sufficient funds
  IF v_sender_balance < p_amount THEN
    RAISE EXCEPTION 'Insufficient funds';
  END IF;

  -- Start transaction
  BEGIN
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
      'Internal Transfer',
      'p2p_transfer',
      v_recipient_email
    );

    -- Only update balances for approved transactions
    IF NOT EXISTS (
      SELECT 1 FROM transactions 
      WHERE user_id = p_sender_id 
      AND status IN ('disputed', 'cancelled')
      ORDER BY created_at DESC 
      LIMIT 1
    ) THEN
      -- Deduct from sender
      UPDATE users 
      SET balance = balance - p_amount
      WHERE id = p_sender_id;

      -- Add to recipient
      UPDATE users 
      SET balance = balance + p_amount
      WHERE id = p_recipient_id;

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
    END IF;

    -- If we get here, commit the transaction
    COMMIT;
  EXCEPTION
    WHEN OTHERS THEN
      -- If anything goes wrong, roll back
      ROLLBACK;
      RAISE;
  END;
END;
$$;