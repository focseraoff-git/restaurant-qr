-- ==========================================
-- SYNC AUTH TO STAFF (ROBUST VERSION)
-- ==========================================

-- 1. Ensure the profile_id link exists
ALTER TABLE public.staff 
ADD COLUMN IF NOT EXISTS profile_id UUID REFERENCES public.profiles(id);

-- 2. Add Unique Constraint to allow ON CONFLICT checks
-- This prevents a user from having multiple staff records.
DO $$ BEGIN
    ALTER TABLE public.staff 
    ADD CONSTRAINT staff_profile_id_key UNIQUE (profile_id);
EXCEPTION
    WHEN duplicate_object THEN null; -- Ignore if already exists
    WHEN OTHERS THEN null;
END $$;

-- 3. Update the Trigger Function
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  meta_role user_role;
  meta_rest_id UUID;
  meta_name TEXT;
BEGIN
  -- Wrap entire block to ensure Auth User creation NEVER fails
  BEGIN
      -- Extract Metadata safely
      meta_name := new.raw_user_meta_data->>'full_name';
      
      -- CASTING SAFETY: Safe cast for Restaurant ID
      BEGIN
          meta_rest_id := (new.raw_user_meta_data->>'restaurant_id')::uuid;
      EXCEPTION WHEN OTHERS THEN
          meta_rest_id := NULL;
      END;
      
      -- CASTING SAFETY: Safe cast for Role
      BEGIN
        meta_role := (new.raw_user_meta_data->>'role')::user_role;
      EXCEPTION WHEN OTHERS THEN
        meta_role := 'staff'::user_role;
      END;

      -- A. Create Profile (Required for Login)
      -- Using ON CONFLICT to avoid errors if profile exists
      INSERT INTO public.profiles (id, full_name, role, restaurant_id)
      VALUES (
        new.id,
        meta_name,
        COALESCE(meta_role, 'staff'::user_role),
        meta_rest_id
      )
      ON CONFLICT (id) DO UPDATE 
      SET full_name = EXCLUDED.full_name;

      -- B. Auto-Create Staff Record (Sync with HR)
      -- Only if we have a valid restaurant_id
      IF meta_rest_id IS NOT NULL THEN
          INSERT INTO public.staff (
              restaurant_id, 
              name, 
              role, 
              profile_id,
              status,
              joining_date
          ) VALUES (
              meta_rest_id,
              COALESCE(meta_name, 'New User'),
              COALESCE(meta_role, 'staff'::user_role),
              new.id, -- Link to Auth User
              'active',
              CURRENT_DATE
          )
          ON CONFLICT (profile_id) DO NOTHING; -- Requires the CONSTRAINT added above
      END IF;

  EXCEPTION WHEN OTHERS THEN
      -- Log error but don't fail the auth creation
      RAISE WARNING 'Sync Logic Failed for user %: %', new.id, SQLERRM;
  END;

  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Re-apply Trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
