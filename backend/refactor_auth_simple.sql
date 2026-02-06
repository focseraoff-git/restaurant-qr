-- ARCHITECTURE REFACTOR: MERGE PROFILES INTO STAFF
-- Goal: Simplify Authentication by removing the 'profiles' table.
--       All user data will live in 'staff'. 
--       Auth links will be via 'staff.user_id'.

BEGIN;

-- 1. Add 'user_id' column to Staff (replacing profile_id)
--    It links directly to auth.users
ALTER TABLE public.staff 
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id);

-- 2. Add Unique Constraint (One Auth Account = One Staff Member)
ALTER TABLE public.staff 
ADD CONSTRAINT staff_user_id_key UNIQUE (user_id);

-- 3. Migrate Data: Copy existing links
--    If staff.profile_id was set, that IS the user_id.
UPDATE public.staff
SET user_id = profile_id
WHERE profile_id IS NOT NULL;

-- 4. Clean up Old Constraints
ALTER TABLE public.staff DROP CONSTRAINT IF EXISTS staff_profile_id_fkey;
ALTER TABLE public.staff DROP COLUMN IF EXISTS profile_id;

-- 5. Drop the Profiles Table (It is now obsolete)
--    Note: We might need to drop dependent views/policies first if any exist.
DROP TABLE IF EXISTS public.profiles CASCADE;

-- 6. Update RLS Policies for Staff
--    (Ensure users can read their own row or admins can read all)
ALTER TABLE public.staff ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Staff can read own data" ON public.staff;
CREATE POLICY "Staff can read own data" ON public.staff
    FOR SELECT
    USING (auth.uid() = user_id OR auth.uid() IN (
        SELECT user_id FROM public.staff WHERE role = 'admin' -- Admins can read all
    ));

-- 7. Fix Trigger for New Users
--    We need to update 'handle_new_user' to insert into STAFF directly, ignoring profiles.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  meta_role text; -- Changed from user_role enum to text to be safe
  meta_rest_id UUID;
  meta_name TEXT;
BEGIN
  -- Safe Metadata Extraction
  meta_name := new.raw_user_meta_data->>'full_name';
  
  BEGIN
      meta_rest_id := (new.raw_user_meta_data->>'restaurant_id')::uuid;
  EXCEPTION WHEN OTHERS THEN
      meta_rest_id := NULL;
  END;
  
  meta_role := new.raw_user_meta_data->>'role';
  IF meta_role IS NULL THEN meta_role := 'staff'; END IF;

  -- Insert into STAFF table directly
  IF meta_rest_id IS NOT NULL THEN
      INSERT INTO public.staff (
          restaurant_id, 
          name, 
          role, 
          user_id, -- Direct Link to Auth
          status,
          joining_date
      ) VALUES (
          meta_rest_id,
          COALESCE(meta_name, 'New User'),
          meta_role::user_role, -- Cast to enum
          new.id, -- Use Auth ID
          'active',
          CURRENT_DATE
      );
  END IF;

  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMIT;

-- Refactor Complete.
