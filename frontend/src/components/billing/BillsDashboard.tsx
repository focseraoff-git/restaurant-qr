import { useEffect, useState } from 'react';
import { useBillingStore } from '../../store/useBillingStore';

export const BillsDashboard = ({ restaurantId }: { restaurantId: string }) => {
    const { stats, fetchStats, loading } = useBillingStore();
    const [period, setPeriod] = useState('daily');

    useEffect(() => {
        if (restaurantId) {
            fetchStats(restaurantId, period);
        }
    }, [restaurantId, period, fetchStats]);

    if (loading && !stats) return <div className="p-20 text-center text-indigo-400 font-bold animate-pulse text-xl">Loading Analytics...</div>;

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center bg-slate-900/50 p-4 rounded-2xl border border-white/5 backdrop-blur-sm">
                <h2 className="text-xl font-bold flex items-center gap-2 text-white">
                    📊 Sales Overview
                </h2>
                <div className="flex bg-slate-950/50 rounded-xl p-1 border border-white/5">
                    {['daily', 'monthly', 'yearly'].map(p => (
                        <button
                            key={p}
                            onClick={() => setPeriod(p)}
                            className={`px-6 py-2 rounded-lg font-bold text-xs uppercase tracking-wider transition-all ${period === p
                                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20'
                                : 'text-gray-500 hover:text-gray-300 hover:bg-white/5'
                                }`}
                        >
                            {p}
                        </button>
                    ))}
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="glass-panel p-6 rounded-2xl relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity text-4xl">💰</div>
                    <h3 className="text-gray-400 text-[10px] font-black uppercase tracking-widest">Total Revenue</h3>
                    <p className="text-5xl font-display font-black text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-400 mt-2">
                        ₹{stats?.totalRevenue?.toLocaleString() ?? '0'}
                    </p>
                    <p className="text-[10px] font-bold text-gray-500 mt-2 uppercase tracking-wider">{period} revenue</p>
                    <div className="absolute bottom-0 left-0 h-1 bg-gradient-to-r from-emerald-500 to-teal-500 w-full opacity-50"></div>
                </div>

                <div className="glass-panel p-6 rounded-2xl relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity text-4xl">🧾</div>
                    <h3 className="text-gray-400 text-[10px] font-black uppercase tracking-widest">Total Orders</h3>
                    <p className="text-5xl font-display font-black text-white mt-2">
                        {stats?.totalOrders ?? 0}
                    </p>
                    <p className="text-[10px] font-bold text-gray-500 mt-2 uppercase tracking-wider">bills generated</p>
                    <div className="absolute bottom-0 left-0 h-1 bg-gradient-to-r from-blue-500 to-indigo-500 w-full opacity-50"></div>
                </div>

                <div className="glass-panel p-6 rounded-2xl relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity text-4xl">🚫</div>
                    <h3 className="text-gray-400 text-[10px] font-black uppercase tracking-widest">Cancelled Bills</h3>
                    <p className="text-5xl font-display font-black text-red-500 mt-2">
                        {stats?.cancelledCount ?? 0}
                    </p>
                    <p className="text-[10px] font-bold text-gray-500 mt-2 uppercase tracking-wider">voided orders</p>
                    <div className="absolute bottom-0 left-0 h-1 bg-gradient-to-r from-red-500 to-rose-500 w-full opacity-50"></div>
                </div>
            </div>

            {/* Recent Bills Table */}
            <div className="glass-panel p-6 rounded-2xl">
                <h3 className="font-bold text-lg mb-6 text-white border-b border-white/5 pb-4">Recent Transactions</h3>
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm border-collapse">
                        <thead className="text-[10px] text-gray-500 font-black uppercase tracking-widest bg-white/5">
                            <tr>
                                <th className="p-4 rounded-l-lg">Order ID</th>
                                <th className="p-4">Time</th>
                                <th className="p-4">Type</th>
                                <th className="p-4">Amount</th>
                                <th className="p-4 rounded-r-lg">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {stats?.orders?.slice(0, 10).map((order: any) => (
                                <tr key={order.id} className="hover:bg-white/5 group transition-colors">
                                    <td className="p-4 font-mono text-xs text-indigo-300 group-hover:text-indigo-200">#{order.id.slice(0, 8)}</td>
                                    <td className="p-4 text-gray-400">{new Date(order.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</td>
                                    <td className="p-4">
                                        <span className="px-2 py-1 rounded-md bg-white/5 text-[10px] font-bold text-gray-300 border border-white/10">
                                            {order.order_type}
                                        </span>
                                    </td>
                                    <td className="p-4 font-black text-white">₹{order.total_amount}</td>
                                    <td className="p-4">
                                        <span className={`px-2 py-1 rounded text-[10px] font-black uppercase tracking-wider ${order.status === 'completed' ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' :
                                            order.status === 'cancelled' ? 'bg-red-500/10 text-red-500 border border-red-500/20' :
                                                'bg-amber-500/10 text-amber-500 border border-amber-500/20'
                                            }`}>
                                            {order.status}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};
