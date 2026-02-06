-- FINAL FIX: AUTH -> STAFF TRIGGER
-- This script repairs the automation that creates a Staff record when a User signs up.
-- It fixes the "Invalid Role" error by checking if the role is 'staff' (invalid) and changing it to 'waiter' (valid).

BEGIN;

-- 1. Remove old definitions to ensure a clean slate
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

-- 2. Create the robust function
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  meta_rest_id UUID;
  meta_role TEXT;
  meta_name TEXT;
  default_rest_id UUID;
BEGIN
  -- A. Get a fallback restaurant ID (The first one found)
  SELECT id INTO default_rest_id FROM public.restaurants LIMIT 1;

  -- B. Parse Inputs
  meta_name := new.raw_user_meta_data->>'full_name';
  IF meta_name IS NULL OR meta_name = '' THEN meta_name := new.email; END IF;
  
  -- C. Handle Restaurant ID
  BEGIN
      meta_rest_id := (new.raw_user_meta_data->>'restaurant_id')::uuid;
  EXCEPTION WHEN OTHERS THEN
      meta_rest_id := NULL;
  END;
  IF meta_rest_id IS NULL THEN meta_rest_id := default_rest_id; END IF;

  -- D. Handle Role (CRITICAL FIX)
  meta_role := new.raw_user_meta_data->>'role';
  
  -- If role is missing OR is the old invalid 'staff', default to 'waiter'
  IF meta_role IS NULL OR meta_role = 'staff' THEN 
      meta_role := 'waiter'; 
  END IF;

  -- E. Insert (Only if we have a restaurant)
  IF meta_rest_id IS NOT NULL THEN
      INSERT INTO public.staff (
          restaurant_id, 
          name, 
          role, 
          user_id, 
          status, 
          joining_date
      ) VALUES (
          meta_rest_id,
          meta_name,
          meta_role::public.user_role, -- Cast to the Enum type
          new.id,
          'active',
          CURRENT_DATE
      )
      ON CONFLICT (user_id) DO UPDATE 
      SET status = 'active';
  END IF;

  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Re-Attach the Trigger
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

COMMIT;

-- Verify
DO $$
BEGIN
  RAISE NOTICE 'Fixed Trigger Applied. New users will default to "waiter" role.';
END $$;
