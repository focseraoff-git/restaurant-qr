const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);
const restaurantId = '5331ded5-6ab3-43cf-b64e-dbfdb6a215eb';

async function testInsert() {
    console.log('Testing Menu Insert...');
    // 1. Get Category
    const { data: cats, error: catError } = await supabase
        .from('menu_categories')
        .select('id')
        .eq('restaurant_id', restaurantId)
        .limit(1);

    if (catError) { console.error('Cat Fetch Error:', catError); return; }
    if (!cats || cats.length === 0) { console.error('No categories found'); return; }

    const catId = cats[0].id;
    console.log('Using Category ID:', catId);

    // 2. Insert Item
    const payload = {
        category_id: catId,
        name: 'Debug Item ' + Date.now(),
        description: 'Debug Description',
        price_full: 100,
        is_veg: true
        // image is omitted
    };

    const { data, error } = await supabase.from('menu_items').insert([payload]).select();

    if (error) {
        console.error('INSERT FAILED:', JSON.stringify(error, null, 2));
    } else {
        console.log('INSERT SUCCESS:', data);
        // Clean up
        await supabase.from('menu_items').delete().eq('id', data[0].id);
    }
}

testInsert();
