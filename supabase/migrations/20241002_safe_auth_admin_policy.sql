-- SAFE policy to allow Supabase auth trigger role to insert profiles
-- No destructive operations. Does not delete or modify existing data rows.

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'user_profiles' 
      AND policyname = 'Auth admin can insert profiles'
  ) THEN
    CREATE POLICY "Auth admin can insert profiles"
      ON public.user_profiles
      FOR INSERT
      TO supabase_auth_admin
      WITH CHECK (true);
  END IF;
END $$;
