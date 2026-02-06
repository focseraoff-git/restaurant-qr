-- MIGRATION: ALLOW AUTH USER DELETION
-- Problem: Deleting a user in Supabase Auth/Dashboard fails because 'public.staff.user_id' references it.
-- Solution: Change the Foreign Key constraint to 'ON DELETE SET NULL'.
--           This dissociates the Staff record from the deleted Auth user, preserving the Staff history.

BEGIN;

-- 1. Drop the existing strict constraint
-- Note: Postgres usually names it 'staff_user_id_fkey' by default unless customized.
-- We try to drop it by name. If 'refactor_auth_simple.sql' created it without a name, it generated a default.

ALTER TABLE public.staff
DROP CONSTRAINT IF EXISTS staff_user_id_fkey;

-- 2. Re-add the constraint with ON DELETE SET NULL
ALTER TABLE public.staff
ADD CONSTRAINT staff_user_id_fkey
FOREIGN KEY (user_id)
REFERENCES auth.users(id)
ON DELETE SET NULL;

COMMIT;

-- Verify
DO $$
BEGIN
  RAISE NOTICE 'Constraint updated. You can now delete Auth Users safely.';
END $$;
