const express = require('express');
const router = express.Router();
const supabase = require('../config/supabaseClient');

// Create Waiter (Admin Action)
router.post('/create', async (req, res) => {
    const { email, password, name, restaurantId } = req.body;
    try {
        // 1. Create Auth User
        const { data: authData, error: authError } = await supabase.auth.admin.createUser({
            email,
            password,
            email_confirm: true
        });

        if (authError) throw authError;

        // 2. Insert into waiters table
        const { data: waiter, error: dbError } = await supabase
            .from('waiters')
            .insert({
                auth_id: authData.user.id,
                restaurant_id: restaurantId,
                email,
                name
            })
            .select()
            .single();

        if (dbError) {
            // Rollback auth user if DB fails (optional but good)
            await supabase.auth.admin.deleteUser(authData.user.id);
            throw dbError;
        }

        res.status(201).json(waiter);
    } catch (error) {
        console.error('Create Waiter Error:', error);
        res.status(500).json({ error: error.message });
    }
});

// List Waiters
router.get('/:restaurantId', async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('waiters')
            .select('*')
            .eq('restaurant_id', req.params.restaurantId);

        if (error) throw error;
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Delete Waiter
router.delete('/:id', async (req, res) => {
    try {
        // Get auth_id first
        const { data: waiter } = await supabase.from('waiters').select('auth_id').eq('id', req.params.id).single();

        // Delete from DB (Cascade should handle orders or set null? Assuming cascade or restricted)
        // We'll just delete the waiter record.
        const { error: dbError } = await supabase.from('waiters').delete().eq('id', req.params.id);
        if (dbError) throw dbError;

        // Delete from Auth
        if (waiter && waiter.auth_id) {
            await supabase.auth.admin.deleteUser(waiter.auth_id);
        }

        res.json({ message: 'Waiter deleted' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Kitchen Stats (Settlement)
router.get('/:restaurantId/stats', async (req, res) => {
    const { date } = req.query; // YYYY-MM-DD
    const startDate = date ? new Date(date).toISOString() : new Date().toISOString().split('T')[0];

    try {
        // Total Orders & Revenue for the day
        const { data: orders, error } = await supabase
            .from('orders')
            .select('total_amount, status, waiter_id')
            .eq('restaurant_id', req.params.restaurantId)
            .gte('created_at', startDate); // Orders from today

        if (error) throw error;

        const totalOrders = orders.length;
        const deliveredOrders = orders.filter(o => o.status === 'completed').length;
        const revenue = orders.filter(o => o.status === 'completed').reduce((sum, o) => sum + o.total_amount, 0);

        // Per Waiter Stats
        const { data: waiters } = await supabase.from('waiters').select('id, name').eq('restaurant_id', req.params.restaurantId);

        const waiterStats = waiters.map(w => {
            const myOrders = orders.filter(o => o.waiter_id === w.id && o.status === 'completed');
            return {
                name: w.name,
                id: w.id,
                count: myOrders.length,
                total: myOrders.reduce((sum, o) => sum + o.total_amount, 0)
            };
        });

        res.json({
            summary: { totalOrders, deliveredOrders, revenue },
            waiters: waiterStats
        });

    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
