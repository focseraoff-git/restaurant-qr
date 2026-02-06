-- Vendor Management
CREATE TABLE IF NOT EXISTS vendors (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    restaurant_id UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    contact_person TEXT,
    phone TEXT,
    email TEXT,
    address TEXT,
    category TEXT, -- 'Ingredients', 'Packaging', 'Equipment', 'Services'
    payment_terms TEXT DEFAULT 'Cash', -- 'Cash', 'Weekly', 'Monthly', 'Credit'
    status TEXT DEFAULT 'active', -- 'active', 'inactive', 'blacklisted'
    gstin TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Inventory Items (Master)
CREATE TABLE IF NOT EXISTS inventory_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    restaurant_id UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    type TEXT NOT NULL, -- 'Ingredient', 'Material', 'Packaging', 'Consumable'
    unit TEXT NOT NULL, -- 'kg', 'g', 'l', 'ml', 'pcs', 'packs'
    current_stock DECIMAL(10, 3) DEFAULT 0,
    min_stock_level DECIMAL(10, 3) DEFAULT 0,
    purchase_price DECIMAL(10, 2), -- Last purchase price or standard cost
    storage_location TEXT, -- 'Store Room', 'Fridge', 'Shelf A'
    is_perishable BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Purchase Master (Invoice Header)
CREATE TABLE IF NOT EXISTS purchases (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    restaurant_id UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
    vendor_id UUID NOT NULL REFERENCES vendors(id),
    invoice_no TEXT,
    invoice_date DATE DEFAULT CURRENT_DATE,
    total_amount DECIMAL(10, 2) NOT NULL DEFAULT 0,
    paid_amount DECIMAL(10, 2) DEFAULT 0,
    payment_status TEXT DEFAULT 'Pending', -- 'Paid', 'Partially Paid', 'Pending', 'Credit'
    notes TEXT,
    attachment_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Purchase Items (Invoice Details)
CREATE TABLE IF NOT EXISTS purchase_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    purchase_id UUID NOT NULL REFERENCES purchases(id) ON DELETE CASCADE,
    item_id UUID NOT NULL REFERENCES inventory_items(id),
    quantity DECIMAL(10, 3) NOT NULL,
    unit TEXT NOT NULL,
    unit_price DECIMAL(10, 2) NOT NULL,
    total_price DECIMAL(10, 2) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Stock Movements (Ledger)
CREATE TABLE IF NOT EXISTS stock_movements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    restaurant_id UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
    item_id UUID NOT NULL REFERENCES inventory_items(id) ON DELETE CASCADE,
    type TEXT NOT NULL, -- 'IN', 'OUT', 'ADJUST', 'WASTAGE', 'RETURN'
    quantity DECIMAL(10, 3) NOT NULL, -- Positive for add, negative for remove
    unit TEXT NOT NULL,
    reason TEXT, -- 'Purchase', 'Production', 'Sale', 'Expired', 'Damaged', 'Correction'
    reference_id UUID, -- Link to purchase_id or order_id if applicable
    performed_by UUID, -- Link to staff_id (optional)
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);
