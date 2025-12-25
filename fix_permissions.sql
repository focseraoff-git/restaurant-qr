-- ==============================================================================
-- FIX PERMISSIONS (RLS POLICIES)
-- Run this script in the Supabase SQL Editor to allow the dashboard to manage the menu.
-- ==============================================================================

-- 1. Enable RLS (just in case)
ALTER TABLE menu_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE menu_categories ENABLE ROW LEVEL SECURITY;

-- 2. Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Enable read access for all users" ON menu_items;
DROP POLICY IF EXISTS "Enable insert for all users" ON menu_items;
DROP POLICY IF EXISTS "Enable update for all users" ON menu_items;
DROP POLICY IF EXISTS "Enable delete for all users" ON menu_items;

DROP POLICY IF EXISTS "Enable read access for all users" ON menu_categories;
DROP POLICY IF EXISTS "Enable insert for all users" ON menu_categories;
DROP POLICY IF EXISTS "Enable update for all users" ON menu_categories;
DROP POLICY IF EXISTS "Enable delete for all users" ON menu_categories;

-- 3. Create Permissive Policies (Allowing Anonymous Access for Demo/Dev)
-- NOTE: In a production environment, you would restrict this to authenticated managers.

-- Menu Items
CREATE POLICY "Enable all access for all users" ON menu_items
FOR ALL
USING (true)
WITH CHECK (true);

-- Menu Categories
CREATE POLICY "Enable all access for all users" ON menu_categories
FOR ALL
USING (true)
WITH CHECK (true);

-- 4. Verify
-- You should now be able to add/edit/delete items from the dashboard without login.
