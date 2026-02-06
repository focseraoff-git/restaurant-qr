const supabase = require('../config/supabaseClient');

async function testPayroll() {
    console.log('Testing Payroll Generation logic...');

    // 1. Get a random staff member
    const { data: staff, error: sError } = await supabase
        .from('staff')
        .select('*')
        .limit(1)
        .single();

    if (sError) {
        console.error('Error fetching staff:', sError);
        return;
    }
    console.log('Test Staff:', staff.name, staff.id);

    const month = new Date().toISOString().slice(0, 7); // Current YYYY-MM
    console.log('Target Month:', month);

    // 2. Logic Check - Correct Date Range
    const [year, monthNum] = month.split('-');
    const startDate = `${month}-01`;
    // Get last day of month
    const lastDay = new Date(parseInt(year), parseInt(monthNum), 0).getDate();
    const endDate = `${month}-${lastDay}`;

    console.log(`Testing range filter: ${startDate} to ${endDate}`);

    const { data: att2, error: attError2 } = await supabase
        .from('staff_attendance')
        .select('status, date')
        .eq('staff_id', staff.id)
        .gte('date', startDate)
        .lte('date', endDate);

    if (attError2) {
        console.error('Query FAILED:', attError2);
    } else {
        console.log(`Query Success. Found ${att2.length} records.`);
    }
}

testPayroll();
