import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../utils/supabaseClient';

interface Order {
    id: string;
    order_type: string;
    table_id?: string; // join tables for number
    customer_name?: string;
    total_amount: number;
    status: string;
    created_at: string;
    table?: { table_number: string }; // joined
    order_items: {
        quantity: number;
        menu_items: { name: string }
    }[];
}

export const LiveOrdersBoard = ({ restaurantId, showToast, setConfirmAction }: { restaurantId: string, showToast: (msg: string, type?: any) => void, setConfirmAction: (action: any) => void }) => {
    const [orders, setOrders] = useState<Order[]>([]);

    const fetchOrders = useCallback(async () => {
        const { data } = await supabase
            .from('orders')
            .select(`
                *,
                table:tables(table_number),
                order_items(
                    quantity,
                    menu_items(name)
                )
            `)
            .eq('restaurant_id', restaurantId)
            .in('status', ['pending', 'preparing', 'ready'])
            .order('created_at', { ascending: false });

        if (data) {
            setOrders(data);
        }
    }, [restaurantId]);

    useEffect(() => {
        fetchOrders();

        // Realtime Subscription
        const channel = supabase
            .channel('public:orders')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'orders', filter: `restaurant_id=eq.${restaurantId}` }, () => {
                fetchOrders(); // Refresh fully on any change for simplicity
            })
            .subscribe();

        return () => { supabase.removeChannel(channel); };
    }, [restaurantId, fetchOrders]);

    const updateStatus = async (orderId: string, newStatus: string) => {
        try {
            await supabase
                .from('orders')
                .update({ status: newStatus })
                .eq('id', orderId);
            showToast(`Order marked as ${newStatus}`, 'success');
        } catch (error) {
            showToast('Failed to update status', 'error');
        }
    };

    const StatusBadge = ({ status }: { status: string }) => {
        const colors: Record<string, string> = {
            pending: 'bg-yellow-500/20 text-yellow-500 border-yellow-500/50',
            preparing: 'bg-blue-500/20 text-blue-500 border-blue-500/50',
            ready: 'bg-green-500/20 text-green-500 border-green-500/50',
            completed: 'bg-gray-500/20 text-gray-500 border-gray-500/50',
        };
        return (
            <span className={`px-2 py-1 rounded text-xs font-bold uppercase tracking-wide border ${colors[status] || 'bg-gray-700'}`}>
                {status}
            </span>
        );
    };

    return (
        <div className="h-full overflow-y-auto p-4 md:p-8 bg-transparent relative z-10 custom-scrollbar">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {orders.length === 0 && (
                    <div className="col-span-full flex flex-col items-center justify-center p-32 text-gray-500 opacity-50">
                        <span className="text-8xl mb-6 grayscale animate-float">🍽️</span>
                        <p className="text-3xl font-display font-bold">No active orders</p>
                        <p className="text-sm mt-2">New orders will pop up here instantly.</p>
                    </div>
                )}

                {orders.map(order => (
                    <div
                        key={order.id}
                        className={`p-5 rounded-3xl shadow-2xl border backdrop-blur-md transition-all hover:scale-[1.02] duration-300 flex flex-col group relative overflow-hidden ${order.status === 'ready'
                            ? 'bg-emerald-900/10 border-emerald-500/30'
                            : order.status === 'preparing'
                                ? 'bg-blue-900/10 border-blue-500/30'
                                : 'glass-card'}`}
                    >
                        {/* Status Stripe */}
                        <div className={`absolute top-0 left-0 w-full h-1 ${order.status === 'ready' ? 'bg-emerald-500' : order.status === 'preparing' ? 'bg-blue-500' : 'bg-orange-500'}`}></div>

                        {/* Header */}
                        <div className="flex justify-between items-start mb-4">
                            <div>
                                <h3 className="font-bold text-xl flex items-center gap-2 text-white">
                                    {order.order_type === 'dine-in' ? (
                                        <span className="bg-emerald-500/20 text-emerald-300 px-3 py-1 rounded-xl border border-emerald-500/20 text-sm flex items-center gap-1">
                                            <span>🍽️</span> T-{order.table?.table_number || '?'}
                                        </span>
                                    ) : (
                                        <span className="bg-blue-500/20 text-blue-300 px-3 py-1 rounded-xl border border-blue-500/20 text-sm flex items-center gap-1">
                                            <span>🛍️</span> Takeaway
                                        </span>
                                    )}
                                </h3>
                                {order.customer_name && (
                                    <div className="font-display font-medium text-gray-200 mt-2 text-lg flex items-center gap-2">
                                        <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center text-[10px] text-white font-bold shadow-lg">
                                            {order.customer_name.charAt(0)}
                                        </div>
                                        {order.customer_name}
                                    </div>
                                )}
                                <span className="text-[10px] opacity-40 font-mono mt-1 block text-gray-400">ID: {order.id.slice(0, 4)}</span>
                            </div>
                            <div className="text-right">
                                <span className="text-lg font-bold font-mono block text-white/90">
                                    {new Date(order.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                                <StatusBadge status={order.status} />
                            </div>
                        </div>

                        {/* Items */}
                        <div className="flex-1 space-y-2 mb-6 bg-black/20 p-4 rounded-2xl border border-white/5 overflow-y-auto custom-scrollbar max-h-[200px]">
                            {order.order_items?.map((item, idx) => (
                                <div key={idx} className="flex justify-between items-center text-sm border-b border-white/5 last:border-0 pb-2 last:pb-0">
                                    <span className="text-gray-200 font-medium flex items-center gap-2">
                                        <span className="font-bold text-emerald-400 bg-emerald-500/10 px-1.5 rounded border border-emerald-500/20">{item.quantity}x</span>
                                        {item.menu_items?.name || 'Unknown Item'}
                                    </span>
                                </div>
                            ))}
                        </div>

                        {/* Footer / Actions */}
                        <div className="flex gap-3 mt-auto">
                            {order.status !== 'ready' && (
                                <button
                                    onClick={() => updateStatus(order.id, 'ready')}
                                    className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold py-3 rounded-xl shadow-lg shadow-blue-500/20 transition-all active:scale-95 text-sm border border-transparent hover:border-blue-400/50"
                                >
                                    ✅ Ready
                                </button>
                            )}

                            {order.status === 'ready' && (
                                <button
                                    onClick={() => updateStatus(order.id, 'completed')}
                                    className="flex-1 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold py-3 rounded-xl shadow-lg shadow-emerald-500/20 transition-all active:scale-95 text-sm border border-transparent hover:border-emerald-400/50"
                                >
                                    ✨ Completes
                                </button>
                            )}

                            <button
                                onClick={() => {
                                    setConfirmAction({
                                        isOpen: true,
                                        title: "Cancel Order",
                                        message: "Are you sure you want to cancel this active order?",
                                        onConfirm: () => updateStatus(order.id, 'cancelled')
                                    });
                                }}
                                className="px-4 py-3 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 rounded-xl transition-all hover:scale-105 active:scale-95"
                                title="Cancel Order"
                            >
                                ✕
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};
