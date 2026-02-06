-- ==========================================
-- FIX PERMISSIONS (FORCE ADMIN ROLE)
-- ==========================================

-- The sync script likely defaulted your Admin user to 'staff' due to a safety fallback.
-- This script forcefully corrects the roles based on Email Address.

-- 1. Fix Profiles (The source of truth for Login)
UPDATE public.profiles
SET role = 'admin'
FROM auth.users
WHERE profiles.id = auth.users.id
AND auth.users.email LIKE 'admin@%';

UPDATE public.profiles
SET role = 'manager'
FROM auth.users
WHERE profiles.id = auth.users.id
AND auth.users.email LIKE 'manager@%';

-- 2. Fix Staff Table (The source for HR)
UPDATE public.staff
SET role = 'admin'
FROM public.profiles
WHERE staff.profile_id = profiles.id
AND profiles.role = 'admin';

UPDATE public.staff
SET role = 'manager'
FROM public.profiles
WHERE staff.profile_id = profiles.id
AND profiles.role = 'manager';


-- 3. Validation Check
DO $$
DECLARE
    admin_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO admin_count FROM public.profiles WHERE role = 'admin';
    RAISE NOTICE 'Fixed Roles. Total Admins found: %', admin_count;
END $$;
