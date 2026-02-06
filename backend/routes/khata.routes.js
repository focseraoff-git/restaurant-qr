const express = require('express');
const router = express.Router();
const supabase = require('../config/supabaseClient');

// Get Customers (Filter for Khata Active)
router.get('/customers/:restaurantId', async (req, res) => {
    try {
        const { khataOnly } = req.query;
        let query = supabase
            .from('customers')
            .select('*')
            .eq('restaurant_id', req.params.restaurantId)
            .order('name');

        if (khataOnly === 'true') {
            query = query.eq('is_khata_active', true);
        }

        const { data, error } = await query;
        if (error) throw error;
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Create/Update Customer (Enable Khata)
router.post('/customers', async (req, res) => {
    try {
        const { restaurant_id, name, phone, email, is_khata_active, credit_limit } = req.body;

        // Upsert based on phone + restaurant_id
        const { data, error } = await supabase
            .from('customers')
            .upsert({
                restaurant_id,
                name,
                phone,
                email,
                is_khata_active,
                credit_limit
            }, { onConflict: 'restaurant_id, phone' })
            .select()
            .single();

        if (error) throw error;
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get Customer Ledger (Transactions)
router.get('/ledger/:customerId', async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('khata_transactions')
            .select('*')
            .eq('customer_id', req.params.customerId)
            .order('transaction_date', { ascending: false });

        if (error) throw error;
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Add Transaction (Credit Record or Payment)
router.post('/transaction', async (req, res) => {
    const { restaurant_id, customer_id, type, amount, reference_id, payment_method, description } = req.body;
    // type: 'CREDIT' (adds to due), 'PAYMENT' (reduces due)

    try {
        // 1. Log Transaction
        const { error: txError } = await supabase
            .from('khata_transactions')
            .insert({
                restaurant_id,
                customer_id,
                type,
                amount,
                reference_id,
                payment_method,
                description
            });

        if (txError) throw txError;

        // 2. Update Customer Current Due
        // Fetch current due first or use rpc. Supabase JS update with current value needs fetch first.
        const { data: customer, error: fetchError } = await supabase
            .from('customers')
            .select('current_due')
            .eq('id', customer_id)
            .single();

        if (fetchError) throw fetchError;

        let newDue = Number(customer.current_due || 0);
        if (type === 'CREDIT') {
            newDue += Number(amount);
        } else if (type === 'PAYMENT') {
            newDue -= Number(amount);
        }

        const { error: updateError } = await supabase
            .from('customers')
            .update({ current_due: newDue })
            .eq('id', customer_id);

        if (updateError) throw updateError;

        res.json({ success: true, new_due: newDue });

    } catch (error) {
        console.error('Khata Transaction Error:', error);
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
