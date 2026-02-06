const express = require('express');
const router = express.Router();
const supabase = require('../config/supabaseClient');

// Get Stock Movements (History)
router.get('/:restaurantId', async (req, res) => {
    try {
        const { limit = 50, itemId, type } = req.query;
        let query = supabase
            .from('stock_movements')
            .select(`
                *,
                inventory_items (name, unit)
            `)
            .eq('restaurant_id', req.params.restaurantId)
            .order('created_at', { ascending: false })
            .limit(Number(limit));

        if (itemId) query = query.eq('item_id', itemId);
        if (type) query = query.eq('type', type);

        const { data, error } = await query;

        if (error) throw error;
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Log a Manual Stock Movement (Wastage, Adjust, Manual Out, Manual In)
router.post('/', async (req, res) => {
    const { restaurant_id, item_id, type, quantity, unit, reason, performed_by } = req.body;

    // Movement types: 'IN', 'OUT', 'ADJUST', 'WASTAGE'
    // quantity should be positive in the request, logic below handles sign

    if (!restaurant_id || !item_id || !type || !quantity) {
        return res.status(400).json({ error: 'Missing required fields' });
    }

    try {
        // 1. Fetch current item to ensure it exists and get correct unit conversion if needed
        // (Assuming simple unit match for now)
        const { data: item, error: itemError } = await supabase
            .from('inventory_items')
            .select('current_stock')
            .eq('id', item_id)
            .single();

        if (itemError || !item) throw new Error('Item not found');

        let newStock = Number(item.current_stock);
        const qty = Number(quantity);

        if (type === 'IN' || type === 'RETURN') {
            newStock += qty;
        } else if (type === 'OUT' || type === 'WASTAGE') {
            newStock -= qty;
        } else if (type === 'ADJUST') {
            // Adjust usually means "Set to X" or "Add/Sub X". 
            // Let's assume input is the DELTA. If user enters "New Stock = 5", frontend calculates delta.
            // Here we assume payload IS the delta. "Adjust +2" or "Adjust -2".
            // Let's enforce standard: "IN/OUT" is usually safer. 
            // If type is ADJUST, we treat quantity as signed? 
            // Let's stick to: quantity is magnitude. 
            // IF ADJUST, we might need a separate field or convention. 
            // User requirement: "Stock ADJUST (Correction)".
            // Let's assume ADJUST acts like IN/OUT depending on sign of quantity passed?
            // Or explicit: "ADJUST_ADD", "ADJUST_SUB"?
            // Simplest: "ADJUST" takes signed quantity.
            newStock += qty;
        }

        // 2. Insert Movement
        const { error: moveError } = await supabase
            .from('stock_movements')
            .insert({
                restaurant_id,
                item_id,
                type,
                quantity: qty, // Log the raw magnitude or delta? Ledger usually logs signed or has Dr/Cr. 
                // Let's log SIGNED quantity for easier aggregation later? 
                // Schema has 'quantity'. Let's log the MAGNITUDE and trust 'type' for direction.
                unit,
                reason,
                performed_by
            });

        if (moveError) throw moveError;

        // 3. Update Item Stock
        const { error: updateError } = await supabase
            .from('inventory_items')
            .update({ current_stock: newStock, updated_at: new Date() })
            .eq('id', item_id);

        if (updateError) throw updateError;

        res.status(201).json({ message: 'Stock updated', new_stock: newStock });

    } catch (error) {
        console.error('Stock Movement Error:', error);
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
