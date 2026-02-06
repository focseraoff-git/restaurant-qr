-- CRITICAL FIX: ENABLE TRIGGER
-- Previous scripts created the FUNCTION but might have missed the TRIGGER itself.
-- This script ensures the trigger is ACTIVE on the auth.users table.

BEGIN;

-- 1. Refresh the Function Logic (Ensuring it handles missing metadata)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  meta_role text;
  meta_rest_id UUID;
  meta_name TEXT;
  fallback_rest_id UUID;
BEGIN
  -- 1. Try to fetch a default restaurant ID (Fallback)
  --    Useful if user is created via Supabase Dashboard without metadata
  SELECT id INTO fallback_rest_id FROM public.restaurants LIMIT 1;

  -- 2. Extract Metadata (Safe)
  meta_name := new.raw_user_meta_data->>'full_name';
  
  BEGIN
      meta_rest_id := (new.raw_user_meta_data->>'restaurant_id')::uuid;
  EXCEPTION WHEN OTHERS THEN
      meta_rest_id := NULL;
  END;
  
  meta_role := new.raw_user_meta_data->>'role';
  
  -- 3. Apply Defaults / Fallbacks
  IF meta_name IS NULL OR meta_name = '' THEN meta_name := new.email; END IF; 
  IF meta_role IS NULL THEN meta_role := 'staff'; END IF;
  
  -- Fallback for Restaurant ID
  IF meta_rest_id IS NULL THEN 
      meta_rest_id := fallback_rest_id; 
  END IF;

  -- 4. Insert into STAFF (Only if we have a valid restaurant ID)
  IF meta_rest_id IS NOT NULL THEN
      INSERT INTO public.staff (
          restaurant_id, 
          name, 
          role, 
          user_id, -- Link to Auth
          status,
          joining_date
      ) VALUES (
          meta_rest_id,
          meta_name,
          meta_role::user_role,
          new.id,
          'active',
          CURRENT_DATE
      )
      ON CONFLICT (user_id) DO UPDATE 
      SET 
        name = EXCLUDED.name,
        role = EXCLUDED.role;
  ELSE
      RAISE WARNING 'No restaurant found. User % created but not linked to Staff.', new.email;
  END IF;

  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. DROP OLD TRIGGER (To avoid duplicates or stale definitions)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- 3. CREATE TRIGGER (The Critical Step)
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

COMMIT;

-- Verification Message
DO $$
BEGIN
  RAISE NOTICE 'Trigger [on_auth_user_created] has been explicitly RE-CREATED and ENABLED.';
END $$;
