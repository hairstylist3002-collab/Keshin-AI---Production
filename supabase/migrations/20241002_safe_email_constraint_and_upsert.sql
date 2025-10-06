-- SAFE schema fix: remove email unique constraint if present and
-- change trigger to UPSERT by id to avoid failures.
-- This migration does NOT delete any user data.

-- 1) Drop UNIQUE constraint on email if it exists (keeps all rows intact)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.table_constraints
    WHERE table_schema = 'public'
      AND table_name = 'user_profiles'
      AND constraint_type = 'UNIQUE'
      AND constraint_name = 'user_profiles_email_key'
  ) THEN
    ALTER TABLE public.user_profiles DROP CONSTRAINT user_profiles_email_key;
  END IF;
END $$;

-- 2) Ensure our new handle_new_user uses UPSERT on id and proper search_path
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_profiles (id, name, email, credits, updated_at)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', 'User'),
    COALESCE(NEW.email, 'unknown@example.com'),
    1,
    NOW()
  )
  ON CONFLICT (id) DO UPDATE
    SET name = EXCLUDED.name,
        email = EXCLUDED.email,
        updated_at = NOW();

  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'handle_new_user failed for %: %', NEW.id, SQLERRM;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;

-- 3) Create trigger if missing (no-op if already present)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'on_auth_user_created'
  ) THEN
    CREATE TRIGGER on_auth_user_created
      AFTER INSERT ON auth.users
      FOR EACH ROW
      EXECUTE FUNCTION public.handle_new_user();
  END IF;
END $$;
