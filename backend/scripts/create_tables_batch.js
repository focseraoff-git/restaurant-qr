const { createClient } = require('@supabase/supabase-js');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

const RESTAURANT_ID = '5331ded5-6ab3-43cf-b64e-dbfdb6a215eb';

async function createTables() {
    console.log(`Creating 25 tables for restaurant: ${RESTAURANT_ID}`);

    const tables = [];
    for (let i = 1; i <= 25; i++) {
        tables.push({
            restaurant_id: RESTAURANT_ID,
            table_number: i.toString()
        });
    }

    // Insert tables
    const { data, error } = await supabase
        .from('tables')
        .insert(tables)
        .select();

    if (error) {
        console.error('Error creating tables:', JSON.stringify(error, null, 2));
    } else {
        console.log(`Successfully created ${data.length} tables.`);
        console.log('--- QR CODES ---');
        data.forEach(table => {
            const url = `http://localhost:5173/?restaurantId=${RESTAURANT_ID}&tableId=${table.id}`;
            console.log(`Table ${table.table_number}: ${url}`);
        });
    }
}

createTables();
