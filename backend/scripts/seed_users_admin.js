const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseAdmin = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    {
        auth: {
            autoRefreshToken: false,
            persistSession: false
        }
    }
);

async function seedUsers() {
    console.log('Seeding users via Admin API...');

    // 1. Get or Create Restaurant
    let restaurantId;
    const { data: existingRest } = await supabaseAdmin
        .from('restaurants')
        .select('id')
        .eq('name', 'Focsera Demo')
        .single();

    if (existingRest) {
        restaurantId = existingRest.id;
        console.log('Using existing restaurant:', restaurantId);
    } else {
        const { data: newRest, error: restError } = await supabaseAdmin
            .from('restaurants')
            .insert({ name: 'Focsera Demo', logo_url: 'https://via.placeholder.com/150' })
            .select()
            .single();

        if (restError) throw restError;
        restaurantId = newRest.id;
        console.log('Created new restaurant:', restaurantId);
    }

    const users = [
        { email: 'admin@restaurant.in', password: 'password123', role: 'admin', name: 'Demo Owner' },
        { email: 'manager@restaurant.in', password: 'password123', role: 'manager', name: 'Demo Manager' },
        { email: 'counter@restaurant.in', password: 'password123', role: 'staff_counter', name: 'Counter Staff' },
        { email: 'kitchen@restaurant.in', password: 'password123', role: 'staff_kitchen', name: 'Chef Gordon' }
    ];

    for (const u of users) {
        console.log(`Creating user: ${u.email}...`);

        // 2. Create User via Admin API
        // This handles password hashing correctly.
        const { data: user, error: authError } = await supabaseAdmin.auth.admin.createUser({
            email: u.email,
            password: u.password,
            email_confirm: true,
            user_metadata: {
                full_name: u.name,
                role: u.role,
                restaurant_id: restaurantId
            }
        });

        if (authError) {
            console.error(`Error creating ${u.email}:`, authError.message);
            // If user exists, we might want to update their password?
            // Optional: await supabaseAdmin.auth.admin.updateUserById(...)
        } else {
            console.log(`Success: ${u.email} created.`);
        }
    }
    console.log('Seeding complete.');
}

seedUsers().catch(console.error);
