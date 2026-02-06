const express = require('express');
const router = express.Router();
const supabase = require('../config/supabaseClient');

// Get All Items for Restaurant
router.get('/:restaurantId', async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('inventory_items')
            .select('*')
            .eq('restaurant_id', req.params.restaurantId)
            .order('name', { ascending: true });

        if (error) throw error;
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Create Item
router.post('/', async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('inventory_items')
            .insert(req.body)
            .select()
            .single();

        if (error) throw error;
        res.status(201).json(data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Update Item
router.put('/:id', async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('inventory_items')
            .update(req.body)
            .eq('id', req.params.id)
            .select()
            .single();

        if (error) throw error;
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Delete Item
router.delete('/:id', async (req, res) => {
    try {
        const { error } = await supabase
            .from('inventory_items')
            .delete()
            .eq('id', req.params.id);

        if (error) throw error;
        res.json({ message: 'Item deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Low Stock Alerts (Custom Endpoint)
router.get('/:restaurantId/alerts', async (req, res) => {
    try {
        // Fetch items where current_stock <= min_stock_level
        // Supabase-js doesn't support "col <= col" comparison easily in filters directly without RPC usually,
        // but we can fetch all and filter JS side OR use logic if available.
        // OR: .lte('current_stock', 'min_stock_level') - NO, 2nd arg is value.
        // So we pull all items and filter in backend.

        const { data, error } = await supabase
            .from('inventory_items')
            .select('*')
            .eq('restaurant_id', req.params.restaurantId);

        if (error) throw error;

        const alerts = data.filter(item =>
            (item.current_stock <= item.min_stock_level) ||
            (item.current_stock === 0)
        );

        res.json(alerts);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
