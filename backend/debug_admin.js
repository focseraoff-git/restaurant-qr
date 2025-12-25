const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseServiceKey) {
    console.error('NO_SERVICE_KEY');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);
const restaurantId = '5331ded5-6ab3-43cf-b64e-dbfdb6a215eb';

async function testInsert() {
    console.log('Testing Menu Insert with ADMIN KEY...');

    // 1. Get Category
    const { data: cats, error: catError } = await supabase
        .from('menu_categories')
        .select('id')
        .eq('restaurant_id', restaurantId)
        .limit(1);

    if (catError) { console.error('Cat Error:', catError); return; }

    const catId = cats[0].id;

    // 2. Insert Item
    const payload = {
        category_id: catId,
        name: 'Debug Admin Item',
        description: 'Debug Description',
        price_full: 100,
        is_veg: true
    };

    const { data, error } = await supabase.from('menu_items').insert([payload]).select();

    if (error) {
        console.error('INSERT FAILED:', error);
    } else {
        console.log('INSERT SUCCESS:', data);
        await supabase.from('menu_items').delete().eq('id', data[0].id);
    }
}

testInsert();
