const express = require('express');
const router = express.Router();
const supabase = require('../config/supabaseClient');

// Get payroll for a restaurant and month
router.get('/:restaurantId/:month', async (req, res) => {
    const { restaurantId, month } = req.params;
    const { data, error } = await supabase
        .from('staff_payroll')
        .select('*, staff!inner(name, role, restaurant_id)')
        .eq('staff.restaurant_id', restaurantId)
        .eq('month', month);

    if (error) return res.status(400).json(error);
    res.json(data);
});

const { calculateAndSavePayroll } = require('../services/payrollService');

// Generate/Update Payroll item
router.post('/generate', async (req, res) => {
    const { staff_id, month } = req.body;

    try {
        const payroll = await calculateAndSavePayroll(staff_id, month);
        res.json(payroll);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// Mark payroll as paid
router.post('/mark-paid/:payrollId', async (req, res) => {
    const { payrollId } = req.params;

    const { data, error } = await supabase
        .from('staff_payroll')
        .update({ status: 'paid', paid_at: new Date().toISOString() })
        .eq('id', payrollId)
        .select();

    if (error) return res.status(400).json(error);
    res.json(data[0]);
});

module.exports = router;
