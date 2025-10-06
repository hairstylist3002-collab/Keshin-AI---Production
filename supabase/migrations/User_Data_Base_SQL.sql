-- Create user_profiles table to store user information and credits
CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  gender TEXT, -- ← NEW: Gender field for personalization
  credits INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_user_profiles_email ON user_profiles(email);
CREATE INDEX IF NOT EXISTS idx_user_profiles_credits ON user_profiles(credits);
CREATE INDEX IF NOT EXISTS idx_user_profiles_gender ON user_profiles(gender); -- ← NEW: Index for gender queries

-- Create function to automatically create user profile when a new user signs up
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO user_profiles (id, name, email, gender, credits)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', 'User'),
    COALESCE(NEW.email, 'unknown@example.com'),
    NULL, -- ← NEW: Gender will be NULL for auto-created profiles (users can update later)
    1
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to automatically create user profile
CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();

-- Create function to manually create user profile (with gender support)
CREATE OR REPLACE FUNCTION create_user_profile_manually(
  user_id UUID,
  user_name TEXT DEFAULT 'User',
  user_email TEXT DEFAULT 'unknown@example.com',
  user_gender TEXT DEFAULT NULL, -- ← NEW: Gender parameter
  user_credits INTEGER DEFAULT 1
)
RETURNS BOOLEAN AS $$
BEGIN
  -- Check if profile already exists
  IF EXISTS (SELECT 1 FROM user_profiles WHERE id = user_id) THEN
    -- Update existing profile with new data including gender
    UPDATE user_profiles 
    SET name = user_name, email = user_email, gender = user_gender, credits = user_credits, updated_at = NOW()
    WHERE id = user_id;
    RETURN true;
  END IF;
  
  -- Insert new profile with gender
  INSERT INTO user_profiles (id, name, email, gender, credits)
  VALUES (user_id, user_name, user_email, user_gender, user_credits);
  
  RETURN true;
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'Failed to manually create user profile for user %: %', user_id, SQLERRM;
  RETURN false;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updating updated_at
CREATE TRIGGER update_user_profiles_updated_at
    BEFORE UPDATE ON user_profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security (RLS)
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- Create policy to allow users to read their own profile
CREATE POLICY "Users can read own profile"
  ON user_profiles
  FOR SELECT
  USING (auth.uid() = id);

-- Create policy to allow users to update their own profile
CREATE POLICY "Users can update own profile"
  ON user_profiles
  FOR UPDATE
  USING (auth.uid() = id);

-- Create policy to allow users to insert their own profile (for the trigger)
CREATE POLICY "Users can insert own profile"
  ON user_profiles
  FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Grant permissions for the manual creation function
GRANT EXECUTE ON FUNCTION create_user_profile_manually TO authenticated;
GRANT EXECUTE ON FUNCTION create_user_profile_manually TO service_role;