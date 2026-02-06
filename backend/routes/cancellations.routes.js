const express = require('express');
const router = express.Router();
const supabase = require('../config/supabaseClient');

// Get Cancellations Report
router.get('/:restaurantId', async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('cancellations')
            .select('*')
            .eq('restaurant_id', req.params.restaurantId)
            .order('created_at', { ascending: false });

        if (error) throw error;
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Log Cancellation / Damage
router.post('/', async (req, res) => {
    try {
        const { restaurant_id, order_id, item_name, quantity, reason_category, notes, amount_impact, reported_by } = req.body;

        const { data, error } = await supabase
            .from('cancellations')
            .insert({
                restaurant_id,
                order_id,
                item_name,
                quantity,
                reason_category,
                notes,
                amount_impact,
                reported_by
            })
            .select()
            .single();

        if (error) throw error;

        // If linked to stock logic, we might need to update stock here too?
        // Usually cancellations mean wasted stock (Stock OUT).
        // For now, we assume stock update is handled separately or this is just a compliance log.
        // The user asked for "Track Cancellations & Damages".

        res.json(data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
