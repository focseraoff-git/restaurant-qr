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

async function cleanupUsers() {
    console.log('Cleaning up demo users...');
    const emails = [
        'admin@restaurant.in',
        'manager@restaurant.in',
        'counter@restaurant.in',
        'kitchen@restaurant.in'
    ];

    for (const email of emails) {
        // Find user by email (Admin API doesn't have getUserByEmail, has listUsers)
        // Actually, deleteUser requires ID.
        // We can list users or just try to delete if we knew the ID. 
        // Better: List all users and filter.

        // Note: listUsers is paginated.
        const { data: { users }, error } = await supabaseAdmin.auth.admin.listUsers();
        if (error) {
            console.error('Error listing users:', error);
            return;
        }

        const user = users.find(u => u.email === email);
        if (user) {
            console.log(`Deleting ${email} (${user.id})...`);
            const { error: delError } = await supabaseAdmin.auth.admin.deleteUser(user.id);
            if (delError) {
                console.error(`Failed to delete ${email}:`, delError.msg);
            } else {
                console.log(`Deleted ${email}.`);
            }
        } else {
            console.log(`User ${email} not found.`);
        }
    }
    console.log('Cleanup complete.');
}

cleanupUsers();
