-- ==========================================
-- MIGRATION: Convert Staff Role to Enum
-- ==========================================

-- 1. Ensure the Enum exists (it should from auth_schema)
DO $$ BEGIN
    CREATE TYPE user_role AS ENUM ('admin', 'manager', 'staff_counter', 'staff_kitchen');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 2. Update existing 'admin' text values to match enum if needed (case sensitivity)
-- Assuming current values might be 'Admin' or 'admin', let's normalize.
UPDATE public.staff SET role = lower(role);

-- 3. Alter the column type to use the Enum
-- The USING clause handles the casting from text to enum.
ALTER TABLE public.staff 
  ALTER COLUMN role TYPE user_role 
  USING role::user_role;

-- 4. Verify (Optional, will fail migration if invalid data exists)
-- If there are roles like 'waiter' not in the enum, this migration will fail.
-- In that case, we should update them first.
-- For now, we assume standard roles.
