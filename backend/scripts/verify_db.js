
const supabase = require('../config/supabaseClient');

async function verifyConnection() {
    console.log('Verifying Supabase connection...');

    try {
        const { data, error, count } = await supabase
            .from('restaurants')
            .select('*', { count: 'exact', head: true });

        if (error) {
            console.error('❌ Connection Failed or Query Error:', error.message);
            console.error('Details:', error);
            if (error.code === '42P01') { // PostgreSQL undefined_table
                console.log('\n💡 Hint: It seems the tables have not been created yet.');
                console.log('Please copy the contents of "database/schema.sql" and run it in the Supabase SQL Editor.');
            }
        } else {
            console.log('✅ Connection Successful!');
            console.log(`Found ${count !== null ? count : 'unknown'} restaurants.`);
        }
    } catch (err) {
        console.error('❌ Unexpected Error:', err.message);
    }
}

verifyConnection();
