import { useState, useEffect } from 'react';
import { useBillingStore } from '../../store/useBillingStore';

export const CancellationRegister = ({ restaurantId, showToast }: { restaurantId: string, showToast: any }) => {
    const { cancellations, fetchCancellations, logCancellation } = useBillingStore();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [form, setForm] = useState({
        item_name: '',
        quantity: 1,
        reason_category: 'Spillage',
        notes: '',
        amount_impact: 0,
        reported_by: ''
    });

    useEffect(() => {
        fetchCancellations(restaurantId);
    }, [restaurantId, fetchCancellations]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            await logCancellation({ ...form, restaurant_id: restaurantId });
            showToast('Incident Logged', 'success');
            setForm({ item_name: '', quantity: 1, reason_category: 'Spillage', notes: '', amount_impact: 0, reported_by: '' });
        } catch (err) {
            showToast('Failed to log incident', 'error');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Form */}
            <div className="bg-slate-900 border border-white/5 rounded-2xl p-6 shadow-xl h-fit">
                <h3 className="font-bold text-lg mb-4 text-red-500">Report Damage / Wastage</h3>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="text-sm text-gray-400">Item Name</label>
                        <input className="w-full bg-slate-800 border-none rounded p-2 text-white" value={form.item_name} onChange={e => setForm({ ...form, item_name: e.target.value })} required />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-sm text-gray-400">Qty</label>
                            <input type="number" step="0.1" className="w-full bg-slate-800 border-none rounded p-2 text-white" value={form.quantity} onChange={e => setForm({ ...form, quantity: Number(e.target.value) })} />
                        </div>
                        <div>
                            <label className="text-sm text-gray-400">Cost Impact (₹)</label>
                            <input type="number" step="0.01" className="w-full bg-slate-800 border-none rounded p-2 text-white" value={form.amount_impact} onChange={e => setForm({ ...form, amount_impact: Number(e.target.value) })} />
                        </div>
                    </div>
                    <div>
                        <label className="text-sm text-gray-400">Reason</label>
                        <select className="w-full bg-slate-800 border-none rounded p-2 text-white" value={form.reason_category} onChange={e => setForm({ ...form, reason_category: e.target.value })}>
                            <option>Spillage</option>
                            <option>Kitchen Delay</option>
                            <option>Wrong Item Server</option>
                            <option>Quality Issue</option>
                            <option>Customer Cancelled</option>
                        </select>
                    </div>
                    <div>
                        <label className="text-sm text-gray-400">Notes / Reported By</label>
                        <input className="w-full bg-slate-800 border-none rounded p-2 text-white" placeholder="e.g. John (Waiter)" value={form.reported_by} onChange={e => setForm({ ...form, reported_by: e.target.value })} />
                    </div>
                    <button disabled={isSubmitting} className="w-full bg-red-500 hover:bg-red-600 text-white font-bold py-3 rounded disabled:opacity-50">
                        {isSubmitting ? 'Logging...' : 'Log Incident'}
                    </button>
                </form>
            </div>

            {/* List */}
            <div className="lg:col-span-2 bg-slate-900 border border-white/5 rounded-2xl p-6 shadow-xl">
                <h3 className="font-bold text-lg mb-4">Incident Register</h3>
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="text-xs text-gray-500 uppercase border-b border-white/5">
                            <tr>
                                <th className="p-3">Date</th>
                                <th className="p-3">Item</th>
                                <th className="p-3">Reason</th>
                                <th className="p-3">Impact</th>
                                <th className="p-3">Reported By</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {cancellations.map(c => (
                                <tr key={c.id} className="hover:bg-white/5">
                                    <td className="p-3 text-gray-400">{new Date(c.created_at).toLocaleDateString()}</td>
                                    <td className="p-3 font-bold">{c.item_name} ({c.quantity})</td>
                                    <td className="p-3">
                                        <span className="bg-red-500/10 text-red-500 px-2 py-1 rounded text-xs border border-red-500/20">{c.reason_category}</span>
                                    </td>
                                    <td className="p-3 text-gray-300">₹{c.amount_impact}</td>
                                    <td className="p-3 text-gray-400 italic">{c.reported_by}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};
