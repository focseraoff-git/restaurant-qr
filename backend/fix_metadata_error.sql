-- ==========================================
-- FIX METADATA ERROR (Invalid UUID)
-- ==========================================

-- The error "invalid input syntax for type uuid" happens because
-- one of your users has a restaurant_id like "uuid/dashboard".
-- This script strips the "/dashboard" part to leave just the clean UUID.

UPDATE auth.users
SET raw_user_meta_data = jsonb_set(
    raw_user_meta_data,
    '{restaurant_id}',
    to_jsonb(split_part(raw_user_meta_data->>'restaurant_id', '/', 1))
)
WHERE raw_user_meta_data->>'restaurant_id' LIKE '%/%';

-- Verify
DO $$
BEGIN
    RAISE NOTICE 'Fixed invalid matching metadata IDs.';
END $$;
