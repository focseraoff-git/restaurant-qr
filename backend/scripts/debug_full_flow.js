const supabase = require('../config/supabaseClient');

async function runFullFlow() {
    console.log('--- STARTING FULL SYSTEM DIAGNOSTIC ---');

    const testName = `TestWorker_${Date.now()}`;
    const restaurantId = '5331ded5-6ab3-43cf-b64e-dbfdb6a215eb'; // Known ID

    // 1. Create Staff
    console.log('\n[1] Creating Test Staff...');
    const { data: staff, error: sError } = await supabase
        .from('staff')
        .insert([{
            restaurant_id: restaurantId,
            name: testName,
            role: 'Tester',
            salary_type: 'monthly',
            base_salary: 30000,
            status: 'active',
            joining_date: '2026-01-01'
        }])
        .select()
        .single();

    if (sError) {
        console.error('❌ Failed to create staff:', sError);
        return;
    }
    console.log('✅ Staff Created:', staff.id, staff.name);

    // 2. Mark Attendance (5 Days)
    console.log('\n[2] Marking Attendance...');
    const month = '2026-02';
    const statuses = ['present', 'present', 'absent', 'half-day', 'present'];

    for (let i = 0; i < statuses.length; i++) {
        const date = `${month}-0${i + 1}`;
        const { error } = await supabase
            .from('staff_attendance')
            .upsert({
                staff_id: staff.id,
                date: date,
                status: statuses[i]
            }, { onConflict: 'staff_id,date' });

        if (error) console.error(`❌ Failed to mark ${date}:`, error);
        else console.log(`✅ Marked ${date}: ${statuses[i]}`);
    }

    // 3. Verify Attendance Read
    console.log('\n[3] Verifying Attendance Read...');
    const [year, monthNum] = month.split('-');
    const startDate = `${month}-01`;
    const lastDay = new Date(parseInt(year), parseInt(monthNum), 0).getDate();
    const endDate = `${month}-${lastDay}`;

    const { data: attendance, error: readError } = await supabase
        .from('staff_attendance')
        .select('*')
        .eq('staff_id', staff.id)
        .gte('date', startDate)
        .lte('date', endDate);

    if (readError) console.error('❌ Failed to read attendance:', readError);
    else console.log(`✅ Found ${attendance.length} attendance records.`);

    // 4. Generate Payroll
    console.log('\n[4] Generating Payroll...');

    // START PAYROLL LOGIC MIRROR (from payroll.routes.js)
    const summary = {
        present: attendance.filter(a => a.status === 'present').length,
        absent: attendance.filter(a => a.status === 'absent').length,
        half_day: attendance.filter(a => a.status === 'half-day').length,
        leave: attendance.filter(a => a.status === 'leave').length,
    };
    console.log('Calculated Summary:', summary);

    let deductions = 0;
    const dailyRate = staff.base_salary / 30;
    deductions = dailyRate * summary.absent + (dailyRate / 2) * summary.half_day;
    const final_amount = Math.max(0, staff.base_salary - deductions);
    // END PAYROLL LOGIC MIRROR

    const payrollData = {
        staff_id: staff.id,
        month: month,
        attendance_summary: summary,
        base_salary_snapshot: staff.base_salary,
        deductions: deductions,
        final_amount: final_amount,
        status: 'pending'
    };

    const { data: payroll, error: pError } = await supabase
        .from('staff_payroll')
        .upsert(payrollData, { onConflict: 'staff_id,month' })
        .select();

    if (pError) console.error('❌ Failed to save payroll:', pError);
    else console.log('✅ Payroll Saved Successfully:', payroll[0].final_amount);

    // 5. Clean up (Optional, maybe keep for manual check)
    // console.log('\n[5] Cleaning up...');
    // await supabase.from('staff').delete().eq('id', staff.id);
}

runFullFlow();
