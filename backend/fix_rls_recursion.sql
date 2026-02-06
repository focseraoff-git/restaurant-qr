-- FIX: INFINITE RLS RECURSION
-- Issue: The RLS policy on 'staff' queries 'staff' to check for admin, 
--        which triggers the policy again, causing an infinite loop (500 Error).

BEGIN;

-- 1. Create a Helper Function that Bypasses RLS (SECURITY DEFINER)
--    This allows us to check "Is Admin?" without triggering the policy loop.
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
DECLARE
  current_role public.user_role;
BEGIN
  -- Select role from staff directly (bypassing RLS due to SECURITY DEFINER)
  SELECT role INTO current_role
  FROM public.staff
  WHERE user_id = auth.uid();

  RETURN current_role = 'admin';
EXCEPTION WHEN OTHERS THEN
  RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Drop the Recursive Policy
DROP POLICY IF EXISTS "Staff can read own data" ON public.staff;

-- 3. Create the New, Safe Policy
--    "You can see rows if it's YOU, or if you are an ADMIN (checked via safe function)"
CREATE POLICY "Staff can read own data" ON public.staff
    FOR SELECT
    USING (
        user_id = auth.uid() 
        OR 
        public.is_admin() = TRUE
    );

-- 4. Enable Policy for Update/Delete as well (Optional but good practice)
DROP POLICY IF EXISTS "Admins can update all" ON public.staff;
CREATE POLICY "Admins can update all" ON public.staff
    FOR UPDATE
    USING (public.is_admin() = TRUE);

DROP POLICY IF EXISTS "Admins can delete all" ON public.staff;
CREATE POLICY "Admins can delete all" ON public.staff
    FOR DELETE
    USING (public.is_admin() = TRUE);

COMMIT;
