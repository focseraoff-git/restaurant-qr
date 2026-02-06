-- FIX 406 ERROR FOR USER 29abae33...
-- 1. Insert Profile if missing
INSERT INTO public.profiles (id, full_name, role, restaurant_id)
VALUES (
    '29abae33-c282-4ba4-815f-30a16d1319ca', -- User ID from logs
    'Admin User',
    'admin',
    '8dba0462-8053-4889-a292-66fdce5603af' -- Replace with valid Restaurant ID if known, or leave NULL
)
ON CONFLICT (id) DO UPDATE
SET role = 'admin'; -- Ensure they are admin

-- 2. Ensure RLS allows reading
-- Drop restrictive policy if it's broken
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;

-- Create a simple permissive policy for now to unblock
CREATE POLICY "Users can view own profile" 
ON public.profiles FOR SELECT 
USING (auth.uid() = id);

-- 3. Also allow Admins to view ALL profiles (for Dashboard list)
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
CREATE POLICY "Admins can view all profiles" 
ON public.profiles FOR SELECT 
USING (
  (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
);
