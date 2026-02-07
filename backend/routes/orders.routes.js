const express = require('express');
const router = express.Router();
const supabase = require('../config/supabaseClient');

// Create Order
router.post('/', async (req, res) => {
    const { restaurantId, tableId, items, customerName, customerPhone, orderType = 'dine-in', orderNote } = req.body;

    if (!items || items.length === 0) {
        return res.status(400).json({ error: 'No items in order' });
    }

    try {

        // 1. Separate Menu Items and Custom Items
        const menuItemsInput = items.filter(i => i.itemId);
        const customItemsInput = items.filter(i => !i.itemId);

        // 2. Fetch details for Menu Items
        let menuItemsDB = [];
        if (menuItemsInput.length > 0) {
            const itemIds = menuItemsInput.map(i => i.itemId);
            const { data, error: itemsError } = await supabase
                .from('menu_items')
                .select('id, price_full, price_half, name')
                .in('id', itemIds);

            if (itemsError) throw itemsError;
            menuItemsDB = data;
        }

        let totalAmount = 0;
        const orderItemsData = [];

        // Process Menu Items
        for (const item of menuItemsInput) {
            const menuItem = menuItemsDB.find(mi => mi.id === item.itemId);
            if (!menuItem) throw new Error(`Item ${item.itemId} not found`);

            const price = item.price || (item.portion === 'half' && menuItem.price_half ? menuItem.price_half : menuItem.price_full);
            totalAmount += price * item.quantity;

            orderItemsData.push({
                item_id: item.itemId,
                quantity: item.quantity,
                portion: item.portion || 'full',
                taste_preference: item.tastePreference,
                price_at_time: price,
                custom_name: null // Standard item
            });
        }

        // Process Custom Items
        for (const item of customItemsInput) {
            if (!item.name || !item.price) throw new Error('Custom items must have name and price');

            const price = parseFloat(item.price);
            totalAmount += price * item.quantity;

            orderItemsData.push({
                item_id: null, // No menu reference
                quantity: item.quantity,
                portion: 'custom',
                taste_preference: item.tastePreference,
                price_at_time: price,
                custom_name: item.name
            });
        }

        // 3. Create Order
        const { data: orderData, error: orderError } = await supabase
            .from('orders')
            .insert({
                restaurant_id: restaurantId,
                table_id: tableId,
                status: 'pending',
                order_type: orderType,
                total_amount: totalAmount,
                customer_name: customerName,
                customer_phone: customerPhone,
                order_note: orderNote
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
    const { restaurantId, customerName, tableId, tableNumber, orderIds } = req.query;

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
            .order('created_at', { ascending: false });

        // PRIORITY 1: Fetch by explicit Device History IDs if provided
        if (orderIds) {
            const idsList = orderIds.split(',').filter(Boolean);
            if (idsList.length > 0) {
                query = query.in('id', idsList);
            } else {
                // Return empty if IDs param is present but empty? Or fall through?
                // If ids provided but empty, return empty to be safe
                return res.json([]);
            }
        }
        // PRIORITY 2: Fallback to Name/Table matching (Old Logic)
        else {
            if (!customerName) return res.status(400).json({ error: 'Missing required parameters (customerName or orderIds)' });

            if (tableId && tableId !== 'manual' && tableId !== 'null' && tableId !== 'undefined') {
                query = query.eq('table_id', tableId);
            } else {
                const namesToCheck = [customerName];
                if (tableNumber) {
                    namesToCheck.push(`${customerName} (Table ${tableNumber})`);
                }
                query = query.in('customer_name', namesToCheck);
            }
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
        if (req.body.payment_method) updateData.payment_method = req.body.payment_method;

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

// Replace Order Items (Edit Order)
router.put('/:id/replace', async (req, res) => {
    const { items, orderNote } = req.body;
    const orderId = req.params.id;

    if (!items || items.length === 0) {
        return res.status(400).json({ error: 'No items in order' });
    }

    try {
        // 1. Separate Menu Items and Custom Items
        const menuItemsInput = items.filter(i => i.itemId);
        const customItemsInput = items.filter(i => !i.itemId);

        // 2. Fetch details for Menu Items
        let menuItemsDB = [];
        if (menuItemsInput.length > 0) {
            const itemIds = menuItemsInput.map(i => i.itemId);
            const { data, error: itemsError } = await supabase
                .from('menu_items')
                .select('id, price_full, price_half, name')
                .in('id', itemIds);

            if (itemsError) throw itemsError;
            menuItemsDB = data;
        }

        let totalAmount = 0;
        const orderItemsData = [];

        // Process Menu Items
        for (const item of menuItemsInput) {
            const menuItem = menuItemsDB.find(mi => mi.id === item.itemId);
            if (!menuItem) throw new Error(`Item ${item.itemId} not found`);

            const price = item.price || (item.portion === 'half' && menuItem.price_half ? menuItem.price_half : menuItem.price_full);
            totalAmount += price * item.quantity;

            orderItemsData.push({
                order_id: orderId,
                item_id: item.itemId,
                quantity: item.quantity,
                portion: item.portion || 'full',
                taste_preference: item.tastePreference, // Item Note
                price_at_time: price,
                custom_name: null
            });
        }

        // Process Custom Items
        for (const item of customItemsInput) {
            if (!item.name || !item.price) throw new Error('Custom items must have name and price');

            const price = parseFloat(item.price);
            totalAmount += price * item.quantity;

            orderItemsData.push({
                order_id: orderId,
                item_id: null,
                quantity: item.quantity,
                portion: 'custom',
                taste_preference: item.tastePreference, // Item Note
                price_at_time: price,
                custom_name: item.name
            });
        }

        // 3. Transaction-like update
        // A. Delete existing items
        const { error: deleteError } = await supabase
            .from('order_items')
            .delete()
            .eq('order_id', orderId);

        if (deleteError) throw deleteError;

        // B. Update Order Total & Note
        const { error: updateOrderError } = await supabase
            .from('orders')
            .update({
                total_amount: totalAmount,
                order_note: orderNote,
                updated_at: new Date().toISOString()
            })
            .eq('id', orderId);

        if (updateOrderError) throw updateOrderError;

        // C. Insert New Items
        const { error: insertItemsError } = await supabase
            .from('order_items')
            .insert(orderItemsData);

        if (insertItemsError) throw insertItemsError;

        res.json({ success: true, message: 'Order updated successfully' });

    } catch (error) {
        console.error('Error replacing order:', error);
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
