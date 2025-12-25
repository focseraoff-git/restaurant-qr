-- Allow public insert on tables so the setup script can run
-- Run this in Supabase SQL Editor

BEGIN;

-- Drop just in case it exists to avoid conflicts
DROP POLICY IF EXISTS "Public insert tables" ON tables;
DROP POLICY IF EXISTS "Public update tables" ON tables;

-- Create policies
CREATE POLICY "Public insert tables" ON tables FOR INSERT WITH CHECK (true);
CREATE POLICY "Public update tables" ON tables FOR UPDATE USING (true); -- In case we need to update QR codes

COMMIT;
