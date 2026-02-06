-- Add 'staff_manager' to the user_role enum
-- We use ALTER TYPE ... ADD VALUE which is safe and transaction-friendly in recent Postgres versions
BEGIN;

ALTER TYPE public.user_role ADD VALUE IF NOT EXISTS 'staff_manager';

COMMIT;

-- Verify
DO $$
BEGIN
  RAISE NOTICE 'Success: staff_manager role added.';
END $$;
