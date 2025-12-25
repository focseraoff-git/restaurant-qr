const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);
// The ID from the user error
const targetId = 'efdea58f-4ef5-4d79-86bc-8f5e61f4336b';

async function checkItem() {
    console.log(`Checking Menu Item ID: ${targetId}`);

    const { data, error } = await supabase
        .from('menu_items')
        .select('*')
        .eq('id', targetId);

    if (error) {
        console.error('Query Error:', error);
    } else {
        console.log('Item Found:', data);
        if (data.length === 0) {
            console.log('Result: The ID does NOT exist in menu_items table.');
        } else {
            console.log('Result: The ID EXISTS.');
        }
    }
}

checkItem();
