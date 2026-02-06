
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

async function inspectTable(tableName) {
    console.log(`Inspecting table: ${tableName}`);
    // We can't easily get schema info via client-js without admin access or specific query.
    // simpler: try to select one row and see keys, OR force an error to see columns?
    // standard way: just select * limit 1
    const { data, error } = await supabase.from(tableName).select('*').limit(1);

    if (error) {
        console.error(`Error querying ${tableName}:`, error);
        return;
    }

    if (data && data.length > 0) {
        console.log(`Columns in ${tableName}:`, Object.keys(data[0]));
    } else {
        console.log(`${tableName} is empty or no columns returned.`);
        // Try inserting dummy data to get "column does not exist" error? No that's risky.
    }
}

async function run() {
    await inspectTable('restaurants');
    // auth.users is not accessible via client-js usually.
}

run();
