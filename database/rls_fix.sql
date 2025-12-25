
-- Enable RLS Policies for transactional tables

-- Waiters (Public Read)
create policy "Public read waiters" on waiters for select using (true);

-- Orders (Public Create, Public Read for MVP)
create policy "Public create orders" on orders for insert with check (true);
create policy "Public read orders" on orders for select using (true);

-- Order Items (Public Create, Public Read)
create policy "Public create order items" on order_items for insert with check (true);
create policy "Public read order items" on order_items for select using (true);

-- Payments (Public Create, Public Read)
create policy "Public create payments" on payments for insert with check (true);
create policy "Public read payments" on payments for select using (true);

-- Ratings
create policy "Public create ratings" on ratings for insert with check (true);
create policy "Public read ratings" on ratings for select using (true);
