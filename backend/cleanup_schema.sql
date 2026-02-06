-- ==========================================
-- MASTER SCHEMA CLEANUP SCRIPT
-- ==========================================

-- 1. CONSOLIDATE WAITERS INTO STAFF
-- ------------------------------------------------
-- Add Waiter-specific columns to Staff (if they don't exist)
ALTER TABLE public.staff 
ADD COLUMN IF NOT EXISTS rating numeric DEFAULT 5.0,
ADD COLUMN IF NOT EXISTS is_available boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS current_tables_count integer DEFAULT 0;

-- Update Orders to reference Staff instead of Waiters
ALTER TABLE public.orders 
DROP CONSTRAINT IF EXISTS orders_waiter_id_fkey;

ALTER TABLE public.orders 
ADD CONSTRAINT orders_waiter_id_fkey 
FOREIGN KEY (waiter_id) REFERENCES public.staff(id);

-- Drop the redundant Waiters table
DROP TABLE IF EXISTS public.waiters;


-- 2. LINK STAFF TO PROFILES (Solve "Profiles vs Staff" confusion)
-- ------------------------------------------------
-- Add a link so we know which Staff record belongs to which Login User (Profile)
ALTER TABLE public.staff 
ADD COLUMN IF NOT EXISTS profile_id UUID REFERENCES public.profiles(id);

-- Optional: Sync Role from Profile to Staff for existing users (One-time fix)
UPDATE public.staff s
SET role = p.role
FROM public.profiles p
WHERE s.profile_id = p.id;


-- 3. ENSURE STAFF ROLE IS ENUM (From previous step, simpler to ensure here)
-- ------------------------------------------------
DO $$ BEGIN
    -- Ensure granular roles exist
    ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'billing';
    ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'inventory';
    ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'staff';
    ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'counter';
    ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'waiter';
    ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'kitchen';
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Validation Message
DO $$
BEGIN
    RAISE NOTICE 'Schema Cleanup Complete: Waiters merged into Staff. Staff linked to Profiles.';
END $$;
