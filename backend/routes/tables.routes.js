const express = require('express');
const router = express.Router();
const supabase = require('../config/supabaseClient');

// Get Table Details by ID
router.get('/:id', async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('tables')
            .select('*')
            .eq('id', req.params.id)
            .single();

        if (error) throw error;
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get All Tables for Restaurant
router.get('/restaurant/:restaurantId', async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('tables')
            .select('*')
            .eq('restaurant_id', req.params.restaurantId)
            .order('table_number', { ascending: true }); // Assuming table_number is sortable (if string "1", "10", "2" issue might occur but fine for now)

        if (error) throw error;
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
