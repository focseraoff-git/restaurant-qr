
-- Run this in Supabase SQL Editor to seed data
DO $$
DECLARE
    r_id uuid;
    c_id_starters uuid;
    c_id_main uuid;
    c_id_drinks uuid;
BEGIN
    -- Create Restaurant
    INSERT INTO restaurants (name, logo_url, whatsapp_link) 
    VALUES ('Tasty Bites', 'https://via.placeholder.com/150', '919876543210') 
    RETURNING id INTO r_id;
    
    -- Create Tables
    INSERT INTO tables (restaurant_id, table_number, qr_code) VALUES (r_id, 'T1', 'qr_t1'), (r_id, 'T2', 'qr_t2');

    -- Create Categories
    INSERT INTO menu_categories (restaurant_id, name, type, sort_order) VALUES (r_id, 'Starters', 'veg', 1) RETURNING id INTO c_id_starters;
    INSERT INTO menu_categories (restaurant_id, name, type, sort_order) VALUES (r_id, 'Main Course', 'veg', 2) RETURNING id INTO c_id_main;
    INSERT INTO menu_categories (restaurant_id, name, type, sort_order) VALUES (r_id, 'Drinks', 'drinks', 3) RETURNING id INTO c_id_drinks;
    
    -- Create Items
    INSERT INTO menu_items (category_id, name, price_full, is_veg, description) VALUES (c_id_starters, 'Paneer Tikka', 250, true, 'Cottage cheese cubes marinated in spices');
    INSERT INTO menu_items (category_id, name, price_full, is_veg, description) VALUES (c_id_starters, 'Chicken Wings', 300, false, 'Spicy grilled wings');
    INSERT INTO menu_items (category_id, name, price_full, is_veg, description) VALUES (c_id_main, 'Dal Makhani', 180, true, 'Creamy black lentils');
    INSERT INTO menu_items (category_id, name, price_full, is_veg, description) VALUES (c_id_main, 'Butter Naan', 40, true, 'Soft indian bread');
    INSERT INTO menu_items (category_id, name, price_full, is_veg, description) VALUES (c_id_drinks, 'Cola', 50, true, 'Chilled soda');
END $$;
