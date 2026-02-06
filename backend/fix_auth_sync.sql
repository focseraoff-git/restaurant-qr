-- FIX: SYNC ORPHANED AUTH USERS TO STAFF
-- This script looks for users in auth.users who are NOT in public.staff.
-- It attempts to insert them into public.staff.
-- Since we don't know the proper 'restaurant_id' if metadata is missing,
-- we might have to use a placeholder or the first available restaurant.

DO $$
DECLARE
    orphan_user RECORD;
    target_restaurant_id UUID;
    user_meta_name TEXT;
    user_meta_role TEXT;
    user_meta_rest UUID;
BEGIN
    -- 1. Try to get a valid restaurant ID to fallback to (e.g. the first one found)
    SELECT id INTO target_restaurant_id FROM public.restaurants LIMIT 1;
    
    IF target_restaurant_id IS NULL THEN
        RAISE NOTICE 'No restaurants found! Cannot sync users without a restaurant.';
        RETURN;
    END IF;

    -- 2. Loop through Orphaned Users
    FOR orphan_user IN 
        SELECT * FROM auth.users 
        WHERE id NOT IN (SELECT user_id FROM public.staff WHERE user_id IS NOT NULL)
    LOOP
        -- Extract Metadata if available
        user_meta_name := orphan_user.raw_user_meta_data->>'full_name';
        
        BEGIN
             user_meta_rest := (orphan_user.raw_user_meta_data->>'restaurant_id')::uuid;
        EXCEPTION WHEN OTHERS THEN
             user_meta_rest := NULL;
        END;

        user_meta_role := orphan_user.raw_user_meta_data->>'role';

        -- Fallback if missing
        IF user_meta_name IS NULL OR user_meta_name = '' THEN user_meta_name := orphan_user.email; END IF;
        IF user_meta_rest IS NULL THEN user_meta_rest := target_restaurant_id; END IF; 
        IF user_meta_role IS NULL THEN user_meta_role := 'staff'; END IF;

        -- Insert into Staff
        INSERT INTO public.staff (
            restaurant_id,
            name,
            role,
            user_id,
            status,
            joining_date
        ) VALUES (
            user_meta_rest,
            user_meta_name,
            user_meta_role::user_role, -- Cast string to enum
            orphan_user.id,
            'active',
            CURRENT_DATE
        );
        
        RAISE NOTICE ' synced user: % (%)', orphan_user.email, orphan_user.id;
        
    END LOOP;
END $$;
