const supabase = require('./config/supabaseClient');

async function debugCreateUser() {
    console.log('--- DEBUG USER CREATION ---');

    // 1. Check Restaurant Existence
    const { data: rests, error: restError } = await supabase.from('restaurants').select('id, name').limit(1);
    if (restError) {
        console.error('Restaurant Check Error:', restError);
        return;
    }

    if (!rests || rests.length === 0) {
        console.error('CRITICAL: No restaurants found! The trigger implies generic fallback will fail if table is empty.');
    } else {
        console.log('Found Restaurant:', rests[0]);
    }

    const restId = rests && rests.length > 0 ? rests[0].id : null;

    // 2. Try to create a user (Trigger will fire)
    const testEmail = `debug_test_${Date.now()}@example.com`;
    console.log(`Attempting to create user: ${testEmail}`);
    console.log(`Role: 'waiter' (valid enum)`);

    const { data, error } = await supabase.auth.admin.createUser({
        email: testEmail,
        password: 'password123',
        email_confirm: true,
        user_metadata: {
            full_name: 'Debug User',
            restaurant_id: restId, // Providing explicit ID
            role: 'waiter' // Using VALID role
        }
    });

    if (error) {
        console.error('!!! CREATION FAILED !!!');
        console.error('Message:', error.message); // This usually contains the Trigger error text
        console.error('Status:', error.status);
    } else {
        console.log('CREATION SUCCESS:', data.user.id);

        // Cleanup
        console.log('Cleaning up...');
        await supabase.auth.admin.deleteUser(data.user.id);
    }
}

debugCreateUser();
