const express = require('express');
const router = express.Router();
const supabase = require('../config/supabaseClient');

// Helper to get start/end of day/month
const getRange = (period) => {
    const now = new Date();
    let start = new Date();
    let end = new Date();

    if (period === 'daily') {
        start.setHours(0, 0, 0, 0);
        end.setHours(23, 59, 59, 999);
    } else if (period === 'monthly') {
        start.setDate(1);
        start.setHours(0, 0, 0, 0);
        end.setMonth(now.getMonth() + 1);
        end.setDate(0);
        end.setHours(23, 59, 59, 999);
    } else if (period === 'yearly') {
        start.setMonth(0, 1);
        start.setHours(0, 0, 0, 0);
        end.setMonth(11, 31);
        end.setHours(23, 59, 59, 999);
    }
    return { start: start.toISOString(), end: end.toISOString() };
};

// Get Dashboard Stats (Daily/Monthly/Yearly)
router.get('/stats', async (req, res) => {
    const { restaurantId, period = 'daily' } = req.query;
    const { start, end } = getRange(period);

    try {
        const { data: orders, error } = await supabase
            .from('orders')
            .select('*')
            .eq('restaurant_id', restaurantId)
            .gte('created_at', start)
            .lte('created_at', end)
            .neq('status', 'cancelled'); // Exclude cancelled for revenue

        if (error) throw error;

        // Calculate Stats
        const totalRevenue = orders.reduce((sum, o) => sum + Number(o.total_amount || 0), 0);
        const totalOrders = orders.length;

        // Payment Mode Breakdown
        // Note: Payment mode is usually in `payments` table but often cached in `orders` or we need to join.
        // For simple dashboard, we assume orders table might have it or we fetch payments separate.
        // Let's keep it simple: Revenue & Count first.

        // Fetch Cancelled Count separately
        const { count: cancelledCount, error: cancelError } = await supabase
            .from('orders')
            .select('*', { count: 'exact', head: true })
            .eq('restaurant_id', restaurantId)
            .gte('created_at', start)
            .lte('created_at', end)
            .eq('status', 'cancelled');

        if (cancelError) throw cancelError;

        res.json({
            period,
            start,
            end,
            totalRevenue,
            totalOrders,
            cancelledCount,
            orders // Send full list for details table if needed (paginated is better but this is MVP)
        });

    } catch (error) {
        console.error('Stats Error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Online Orders Platform Analytics
router.get('/online-stats', async (req, res) => {
    const { restaurantId, period = 'daily' } = req.query;
    const { start, end } = getRange(period);

    try {
        // Fetch Online Orders
        const { data, error } = await supabase
            .from('orders')
            .select('*')
            .eq('restaurant_id', restaurantId)
            .gte('created_at', start)
            .lte('created_at', end)
            .eq('order_type', 'online'); // or similar flag

        if (error) throw error;

        // Aggregate by Platform
        const platformStats = {};
        let totalOnlineRevenue = 0;

        data.forEach(order => {
            // platform field or metadata? assuming we added 'platform' or extract from notes
            const platform = order.platform || order.notes?.includes('Swiggy') ? 'Swiggy' : order.notes?.includes('Zomato') ? 'Zomato' : 'Website';

            if (!platformStats[platform]) platformStats[platform] = { count: 0, revenue: 0 };

            platformStats[platform].count += 1;
            platformStats[platform].revenue += Number(order.total_amount || 0);
            totalOnlineRevenue += Number(order.total_amount || 0);
        });

        res.json({
            period,
            totalOnlineRevenue,
            totalOnlineOrders: data.length,
            breakdown: platformStats
        });

    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Log Manual Online Order
router.post('/online-order', async (req, res) => {
    try {
        const { restaurantId, platform, externalOrderId, amount, status = 'completed' } = req.body;

        // We log it as a standard order but with specific metadata
        // Storing platform in Notes for simple filtering/analytics later as per our stats logic
        const notes = `Platform: ${platform}, Ref: ${externalOrderId}`;

        const { data, error } = await supabase
            .from('orders')
            .insert({
                restaurant_id: restaurantId,
                order_type: 'online',
                total_amount: amount,
                status: status,
                table_id: null, // No table for online
                customer_name: `${platform} Order`,
                notes: notes,
                created_at: new Date().toISOString()
            })
            .select()
            .single();

        if (error) throw error;
        res.json(data);
    } catch (error) {
        console.error('Manual Order Error:', error);
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
