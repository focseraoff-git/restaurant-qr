-- ==========================================
-- DISABLE AUTH TRIGGER (UNBLOCK INSERTION)
-- ==========================================

-- Removing the trigger allows the Node.js script to create users 
-- without crashing due to downstream database errors.

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

DO $$ 
BEGIN 
    RAISE NOTICE 'Trigger Disabled. run node scripts/seed_users_admin.js now.';
END $$;
