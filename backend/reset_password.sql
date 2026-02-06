-- RESET PASSWORD FOR ADMIN USER
-- Update password to '123456' for the fixed admin user

UPDATE auth.users
SET encrypted_password = crypt('123456', gen_salt('bf'))
WHERE id = '29abae33-c282-4ba4-815f-30a16d1319ca';

-- Also ensure email is confirmed
UPDATE auth.users
SET email_confirmed_at = now()
WHERE id = '29abae33-c282-4ba4-815f-30a16d1319ca';

-- Ensure Email is correct (for your reference)
UPDATE auth.users
SET email = 'admin@example.com' 
WHERE id = '29abae33-c282-4ba4-815f-30a16d1319ca';
