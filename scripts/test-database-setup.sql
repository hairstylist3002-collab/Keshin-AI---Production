-- Test script to verify user_profiles table and functions are working correctly

-- 1. Check if user_profiles table exists
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name = 'user_profiles';

-- 2. Check if the trigger function exists
SELECT routine_name 
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name = 'handle_new_user';

-- 3. Check if the manual creation function exists
SELECT routine_name 
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name = 'create_user_profile_manually';

-- 4. Check RLS policies
SELECT policyname, tablename, permissive, cmd, roles 
FROM pg_policies 
WHERE tablename = 'user_profiles';

-- 5. Test the manual creation function (you can run this with actual values)
-- SELECT create_user_profile_manually('test-user-id', 'Test User', 'test@example.com', 1);

-- 6. Check existing user profiles
SELECT * FROM user_profiles LIMIT 10;

-- 7. Check for any trigger errors
SELECT * FROM pg_trigger WHERE tgname = 'on_auth_user_created';

-- 8. Check function definitions
SELECT pg_get_functiondef(oid) as function_definition
FROM pg_proc 
WHERE proname IN ('handle_new_user', 'create_user_profile_manually')
ORDER BY proname;
