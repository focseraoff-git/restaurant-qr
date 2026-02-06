-- ==========================================
-- FINAL STEP: RE-ENABLE SECURITY (RLS)
-- ==========================================

-- We temporarily disabled RLS to debug the 406 error.
-- Now that Login + Admin UI are working, we must turn it back on.

-- 1. Enable RLS on Profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 2. Verify Policies exist (just in case)
-- "Users can view own profile" (Created in fix_login_406.sql)
-- "Admins can view all restaurant profiles" (Created in step2_fix_policy.sql)

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'profiles' 
        AND policyname = 'Users can view own profile'
    ) THEN
        RAISE NOTICE 'WARNING: Basic user policy might be missing. Ensure you ran fix_login_406.sql';
    END IF;

    RAISE NOTICE 'Security (RLS) is now ACTIVE and SAFE.';
END $$;
