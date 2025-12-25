const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);
const targetId = 'efdea58f-4ef5-4d79-86bc-8f5e61f4336b';

async function checkRestaurant() {
    console.log(`Checking Restaurant ID: ${targetId}`);

    // Check if restaurant exists
    const { data: rest, error: restError } = await supabase
        .from('restaurants')
        .select('*')
        .eq('id', targetId);

    if (restError) {
        console.error('Restaurant Query Error:', restError);
    } else {
        console.log('Restaurant Found:', rest.length > 0 ? rest[0] : 'None');
    }
}

checkRestaurant();
