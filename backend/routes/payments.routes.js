const express = require('express');
const router = express.Router();
const supabase = require('../config/supabaseClient');

// Initiate Payment
router.post('/initiate', async (req, res) => {
    const { orderId, amount, method } = req.body;

    try {
        const { data, error } = await supabase
            .from('payments')
            .insert({
                order_id: orderId,
                amount: amount,
                method: method,
                status: 'pending'
            })
            .select()
            .single();

        if (error) throw error;
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Generate Bill
router.post('/bill/generate', async (req, res) => {
    // TODO: Implementation
    res.json({ message: 'Bill generate endpoint' });
});

module.exports = router;
