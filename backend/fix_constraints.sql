-- FIX FOREIGN KEY CONSTRAINT (CORRECTED)
-- Removed 'RAISE NOTICE' which causes syntax errors in standard SQL mode.

-- 1. Fix Staff -> Profile Link
-- Allow deleting a Profile without blocking (sets staff.profile_id to NULL)
ALTER TABLE public.staff
DROP CONSTRAINT IF EXISTS staff_profile_id_fkey;

ALTER TABLE public.staff
ADD CONSTRAINT staff_profile_id_fkey
FOREIGN KEY (profile_id)
REFERENCES public.profiles(id)
ON DELETE SET NULL;

-- 2. Fix Order -> Staff Link
-- Allow deleting a Staff Member without blocking (sets orders.waiter_id to NULL)
ALTER TABLE public.orders
DROP CONSTRAINT IF EXISTS orders_waiter_id_fkey;

ALTER TABLE public.orders
ADD CONSTRAINT orders_waiter_id_fkey
FOREIGN KEY (waiter_id)
REFERENCES public.staff(id)
ON DELETE SET NULL;

-- Done. Constraints are updated.
