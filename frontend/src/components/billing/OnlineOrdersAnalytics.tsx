import { useEffect, useState } from 'react';
import { useBillingStore } from '../../store/useBillingStore';
import { Modal } from '../Modal';

export const OnlineOrdersAnalytics = ({ restaurantId }: { restaurantId: string }) => {
    const { onlineStats, fetchOnlineStats, addOnlineOrder } = useBillingStore();
    const [period, setPeriod] = useState('daily');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [successMsg, setSuccessMsg] = useState('');

    const [form, setForm] = useState({
        platform: 'Swiggy',
        externalOrderId: '',
        amount: '',
        status: 'completed'
    });

    useEffect(() => {
        if (restaurantId) {
            fetchOnlineStats(restaurantId, period);
        }
    }, [restaurantId, period, fetchOnlineStats]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            await addOnlineOrder({
                restaurantId,
                platform: form.platform,
                externalOrderId: form.externalOrderId,
                amount: Number(form.amount),
                status: form.status
            });
            setSuccessMsg('Order Logged Successfully! ✅');
            setTimeout(() => {
                setSuccessMsg('');
                setIsModalOpen(false);
                fetchOnlineStats(restaurantId, period); // Refresh stats
            }, 1000);
            setForm({ platform: 'Swiggy', externalOrderId: '', amount: '', status: 'completed' });
        } catch (err) {
            console.error(err);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold">Online Platform Performance</h2>
                <div className="flex gap-4">
                    <button
                        onClick={() => setIsModalOpen(true)}
                        className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg font-bold shadow-lg shadow-blue-500/20"
                    >
                        + Add Online Order
                    </button>
                    <div className="flex gap-2">
                        {['daily', 'monthly'].map(p => (
                            <button key={p} onClick={() => setPeriod(p)} className={`px-3 py-1 rounded text-sm font-bold ${period === p ? 'bg-blue-500 text-white' : 'bg-white/5 text-gray-400'}`}>{p}</button>
                        ))}
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-slate-900 border border-white/5 rounded-xl p-5 shadow-lg">
                    <h3 className="text-gray-400 text-xs font-bold uppercase">Total Online Revenue</h3>
                    <p className="text-3xl font-black text-blue-400 mt-2">₹{onlineStats?.totalOnlineRevenue?.toLocaleString() ?? 0}</p>
                </div>
                <div className="bg-slate-900 border border-white/5 rounded-xl p-5 shadow-lg">
                    <h3 className="text-gray-400 text-xs font-bold uppercase">Total Orders</h3>
                    <p className="text-3xl font-black text-white mt-2">{onlineStats?.totalOnlineOrders ?? 0}</p>
                </div>
            </div>

            <div className="bg-slate-900 border border-white/5 rounded-2xl p-6 shadow-xl">
                <h3 className="font-bold text-lg mb-4">Platform Breakdown</h3>
                <div className="space-y-4">
                    {onlineStats?.breakdown && Object.entries(onlineStats.breakdown).map(([platform, data]: [string, any]) => (
                        <div key={platform} className="flex items-center justify-between p-4 bg-white/5 rounded-xl">
                            <div className="flex items-center gap-3">
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-white ${platform === 'Swiggy' ? 'bg-orange-500' :
                                    platform === 'Zomato' ? 'bg-red-600' :
                                        'bg-indigo-500' // Website
                                    }`}>
                                    {platform[0]}
                                </div>
                                <div>
                                    <div className="font-bold">{platform}</div>
                                    <div className="text-xs text-gray-400">{data.count} orders</div>
                                </div>
                            </div>
                            <div className="text-right">
                                <div className="font-bold text-lg">₹{data.revenue.toLocaleString()}</div>
                                <div className="text-xs text-gray-400">Avg: ₹{(data.revenue / data.count).toFixed(0)}</div>
                            </div>
                        </div>
                    ))}
                    {!onlineStats?.breakdown && <div className="text-gray-500 italic">No online orders found for this period.</div>}
                </div>
            </div>

            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Log Manual Online Order">
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="text-sm text-gray-400">Platform</label>
                        <select className="w-full bg-slate-800 border-none rounded p-3 text-white" value={form.platform} onChange={e => setForm({ ...form, platform: e.target.value })}>
                            <option value="Swiggy">Swiggy</option>
                            <option value="Zomato">Zomato</option>
                            <option value="Uber Eats">Uber Eats</option>
                            <option value="Website">Website (Direct)</option>
                        </select>
                    </div>
                    <div>
                        <label className="text-sm text-gray-400">External Order ID</label>
                        <input className="w-full bg-slate-800 border-none rounded p-3 text-white"
                            placeholder="#OID-12345"
                            value={form.externalOrderId} onChange={e => setForm({ ...form, externalOrderId: e.target.value })} required
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-sm text-gray-400">Total Amount</label>
                            <input type="number" className="w-full bg-slate-800 border-none rounded p-3 text-white font-bold"
                                placeholder="₹₹₹"
                                value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })} required
                            />
                        </div>
                        <div>
                            <label className="text-sm text-gray-400">Status</label>
                            <select className="w-full bg-slate-800 border-none rounded p-3 text-white" value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}>
                                <option value="completed">Completed (Paid)</option>
                                <option value="pending">Pending</option>
                            </select>
                        </div>
                    </div>

                    <button disabled={isSubmitting} className="w-full bg-blue-500 py-4 rounded-xl font-bold hover:bg-blue-600 disabled:opacity-50">
                        {isSubmitting ? 'Logging...' : 'Log Order 📝'}
                    </button>
                    {successMsg && <p className="text-center text-green-400 font-bold">{successMsg}</p>}
                </form>
            </Modal>
        </div>
    );
};
