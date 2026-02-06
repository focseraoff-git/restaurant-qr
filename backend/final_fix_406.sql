-- FINAL FIX: Create User in AUTH if missing, then Profile
-- This handles "Key (id) is not present in table users" error.

DO $$
BEGIN
    -- 1. Check if user exists in auth.users, if not create them (mock)
    IF NOT EXISTS (SELECT 1 FROM auth.users WHERE id = '29abae33-c282-4ba4-815f-30a16d1319ca') THEN
        INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, role)
        VALUES (
            '29abae33-c282-4ba4-815f-30a16d1319ca', 
            'admin_restored@example.com', -- Placeholder email
            '$2a$10$wTf/././././././././././.', -- Dummy bcrypt hash
            now(),
            'authenticated'
        );
    END IF;

    -- 2. NOW insert the profile
    INSERT INTO public.profiles (id, full_name, role, restaurant_id)
    VALUES (
        '29abae33-c282-4ba4-815f-30a16d1319ca', 
        'Admin User', 
        'admin', 
        '8dba0462-8053-4889-a292-66fdce5603af'
    )
    ON CONFLICT (id) DO UPDATE SET role = 'admin';

    -- 3. Ensure Policy Exists
    DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
    CREATE POLICY "Users can view own profile" 
    ON public.profiles FOR SELECT 
    USING (auth.uid() = id);

END $$;
