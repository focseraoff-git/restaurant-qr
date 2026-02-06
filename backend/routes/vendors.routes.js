const express = require('express');
const router = express.Router();
const supabase = require('../config/supabaseClient');

// Get All Vendors for a Restaurant
router.get('/:restaurantId', async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('vendors')
            .select('*')
            .eq('restaurant_id', req.params.restaurantId)
            .order('name', { ascending: true });

        if (error) throw error;
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Create Vendor
router.post('/', async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('vendors')
            .insert(req.body)
            .select()
            .single();

        if (error) throw error;
        res.status(201).json(data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Update Vendor
router.put('/:id', async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('vendors')
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

// Delete Vendor (Soft delete or physical depending on rules, user asked for "Deactivate" mostly)
router.delete('/:id', async (req, res) => {
    try {
        // Check for dependencies first? For now, relying on FK constraints or simply allowing delete if no history.
        // User asked: "Delete item (only if no history, else archive)" - that's for Items.
        // For Vendors: "Deactivate vendor (vendor exit) with exit date + reason"
        // So this might be better as an Update, but I'll leave DELETE for cleanup of mistakes.
        const { error } = await supabase
            .from('vendors')
            .delete()
            .eq('id', req.params.id);

        if (error) throw error;
        res.json({ message: 'Vendor deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
