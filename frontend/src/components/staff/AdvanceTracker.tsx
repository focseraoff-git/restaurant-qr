import { useState } from 'react';
import { useStaffStore } from '../../store/useStaffStore';
import { Modal } from '../Modal';

export const AdvanceTracker = ({ showToast }: { showToast: any }) => {
    // Consume Global Store
    const { advances, staff, loading, addAdvance } = useStaffStore();

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [formData, setFormData] = useState({
        staff_id: '',
        amount: 0,
        date: new Date().toISOString().split('T')[0],
        payment_method: 'Cash',
        notes: '',
        is_recovery: false
    });

    const activeStaff = staff.filter((s: any) => s.status === 'active');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await addAdvance(formData);
            showToast(formData.is_recovery ? 'Recovery recorded' : 'Advance issued', 'success');
            setIsModalOpen(false);
        } catch (err) {
            showToast('Failed to record transaction', 'error');
        }
    };

    if (loading) return <div className="text-center py-10 opacity-50">Loading transaction history...</div>;

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-xl font-bold text-red-400">Advance & Recoveries</h2>
                    <p className="text-xs text-gray-500 font-bold uppercase tracking-widest">Track loans and repayments</p>
                </div>
                <button
                    onClick={() => setIsModalOpen(true)}
                    className="bg-red-600 hover:bg-red-500 text-white px-6 py-2 rounded-xl text-sm font-bold transition-all shadow-lg shadow-red-500/10"
                >
                    + New Entry
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Timeline */}
                <div className="lg:col-span-2 space-y-4">
                    <h3 className="text-xs font-black uppercase tracking-[0.2em] text-gray-500 mb-4">Transaction History</h3>
                    <div className="space-y-3">
                        {advances.map(a => (
                            <div key={a.id} className="glass-panel p-4 rounded-2xl border border-white/5 flex justify-between items-center group hover:border-white/10 transition-all">
                                <div className="flex items-center gap-4">
                                    <div className={`w - 10 h - 10 rounded - xl flex items - center justify - center text - lg border ${a.is_recovery ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-red-500/10 text-red-400 border-red-500/20'
                                        } `}>
                                        {a.is_recovery ? '↓' : '↑'}
                                    </div>
                                    <div>
                                        <p className="font-bold text-gray-200">{a.staff.name}</p>
                                        <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">{a.date} • {a.payment_method}</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className={`font - black text - lg ${a.is_recovery ? 'text-emerald-400' : 'text-red-400'} `}>
                                        {a.is_recovery ? '+' : '-'} ₹{a.amount}
                                    </p>
                                    <p className="text-[8px] text-gray-600 uppercase font-black">{a.notes || 'No notes'}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Summary / Stats? */}
                <div className="space-y-4">
                    <h3 className="text-xs font-black uppercase tracking-[0.2em] text-gray-500 mb-4">Outstanding Balances</h3>
                    <div className="glass-card p-6 rounded-3xl border border-white/5 space-y-4">
                        <div className="text-center py-6 border-b border-white/5">
                            <p className="text-[10px] text-gray-500 uppercase font-black tracking-[0.3em] mb-2">NETWORK DEBT</p>
                            <h2 className="text-4xl font-black text-white">₹{advances.reduce((sum, a) => sum + (a.is_recovery ? -parseFloat(a.amount.toString()) : parseFloat(a.amount.toString())), 0)}</h2>
                        </div>
                        <div className="pt-4 space-y-3">
                            <p className="text-[10px] text-gray-500 uppercase font-bold tracking-widest text-center">Top Borrowers</p>
                            {/* Placeholder for staff balances */}
                            <p className="text-center text-xs text-gray-600 italic">Select staff in directory to see detailed balance.</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Modal */}
            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Record Transaction">
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-1 block">Staff Member</label>
                        <select
                            required
                            value={formData.staff_id}
                            onChange={e => setFormData({ ...formData, staff_id: e.target.value })}
                            className="w-full bg-slate-900 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-red-500/50 transition-all font-bold"
                        >
                            <option value="">Select Staff</option>
                            {activeStaff.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                        </select>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-1 block">Type</label>
                            <select
                                value={formData.is_recovery ? 'recovery' : 'advance'}
                                onChange={e => setFormData({ ...formData, is_recovery: e.target.value === 'recovery' })}
                                className="w-full bg-slate-900 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-red-500/50 transition-all font-bold"
                            >
                                <option value="advance">Issue Advance (Loan)</option>
                                <option value="recovery">Record Recovery (Repayment)</option>
                            </select>
                        </div>
                        <div>
                            <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-1 block">Amount</label>
                            <input
                                type="number"
                                required
                                value={formData.amount}
                                onChange={e => setFormData({ ...formData, amount: parseFloat(e.target.value) })}
                                className="w-full bg-slate-900 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-red-500/50 transition-all font-bold"
                            />
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-1 block">Date</label>
                            <input
                                type="date"
                                required
                                value={formData.date}
                                onChange={e => setFormData({ ...formData, date: e.target.value })}
                                className="w-full bg-slate-900 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-red-500/50 transition-all font-bold"
                            />
                        </div>
                        <div>
                            <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-1 block">Method</label>
                            <select
                                value={formData.payment_method}
                                onChange={e => setFormData({ ...formData, payment_method: e.target.value })}
                                className="w-full bg-slate-900 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-red-500/50 transition-all font-bold"
                            >
                                <option value="Cash">Cash</option>
                                <option value="UPI">UPI</option>
                                <option value="Bank">Bank Transfer</option>
                            </select>
                        </div>
                    </div>
                    <div>
                        <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-1 block">Notes</label>
                        <input
                            value={formData.notes}
                            onChange={e => setFormData({ ...formData, notes: e.target.value })}
                            className="w-full bg-slate-900 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-red-500/50 transition-all font-bold"
                            placeholder="Reason for advance/recovery"
                        />
                    </div>
                    <button type="submit" className="w-full bg-red-600 hover:bg-red-500 text-white font-bold py-4 rounded-xl mt-4 shadow-lg shadow-red-500/20 transition-all active:scale-95">
                        Record Transaction
                    </button>
                </form>
            </Modal>
        </div>
    );
};
