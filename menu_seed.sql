-- ==========================================
-- RESTAURANT MENU SEED DATA
-- Restaurant ID: 5331ded5-6ab3-43cf-b64e-dbfdb6a215eb
-- ==========================================

-- 1. Clean up existing menu for this restaurant to avoid duplicates
-- NOTE: This will remove order history details for these items to allow the menu reset.
DELETE FROM order_items WHERE item_id IN (
    SELECT id FROM menu_items WHERE category_id IN (
        SELECT id FROM menu_categories WHERE restaurant_id = '5331ded5-6ab3-43cf-b64e-dbfdb6a215eb'
    )
);
DELETE FROM menu_items WHERE category_id IN (SELECT id FROM menu_categories WHERE restaurant_id = '5331ded5-6ab3-43cf-b64e-dbfdb6a215eb');
DELETE FROM menu_categories WHERE restaurant_id = '5331ded5-6ab3-43cf-b64e-dbfdb6a215eb';

-- 2. Insert Categories and Items using CTEs for clean ID linking
WITH 
    restaurant AS (SELECT '5331ded5-6ab3-43cf-b64e-dbfdb6a215eb'::uuid as id),
    
    -- Category: Chef's Specials
    cat_special AS (
        INSERT INTO menu_categories (restaurant_id, name, sort_order) 
        SELECT id, '👨‍🍳 Chef''s Specials', 1 FROM restaurant RETURNING id
    ),
    -- Category: Starters (Veg)
    cat_veg_start AS (
        INSERT INTO menu_categories (restaurant_id, name, sort_order) 
        SELECT id, '🥬 Starters (Veg)', 2 FROM restaurant RETURNING id
    ),
    -- Category: Starters (Non-Veg)
    cat_nonveg_start AS (
        INSERT INTO menu_categories (restaurant_id, name, sort_order) 
        SELECT id, '🍗 Starters (Non-Veg)', 3 FROM restaurant RETURNING id
    ),
    -- Category: Main Course
    cat_main AS (
        INSERT INTO menu_categories (restaurant_id, name, sort_order) 
        SELECT id, '🍛 Main Course', 4 FROM restaurant RETURNING id
    ),
    -- Category: Desserts
    cat_dessert AS (
        INSERT INTO menu_categories (restaurant_id, name, sort_order) 
        SELECT id, '🍰 Desserts', 5 FROM restaurant RETURNING id
    ),
    -- Category: Beverages
    cat_bev AS (
        INSERT INTO menu_categories (restaurant_id, name, sort_order) 
        SELECT id, '🍹 Beverages', 6 FROM restaurant RETURNING id
    )

-- Insert Items
INSERT INTO menu_items (category_id, name, description, price_full, is_veg)
VALUES
    -- Specials
    ((SELECT id FROM cat_special), 'Truffle Mushroom Risotto', 'Creamy arborio rice with black truffle oil and parmesan.', 450, true),
    ((SELECT id FROM cat_special), 'Grilled Salmon with Asparagus', 'Fresh Atlantic salmon grilled to perfection, served with lemon butter sauce.', 650, false),
    ((SELECT id FROM cat_special), 'Spicy Naga Pork', 'Traditional Naga style smoked pork with bamboo shoots and king chilli.', 380, false),

    -- Starters (Veg)
    ((SELECT id FROM cat_veg_start), 'Paneer Tikka', 'Cottage cheese cubes marinated in spiced yogurt and grilled in tandoor.', 280, true),
    ((SELECT id FROM cat_veg_start), 'Crispy Corn', 'Sweet corn kernels fried and tossed with salt and pepper.', 220, true),
    ((SELECT id FROM cat_veg_start), 'Hara Bhara Kebab', 'Spinach and green pea patties, deep fried.', 240, true),
    ((SELECT id FROM cat_veg_start), 'Cheese Balls', 'Melting cheese balls with a crispy outer coating.', 260, true),

    -- Starters (Non-Veg)
    ((SELECT id FROM cat_nonveg_start), 'Chicken 65', 'Spicy, deep-fried chicken dish originating from Chennai.', 320, false),
    ((SELECT id FROM cat_nonveg_start), 'Mutton Seekh Kebab', 'Minced mutton spiced and grilled on skewers.', 400, false),
    ((SELECT id FROM cat_nonveg_start), 'Peri Peri Chicken Wings', 'Spicy chicken wings tossed in peri peri sauce.', 350, false),
    ((SELECT id FROM cat_nonveg_start), 'Fish Fingers', 'Crumb fried fish strips served with tartar sauce.', 380, false),

    -- Main Course
    ((SELECT id FROM cat_main), 'Butter Chicken', 'Tandoori chicken cooked in a smooth tomato and cream gravy.', 380, false),
    ((SELECT id FROM cat_main), 'Paneer Butter Masala', 'Rich and creamy curry made with paneer, spices, onions, tomatoes and butter.', 340, true),
    ((SELECT id FROM cat_main), 'Dal Makhani', 'Black lentils cooked with butter and cream, simmered on low heat.', 280, true),
    ((SELECT id FROM cat_main), 'Chicken Biryani', 'Aromatic basmati rice cooked with spiced chicken and herbs.', 360, false),
    ((SELECT id FROM cat_main), 'Veg Biryani', 'Aromatic basmati rice cooked with mixed vegetables.', 290, true),
    ((SELECT id FROM cat_main), 'Garlic Naan', 'Leavened flatbread topped with chopped garlic and butter.', 60, true),

    -- Desserts
    ((SELECT id FROM cat_dessert), 'Chocolate Molten Cake', 'Warm chocolate cake with a gooey center, served with vanilla ice cream.', 250, true),
    ((SELECT id FROM cat_dessert), 'Gulab Jamun', 'Deep fried dough balls soaked in sweet, sticky sugar syrup.', 120, true),
    ((SELECT id FROM cat_dessert), 'Sizzling Brownie', 'Walnut brownie served on a hot sizzler plate with ice cream.', 280, true),

    -- Beverages
    ((SELECT id FROM cat_bev), 'Virgin Mojito', 'Refreshing lime and mint cooler.', 180, true),
    ((SELECT id FROM cat_bev), 'Mango Lassi', 'Traditional yogurt-based drink with mango pulp.', 150, true),
    ((SELECT id FROM cat_bev), 'Cold Coffee', 'Chilled milk coffee topped with ice cream.', 200, true);
