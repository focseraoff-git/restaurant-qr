const supabase = require('../config/supabaseClient');

async function migrate() {
    console.log('Starting migration of waiters to staff...');

    // 1. Fetch all waiters
    const { data: waiters, error: wError } = await supabase
        .from('waiters')
        .select('*');

    if (wError) {
        console.error('Error fetching waiters:', wError);
        return;
    }

    console.log(`Found ${waiters.length} waiters.`);

    // 2. Fetch existing staff to avoid duplicates
    const { data: staff, error: sError } = await supabase
        .from('staff')
        .select('name, restaurant_id');

    if (sError) {
        console.error('Error fetching staff:', sError);
        return;
    }

    const existingStaff = new Set(staff.map(s => `${s.restaurant_id}:${s.name}`));

    // 3. Prepare new staff records
    const newStaff = [];
    for (const waiter of waiters) {
        const key = `${waiter.restaurant_id}:${waiter.name}`;
        if (!existingStaff.has(key)) {
            newStaff.push({
                restaurant_id: waiter.restaurant_id,
                name: waiter.name,
                role: 'Waiter',
                phone: '', // Waiters table doesn't have phone
                salary_type: 'monthly',
                base_salary: 0,
                status: 'active',
                joining_date: waiter.created_at.split('T')[0], // Use creation date
                created_at: new Date().toISOString()
            });
        } else {
            console.log(`Skipping duplicate: ${waiter.name}`);
        }
    }

    if (newStaff.length === 0) {
        console.log('No new waiters to migrate.');
        return;
    }

    // 4. Insert into staff table
    const { data: inserted, error: iError } = await supabase
        .from('staff')
        .insert(newStaff)
        .select();

    if (iError) {
        console.error('Error inserting staff:', iError);
    } else {
        console.log(`Successfully migrated ${inserted.length} waiters to staff table.`);
    }
}

migrate();
