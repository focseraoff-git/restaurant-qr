
const { createClient } = require('@supabase/supabase-js');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl) {
    console.error("Missing SUPABASE_URL");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkWaiters() {
    const restaurantId = '5331ded5-6ab3-43cf-b64e-dbfdb6a215eb';
    console.log(`Checking waiters for restaurant: ${restaurantId}`);

    const { data: waiters, error } = await supabase
        .from('waiters')
        .select('*')
        .eq('restaurant_id', restaurantId);

    if (error) {
        console.error('Error:', error);
        return;
    }

    console.log('Found waiters (simplified):');
    waiters.forEach(w => {
        console.log(`ID: ${w.id}, AuthID: ${w.auth_id}, Email: ${w.email}, Name: ${w.name}`);
    });

    // Also list all users if possible (admin only) but we might not have service key here.
    // So we just rely on what we see in waiters table.
}

checkWaiters();
