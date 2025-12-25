
const supabase = require('../config/supabaseClient');

async function seed() {
    console.log('Seeding database...');

    try {
        // 1. Create Restaurant
        const { data: restaurant, error: restError } = await supabase
            .from('restaurants')
            .insert({
                name: 'Tasty Bites',
                logo_url: 'https://via.placeholder.com/150',
                whatsapp_link: '1234567890',
                instagram_link: 'tasty_bites'
            })
            .select()
            .single();

        if (restError) throw restError;
        console.log('Restaurant created:', restaurant.id);

        // 2. Create Categories
        const categories = [
            { name: 'Starters', type: 'veg', sort_order: 1 },
            { name: 'Main Course', type: 'veg', sort_order: 2 },
            { name: 'Drinks', type: 'drinks', sort_order: 3 }
        ];

        const { data: cats, error: catError } = await supabase
            .from('menu_categories')
            .insert(categories.map(c => ({ ...c, restaurant_id: restaurant.id })))
            .select();

        if (catError) throw catError;
        console.log('Categories created:', cats.length);

        // 3. Create Items
        const items = [
            { name: 'Paneer Tikka', price_full: 250, category_name: 'Starters', is_veg: true },
            { name: 'Chicken Wings', price_full: 300, category_name: 'Starters', is_veg: false },
            { name: 'Butter Naan', price_full: 40, category_name: 'Main Course', is_veg: true },
            { name: 'Dal Makhani', price_full: 180, category_name: 'Main Course', is_veg: true },
            { name: 'Cola', price_full: 50, category_name: 'Drinks', is_veg: true }
        ];

        const itemsToInsert = items.map(item => {
            const cat = cats.find(c => c.name === item.category_name);
            return {
                restaurant_id: -1, // Not needed in schema? Wait, schema doesn't have restaurant_id in menu_items? 
                // Schema check: menu_items has category_id. category has restaurant_id.
                // Ah, let's check schema again. 
                // Schema: menu_items (category_id references menu_categories(id)).
                category_id: cat ? cat.id : null,
                name: item.name,
                price_full: item.price_full,
                is_veg: item.is_veg,
                description: 'Delicious ' + item.name
            };
        }).filter(i => i.category_id);

        const { error: itemError } = await supabase
            .from('menu_items')
            .insert(itemsToInsert);

        if (itemError) throw itemError;
        console.log('Items created:', itemsToInsert.length);

        // 4. Create Tables
        const { error: tableError } = await supabase
            .from('tables')
            .insert([
                { restaurant_id: restaurant.id, table_number: 'T1' },
                { restaurant_id: restaurant.id, table_number: 'T2' }
            ]);

        if (tableError) throw tableError;
        console.log('Tables created');

    } catch (err) {
        console.error('Error seeding:', err);
    }
}

seed();
