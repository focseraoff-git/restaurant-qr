const express = require('express');
const router = express.Router();
const supabase = require('../config/supabaseClient');

// Get attendance for a date
router.get('/:restaurantId', async (req, res) => {
    const { restaurantId } = req.params;
    const { date } = req.query; // YYYY-MM-DD

    const { data, error } = await supabase
        .from('staff_attendance')
        .select('*, staff!inner(restaurant_id)')
        .eq('staff.restaurant_id', restaurantId)
        .eq('date', date);

    if (error) return res.status(400).json(error);
    res.json(data);
});

const { calculateAndSavePayroll } = require('../services/payrollService');

// Upsert attendance
router.post('/upsert', async (req, res) => {
    const { staff_id, date, status, notes, in_time, out_time } = req.body;
    console.log(`[BACKEND] Upserting attendance: Staff=${staff_id}, Date=${date}, Status=${status}`);

    const { data, error } = await supabase
        .from('staff_attendance')
        .upsert({ staff_id, date, status, notes, in_time, out_time }, { onConflict: 'staff_id,date' })
        .select();

    if (error) {
        console.error('[BACKEND] Upsert Error:', error);
        return res.status(400).json(error);
    }

    console.log('[BACKEND] Upsert Success:', data);

    // Auto-update payroll for this month
    try {
        const month = date.slice(0, 7); // YYYY-MM
        await calculateAndSavePayroll(staff_id, month);
    } catch (err) {
        console.error('Failed to auto-update payroll:', err);
        // Don't fail the request, just log it
    }

    res.json(data[0]);
});

// Attendance Report Summary
router.get('/report/:staffId', async (req, res) => {
    const { staffId } = req.params;
    const { startDate, endDate } = req.query;

    const { data, error } = await supabase
        .from('staff_attendance')
        .select('*')
        .eq('staff_id', staffId)
        .gte('date', startDate)
        .lte('date', endDate);

    if (error) return res.status(400).json(error);
    res.json(data);
});

module.exports = router;
