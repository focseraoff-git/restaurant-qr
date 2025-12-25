
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

const restaurantId = '5331ded5-6ab3-43cf-b64e-dbfdb6a215eb';

async function dumpOrders() {
    console.log('Fetching last 10 orders...');
    const { data, error } = await supabase
        .from('orders')
        .select('id, customer_name, table_id, status, total_amount, created_at')
        .eq('restaurant_id', restaurantId)
        .order('created_at', { ascending: false })
        .limit(10);

    if (error) {
        console.error('Error:', error);
    } else {
        console.table(data);
    }
}

dumpOrders();
