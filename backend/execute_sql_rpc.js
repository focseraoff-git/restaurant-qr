
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
// MUST use Service Role Key for Admin operations like modifying Types.
// If SERVICE_ROLE_KEY is not in env, we might fail on restricted ops, 
// but enum modification usually requires superuser or owner. Service Role is best bet.
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY/ANON_KEY');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const sqlFile = process.argv[2];

if (!sqlFile) {
    console.error('Please provide a SQL file path');
    process.exit(1);
}

async function runSql() {
    const filePath = path.resolve(__dirname, sqlFile);
    console.log(`Reading SQL from: ${filePath}`);

    try {
        const sqlContent = fs.readFileSync(filePath, 'utf8');

        // Supabase JS client doesn't support raw SQL execution directly on the public interface
        // typically unless using a stored procedure like 'exec_sql'.
        // However, we can use the 'rpc' call if we have a function setup, 
        // OR we can use the standard PG connection if we had 'pg' installed.
        // Given the constraints and previous files, it seems previous devs might have used 
        // a specific function or just trusted 'psql'.
        // 
        // WAIT: The previous 'execute_sql.js' I tried to run didn't exist.
        // Let's assume we need to use a PG client if we want to run raw DDL.
        // BUT 'pg' might not be installed.
        // Let's try to find if there is a wrapper function already.

        // Strategy B: Use 'rpc' to call a function 'exec_sql' if it exists.
        // If not, we might be stuck without a direct SQL driver.

        // Let's try to run it via a direct raw PG connection if 'pg' is in package.json.
        // I saw package.json had dependencies? Let's check package.json again.

        // Re-reading package.json content from memory...
        // It had "@supabase/supabase-js", "cors", "dotenv", "express", "nodemon".
        // It did NOT have "pg".

        // This is tricky. Without "pg", we can't run raw SQL from Node unless Supabase has an RPC for it.
        // Most Supabase projects have an 'exec_sql' or similar function for this, or they rely on the dashboard SQL editor.

        // Let's TRY to use a function 'exec' or 'exec_sql' which is common.

        const { data, error } = await supabase.rpc('exec_sql', { sql: sqlContent });

        if (error) {
            // If that fails, we might just be unable to run DDL from here.
            console.error('RPC Error:', error);
            console.log('Attempting fallback or notifying user...');

            // Fallback: If 'exec_sql' doesn't exist, we can't easily run DDL from node 
            // without 'pg' driver.
            // I will notify the user if this fails.
        } else {
            console.log('Success:', data);
        }

    } catch (err) {
        console.error('File Read/Exec Error:', err);
    }
}

runSql();
