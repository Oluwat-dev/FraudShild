/*
  # Add user creation trigger

  1. Changes
    - Create trigger function to handle new user creation
    - Add trigger to automatically create user record when auth.users receives new entry
  
  2. Security
    - No changes to existing RLS policies
    - Maintains existing table security
*/

-- Create the trigger function
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.users (id)
  VALUES (NEW.id)
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create the trigger
DO $$ BEGIN
  -- First check if the trigger doesn't already exist
  IF NOT EXISTS (
    SELECT 1
    FROM pg_trigger
    WHERE tgname = 'on_auth_user_created'
  ) THEN
    CREATE TRIGGER on_auth_user_created
      AFTER INSERT ON auth.users
      FOR EACH ROW
      EXECUTE FUNCTION public.handle_new_user();
  END IF;
END $$;