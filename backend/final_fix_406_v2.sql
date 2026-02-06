-- FINAL FIX V2: DYNAMIC RESTAURANT ID
-- Handles: Missing Auth User AND Missing Restaurant ID

DO $$
DECLARE
    valid_restaurant_id UUID;
BEGIN
    -- 1. Find a valid Restaurant ID
    SELECT id INTO valid_restaurant_id FROM public.restaurants LIMIT 1;

    -- If no restaurant exists, create one!
    IF valid_restaurant_id IS NULL THEN
        INSERT INTO public.restaurants (name, slug, address)
        VALUES ('Default Restaurant', 'default-rest', '123 Main St')
        RETURNING id INTO valid_restaurant_id;
    END IF;

    -- 2. Check if user exists in auth.users, if not create them
    IF NOT EXISTS (SELECT 1 FROM auth.users WHERE id = '29abae33-c282-4ba4-815f-30a16d1319ca') THEN
        INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, role)
        VALUES (
            '29abae33-c282-4ba4-815f-30a16d1319ca', 
            'admin_restored@example.com', 
            '$2a$10$wTf/././././././././././.', 
            now(),
            'authenticated'
        );
    END IF;

    -- 3. NOW insert the profile safely
    INSERT INTO public.profiles (id, full_name, role, restaurant_id)
    VALUES (
        '29abae33-c282-4ba4-815f-30a16d1319ca', 
        'Admin User', 
        'admin', 
        valid_restaurant_id -- Use the dynamic ID
    )
    ON CONFLICT (id) DO UPDATE SET 
        role = 'admin',
        restaurant_id = valid_restaurant_id; -- Ensure invalid ID is fixed

    -- 4. Ensure Policy Exists
    DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
    CREATE POLICY "Users can view own profile" 
    ON public.profiles FOR SELECT 
    USING (auth.uid() = id);

    RAISE NOTICE 'Fixed User 29abae33 linked to Restaurant %', valid_restaurant_id;

END $$;
