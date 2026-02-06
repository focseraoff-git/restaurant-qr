import { useState, useEffect } from 'react';
import { useStaffStore } from '../../store/useStaffStore';
import { getLocalMonth } from '../../utils/date';
import api from '../../utils/api';

export const PayrollDashboard = ({ restaurantId, showToast }: { restaurantId: string, showToast: any }) => {
    // Consume Global Store
    const { payroll, loading, refresh, markPayrollPaid, deletePayroll, restaurant } = useStaffStore();

    // UI State
    const [month, setMonth] = useState(getLocalMonth());
    const [generating, setGenerating] = useState(false);
    const [selectedPayroll, setSelectedPayroll] = useState<any>(null);

    // Refresh store when month changes
    useEffect(() => {
        if (restaurantId) {
            refresh(restaurantId, undefined, month);
        }
    }, [month, restaurantId, refresh]);

    const handleGenerate = async () => {
        setGenerating(true);
        try {
            const staffRes = await api.get(`/staff/${restaurantId}`);
            const activeStaff = staffRes.data.filter((s: any) => s.status === 'active');

            await Promise.all(activeStaff.map((s: any) =>
                api.post('/payroll/generate', { staff_id: s.id, month })
            ));

            showToast(`Payroll generated for ${month}`, 'success');
            // Store will auto-update via realtime
        } catch (err) {
            showToast('Failed to generate payroll', 'error');
        } finally {
            setGenerating(false);
        }
    };

    const handleMarkPaid = async (payrollId: string) => {
        try {
            await markPayrollPaid(payrollId);
            showToast('Payroll marked as paid', 'success');
        } catch (err) {
            showToast('Failed to mark as paid', 'error');
        }
    };
    const handleDelete = async (payrollId: string) => {
        if (!confirm('Are you sure you want to delete this payroll record?')) return;
        try {
            await deletePayroll(payrollId);
            showToast('Payroll record deleted', 'success');
        } catch (err) {
            showToast('Failed to delete payroll', 'error');
        }
    };

    if (loading) return <div className="text-center py-10 opacity-50">Calculating payroll entries...</div>;

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h2 className="text-xl font-bold text-amber-500">Payroll & Salaries</h2>
                    <p className="text-xs text-gray-500 font-bold uppercase tracking-widest">Manage monthly payouts</p>
                </div>
                <div className="flex gap-2 w-full md:w-auto">
                    <input
                        type="month"
                        value={month}
                        onChange={e => setMonth(e.target.value)}
                        className="bg-slate-900 border border-white/10 rounded-xl px-4 py-2 text-sm font-bold outline-none focus:border-amber-500/50"
                    />
                    <button
                        onClick={handleGenerate}
                        disabled={generating}
                        className="flex-1 md:flex-none bg-amber-600 hover:bg-amber-500 text-white px-6 py-2 rounded-xl text-sm font-bold transition-all shadow-lg shadow-amber-500/20"
                    >
                        {generating ? 'Calculating...' : 'Generate New Roll'}
                    </button>
                </div>
            </div>

            {payroll.length === 0 ? (
                <div className="text-center py-20 glass-card rounded-3xl border border-dashed border-white/10">
                    <p className="text-gray-500 mb-4">No payroll records found for this month.</p>
                    <button onClick={handleGenerate} className="text-amber-500 font-bold hover:underline">Click to generate now</button>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {payroll.map(p => (
                        <div key={p.id} className="glass-panel p-6 rounded-3xl border border-white/5 hover:border-amber-500/20 transition-all">
                            <div className="flex justify-between items-start mb-4">
                                <div>
                                    <h3 className="text-lg font-bold">{p.staff.name}</h3>
                                    <p className="text-[10px] text-gray-500 uppercase tracking-widest font-black">{p.staff.role}</p>
                                </div>
                                <span className={`text-[10px] font-bold px-2 py-1 rounded-md uppercase tracking-wider border ${p.status === 'paid' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-red-500/10 text-red-400 border-red-500/20'
                                    }`}>
                                    {p.status}
                                </span>
                            </div>

                            <div className="grid grid-cols-3 gap-2 mb-6">
                                <div className="bg-white/5 p-3 rounded-2xl border border-white/5 text-center">
                                    <p className="text-[8px] text-gray-500 uppercase font-black tracking-widest mb-1">Base</p>
                                    <p className="font-bold text-sm">₹{p.base_salary_snapshot}</p>
                                </div>
                                <div className="bg-white/5 p-3 rounded-2xl border border-white/5 text-center">
                                    <p className="text-[8px] text-gray-500 uppercase font-black tracking-widest mb-1">Deduct</p>
                                    <p className="font-bold text-sm text-red-400">₹{p.deductions}</p>
                                </div>
                                <div className="bg-emerald-500/5 p-3 rounded-2xl border border-emerald-500/10 text-center">
                                    <p className="text-[8px] text-emerald-500/50 uppercase font-black tracking-widest mb-1">Final</p>
                                    <p className="font-bold text-sm text-emerald-400">₹{p.final_amount}</p>
                                </div>
                            </div>

                            <div className="space-y-3 bg-black/20 p-4 rounded-2xl border border-white/5">
                                <div className="flex justify-between text-[10px] text-gray-400 uppercase tracking-widest font-bold">
                                    <span>Attendance Summary</span>
                                    <span className="text-emerald-400">{p.attendance_summary.present}P / {p.attendance_summary.absent}A / {p.attendance_summary.half_day}H</span>
                                </div>
                                <div className="flex gap-1 h-1 w-full bg-white/5 rounded-full overflow-hidden">
                                    <div style={{ width: `${(p.attendance_summary.present / 30) * 100}%` }} className="bg-emerald-500 h-full"></div>
                                    <div style={{ width: `${(p.attendance_summary.half_day / 30) * 100}%` }} className="bg-amber-500 h-full"></div>
                                    <div style={{ width: `${(p.attendance_summary.absent / 30) * 100}%` }} className="bg-red-500 h-full"></div>
                                </div>
                            </div>

                            <div className="flex gap-2 mt-6">
                                <button
                                    onClick={() => setSelectedPayroll(p)}
                                    className="flex-1 py-3 bg-white/5 hover:bg-white/10 rounded-xl text-xs font-bold border border-white/5 transition-all uppercase tracking-widest"
                                >
                                    View Payslip
                                </button>
                                {p.status !== 'paid' && (
                                    <button
                                        onClick={() => handleMarkPaid(p.id)}
                                        className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-emerald-500/10 transition-all uppercase tracking-widest"
                                    >
                                        Mark Paid
                                    </button>
                                )}
                                <button
                                    onClick={() => handleDelete(p.id)}
                                    className="px-3 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-xl border border-red-500/20 transition-all font-bold"
                                    title="Delete Record"
                                >
                                    🗑️
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Payslip Modal */}
            {selectedPayroll && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm print:bg-white print:p-0">
                    <div id="payslip-modal" className="bg-[#0f172a] border border-white/10 w-full max-w-md rounded-3xl p-8 shadow-2xl space-y-6 print:shadow-none print:border-none print:bg-white print:text-black">
                        <div className="flex justify-between items-start print:hidden">
                            <div className="space-y-1">
                                <h3 className="text-2xl font-black italic tracking-tighter text-amber-500">PAY SLIP</h3>
                                <p className="text-xs text-gray-500 font-bold uppercase tracking-widest">{selectedPayroll.month}</p>
                            </div>
                            <button
                                onClick={() => setSelectedPayroll(null)}
                                className="text-gray-500 hover:text-white"
                            >
                                ✕
                            </button>
                        </div>
                        {/* Print Header (Only visible in print) */}
                        <div className="hidden print:block text-center border-b pb-4 mb-4">
                            <h1 className="text-3xl font-black italic tracking-tighter text-amber-600">{restaurant?.name || 'RESTAURANT'}</h1>
                            <h2 className="text-xl font-bold uppercase tracking-[0.3em] mt-2">Salary Pay Slip</h2>
                            <p className="text-sm font-bold text-gray-600">{selectedPayroll.month}</p>
                        </div>

                        <div className="border-y border-white/5 py-6 space-y-4 print:border-black/10">
                            <div className="flex justify-between items-baseline">
                                <span className="text-gray-500 text-[10px] font-black uppercase tracking-widest print:text-gray-600">Employee</span>
                                <span className="text-lg font-bold text-gray-200 print:text-black">{selectedPayroll.staff.name}</span>
                            </div>
                            <div className="flex justify-between items-baseline">
                                <span className="text-gray-500 text-[10px] font-black uppercase tracking-widest print:text-gray-600">Position</span>
                                <span className="text-sm font-bold text-gray-400 print:text-gray-700">{selectedPayroll.staff.role}</span>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-400 print:text-gray-600">Base Salary</span>
                                <span className="font-bold">₹{selectedPayroll.base_salary_snapshot}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-400 print:text-gray-600">Deductions (Absence/Half-days)</span>
                                <span className="font-bold text-red-500">-₹{selectedPayroll.deductions}</span>
                            </div>
                            <div className="pt-4 border-t border-white/10 flex justify-between items-center print:border-black/10">
                                <span className="text-lg font-black italic text-emerald-500 tracking-tighter print:text-emerald-700">NET PAYABLE</span>
                                <span className="text-2xl font-black text-emerald-400 print:text-black">₹{selectedPayroll.final_amount}</span>
                            </div>
                        </div>

                        <div className="flex gap-2 print:hidden">
                            <button
                                onClick={() => window.print()}
                                className="flex-1 py-4 bg-amber-600 hover:bg-amber-500 text-white rounded-2xl text-xs font-black uppercase tracking-[0.2em] transition-all shadow-lg shadow-amber-500/20"
                            >
                                Download PDF
                            </button>
                            <button
                                onClick={() => setSelectedPayroll(null)}
                                className="flex-1 py-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl text-xs font-black uppercase tracking-[0.2em] transition-all"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
