-- ==========================================
-- Focsera Demo Data Seeder (Idempotent)
-- ==========================================

-- 1. Enable Cryptography
CREATE EXTENSION IF NOT EXISTS pgcrypto;

DO $$
DECLARE
    v_restaurant_id UUID;
BEGIN
    -- 2. Get or Create Demo Restaurant
    SELECT id INTO v_restaurant_id FROM public.restaurants WHERE name = 'Focsera Demo' LIMIT 1;

    IF v_restaurant_id IS NULL THEN
        INSERT INTO public.restaurants (name, logo_url, whatsapp_link, instagram_link)
        VALUES ('Focsera Demo', 'https://via.placeholder.com/150', '9876543210', 'demo_insta')
        RETURNING id INTO v_restaurant_id;
        RAISE NOTICE 'Created new demo restaurant: %', v_restaurant_id;
    ELSE
        RAISE NOTICE 'Using existing demo restaurant: %', v_restaurant_id;
    END IF;

    -- 3. Insert Users (Skip if Email Exists)
    INSERT INTO auth.users (
        instance_id,
        id,
        aud,
        role,
        email,
        encrypted_password,
        email_confirmed_at,
        raw_user_meta_data,
        created_at,
        updated_at
    )
    SELECT 
        '00000000-0000-0000-0000-000000000000',
        gen_random_uuid(),
        'authenticated',
        'authenticated',
        u.email,
        crypt('password123', gen_salt('bf')),
        now(),
        jsonb_build_object(
            'full_name', u.full_name,
            'role', u.role,
            'restaurant_id', v_restaurant_id
        ),
        now(),
        now()
    FROM (
        VALUES 
            ('admin@restaurant.in', 'Demo Owner', 'admin'),
            ('manager@restaurant.in', 'Demo Manager', 'manager'),
            ('counter@restaurant.in', 'Counter Staff', 'staff_counter'),
            ('kitchen@restaurant.in', 'Chef Gordon', 'staff_kitchen')
    ) AS u(email, full_name, role)
    WHERE NOT EXISTS (
        SELECT 1 FROM auth.users WHERE email = u.email
    );
    
    RAISE NOTICE 'Users seeded (duplicates skipped).';

END $$;

