require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing env vars');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
    console.log('Checking for vendors table...');
    const { data, error } = await supabase
        .from('vendors')
        .select('id')
        .limit(1);

    if (error) {
        if (error.code === '42P01') { // Postgres error code for undefined table
            console.log('TABLE_MISSING');
        } else {
            console.error('Error:', error.message);
        }
    } else {
        console.log('TABLE_EXISTS');
    }
}

check();
