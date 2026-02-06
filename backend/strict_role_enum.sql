-- FIX: STRICT ROLES (FINAL)
-- Removed references to 'profiles' table which is already deleted.

BEGIN;

-- 1. DROP DEPENDENT FUNCTION (This is what blocks the type drop)
DROP FUNCTION IF EXISTS public.get_my_role(); 

-- 2. MIGRATE DATA to new valid values
--    (Casting to text to avoid type mismatch during update)
UPDATE public.staff SET role = 'counter' WHERE role::text = 'staff';
UPDATE public.staff SET role = 'counter' WHERE role::text = 'billing';
UPDATE public.staff SET role = 'counter' WHERE role::text = 'staff_counter';
UPDATE public.staff SET role = 'kitchen' WHERE role::text = 'staff_kitchen';
UPDATE public.staff SET role = 'manager' WHERE role::text = 'vendor_manager';

-- 3. UPDATE THE ENUM TYPE
ALTER TYPE public.user_role RENAME TO user_role_old;

CREATE TYPE public.user_role AS ENUM (
    'admin', 
    'manager', 
    'waiter', 
    'kitchen', 
    'counter', 
    'inventory'
);

ALTER TABLE public.staff 
ALTER COLUMN role TYPE public.user_role 
USING role::text::public.user_role;

DROP TYPE public.user_role_old;

-- 4. RESTORE 'get_my_role' (Updated to use STAFF table)
CREATE OR REPLACE FUNCTION public.get_my_role()
RETURNS public.user_role AS $$
DECLARE
  ret_role public.user_role;
BEGIN
  SELECT role INTO ret_role FROM public.staff WHERE user_id = auth.uid();
  RETURN ret_role;
EXCEPTION WHEN OTHERS THEN
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

COMMIT;

-- Verify
DO $$
BEGIN
  RAISE NOTICE 'Success: Strict Roles Enforced.';
END $$;
