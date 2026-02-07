const express = require('express');
const router = express.Router();
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

// Create New Purchase (Invoice)
router.post('/', async (req, res) => {
    const {
        restaurant_id,
        vendor_id,
        invoice_no,
        invoice_date,
        total_amount,
        paid_amount,
        payment_status,
        notes,
        items // Array of { item_id, quantity, unit, unit_price, total_price }
    } = req.body;

    if (!items || items.length === 0) {
        return res.status(400).json({ error: 'No items in purchase' });
    }

    try {
        // 1. Create Purchase Header
        const { data: purchase, error: purchaseError } = await supabase
            .from('purchases')
            .insert({
                restaurant_id,
                vendor_id,
                invoice_no,
                invoice_date,
                total_amount,
                paid_amount,
                payment_status,
                notes
            })
            .select()
            .single();

        if (purchaseError) throw purchaseError;

        const purchaseId = purchase.id;

        // 2. Prepare Items Data & Update Stock
        const movementsToInsert = [];
        const purchaseItemsToInsert = items.map(item => ({
            purchase_id: purchaseId,
            item_id: item.item_id,
            quantity: item.quantity,
            unit: item.unit,
            unit_price: item.unit_price,
            total_price: item.total_price
        }));

        // Insert Purchase Items
        const { error: itemsError } = await supabase
            .from('purchase_items')
            .insert(purchaseItemsToInsert);

        if (itemsError) throw itemsError;

        // 3. Process Stock Updates (Sequential for safety in JS loop)
        // Optimization: Could use Promise.all but standard loop is safer for debugging if one fails
        for (const item of items) {
            // Fetch current stock
            const { data: currentItem, error: fetchError } = await supabase
                .from('inventory_items')
                .select('current_stock')
                .eq('id', item.item_id)
                .single();

            if (fetchError) console.error(`Failed to fetch stock for item ${item.item_id}`, fetchError);

            const oldStock = Number(currentItem?.current_stock || 0);
            const newStock = oldStock + Number(item.quantity);

            // Update Stock
            await supabase
                .from('inventory_items')
                .update({
                    current_stock: newStock,
                    purchase_price: item.unit_price, // Update last purchase price
                    updated_at: new Date()
                })
                .eq('id', item.item_id);

            // Add to movements log
            movementsToInsert.push({
                restaurant_id,
                item_id: item.item_id,
                type: 'IN',
                quantity: item.quantity,
                unit: item.unit,
                reason: `Purchase Invoice: ${invoice_no || purchaseId}`,
                reference_id: purchaseId
            });
        }

        // 4. Batch Insert Movements
        if (movementsToInsert.length > 0) {
            const { error: moveError } = await supabase
                .from('stock_movements')
                .insert(movementsToInsert);

            if (moveError) console.error('Error logging movements:', moveError);
        }

        res.status(201).json({ message: 'Purchase recorded successfully', purchase });

    } catch (error) {
        console.error('Purchase Entry Error:', error);
        res.status(500).json({ error: error.message });
        // NOTE: Without transactions, a failure halfway leaves partial data. 
        // In a real prod environment, use Supabase RPC or SQL Transaction.
    }
});

// Get Purchases (History)
router.get('/:restaurantId', async (req, res) => {
    try {
        const { vendorId, fromDate, toDate } = req.query;
        let query = supabase
            .from('purchases')
            .select(`
                *,
                vendors (name)
            `)
            .eq('restaurant_id', req.params.restaurantId)
            .order('invoice_date', { ascending: false });

        if (vendorId) query = query.eq('vendor_id', vendorId);
        if (fromDate) query = query.gte('invoice_date', fromDate);
        if (toDate) query = query.lte('invoice_date', toDate);

        const { data, error } = await query;
        if (error) throw error;
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});


module.exports = router;
