-- 1. Create Enum for Roles
DO $$ BEGIN
    CREATE TYPE user_role AS ENUM ('admin', 'manager', 'staff_counter', 'staff_kitchen');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 2. Create Profiles Table (Linked to Supabase Auth)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  restaurant_id UUID REFERENCES restaurants(id) ON DELETE CASCADE,
  role user_role DEFAULT 'staff_counter',
  full_name TEXT,
  phone TEXT,
  avatar_url TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS on Profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 3. RLS Policies for Profiles

-- Policy: Users can read their own profile
CREATE POLICY "Users can view own profile" ON public.profiles
FOR SELECT USING (auth.uid() = id);

-- Policy: Updates allowed for self
CREATE POLICY "Users can update own profile" ON public.profiles
FOR UPDATE USING (auth.uid() = id);

-- Policy: Admins can view/edit all profiles in their restaurant
CREATE POLICY "Admins can view all restaurant profiles" ON public.profiles
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.profiles admin
    WHERE admin.id = auth.uid()
    AND admin.role = 'admin'
    AND admin.restaurant_id = profiles.restaurant_id
  )
);

-- 4. Helper Function to get Current User's Restaurant ID
CREATE OR REPLACE FUNCTION get_my_restaurant_id()
RETURNS UUID AS $$
  SELECT restaurant_id FROM public.profiles WHERE id = auth.uid();
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- 5. Apply Secure RLS Policies to Core Tables

-- Orders
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Tenant isolation for orders" ON orders
FOR ALL USING (restaurant_id = get_my_restaurant_id())
WITH CHECK (restaurant_id = get_my_restaurant_id());

-- Menu Items
ALTER TABLE menu_items ENABLE ROW LEVEL SECURITY;
-- Menu items need to be readable by public (for QR menu) but only writable by staff
-- Since "public" requests (QR code) might be anon, we need to handle that.
-- For now, we assume authenticated staff management.
CREATE POLICY "Staff can manage menu" ON menu_items
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM menu_categories mc
    WHERE mc.id = menu_items.category_id
    AND mc.restaurant_id = get_my_restaurant_id()
  )
);
-- Public read policy is already in schema.sql ("Public read menu items"), but we should ensure it works.

-- Customers
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Tenant isolation for customers" ON customers
FOR ALL USING (restaurant_id = get_my_restaurant_id());

-- 6. Trigger to Auto-Create Profile handling
-- Note: This assumes the signup metadata contains 'full_name' and optionally 'restaurant_id'
-- If 'restaurant_id' is null, it might be a new owner creating a restaurant.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, role, restaurant_id)
  VALUES (
    new.id,
    new.raw_user_meta_data->>'full_name',
    COALESCE((new.raw_user_meta_data->>'role')::user_role, 'staff_counter'),
    (new.raw_user_meta_data->>'restaurant_id')::uuid
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger definition
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- 7. Grant permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL ROUTINES IN SCHEMA public TO anon, authenticated;
