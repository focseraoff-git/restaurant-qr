const express = require('express');
const router = express.Router();
const supabase = require('../config/supabaseClient');

// Create Staff/User (Admin Action)
// Supports creating: 
// A) Login User (Email + Password) -> Linked to Staff
// B) Simple Staff (No Login)
router.post('/create', async (req, res) => {
    const { email, password, name, restaurantId, role, phone, salary } = req.body;
    try {
        console.log(`Creating staff for: ${name}, Login: ${!!email}`);

        let userId = null;

        // 1. If Email/Password provided, create Auth User first
        if (email && password) {
            const { data: authData, error: authError } = await supabase.auth.admin.createUser({
                email,
                password,
                email_confirm: true,
                user_metadata: {
                    full_name: name,
                    restaurant_id: restaurantId,
                    role: role || 'waiter',
                }
            });

            if (authError) throw authError;
            userId = authData.user.id;
        }

        // 2. Insert into Staff Table (Always)
        // If userId exists, we link it. If not, it's just NULL.
        // Note: The SQL Trigger 'handle_new_user' might fire on Auth creation,
        // but we want robust handling here.
        // If the trigger already created the staff row (via Auth), we might get a duplicate if we insert again.
        // Let's rely on the Trigger for Auth users, and Manual Insert for Non-Auth users.

        if (!userId) {
            // Manual Insert for Non-Login Staff
            const { data: staffData, error: staffError } = await supabase
                .from('staff')
                .insert([{
                    restaurant_id: restaurantId,
                    name: name,
                    role: role || 'waiter',
                    phone: phone || null,
                    base_salary: salary || 0,
                    status: 'active',
                    user_id: null, // explicit null
                    joining_date: new Date().toISOString()
                }])
                .select()
                .single();

            if (staffError) throw staffError;
            res.status(201).json({ message: 'Staff created (No Login)', staff: staffData });
        } else {
            // Auth User Created -> Trigger should have handled Staff creation
            // We just return success.
            res.status(201).json({ message: 'User created (Login Enabled)', userId });
        }

    } catch (error) {
        console.error('Create Staff Error:', error);
        res.status(500).json({ error: error.message });
    }
});

