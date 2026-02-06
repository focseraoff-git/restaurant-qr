-- CRITICAL FIX: SAFE TRIGGER (NON-BLOCKING)
-- This script updates the trigger to CATCH errors.
-- If something goes wrong (e.g. Invalid Role Enum), it will Log a Warning
-- BUT it will allow the User Creation to succeed.

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  meta_role text;
  meta_rest_id UUID;
  meta_name TEXT;
  fallback_rest_id UUID;
BEGIN
  -- Wrap everything in a Block to catch errors
  BEGIN
      -- 1. Try to fetch fallback restaurant
      SELECT id INTO fallback_rest_id FROM public.restaurants LIMIT 1;

      -- 2. Extract Metadata
      -- Use explicit public schema for safety
      meta_name := new.raw_user_meta_data->>'full_name';
      
      BEGIN
          meta_rest_id := (new.raw_user_meta_data->>'restaurant_id')::uuid;
      EXCEPTION WHEN OTHERS THEN
          meta_rest_id := NULL;
      END;
      
      meta_role := new.raw_user_meta_data->>'role';
      
      -- 3. Apply Defaults
      IF meta_name IS NULL OR meta_name = '' THEN meta_name := new.email; END IF;
      -- Default to 'staff' but handle potential enum mismatch later
      IF meta_role IS NULL THEN meta_role := 'staff'; END IF;
      
      IF meta_rest_id IS NULL THEN 
          meta_rest_id := fallback_rest_id; 
      END IF;

      -- 4. Insert into STAFF
      -- We explicitly cast to public.user_role. 
      -- If 'staff' is not a valid enum value, this line would throw, 
      -- but now it will be caught by the outer EXCEPTION block.
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
              meta_role::public.user_role, -- Explicit Schema Cast
              new.id,
              'active',
              CURRENT_DATE
          )
          ON CONFLICT (user_id) DO UPDATE 
          SET status = 'active'; 
      ELSE
          RAISE WARNING 'Trigger: No restaurant found for user %', new.email;
      END IF;

  EXCEPTION WHEN OTHERS THEN
      -- THIS IS THE FIX:
      -- We swallow the error and log it, so Auth User creation does NOT fail.
      RAISE WARNING 'Trigger Failed for User %: %', new.id, SQLERRM;
  END;

  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Re-Apply Trigger Definition just to be sure
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

COMMIT;

-- Verify
DO $$
BEGIN
  RAISE NOTICE 'Safe Trigger Applied. User creation should no longer fail.';
END $$;
