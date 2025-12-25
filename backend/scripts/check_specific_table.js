const { createClient } = require('@supabase/supabase-js');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);
const TABLE_ID = '08fa6430-54ed-49fe-8d6d-1fe1230d4c38';

async function checkTable() {
    console.log(`Checking Table ID: ${TABLE_ID}`);

    const { data, error } = await supabase
        .from('tables')
        .select('*')
        .eq('id', TABLE_ID);

    if (error) {
        console.error('Error fetching table:', JSON.stringify(error, null, 2));
    } else {
        console.log('Result:', data);
        if (data && data.length > 0) {
            console.log('Table found!');
        } else {
            console.log('Table NOT found.');
        }
    }
}

checkTable();
