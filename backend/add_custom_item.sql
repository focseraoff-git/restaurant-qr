-- Add custom_name column to order_items for open items
ALTER TABLE order_items ADD COLUMN custom_name TEXT;

-- Make item_id nullable to allow items without a menu_items reference
ALTER TABLE order_items ALTER COLUMN item_id DROP NOT NULL;
