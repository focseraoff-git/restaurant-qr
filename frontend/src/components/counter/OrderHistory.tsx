import { useState, useEffect } from 'react';
import { supabase } from '../../utils/supabaseClient';

interface Order {
    id: string;
    order_type: string;
    table?: { table_number: string };
    customer_name?: string;
    total_amount: number;
    status: string;
    created_at: string;
}

export const OrderHistory = ({ restaurantId, showToast }: { restaurantId: string, showToast: (msg: string, type?: any) => void }) => {
    const [orders, setOrders] = useState<Order[]>([]);
    const [dateFilter, setDateFilter] = useState(new Date().toISOString().split('T')[0]);

    useEffect(() => {
        const fetchHistory = async () => {
            // Fetch orders created on the selected date
            // Using Supabase Date filtering
            const { data } = await supabase
                .from('orders')
                .select(`
                    *,
                    table:tables(table_number)
                `)
                .eq('restaurant_id', restaurantId)
                // Filter by date (approximate)
                .gte('created_at', `${dateFilter}T00:00:00`)
                .lte('created_at', `${dateFilter}T23:59:59`)
                .order('created_at', { ascending: false });

            if (data) setOrders(data);
        };
        fetchHistory();
    }, [restaurantId, dateFilter]);

    const printBill = (order: Order) => {
        const printWindow = window.open('', '_blank');
        if (!printWindow) {
            showToast('Please allow popups to print bills', 'error');
            return;
        }

        const billHTML = `
            <!DOCTYPE html>
            <html>
            <head>
                <title>Bill #${order.id.slice(0, 6)}</title>
                <style>
                    body { font-family: monospace; padding: 20px; max-width: 300px; margin: 0 auto; }
                    h1 { text-align: center; font-size: 18px; margin-bottom: 10px; }
                    .divider { border-top: 1px dashed #000; margin: 10px 0; }
                    .row { display: flex; justify-content: space-between; margin: 5px 0; }
                    .total { font-weight: bold; font-size: 16px; margin-top: 10px; }
                    .center { text-align: center; }
                    @media print { body { padding: 0; } }
                </style>
            </head>
            <body>
                <h1>RESTAURANT BILL</h1>
                <div class="center">Order #${order.id.slice(0, 6)}</div>
                <div class="center">${new Date(order.created_at).toLocaleString()}</div>
                <div class="divider"></div>
                <div class="row">
                    <span>Type:</span>
                    <span>${order.order_type === 'dine-in' ? `Table ${order.table?.table_number || '?'}` : 'Takeaway'}</span>
                </div>
                ${order.customer_name ? `<div class="row"><span>Customer:</span><span>${order.customer_name}</span></div>` : ''}
                <div class="divider"></div>
                <div class="row total">
                    <span>TOTAL:</span>
                    <span>₹${order.total_amount}</span>
                </div>
                <div class="divider"></div>
                <div class="center">Thank you for your visit!</div>
                <script>
                    window.onload = function() {
                        window.print();
                        setTimeout(function() { window.close(); }, 100);
                    }
                </script>
            </body>
            </html>
        `;

        printWindow.document.write(billHTML);
        printWindow.document.close();
    };

    return (
        <div className="h-full bg-transparent p-4 md:p-8 overflow-y-auto custom-scrollbar relative z-10">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                <div className="flex flex-col">
                    <h2 className="text-3xl font-display font-bold text-white mb-2 tracking-tight">Order History</h2>
                    <p className="text-gray-400 font-medium">Archive of all past transactions</p>
                </div>
                <div className="relative group">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-emerald-400 transition-colors">📅</span>
                    <input
                        type="date"
                        className="input-field bg-slate-900/80 border-slate-700 focus:border-emerald-500/50 pl-11 py-3 text-white appearance-none font-bold tracking-wider rounded-xl shadow-lg"
                        value={dateFilter}
                        onChange={(e) => setDateFilter(e.target.value)}
                    />
                </div>
            </div>

            <div className="glass-panel rounded-3xl overflow-hidden border-white/5 bg-slate-900/60 shadow-2xl">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead className="bg-black/20 text-gray-400 border-b border-white/5 uppercase text-xs tracking-widest font-bold backdrop-blur-md">
                            <tr>
                                <th className="p-6">Time</th>
                                <th className="p-6">Order ID</th>
                                <th className="p-6">Type</th>
                                <th className="p-6">Details</th>
                                <th className="p-6">Amount</th>
                                <th className="p-6">Status</th>
                                <th className="p-6 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {orders.map(order => (
                                <tr key={order.id} className="hover:bg-white/5 transition-colors group">
                                    <td className="p-6 text-gray-300 font-mono text-sm">
                                        {new Date(order.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </td>
                                    <td className="p-6 font-mono text-sm text-gray-500 group-hover:text-emerald-400 transition-colors">
                                        #{order.id.slice(0, 6)}
                                    </td>
                                    <td className="p-6 text-white font-bold capitalize">
                                        {order.order_type === 'dine-in' ? (
                                            <span className="flex items-center gap-2 bg-emerald-500/10 text-emerald-300 px-3 py-1 rounded-lg w-fit border border-emerald-500/20 text-xs"><span>🍽️</span> Dine-In</span>
                                        ) : (
                                            <span className="flex items-center gap-2 bg-blue-500/10 text-blue-300 px-3 py-1 rounded-lg w-fit border border-blue-500/20 text-xs"><span>🛍️</span> Takeaway</span>
                                        )}
                                    </td>
                                    <td className="p-6 text-gray-300">
                                        {order.order_type === 'dine-in'
                                            ? <span className="font-bold text-white">Table {order.table?.table_number || '?'}</span>
                                            : <span className="font-bold text-white">{order.customer_name || 'Walk-in'}</span>}
                                    </td>
                                    <td className="p-6 text-emerald-400 font-display font-bold text-lg tracking-wide">₹{order.total_amount}</td>
                                    <td className="p-6">
                                        <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border flex items-center gap-1 w-fit
                                             ${order.status === 'completed' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                                                order.status === 'cancelled' ? 'bg-red-500/10 text-red-400 border-red-500/20' :
                                                    order.status === 'preparing' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' :
                                                        order.status === 'ready' ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20' :
                                                            'bg-gray-700/50 text-gray-300 border-gray-600/30'}`}>
                                            <span className={`w-1.5 h-1.5 rounded-full ${order.status === 'completed' ? 'bg-emerald-400' :
                                                order.status === 'cancelled' ? 'bg-red-400' :
                                                    order.status === 'preparing' ? 'bg-blue-400 animate-pulse' :
                                                        order.status === 'ready' ? 'bg-indigo-400' : 'bg-gray-400'
                                                }`}></span>
                                            {order.status}
                                        </span>
                                    </td>
                                    <td className="p-6 text-right">
                                        <button
                                            className="text-gray-400 hover:text-white hover:bg-white/10 p-2 rounded-lg transition-all"
                                            onClick={() => printBill(order)}
                                            title="Print Bill"
                                        >
                                            🖨️
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                {orders.length === 0 && (
                    <div className="p-32 text-center text-gray-500 flex flex-col items-center opacity-40">
                        <span className="text-6xl mb-6 grayscale">📅</span>
                        <p className="text-xl font-medium">No orders found for this date.</p>
                        <p className="text-sm">Try selecting a different date.</p>
                    </div>
                )}
            </div>
        </div>
    );
};
