-- RESTORE AUTH-STAFF CONNECTION (FIXED)
-- Goal: Link existing Auth Users to existing Staff records using NAME.
-- (Since 'staff' table does not have email column, we rely on Name matching).

BEGIN;

DO $$
DECLARE
    r RECORD;
    user_name TEXT;
BEGIN
    -- 1. Loop through all Auth Users
    FOR r IN SELECT * FROM auth.users LOOP
        
        -- Extract Name from Metadata
        user_name := r.raw_user_meta_data->>'full_name';
        
        IF user_name IS NOT NULL THEN
            -- A. Try to find a matching Staff record by Name (if user_id is null)
            --    Matches "John Doe" in Auth with "John Doe" in Staff
            UPDATE public.staff
            SET user_id = r.id
            WHERE name = user_name 
              AND user_id IS NULL;
              
            IF FOUND THEN
                RAISE NOTICE 'Restored link for user: % (Name: %)', r.email, user_name;
            END IF;
        END IF;

    END LOOP;
END $$;

COMMIT;

-- Verify
SELECT count(*) as unconnected_staff FROM public.staff WHERE user_id IS NULL;
