-- ==========================================
-- FORCE CLEANUP SCRIPT
-- ==========================================

-- 1. Delete the specific demo users from auth.users
-- This will CASCADE delete their profiles due to the foreign key.
DELETE FROM auth.users 
WHERE email IN (
    'admin@restaurant.in', 
    'manager@restaurant.in', 
    'counter@restaurant.in', 
    'kitchen@restaurant.in'
);

-- 2. Verify cleanup
DO $$
DECLARE
    count_users INT;
BEGIN
    SELECT count(*) INTO count_users 
    FROM auth.users 
    WHERE email IN ('admin@restaurant.in', 'manager@restaurant.in');
    
    IF count_users > 0 THEN
        RAISE EXCEPTION 'Failed to delete users. Still found % users.', count_users;
    ELSE
        RAISE NOTICE 'Success: Users deleted.';
    END IF;
END $$;
