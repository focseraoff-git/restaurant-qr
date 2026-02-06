-- Fix 406 Error for User deb4fd66...
-- CORRECTED SCHEMA VERSION (Removes slug/address which don't exist)

DO $$
DECLARE
    valid_restaurant_id UUID;
    target_user_id UUID := 'deb4fd66-4b87-4bc7-9345-4b5d0bbc3b2a';
BEGIN
    -- 1. Find a valid Restaurant ID
    SELECT id INTO valid_restaurant_id FROM public.restaurants LIMIT 1;

    -- If no restaurant exists, create one! 
    -- Schema only has: id, name, logo_url, whatsapp_link, instagram_link
    IF valid_restaurant_id IS NULL THEN
        INSERT INTO public.restaurants (name)
        VALUES ('Default Restaurant')
        RETURNING id INTO valid_restaurant_id;
    END IF;

    -- 2. Ensure Profile Exists
    -- Note: role is USER-DEFINED enum, usually casts automatically from string 'admin'
    INSERT INTO public.profiles (id, full_name, role, restaurant_id)
    VALUES (
        target_user_id, 
        'Admin User (Restored)', 
        'admin', 
        valid_restaurant_id
    )
    ON CONFLICT (id) DO UPDATE SET 
        role = 'admin',
        restaurant_id = valid_restaurant_id;

    -- 3. Reset Password to '123456' just in case
    UPDATE auth.users 
    SET encrypted_password = crypt('123456', gen_salt('bf')),
        email_confirmed_at = now()
    WHERE id = target_user_id;

    RAISE NOTICE 'Fixed User % linked to Restaurant %', target_user_id, valid_restaurant_id;

END $$;
