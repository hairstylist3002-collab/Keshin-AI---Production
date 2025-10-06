-- SAFE fix for user_profiles trigger issue
-- This migration addresses the database error when saving new users WITHOUT deleting existing data

-- Create improved function to automatically create user profile when a new user signs up
-- Using CREATE OR REPLACE to avoid destructive operations
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Check if profile already exists to avoid conflicts
  IF NOT EXISTS (
    SELECT 1 FROM user_profiles WHERE id = NEW.id
  ) THEN
    INSERT INTO user_profiles (id, name, email, credits)
    VALUES (
      NEW.id,
      COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', 'User'),
      COALESCE(NEW.email, 'unknown@example.com'),
      1
    );
  END IF;
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  -- Log the error but don't fail the authentication
  RAISE WARNING 'Failed to create user profile for user %: %', NEW.id, SQLERRM;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger only if it doesn't exist to avoid conflicts
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'on_auth_user_created') THEN
        CREATE TRIGGER on_auth_user_created
          AFTER INSERT ON auth.users
          FOR EACH ROW
          EXECUTE FUNCTION handle_new_user();
    END IF;
END $$;

-- Add a policy to allow the service role to bypass RLS for inserts
-- This is needed for the trigger to work properly
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'user_profiles' 
        AND policyname = 'Service role can insert profiles'
    ) THEN
        CREATE POLICY "Service role can insert profiles"
          ON user_profiles
          FOR INSERT
          TO service_role
          WITH CHECK (true);
    END IF;
END $$;

-- Create a function to manually create user profile (fallback)
-- Using CREATE OR REPLACE to avoid destructive operations
CREATE OR REPLACE FUNCTION create_user_profile_manually(
  user_id UUID,
  user_name TEXT DEFAULT 'User',
  user_email TEXT DEFAULT 'unknown@example.com',
  user_credits INTEGER DEFAULT 1
)
RETURNS BOOLEAN AS $$
BEGIN
  -- Check if profile already exists
  IF EXISTS (
    SELECT 1 FROM user_profiles WHERE id = user_id
  ) THEN
    RETURN true; -- Profile already exists
  END IF;
  
  -- Insert new profile
  INSERT INTO user_profiles (id, name, email, credits)
  VALUES (user_id, user_name, user_email, user_credits);
  
  RETURN true;
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'Failed to manually create user profile for user %: %', user_id, SQLERRM;
  RETURN false;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant necessary permissions only if they don't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.role_routine_grants 
        WHERE routine_name = 'create_user_profile_manually' 
        AND grantee = 'authenticated'
    ) THEN
        GRANT EXECUTE ON FUNCTION create_user_profile_manually TO authenticated;
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.role_routine_grants 
        WHERE routine_name = 'create_user_profile_manually' 
        AND grantee = 'service_role'
    ) THEN
        GRANT EXECUTE ON FUNCTION create_user_profile_manually TO service_role;
    END IF;
END $$;

-- Create function to update updated_at timestamp if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.routines 
        WHERE routine_name = 'update_updated_at_column'
    ) THEN
        CREATE OR REPLACE FUNCTION update_updated_at_column()
        RETURNS TRIGGER AS $$
        BEGIN
            NEW.updated_at = NOW();
            RETURN NEW;
        END;
        $$ LANGUAGE plpgsql;
        
        -- Create trigger for updating updated_at only if it doesn't exist
        IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_user_profiles_updated_at') THEN
            CREATE TRIGGER update_user_profiles_updated_at
                BEFORE UPDATE ON user_profiles
                FOR EACH ROW
                EXECUTE FUNCTION update_updated_at_column();
        END IF;
    END IF;
END $$;
