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

// Add Menu Item
router.post('/', async (req, res) => {
    const { category_id, name, description, price_full, is_veg, image } = req.body;
    try {
        const { data, error } = await supabase
            .from('menu_items')
            .insert([{ category_id, name, description, price_full, is_veg, image }])
            .select();
        if (error) throw error;
        res.status(201).json(data[0]);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Update Menu Item
router.put('/:id', async (req, res) => {
    const { id } = req.params;
    const updates = req.body;
    try {
        const { data, error } = await supabase
            .from('menu_items')
            .update(updates)
            .eq('id', id)
            .select();
        if (error) throw error;
        res.json(data[0]);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Delete Menu Item
router.delete('/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const { error } = await supabase
            .from('menu_items')
            .delete()
            .eq('id', id);
        if (error) throw error;
        res.json({ message: 'Item deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Add Category
router.post('/categories', async (req, res) => {
    const { restaurant_id, name, sort_order } = req.body;
    try {
        const { data, error } = await supabase
            .from('menu_categories')
            .insert([{ restaurant_id, name, sort_order: sort_order || 0 }])
            .select();
        if (error) throw error;
        res.status(201).json(data[0]);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Update Category
router.put('/categories/:id', async (req, res) => {
    const { name, sort_order } = req.body;
    try {
        const { data, error } = await supabase
            .from('menu_categories')
            .update({ name, sort_order })
            .eq('id', req.params.id)
            .select();
        if (error) throw error;
        res.json(data[0]);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Delete Category
router.delete('/categories/:id', async (req, res) => {
    try {
        const { error } = await supabase
            .from('menu_categories')
            .delete()
            .eq('id', req.params.id);
        if (error) throw error;
        res.json({ message: 'Category deleted' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
