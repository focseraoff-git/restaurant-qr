
-- Enable RLS Policies for UPDATE operations

-- Orders (Public Update for Kitchen Dashboard)
create policy "Public update orders" on orders for update using (true);
