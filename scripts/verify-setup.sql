-- SAFE verification script - NO destructive operations
-- Use this to verify the current database setup without risking data loss

-- 1. Check if user_profiles table exists (safe read-only query)
SELECT 
    'user_profiles table exists' as check_name,
    CASE WHEN EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'user_profiles'
    ) THEN '✅ PASS' ELSE '❌ FAIL' END as status;

-- 2. Check if user_profiles table has data (safe read-only query)
SELECT 
    'user_profiles has data' as check_name,
    CASE WHEN EXISTS (SELECT 1 FROM user_profiles LIMIT 1) 
    THEN '✅ PASS (' || (SELECT COUNT(*) FROM user_profiles) || ' records)' 
    ELSE '⚠️  No data found' END as status;

-- 3. Check trigger function exists (safe read-only query)
SELECT 
    'handle_new_user function exists' as check_name,
    CASE WHEN EXISTS (
        SELECT 1 FROM information_schema.routines 
        WHERE routine_schema = 'public' AND routine_name = 'handle_new_user'
    ) THEN '✅ PASS' ELSE '❌ FAIL' END as status;

-- 4. Check manual creation function exists (safe read-only query)
SELECT 
    'create_user_profile_manually function exists' as check_name,
    CASE WHEN EXISTS (
        SELECT 1 FROM information_schema.routines 
        WHERE routine_schema = 'public' AND routine_name = 'create_user_profile_manually'
    ) THEN '✅ PASS' ELSE '❌ FAIL' END as status;

-- 5. Check trigger exists (safe read-only query)
SELECT 
    'on_auth_user_created trigger exists' as check_name,
    CASE WHEN EXISTS (
        SELECT 1 FROM pg_trigger WHERE tgname = 'on_auth_user_created'
    ) THEN '✅ PASS' ELSE '❌ FAIL' END as status;

-- 6. Check RLS policies (safe read-only query)
SELECT 
    policyname as policy_name,
    '✅ EXISTS' as status
FROM pg_policies 
WHERE tablename = 'user_profiles'
ORDER BY policyname;

-- 7. Check existing user profiles structure (safe read-only query)
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'user_profiles'
ORDER BY ordinal_position;

-- 8. Sample user profile data (limited to 5 records - safe read-only query)
SELECT 
    id,
    name,
    email,
    credits,
    created_at,
    updated_at
FROM user_profiles 
LIMIT 5;

-- 9. Check for any recent errors in logs (safe read-only query)
-- This will show if there have been recent trigger failures
SELECT 
    'Recent trigger errors check' as check_name,
    '⚠️  Check server logs for details' as status
WHERE EXISTS (
    SELECT 1 FROM pg_trigger 
    WHERE tgname = 'on_auth_user_created'
    AND tgenabled = 'D' -- Disabled triggers might indicate issues
);
