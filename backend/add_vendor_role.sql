-- ==========================================
-- MIGRATION: Add 'vendor_manager' to Enum
-- ==========================================

-- PostgreSQL allows adding values to an enum inside a transaction (since v12).
-- But ALTER TYPE ... ADD VALUE cannot be run inside a transaction block in some older versions/contexts.
-- Supabase SQL Editor handles this fine usually.

ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'vendor_manager';

-- Verify
DO $$
BEGIN
    RAISE NOTICE 'Added vendor_manager to user_role enum';
END $$;
