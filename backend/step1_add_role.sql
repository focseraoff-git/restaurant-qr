-- ==========================================
-- STEP 1: ADD MISSING ROLE
-- ==========================================

-- This must be run ALONE first.
-- Postgres requires this change to be "committed" before we can use it in a policy.

DO $$ BEGIN
    ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'vendor_manager';
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    RAISE NOTICE 'Role Added. Now run Step 2.';
END $$;