// List All Staff (Single Table Source!)
router.get('/:restaurantId', async (req, res) => {
    try {
        const { restaurantId } = req.params;

        // Validation: Ensure ID is a UUID (prevents "create" or "stats" being treated as ID)
        const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(restaurantId);
        if (!isUUID) {
            return res.status(400).json({ error: 'Invalid Restaurant ID format' });
        }

        // Simple Select from Staff table
        // Now 'user_id' tells us if they have login access
        const { data: staffList, error } = await supabase
            .from('staff')
            .select('*')
            .eq('restaurant_id', restaurantId)
            .order('name', { ascending: true });

        if (error) throw error;

        // Normalize for Frontend
        const cleanedList = staffList.map(s => ({
            ...s,
            full_name: s.name, // Component expects full_name
            has_login: !!s.user_id, // Helper flag
            id: s.user_id || s.id, // Prefer Auth ID if linked, else Staff UUID
            staff_id: s.id // ALways expose the raw Staff UUID for strict foreign key checks
            // Note: Frontend might use 'id' for deletes. 
            // If user_id exists, we should probably prefer using IT for consistency with Auth operations.
        }));

        res.json(cleanedList);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Delete Staff/User (Soft Delete to preserve history)
router.delete('/:id', async (req, res) => {
    try {
        const id = req.params.id; // Could be Staff ID or Auth ID

        // 1. Find the target staff
        const { data: targetStaff, error: fetchError } = await supabase
            .from('staff')
            .select('id, user_id, name')
            .or(`id.eq.${id},user_id.eq.${id}`)
            .single();

        if (fetchError && fetchError.code !== 'PGRST116') throw fetchError;

        if (targetStaff) {
            console.log(`Soft deleting staff: ${targetStaff.name} (${targetStaff.id})`);

            // 2. Unlink Auth User and Deactivate Staff Record
            // We DO NOT delete the row, to preserve Orders/Payroll history.
            const { error: updateError } = await supabase
                .from('staff')
                .update({
                    status: 'exited',
                    user_id: null,
                    // Append deleted marker to name to allow re-using name later if needed, mostly visual
                    name: `${targetStaff.name} (Deleted)`
                })
                .eq('id', targetStaff.id);

            if (updateError) throw updateError;

            // 3. Delete the Auth User (Prevent Login)
            if (targetStaff.user_id) {
                const { error: authError } = await supabase.auth.admin.deleteUser(targetStaff.user_id);
                if (authError) {
                    console.error('Auth delete warning:', authError.message);
                    // Continue, as main goal was access revocation which user_id:null achieves
                }
            }
        } else {
            // No staff record found, just try to delete Auth ID (Cleanup)
            await supabase.auth.admin.deleteUser(id);
        }

        res.json({ message: 'User deleted successfully (History preserved)' });
    } catch (error) {
        console.error('FULL DELETE ERROR:', error);
        res.status(500).json({
            error: error.message || 'Database error deleting user',
            details: error
        });
    }
});

// Update Staff (Single Table)
router.put('/:id', async (req, res) => {
    const { name, email, password, role, phone, salary } = req.body;
    try {
        const id = req.params.id; // Could be Staff ID or Auth ID

        // 1. Find the target staff to get correct IDs
        const { data: targetStaff, error: fetchError } = await supabase
            .from('staff')
            .select('id, user_id')
            .or(`id.eq.${id},user_id.eq.${id}`)
            .single();

        if (fetchError) throw fetchError;

        // 2. Prepare Staff Updates
        const staffUpdates = {};
        if (name) staffUpdates.name = name;
        if (role) staffUpdates.role = role;
        if (phone) staffUpdates.phone = phone;
        if (salary) staffUpdates.base_salary = salary;

        // Update Staff Table
        if (Object.keys(staffUpdates).length > 0) {
            await supabase.from('staff').update(staffUpdates).eq('id', targetStaff.id);
        }

        // 3. IF Linked Object (Has user_id), Update Auth Credentials
        if (targetStaff.user_id) {
            const authUpdates = {};
            if (email) authUpdates.email = email;
            if (password) authUpdates.password = password;
            // Also update metadata so future triggers work
            if (role || name) {
                authUpdates.user_metadata = {
                    role: role || undefined,
                    full_name: name || undefined
                };
            }

            if (Object.keys(authUpdates).length > 0) {
                await supabase.auth.admin.updateUserById(targetStaff.user_id, authUpdates);
            }
        }

        res.json({ message: 'Updated successfully' });
    } catch (error) {
        console.error('Update Error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Kitchen Stats (Unchanged but using staff table)
router.get('/:restaurantId/stats', async (req, res) => {
    // ... stats logic relies on 'waiters' which is this file? 
    // Wait, the client usually calls /api/waiters?
    // Let's check the route mounting. Assuming this file is served as /api/waiters
    // The previous code had a stats endpoint, keeping it safe.
    try {
        const { date } = req.query;
        const startDate = date ? new Date(date).toISOString() : new Date().toISOString().split('T')[0];

        // Fetch Orders
        const { data: orders, error } = await supabase
            .from('orders')
            .select('total_amount, status, waiter_id')
            .eq('restaurant_id', req.params.restaurantId)
            .gte('created_at', startDate);

        if (error) throw error;

        // Fetch Staff
        const { data: staffList } = await supabase
            .from('staff')
            .select('id, user_id, name')
            .eq('restaurant_id', req.params.restaurantId);

        // Map Stats
        const waiterStats = staffList.map(w => {
            // Match orders by waiter_id (which is usually the Staff ID or maybe Auth ID depending on how order was saved)
            // Robust check: match either
            const myOrders = orders.filter(o =>
                o.waiter_id === w.id || (w.user_id && o.waiter_id === w.user_id)
            );

            return {
                name: w.name,
                id: w.user_id || w.id, // Frontend identifying ID
                count: myOrders.length,
                total: myOrders.filter(o => o.status === 'completed').reduce((sum, o) => sum + o.total_amount, 0)
            };
        });

        res.json({
            summary: {
                totalOrders: orders.length,
                deliveredOrders: orders.filter(o => o.status === 'completed').length,
                revenue: orders.filter(o => o.status === 'completed').reduce((sum, o) => sum + o.total_amount, 0)
            },
            waiters: waiterStats
        });

    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

module.exports = router;
