-- ==========================================
-- MANUAL SYNC (RUN AFTER SEEDING)
-- ==========================================

-- This script finds any Auth Users who are missing a Profile or Staff record
-- and creates them based on their metadata.

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
        
        BEGIN
            meta_role := (r.raw_user_meta_data->>'role')::user_role;
        EXCEPTION WHEN OTHERS THEN meta_role := 'staff'::user_role; END;

        -- 1. Create Profile if missing
        IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = r.id) THEN
            INSERT INTO public.profiles (id, full_name, role, restaurant_id)
            VALUES (
                r.id, 
                COALESCE(meta_name, 'New User'), 
                COALESCE(meta_role, 'staff'::user_role), 
                meta_rest_id
            );
            RAISE NOTICE 'Created Profile for %', r.email;
        END IF;

        -- 2. Create Staff if missing (and we have a restaurant_id)
        IF meta_rest_id IS NOT NULL THEN
            -- Ensure profile_id column exists
            -- (Assuming schema is correct, if not this might fail, but let's assume standard)
            
            IF NOT EXISTS (SELECT 1 FROM public.staff WHERE profile_id = r.id) THEN
                INSERT INTO public.staff (
                    restaurant_id, 
                    name, 
                    role, 
                    profile_id, 
                    status, 
                    joining_date
                ) VALUES (
                    meta_rest_id, 
                    COALESCE(meta_name, 'New User'),
                    COALESCE(meta_role, 'staff'::user_role),
                    r.id,
                    'active',
                    CURRENT_DATE
                );
                RAISE NOTICE 'Created Staff Record for %', r.email;
            END IF;
        END IF;

    END LOOP;
END $$;
