const express = require('express');
const router = express.Router();
const supabase = require('../config/supabaseClient');

// Get all advances for a restaurant
router.get('/:restaurantId', async (req, res) => {
    const { restaurantId } = req.params;
    const { data, error } = await supabase
        .from('staff_advances')
        .select('*, staff!inner(restaurant_id)')
        .eq('staff.restaurant_id', restaurantId)
        .order('date', { ascending: false });

    if (error) return res.status(400).json(error);
    res.json(data);
});

// Get staff specific advance balance
router.get('/balance/:staffId', async (req, res) => {
    const { staffId } = req.params;
    const { data, error } = await supabase
        .from('staff_advances')
        .select('amount, is_recovery')
        .eq('staff_id', staffId);

    if (error) return res.status(400).json(error);

    const totalAdvance = data.filter(a => !a.is_recovery).reduce((sum, a) => sum + parseFloat(a.amount), 0);
    const totalRecovery = data.filter(a => a.is_recovery).reduce((sum, a) => sum + parseFloat(a.amount), 0);

    res.json({ balance: totalAdvance - totalRecovery, totalAdvance, totalRecovery });
});

// Create advance or recovery
router.post('/', async (req, res) => {
    const { data, error } = await supabase
        .from('staff_advances')
        .insert([req.body])
        .select();

    if (error) return res.status(400).json(error);
    res.json(data[0]);
});

module.exports = router;
