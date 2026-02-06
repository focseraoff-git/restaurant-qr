-- ==========================================
-- FIX 406 ERROR (MISSING PROFILE / POLICY)
-- ==========================================

-- 1. Refresh Schema Cache (Fixes potential Stale Enum issues)
COMMENT ON TABLE public.profiles IS 'User Profiles (Refreshed)';

-- 2. Ensure "View Own Profile" Policy Exists
-- If this is missing, you get 0 rows -> 406 Error
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;

CREATE POLICY "Users can view own profile" ON public.profiles
FOR SELECT USING (auth.uid() = id);

-- 3. Update Own Profile (Enable editing)
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile" ON public.profiles
FOR UPDATE USING (auth.uid() = id);


-- 4. SYNC MISSING PROFILES (The likely cause)
-- If your user has no profile row, the query fails.
DO $$
DECLARE
    r RECORD;
    meta_name TEXT;
    meta_role user_role;
    meta_rest_id UUID;
BEGIN
    FOR r IN SELECT * FROM auth.users LOOP
        
        -- Extract Metadata
        meta_name := r.raw_user_meta_data->>'full_name';
        
        BEGIN
            meta_rest_id := (r.raw_user_meta_data->>'restaurant_id')::uuid;
        EXCEPTION WHEN OTHERS THEN meta_rest_id := NULL; END;
        
        -- Safe Role Casting (Now that Step 1 is done, vendor_manager works)
        BEGIN
            meta_role := (r.raw_user_meta_data->>'role')::user_role;
        EXCEPTION WHEN OTHERS THEN meta_role := 'staff'::user_role; END;

        -- Create Profile if missing
        IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = r.id) THEN
            INSERT INTO public.profiles (id, full_name, role, restaurant_id)
            VALUES (
                r.id, 
                COALESCE(meta_name, 'New User'), 
                COALESCE(meta_role, 'staff'::user_role), 
                meta_rest_id
            );
            RAISE NOTICE 'Repaired Profile for %', r.email;
        END IF;

    END LOOP;
END $$;

DO $$ BEGIN RAISE NOTICE 'Fix Complete. Profile Data Guaranteed.'; END $$;
