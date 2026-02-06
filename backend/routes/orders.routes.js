const express = require('express');
const router = express.Router();
const supabase = require('../config/supabaseClient');

// Create Order
router.post('/', async (req, res) => {
    const { restaurantId, tableId, items, customerName, customerPhone, orderType = 'dine-in' } = req.body;

    if (!items || items.length === 0) {
        return res.status(400).json({ error: 'No items in order' });
    }

    try {
        // 1. Fetch item details to calculate total and verify prices
        const itemIds = items.map(i => i.itemId);
        const { data: menuItems, error: itemsError } = await supabase
            .from('menu_items')
            .select('id, price_full, price_half, name')
            .in('id', itemIds);

        if (itemsError) throw itemsError;

        let totalAmount = 0;
        const orderItemsData = items.map(item => {
            const menuItem = menuItems.find(mi => mi.id === item.itemId);
            if (!menuItem) throw new Error(`Item ${item.itemId} not found`);

            const price = item.portion === 'half' && menuItem.price_half ? menuItem.price_half : menuItem.price_full;
            totalAmount += price * item.quantity;

            return {
                item_id: item.itemId,
                quantity: item.quantity,
                portion: item.portion || 'full',
                taste_preference: item.tastePreference,
                price_at_time: price
            };
        });

        // 2. Create Order
        const { data: orderData, error: orderError } = await supabase
            .from('orders')
            .insert({
                restaurant_id: restaurantId,
                table_id: tableId,
                status: 'pending',
                order_type: orderType,
                total_amount: totalAmount,
                customer_name: customerName,
                customer_phone: customerPhone
            })
            .select()
            .single();

        if (orderError) throw orderError;

        // 3. Insert Order Items
        const itemsToInsert = orderItemsData.map(i => ({ ...i, order_id: orderData.id }));
        const { error: insertItemsError } = await supabase
            .from('order_items')
            .insert(itemsToInsert);

        if (insertItemsError) {
            // Ideally rollback order here, but for now just report error
            console.error('Error inserting items:', insertItemsError);
            throw insertItemsError;
        }

        res.status(201).json({ order: orderData, items: itemsToInsert });

    } catch (error) {
        console.error('Error creating order:', error);
        res.status(500).json({ error: error.message });
    }
});

// Get Active Orders (Bill/History)
router.get('/active', async (req, res) => {
    const { restaurantId, customerName, tableId, tableNumber } = req.query;

    if (!restaurantId || !customerName) {
        return res.status(400).json({ error: 'Missing required parameters' });
    }

    try {
        let query = supabase
            .from('orders')
            .select(`
                *,
                order_items (
                    *,
                    menu_items (name, price_full, price_half)
                )
            `)
            .eq('restaurant_id', restaurantId)
            // .neq('status', 'completed') // ALLOW completed orders so we can show them in History
            .order('created_at', { ascending: false });

        // Logic: specific table UUID match OR fuzzy name match
        if (tableId && tableId !== 'manual' && tableId !== 'null' && tableId !== 'undefined') {
            query = query.eq('table_id', tableId);
        } else {
            // Manual Table or No Table Logic
            // We search for exact "John" OR "John (Table 5)"
            const namesToCheck = [customerName];
            if (tableNumber) {
                namesToCheck.push(`${customerName} (Table ${tableNumber})`);
            }
            query = query.in('customer_name', namesToCheck);
        }

        const { data, error } = await query;

        if (error) throw error;
        res.json(data);
    } catch (error) {
        console.error('Active Orders Error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Get Order
// Get Order (with items and payment)
router.get('/:id', async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('orders')
            .select(`
                *,
                order_items (
                    *,
                    menu_items (name, is_veg)
                ),
                payments (*)
            `)
            .eq('id', req.params.id)
            .single();

        if (error) throw error;
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});


// Get All Orders for Restaurant (Kitchen View)
router.get('/restaurant/:restaurantId', async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('orders')
            .select(`
                *,
                order_items (
                    *,
                    menu_items (name)
                ),
                tables (table_number) 
            `)
            .eq('restaurant_id', req.params.restaurantId)
            .order('created_at', { ascending: false });

        if (error) throw error;
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Update Order Status
router.put('/:id/status', async (req, res) => {
    const { status, estimated_prep_time, waiter_id } = req.body;
    try {
        console.log(`[UPDATE] ID: ${req.params.id}, Status: ${status}, Time: ${estimated_prep_time}, Waiter: ${waiter_id}`);
        const updateData = {};
        if (status) updateData.status = status;
        if (estimated_prep_time) updateData.estimated_prep_time = estimated_prep_time;
        if (waiter_id) updateData.waiter_id = waiter_id;

        const { data, error } = await supabase
            .from('orders')
            .update(updateData)
            .eq('id', req.params.id)
            .select()
            .single();

        if (error) {
            console.error('[UPDATE ERROR]', error);
            throw error;
        }
        res.json(data);

        if (error) throw error;
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Generic Update Order (Edit Bill)
router.put('/:id', async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('orders')
            .update(req.body)
            .eq('id', req.params.id)
            .select();

        if (error) throw error;
        res.json(data[0]);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Delete Order
router.delete('/:id', async (req, res) => {
    try {
        const { error } = await supabase
            .from('orders')
            .delete()
            .eq('id', req.params.id);

        if (error) throw error;
        res.json({ success: true, message: 'Order deleted successfully' });
    } catch (error) {
        console.error('Error deleting order:', error);
        res.status(500).json({ error: error.message });
    }
});

// Clear All Cancelled Orders
router.delete('/cancelled/clear', async (req, res) => {
    const { restaurantId } = req.query;
    try {
        if (!restaurantId) return res.status(400).json({ error: 'Restaurant ID required' });

        const { error } = await supabase
            .from('orders')
            .delete()
            .eq('restaurant_id', restaurantId)
            .eq('status', 'cancelled');

        if (error) throw error;
        res.json({ success: true, message: 'All cancelled orders cleared' });
    } catch (error) {
        console.error('Error clearing cancelled orders:', error);
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
