-- Step 1: Add the 'referral_code' column to user_profiles if it doesn't already exist.
-- This ensures every user can have a referral code.
ALTER TABLE public.user_profiles
ADD COLUMN IF NOT EXISTS referral_code TEXT UNIQUE;

-- Step 2: Ensure the 'referrals' table exists and matches the required schema.
-- This table tracks who referred whom and prevents a user from being referred more than once.
CREATE TABLE IF NOT EXISTS public.referrals (
    id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    referrer_id UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
    referee_id UUID NOT NULL REFERENCES public.auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT referrals_referee_id_key UNIQUE (referee_id) -- Ensures a user can only be referred once.
);

-- Step 3: Overwrite the function that automatically creates user profiles upon signup.
-- This new version correctly assigns 2 credits and generates a unique 8-character referral code.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  new_referral_code TEXT;
BEGIN
  -- Generate a unique 8-character alphanumeric referral code.
  LOOP
    new_referral_code := (
      SELECT string_agg(
        substr('ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789', (floor(random() * 36)::int) + 1, 1),
        ''
      )
      FROM generate_series(1, 8)
    );
    EXIT WHEN NOT EXISTS (SELECT 1 FROM public.user_profiles WHERE referral_code = new_referral_code);
  END LOOP;

  -- Insert the new user's profile with 2 starting credits and their unique referral code.
  INSERT INTO public.user_profiles (id, name, email, credits, referral_code)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', 'User'),
    NEW.email,
    2,  -- Rule #1: All new users get 2 credits.
    new_referral_code -- Rule #2: Every new user gets a referral code.
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
