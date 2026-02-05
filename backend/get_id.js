const { createClient } = require('@supabase/supabase-js');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../frontend/.env') });

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

async function getId() {
    const { data, error } = await supabase
        .from('restaurants')
        .select('id, name')
        .limit(1);

    if (data && data.length > 0) {
        console.log('Restaurant ID:', data[0].id);
        console.log('Restaurant Name:', data[0].name);
    } else {
        console.log('No restaurant found');
        if (error) console.error(error);
    }
}

getId();
