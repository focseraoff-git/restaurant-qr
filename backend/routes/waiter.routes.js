const express = require('express');
const router = express.Router();
const supabase = require('../config/supabaseClient');

// Get Waiters
router.get('/:restaurantId', async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('waiters')
            .select('*')
            .eq('restaurant_id', req.params.restaurantId)
            // .eq('is_available', true) // Optional: only show available
            ;

        if (error) throw error;
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
