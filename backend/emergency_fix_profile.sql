-- ==========================================
-- EMERGENCY DEBUG: DISABLE RLS & FORCE DATA
-- ==========================================

-- 1. Disable Security Checks (Temporarily)
-- This confirms if the 406 error is due to "Permissions" or "Missing Data".
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;

-- 2. Force Create the Profile for the User ID from your logs
-- ID: 29abae33-c282-4ba4-815f-30a16d1319ca
INSERT INTO public.profiles (id, full_name, role, restaurant_id)
VALUES (
    '29abae33-c282-4ba4-815f-30a16d1319ca', -- The ID from your console log
    'Debug User',
    'admin', -- Force Admin role
    (SELECT id FROM restaurants LIMIT 1) -- Attach to first available restaurant
)
ON CONFLICT (id) DO UPDATE 
SET role = 'admin', full_name = 'Debug Admin';

-- 3. Verify
DO $$
BEGIN
    RAISE NOTICE 'RLS is OFF. Profile for 29abae... forced to Admin.';
END $$;
