import { useStaffStore } from '../../store/useStaffStore';

export const PendingActions = ({ showToast: _showToast }: { showToast: any }) => {
    const { staff, payroll, advances, loading, markPayrollPaid } = useStaffStore();

    if (loading) return <div className="text-center py-20 opacity-50">Analyzing system data...</div>;

    // 1. Logic: Overdue Salaries (Current month is pending)
    const pendingSalaries = payroll.filter(p => p.status === 'pending');

    // 2. Logic: High Debt (Advances > 30% of base salary)
    const highDebtStaff = staff.filter(s => {
        const staffAdvances = advances.filter(a => a.staff_id === s.id);
        const netAdvance = staffAdvances.reduce((sum, a) => sum + (a.is_recovery ? -parseFloat(a.amount) : parseFloat(a.amount)), 0);
        return netAdvance > (s.base_salary * 0.3);
    }).map(s => {
        const staffAdvances = advances.filter(a => a.staff_id === s.id);
        const netAdvance = staffAdvances.reduce((sum, a) => sum + (a.is_recovery ? -parseFloat(a.amount) : parseFloat(a.amount)), 0);
        return { ...s, netAdvance };
    });

    // 3. Logic: Attendance Warnings (More than 3 absences in current month summary)
    const attendanceWarnings = payroll.filter(p => {
        const summary = p.attendance_summary || {};
        return (summary.absent || 0) > 3;
    });

    const hasActions = pendingSalaries.length > 0 || highDebtStaff.length > 0 || attendanceWarnings.length > 0;

    if (!hasActions) {
        return (
            <div className="flex flex-col items-center justify-center py-20 text-gray-500 space-y-4">
                <div className="w-16 h-16 bg-emerald-500/10 rounded-full flex items-center justify-center text-2xl border border-emerald-500/20">
                    ✅
                </div>
                <div className="text-center">
                    <h3 className="text-lg font-bold text-gray-300">System Clear</h3>
                    <p className="text-xs uppercase tracking-widest font-black opacity-50">All staff tasks are up to date</p>
                </div>
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-fade-in">
            {/* Overdue Salaries */}
            {pendingSalaries.length > 0 && (
                <div className="glass-panel p-6 rounded-3xl border border-amber-500/20 space-y-4">
                    <div className="flex justify-between items-center">
                        <h3 className="text-xs font-black uppercase tracking-[0.2em] text-amber-500">Overdue Salaries</h3>
                        <span className="bg-amber-500/10 text-amber-500 text-[10px] font-black px-2 py-0.5 rounded-full">{pendingSalaries.length}</span>
                    </div>
                    <div className="space-y-3">
                        {pendingSalaries.map(p => (
                            <div key={p.id} className="flex justify-between items-center p-3 bg-white/5 rounded-xl border border-white/5 group hover:border-amber-500/30 transition-all">
                                <div>
                                    <p className="font-bold text-sm text-gray-200">{p.staff.name}</p>
                                    <p className="text-[10px] text-gray-500 font-bold">{p.month}</p>
                                </div>
                                <button
                                    onClick={() => markPayrollPaid(p.id)}
                                    className="px-3 py-1.5 bg-amber-600 hover:bg-amber-500 text-white text-[10px] font-black rounded-lg transition-all uppercase tracking-tighter"
                                >
                                    Pay ₹{p.final_amount}
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* High Debt Alerts */}
            {highDebtStaff.length > 0 && (
                <div className="glass-panel p-6 rounded-3xl border border-red-500/20 space-y-4">
                    <div className="flex justify-between items-center">
                        <h3 className="text-xs font-black uppercase tracking-[0.2em] text-red-500">Debt Alerts</h3>
                        <span className="bg-red-500/10 text-red-500 text-[10px] font-black px-2 py-0.5 rounded-full">{highDebtStaff.length}</span>
                    </div>
                    <div className="space-y-3">
                        {highDebtStaff.map(s => (
                            <div key={s.id} className="p-3 bg-white/5 rounded-xl border border-white/5 hover:border-red-500/30 transition-all">
                                <div className="flex justify-between items-start mb-2">
                                    <p className="font-bold text-sm text-gray-200">{s.name}</p>
                                    <span className="text-[10px] font-black text-red-400">-{Math.round((s.netAdvance / s.base_salary) * 100)}% cap</span>
                                </div>
                                <div className="w-full bg-red-500/10 h-1.5 rounded-full overflow-hidden">
                                    <div
                                        className="bg-red-500 h-full transition-all"
                                        style={{ width: `${Math.min(100, (s.netAdvance / s.base_salary) * 100)}%` }}
                                    ></div>
                                </div>
                                <div className="flex justify-between mt-2">
                                    <span className="text-[8px] text-gray-500 uppercase font-black">Debt: ₹{s.netAdvance}</span>
                                    <span className="text-[8px] text-gray-500 uppercase font-black">Base: ₹{s.base_salary}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Attendance Warnings */}
            {attendanceWarnings.length > 0 && (
                <div className="glass-panel p-6 rounded-3xl border border-emerald-500/20 space-y-4">
                    <div className="flex justify-between items-center">
                        <h3 className="text-xs font-black uppercase tracking-[0.2em] text-emerald-500">Attendance Risk</h3>
                        <span className="bg-emerald-500/10 text-emerald-400 text-[10px] font-black px-2 py-0.5 rounded-full">{attendanceWarnings.length}</span>
                    </div>
                    <div className="space-y-3">
                        {attendanceWarnings.map(p => (
                            <div key={p.id} className="p-3 bg-white/5 rounded-xl border border-white/5 hover:border-emerald-500/30 transition-all">
                                <p className="font-bold text-sm text-gray-200">{p.staff.name}</p>
                                <div className="flex gap-2 mt-2">
                                    <span className="text-[9px] font-bold text-red-400 bg-red-500/10 px-2 py-0.5 rounded-md uppercase">{p.attendance_summary.absent} Absences</span>
                                    <span className="text-[9px] font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-md uppercase">{p.attendance_summary.half_day || 0} Half-days</span>
                                </div>
                                <p className="text-[8px] text-gray-600 font-bold mt-2 uppercase">Significant impact on month: {p.month}</p>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};
