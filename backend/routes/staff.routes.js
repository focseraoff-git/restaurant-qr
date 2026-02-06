const express = require('express');
const router = express.Router();
const supabase = require('../config/supabaseClient');

// Get all staff for a restaurant
router.get('/:restaurantId', async (req, res) => {
    const { restaurantId } = req.params;
    const { data, error } = await supabase
        .from('staff')
        .select('*')
        .eq('restaurant_id', restaurantId)
        .order('name');

    if (error) return res.status(400).json(error);
    res.json(data);
});

// Create new staff
router.post('/', async (req, res) => {
    const { data, error } = await supabase
        .from('staff')
        .insert([req.body])
        .select();

    if (error) return res.status(400).json(error);
    res.json(data[0]);
});

// Update staff
router.put('/:id', async (req, res) => {
    const { id } = req.params;
    const { data, error } = await supabase
        .from('staff')
        .update(req.body)
        .eq('id', id)
        .select();

    if (error) return res.status(400).json(error);
    res.json(data[0]);
});

module.exports = router;
