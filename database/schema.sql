-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Restaurants Table
create table restaurants (
  id uuid default uuid_generate_v4() primary key,
  name text not null,
  logo_url text,
  whatsapp_link text,
  instagram_link text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Tables Table
create table tables (
  id uuid default uuid_generate_v4() primary key,
  restaurant_id uuid references restaurants(id) not null,
  table_number text not null,
  qr_code text, -- URL or unique code
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Menu Categories
create table menu_categories (
  id uuid default uuid_generate_v4() primary key,
  restaurant_id uuid references restaurants(id) not null,
  name text not null,
  type text check (type in ('veg', 'non-veg', 'drinks', 'other')), -- simplified type or just text
  sort_order int default 0,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Menu Items
create table menu_items (
  id uuid default uuid_generate_v4() primary key,
  category_id uuid references menu_categories(id) not null,
  name text not null,
  description text,
  price_half numeric,
  price_full numeric not null,
  image text,
  is_veg boolean default true,
  is_available boolean default true,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Waiters
create table waiters (
  id uuid default uuid_generate_v4() primary key,
  restaurant_id uuid references restaurants(id) not null,
  name text not null,
  photo text,
  rating numeric default 5.0,
  is_available boolean default true,
  current_tables_count int default 0,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Orders
create table orders (
  id uuid default uuid_generate_v4() primary key,
  table_id uuid references tables(id), -- Nullable for Takeaway if needed, but Prompt says Table ID from QR
  restaurant_id uuid references restaurants(id) not null,
  waiter_id uuid references waiters(id),
  order_type text check (order_type in ('dine-in', 'takeaway')) not null,
  status text check (status in ('pending', 'confirmed', 'preparing', 'served', 'paid', 'completed', 'cancelled')) default 'pending',
  total_amount numeric default 0,
  customer_name text, -- Optional for anonymous
  customer_phone text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Order Items
create table order_items (
  id uuid default uuid_generate_v4() primary key,
  order_id uuid references orders(id) not null,
  item_id uuid references menu_items(id) not null,
  quantity int not null default 1,
  portion text check (portion in ('half', 'full')) default 'full',
  taste_preference text,
  price_at_time numeric not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Payments
create table payments (
  id uuid default uuid_generate_v4() primary key,
  order_id uuid references orders(id) not null,
  method text check (method in ('cash', 'online')),
  status text check (status in ('pending', 'success', 'failed')) default 'pending',
  transaction_id text,
  amount numeric not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Ratings
create table ratings (
  id uuid default uuid_generate_v4() primary key,
  order_id uuid references orders(id) not null,
  waiter_rating int check (waiter_rating between 1 and 5),
  food_rating int check (food_rating between 1 and 5),
  review text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS (Row Level Security) - Basic setup
alter table restaurants enable row level security;
alter table tables enable row level security;
alter table menu_categories enable row level security;
alter table menu_items enable row level security;
alter table waiters enable row level security;
alter table orders enable row level security;
alter table order_items enable row level security;
alter table payments enable row level security;
alter table ratings enable row level security;

-- Policies (Public Read for Menu, etc. for now)
create policy "Public read restaurants" on restaurants for select using (true);
create policy "Public read tables" on tables for select using (true);
create policy "Public read menu" on menu_categories for select using (true);
create policy "Public read menu items" on menu_items for select using (true);
