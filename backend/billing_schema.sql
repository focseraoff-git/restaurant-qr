-- Customers (For CRM & Khata)
CREATE TABLE IF NOT EXISTS customers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    restaurant_id UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
    name TEXT,
    phone TEXT NOT NULL,
    email TEXT,
    is_khata_active BOOLEAN DEFAULT FALSE,
    credit_limit DECIMAL(10, 2) DEFAULT 0,
    current_due DECIMAL(10, 2) DEFAULT 0,
    khata_billing_cycle TEXT DEFAULT 'Monthly', -- 'Weekly', 'Monthly'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(restaurant_id, phone)
);

-- Khata Ledger (Transactions)
CREATE TABLE IF NOT EXISTS khata_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    restaurant_id UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
    customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    type TEXT NOT NULL, -- 'CREDIT' (Bill), 'PAYMENT' (Settlement)
    amount DECIMAL(10, 2) NOT NULL,
    reference_id UUID, -- Link to order_id (if CREDIT)
    payment_method TEXT, -- 'Cash', 'UPI', 'Card' (if PAYMENT)
    description TEXT,
    transaction_date TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Offers & Promotions
CREATE TABLE IF NOT EXISTS offers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    restaurant_id UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    code TEXT, -- Promo Code
    type TEXT DEFAULT 'FLAT', -- 'FLAT', 'PERCENTAGE', 'BOGO', 'COMBO'
    value DECIMAL(10, 2) NOT NULL, -- Amount or Percentage
    min_order_value DECIMAL(10, 2) DEFAULT 0,
    max_discount DECIMAL(10, 2),
    start_date TIMESTAMP WITH TIME ZONE,
    end_date TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT TRUE,
    applicable_types TEXT[], -- ['Dine-in', 'Takeaway', 'Online']
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Cancellations & Damages Register
CREATE TABLE IF NOT EXISTS cancellations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    restaurant_id UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
    order_id UUID REFERENCES orders(id), -- Nullable if generic wastage
    item_name TEXT NOT NULL,
    quantity DECIMAL(10, 2) NOT NULL,
    reason_category TEXT NOT NULL, -- 'Customer Cancelled', 'Kitchen Delay', 'Spillage', 'Quality Issue'
    notes TEXT,
    amount_impact DECIMAL(10, 2) DEFAULT 0,
    reported_by TEXT, -- Staff Name/ID
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Update Orders Table (If needed, typically fields already exist or are jsonb, but adding placeholders just in case)
-- ALTER TABLE orders ADD COLUMN IF NOT EXISTS platform TEXT; -- 'Swiggy', 'Zomato' etc.
-- ALTER TABLE orders ADD COLUMN IF NOT EXISTS cancellation_reason TEXT;
