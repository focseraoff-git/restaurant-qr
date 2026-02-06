-- ==========================================
-- STEP 2: FIX RLS POLICY (RUN AFTER STEP 1)
-- ==========================================

-- 1. Create a Secure Function to check role (Bypasses RLS)
CREATE OR REPLACE FUNCTION public.get_my_role()
RETURNS user_role AS $$
BEGIN
  RETURN (SELECT role FROM public.profiles WHERE id = auth.uid());
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- 2. Create the Security Helper for Restaurant ID
CREATE OR REPLACE FUNCTION public.get_my_restaurant_id()
RETURNS UUID AS $$
  SELECT restaurant_id FROM public.profiles WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- 3. Drop and Re-create the Policy
DROP POLICY IF EXISTS "Admins can view all restaurant profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can manage restaurant profiles" ON public.profiles;

-- Create "SELECT" policy (Fixes the 500 loop)
CREATE POLICY "Admins can view all restaurant profiles" ON public.profiles
FOR SELECT USING (
  -- We cast to text to be extra safe, or use the enum directly if Step 1 was run.
  (get_my_role() IN ('admin'::user_role, 'manager'::user_role, 'vendor_manager'::user_role))
  AND 
  restaurant_id = get_my_restaurant_id()
);

-- Create "ALL" policy (For editing/creating)
CREATE POLICY "Admins can manage restaurant profiles" ON public.profiles
FOR ALL USING (
  (get_my_role() IN ('admin'::user_role, 'manager'::user_role, 'vendor_manager'::user_role))
  AND 
  restaurant_id = get_my_restaurant_id()
);

DO $$ BEGIN RAISE NOTICE 'RLS Fixed. You can now login.'; END $$;
