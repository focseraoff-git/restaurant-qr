-- ==========================================
-- MIGRATION: Add Granular Roles
-- ==========================================

-- Adding new roles as requested: 
-- Billing, Inventory, Staff, Counter, Waiter, Kitchen
-- (Admin exists. Kitchen/Counter exist as staff_kitchen/staff_counter, but we will add clean names)

ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'billing';
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'inventory';
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'staff';
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'counter';
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'waiter';
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'kitchen';

-- Note: We are keeping 'manager', 'staff_counter', 'staff_kitchen' for backward compatibility
-- but the UI will offer these new strict roles.

DO $$
BEGIN
    RAISE NOTICE 'Added granular roles to user_role enum.';
END $$;
