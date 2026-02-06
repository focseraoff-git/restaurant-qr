const express = require('express');
const router = express.Router();
const supabase = require('../config/supabaseClient');

// Get Active Offers (For Customers/Menu)
router.get('/:restaurantId/active', async (req, res) => {
    try {
        const now = new Date().toISOString();
        const { data, error } = await supabase
            .from('offers')
            .select('*')
            .eq('restaurant_id', req.params.restaurantId)
            .eq('is_active', true)
            // .lte('start_date', now) // Optional: strictly strictly current
            // .gte('end_date', now)
            .order('value', { ascending: false }); // Show big offers first

        if (error) throw error;
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get All Offers (For Admin)
router.get('/:restaurantId/all', async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('offers')
            .select('*')
            .eq('restaurant_id', req.params.restaurantId)
            .order('created_at', { ascending: false });

        if (error) throw error;
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Create Offer
router.post('/', async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('offers')
            .insert(req.body)
            .select()
            .single();

        if (error) throw error;
        res.status(201).json(data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Toggle / Update Offer
router.put('/:id', async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('offers')
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

module.exports = router;
