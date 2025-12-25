-- Create Waiters Table
create table if not exists waiters (
  id uuid default uuid_generate_v4() primary key,
  restaurant_id uuid not null references restaurants(id),
  auth_id uuid references auth.users(id),
  name text not null,
  email text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Update Orders Table
alter table orders 
add column if not exists waiter_id uuid references waiters(id),
add column if not exists serving_time timestamp with time zone,
add column if not exists estimated_prep_time integer; -- ensuring this is here too

-- Enable RLS (Optional but good practice, keeping it simple for now as per previous context)
-- alter table waiters enable row level security;
-- create policy "Public waiters access" on waiters for select using (true);
