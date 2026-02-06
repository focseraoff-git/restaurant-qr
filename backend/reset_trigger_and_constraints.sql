-- ==========================================
-- EMERGENCY RESET: FIX TRIGGER & CONSTRAINTS
-- ==========================================

-- 1. DROP EVERYTHING related to the broken trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

-- 2. ENSURE PROFILE_ID exists
ALTER TABLE public.staff 
ADD COLUMN IF NOT EXISTS profile_id UUID REFERENCES public.profiles(id);

-- 3. CLEANUP DUPLICATES (Vital Step!)
-- We cannot create a UNIQUE constraint if duplicates already exist.
-- We keep the most recent one and delete others.
DELETE FROM public.staff a USING public.staff b
WHERE a.id < b.id 
AND a.profile_id IS NOT NULL 
AND a.profile_id = b.profile_id;

-- 4. FORCE CREATE UNIQUE INDEX
-- We use a unique index which acts as a constraint for ON CONFLICT
DROP INDEX IF EXISTS staff_profile_id_idx;
CREATE UNIQUE INDEX staff_profile_id_idx ON public.staff(profile_id);

-- 5. RE-CREATE THE TRIGGER FUNCTION (Simplified & Safe)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  meta_role user_role;
  meta_rest_id UUID;
  meta_name TEXT;
BEGIN
  -- SAFETY BLOCK
  BEGIN
      -- Extract Metadata
      meta_name := new.raw_user_meta_data->>'full_name';
      
      -- Safe Casts
      BEGIN
          meta_rest_id := (new.raw_user_meta_data->>'restaurant_id')::uuid;
      EXCEPTION WHEN OTHERS THEN meta_rest_id := NULL; END;
      
      BEGIN
        meta_role := (new.raw_user_meta_data->>'role')::user_role;
      EXCEPTION WHEN OTHERS THEN meta_role := 'staff'::user_role; END;

      -- A. Create Profile
      INSERT INTO public.profiles (id, full_name, role, restaurant_id)
      VALUES (
        new.id,
        meta_name,
        COALESCE(meta_role, 'staff'::user_role),
        meta_rest_id
      )
      ON CONFLICT (id) DO UPDATE 
      SET full_name = EXCLUDED.full_name;

      -- B. Create Staff
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
              new.id,
              'active',
              CURRENT_DATE
          )
          -- Now that we have the index 'staff_profile_id_idx', this works!
          ON CONFLICT (profile_id) DO NOTHING;
      END IF;

  EXCEPTION WHEN OTHERS THEN
      RAISE WARNING 'Trigger Failed for %: %', new.id, SQLERRM;
  END;

  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. RE-ENABLE TRIGGER
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

DO $$ BEGIN RAISE NOTICE 'Trigger and Constraints Reset Successfully.'; END $$;
