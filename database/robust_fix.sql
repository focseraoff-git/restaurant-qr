-- ==============================================================================
-- ROBUST DASHBOARD FIX: RLS POLICIES & CASCADE DELETES
-- Run this script in the Supabase SQL Editor to enable full management.
-- ==============================================================================

BEGIN;

-- 1. FIX FOREIGN KEY CONSTRAINTS (Enable Cascading Deletes)
-- This allows deleting an order to automatically delete its items and payments.

-- Drop existing constraints if they exist (standard PostgreSQL names)
ALTER TABLE order_items DROP CONSTRAINT IF EXISTS order_items_order_id_fkey;
ALTER TABLE payments DROP CONSTRAINT IF EXISTS payments_order_id_fkey;
ALTER TABLE ratings DROP CONSTRAINT IF EXISTS ratings_order_id_fkey;
ALTER TABLE menu_items DROP CONSTRAINT IF EXISTS menu_items_category_id_fkey;

-- Re-add with ON DELETE CASCADE
ALTER TABLE order_items 
    ADD CONSTRAINT order_items_order_id_fkey 
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE;

ALTER TABLE payments 
    ADD CONSTRAINT payments_order_id_fkey 
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE;

ALTER TABLE ratings 
    ADD CONSTRAINT ratings_order_id_fkey 
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE;

ALTER TABLE menu_items 
    ADD CONSTRAINT menu_items_category_id_fkey 
    FOREIGN KEY (category_id) REFERENCES menu_categories(id) ON DELETE CASCADE;


-- 2. ENABLE ROBUST RLS POLICIES (Allow ALL operations)
-- This ensures the backend and dashboard can add, update, and delete records.

-- Orders
DROP POLICY IF EXISTS "Public create orders" ON orders;
DROP POLICY IF EXISTS "Public read orders" ON orders;
DROP POLICY IF EXISTS "Public update orders" ON orders;
DROP POLICY IF EXISTS "Enable all access for all users" ON orders;
CREATE POLICY "Enable all access for all users" ON orders FOR ALL USING (true) WITH CHECK (true);

-- Order Items
DROP POLICY IF EXISTS "Public create order items" ON order_items;
DROP POLICY IF EXISTS "Public read order items" ON order_items;
DROP POLICY IF EXISTS "Enable all access for all users" ON order_items;
CREATE POLICY "Enable all access for all users" ON order_items FOR ALL USING (true) WITH CHECK (true);

-- Payments
DROP POLICY IF EXISTS "Public create payments" ON payments;
DROP POLICY IF EXISTS "Public read payments" ON payments;
DROP POLICY IF EXISTS "Enable all access for all users" ON payments;
CREATE POLICY "Enable all access for all users" ON payments FOR ALL USING (true) WITH CHECK (true);

-- Waiters
DROP POLICY IF EXISTS "Public read waiters" ON waiters;
DROP POLICY IF EXISTS "Enable all access for all users" ON waiters;
CREATE POLICY "Enable all access for all users" ON waiters FOR ALL USING (true) WITH CHECK (true);

-- Restaurants
DROP POLICY IF EXISTS "Public read restaurants" ON restaurants;
DROP POLICY IF EXISTS "Enable all access for all users" ON restaurants;
CREATE POLICY "Enable all access for all users" ON restaurants FOR ALL USING (true) WITH CHECK (true);

-- Menu Items
DROP POLICY IF EXISTS "Public read menu items" ON menu_items;
DROP POLICY IF EXISTS "Enable all access for all users" ON menu_items;
CREATE POLICY "Enable all access for all users" ON menu_items FOR ALL USING (true) WITH CHECK (true);

-- Menu Categories
DROP POLICY IF EXISTS "Public read menu" ON menu_categories;
DROP POLICY IF EXISTS "Enable all access for all users" ON menu_categories;
CREATE POLICY "Enable all access for all users" ON menu_categories FOR ALL USING (true) WITH CHECK (true);

-- Tables
DROP POLICY IF EXISTS "Public read tables" ON tables;
DROP POLICY IF EXISTS "Enable all access for all users" ON tables;
CREATE POLICY "Enable all access for all users" ON tables FOR ALL USING (true) WITH CHECK (true);

-- Ratings
DROP POLICY IF EXISTS "Public create ratings" ON ratings;
DROP POLICY IF EXISTS "Public read ratings" ON ratings;
DROP POLICY IF EXISTS "Enable all access for all users" ON ratings;
CREATE POLICY "Enable all access for all users" ON ratings FOR ALL USING (true) WITH CHECK (true);

COMMIT;
