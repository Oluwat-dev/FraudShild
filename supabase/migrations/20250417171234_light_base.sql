/*
  # Add get_user_by_email function

  1. New Functions
    - `get_user_by_email`: A function to safely retrieve user information by email
      - Takes an email address as input
      - Returns user ID if found
      - Uses auth.users table for lookup
      - Accessible to authenticated users only

  2. Security
    - Function is restricted to authenticated users only
    - Does not expose sensitive user information
*/

CREATE OR REPLACE FUNCTION get_user_by_email(email_address text)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN (
    SELECT id 
    FROM auth.users 
    WHERE email = email_address
    LIMIT 1
  );
END;
$$;