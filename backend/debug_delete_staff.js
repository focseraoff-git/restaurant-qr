const supabase = require('./config/supabaseClient');

async function debugDelete() {
    console.log('--- DEBUG STAFF DELETE ---');
    console.log('Service Role Key Present:', !!process.env.SUPABASE_SERVICE_ROLE_KEY);

    // 1. List Staff to find a candidate
    const { data: staffList, error: listError } = await supabase
        .from('staff')
        .select('*')
        .limit(3);

    if (listError) {
        console.error('List Error:', listError);
        return;
    }

    if (staffList.length === 0) {
        console.log('No staff found to test.');
        return;
    }

    const target = staffList[0];
    console.log('Target Staff:', target.name, target.id, target.status);

    // 2. Try Soft Delete (Update)
    console.log('Attempting Soft Delete (UPDATE)...');

    const { data, error } = await supabase
        .from('staff')
        .update({
            status: 'exited',
            // name: `${target.name} (Deleted)` // Commenting out name change to avoid uniqueness issues for now
        })
        .eq('id', target.id)
        .select();

    if (error) {
        console.error('!!! UPDATE FAILED !!!');
        console.error('Code:', error.code);
        console.error('Message:', error.message);
        console.error('Details:', error.details);
        console.error('Hint:', error.hint);
    } else {
        console.log('UPDATE SUCCESS:', data);

        // Check if status changed
        console.log('New Status:', data[0].status);

        // Revert for safety if it was a real user
        console.log('Reverting...');
        await supabase.from('staff').update({ status: target.status }).eq('id', target.id);
    }
}

debugDelete();
