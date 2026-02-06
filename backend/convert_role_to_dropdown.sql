-- =========================================================
-- FIX: Enable Dropdown for Role Column in Supabase Editor
-- =========================================================

-- 1. Clean up data (ensure lowercase matches Enum)
-- Converting any "Billing" to "billing", "Admin" to "admin", etc.
UPDATE public.staff SET role = lower(role);

-- 1b. Fix Empty/Invalid Roles (The cause of your error)
-- If role is empty string or null, set to 'staff' (or a safe default)
UPDATE public.staff 
SET role = 'staff' 
WHERE role IS NULL OR role = '';

-- 2. Convert column from TEXT to ENUM (Dropdown)
-- This is what enables the "Select" menu in Supabase's grid view.
ALTER TABLE public.staff 
  ALTER COLUMN role TYPE user_role 
  USING role::user_role;

-- 3. Verification
DO $$
BEGIN
    RAISE NOTICE 'Success! Staff role column is now a Dropdown (Enum).';
END $$;
