const express = require('express');
const router = express.Router();
const supabase = require('../config/supabaseClient');

// Get Menu (Categories with Items)
router.get('/:restaurantId', async (req, res) => {
    const { restaurantId } = req.params;

    try {
        const { data, error } = await supabase
            .from('menu_categories')
            .select(`
                *,
                menu_items (*)
            `)
            .eq('restaurant_id', restaurantId)
            .order('sort_order', { ascending: true });
        // .order('name', { foreignTable: 'menu_items', ascending: true }); // Optional: sort items

        if (error) throw error;

        res.json(data);
    } catch (error) {
        console.error('Error fetching menu:', error);
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
