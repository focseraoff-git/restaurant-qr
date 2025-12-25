const { createClient } = require('@supabase/supabase-js');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

async function check() {
    console.log('Checking tables table...');
    const { data, error } = await supabase.from('tables').select('*').limit(1);
    if (error) {
        console.error('Error:', error);
    } else {
        console.log('Success! Table exists. Data:', data);
    }
}

check();
