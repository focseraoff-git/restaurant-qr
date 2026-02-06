const express = require('express');
const router = express.Router();
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

// GET Stats (Total Payout, Pending, etc.)
router.get('/stats/:restaurantId', async (req, res) => {
    const { restaurantId } = req.params;

    // Get current month
    const now = new Date();
    const currentMonth = now.toISOString().slice(0, 7); // YYYY-MM

    try {
        // Fetch payrolls for this month linked to this restaurant's staff
        const { data: payrolls, error } = await supabase
            .from('staff_payroll')
            .select(`
                *,
                staff!inner(restaurant_id)
            `)
            .eq('staff.restaurant_id', restaurantId)
            .eq('month', currentMonth);

        if (error) throw error;

        const totalPayout = payrolls.reduce((sum, p) => sum + (p.status === 'paid' ? p.final_amount : 0), 0);
        const pendingPayout = payrolls.reduce((sum, p) => sum + (p.status !== 'paid' ? p.final_amount : 0), 0);

        res.json({
            month: currentMonth,
            totalPayout,
            pendingPayout,
            count: payrolls.length
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// GET Payroll List by Month
router.get('/:restaurantId/:month', async (req, res) => {
    const { restaurantId, month } = req.params;
    try {
        const { data, error } = await supabase
            .from('staff_payroll')
            .select(`
                *,
                staff:staff_id (name, role, status)
            `)
            .eq('month', month)
            // Ideally also filter by restaurant_id via join, but step 1 is correct relation
            // The staff!inner join ensures we only get payrolls for this restaurant's staff
            .not('staff', 'is', null);

        // Client-side filtering for restaurantId is safer if RLS is tricky with joins in one go,
        // but let's try a correct inner join filter
        const { data: filteredData, error: filterError } = await supabase
            .from('staff_payroll')
            .select(`
                *,
                staff!inner(id, name, role, restaurant_id)
            `)
            .eq('staff.restaurant_id', restaurantId)
            .eq('month', month);

        if (filterError) throw filterError;
        res.json(filteredData);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// GENERATE Payroll for a specific month
router.post('/generate', async (req, res) => {
    const { restaurantId, month } = req.body; // month format: 'YYYY-MM'

    try {
        // 1. Get all active staff for this restaurant
        const { data: staffList, error: staffError } = await supabase
            .from('staff')
            .select('*')
            .eq('restaurant_id', restaurantId)
            .eq('status', 'active');

        if (staffError) throw staffError;

        const results = [];

        // 2. Iterate and Calculate
        for (const staff of staffList) {
            // Get Attendance Stats
            const { data: attendance } = await supabase
                .from('staff_attendance')
                .select('status')
                .eq('staff_id', staff.id)
                .like('date', `${month}%`); // Simple string match for YYYY-MM

            const presentDays = attendance?.filter(a => a.status === 'present').length || 0;
            const halfDays = attendance?.filter(a => a.status === 'half-day').length || 0;

            // Basic Calc (Monthly fixed or Daily based)
            // Assuming Monthly 30 days for simplicity if salary_type is monthly
            let calculatedBase = 0;
            if (staff.salary_type === 'monthly') {
                calculatedBase = staff.base_salary;
                // Deduct for absent days could go here, but keeping simple: Full salary if active
                // Or pro-rata: (base / 30) * (present + half*0.5)
            } else {
                // Daily logic not fully implemented yet, defaulting to base
                calculatedBase = staff.base_salary;
            }

            // Get Active Advances (Recoverable)
            // Implementation detail: Logic to deduct distinct advance records would be here.
            // For now, 0 deduction.
            const advanceDeduction = 0;

            const finalAmount = calculatedBase - advanceDeduction;

            // 3. Upsert Payroll Record
            const { data: payroll, error: payrollError } = await supabase
                .from('staff_payroll')
                .upsert({
                    staff_id: staff.id,
                    month: month,
                    base_salary_snapshot: staff.base_salary,
                    attendance_summary: { present: presentDays, half_day: halfDays },
                    advance_deductions: advanceDeduction,
                    final_amount: finalAmount,
                    status: 'pending' // Default to pending
                }, { onConflict: 'staff_id, month' })
                .select()
                .single();

            if (!payrollError) results.push(payroll);
        }

        res.json({ success: true, Generated: results.length, details: results });

    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// UPDATE Payroll (Manual Adjustment)
router.put('/:id', async (req, res) => {
    const { id } = req.params;
    const updates = req.body; // { final_amount, status, bonuses, notes... }

    try {
        const { data, error } = await supabase
            .from('staff_payroll')
            .update(updates)
            .eq('id', id)
            .select();

        if (error) throw error;
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// DELETE Payroll (Remove Record)
router.delete('/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const { error } = await supabase
            .from('staff_payroll')
            .delete()
            .eq('id', id);

        if (error) throw error;
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
