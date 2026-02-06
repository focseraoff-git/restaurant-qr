-- MIGRATION: ENFORCE STRICT VALID ROLES
-- Goal: 
-- 1. Migrate legacy roles (staff, billing, etc.) to valid ones.
-- 2. Restrict the database ENUM to only: admin, manager, waiter, kitchen, counter, inventory.
-- 3. Update Trigger to use valid default.

BEGIN;

-- 1. Update Functions FIRST (Release dependency on old enum if possible, or prepare for new one)
--    We update the trigger to default to 'counter' instead of 'staff'.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  meta_role text;
  meta_rest_id UUID;
  meta_name TEXT;
  fallback_rest_id UUID;
BEGIN
  SELECT id INTO fallback_rest_id FROM public.restaurants LIMIT 1;

  meta_name := new.raw_user_meta_data->>'full_name';
  
  BEGIN
      meta_rest_id := (new.raw_user_meta_data->>'restaurant_id')::uuid;
  EXCEPTION WHEN OTHERS THEN
      meta_rest_id := NULL;
  END;
  
  meta_role := new.raw_user_meta_data->>'role';
  
  IF meta_name IS NULL OR meta_name = '' THEN meta_name := new.email; END IF;
  
  -- NEW DEFAULT: 'counter' instead of 'staff'
  IF meta_role IS NULL OR meta_role = 'staff' THEN meta_role := 'counter'; END IF;
  
  IF meta_rest_id IS NULL THEN 
      meta_rest_id := fallback_rest_id; 
  END IF;

  IF meta_rest_id IS NOT NULL THEN
      -- We cast to text first, then to the type in the Insert statement if needed, 
      -- or just let Postgres handle the casting to the new type once columns are updated.
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
          meta_role::public.user_role, -- This will point to new type after migration
          new.id,
          'active',
          CURRENT_DATE
      )
      ON CONFLICT (user_id) DO UPDATE 
      SET status = 'active'; 
  END IF;

  RETURN new;
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'Trigger warning: %', SQLERRM;
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- 2. Data Migration: Clean up old values BEFORE changing type
--    Legacy: staff -> counter
--    Legacy: billing -> counter
--    Legacy: staff_counter -> counter
--    Legacy: staff_kitchen -> kitchen
--    Legacy: vendor_manager -> manager

-- We have to cast to text to compare because strictly they are enum values
UPDATE public.staff SET role = 'counter' WHERE role::text = 'staff';
UPDATE public.staff SET role = 'counter' WHERE role::text = 'billing';
UPDATE public.staff SET role = 'counter' WHERE role::text = 'staff_counter';
UPDATE public.staff SET role = 'kitchen' WHERE role::text = 'staff_kitchen';
UPDATE public.staff SET role = 'manager' WHERE role::text = 'vendor_manager';


-- 3. Replace the Enum Type using "Alter Type" strategy
--    Step A: Rename old type
ALTER TYPE public.user_role RENAME TO user_role_old;

--    Step B: Create new strict type
CREATE TYPE public.user_role AS ENUM (
    'admin', 
    'manager', 
    'waiter', 
    'kitchen', 
    'counter', 
    'inventory'
);

--    Step C: Update Table to use new type
--            (We explicitly cast the old values to text, then to new type)
ALTER TABLE public.staff 
ALTER COLUMN role TYPE public.user_role 
USING role::text::public.user_role;

--    Step D: Cleanup
DROP TYPE public.user_role_old;

COMMIT;

-- Verify
DO $$
BEGIN
  RAISE NOTICE 'Strict Roles Enforced: admin, manager, waiter, kitchen, counter, inventory.';
END $$;
