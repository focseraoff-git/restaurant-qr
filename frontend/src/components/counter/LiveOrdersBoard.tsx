import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../utils/supabaseClient';
import { Modal } from '../Modal';

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

// Sub-component for individual order card
const OrderCard = ({ order, isKitchen, updateStatus, setConfirmAction, onPaymentClick, onEditClick }: { order: Order, isKitchen: boolean, updateStatus: any, setConfirmAction: any, onPaymentClick?: () => void, onEditClick?: () => void }) => {

    const StatusBadge = ({ status }: { status: string }) => {
        const colors: Record<string, string> = {
            pending: 'bg-amber-500/20 text-amber-500 border-amber-500/50',
            preparing: 'bg-blue-500/20 text-blue-500 border-blue-500/50',
            ready: 'bg-emerald-500/20 text-emerald-500 border-emerald-500/50',
            completed: 'bg-gray-500/20 text-gray-500 border-gray-500/50',
        };
        const icons: Record<string, string> = {
            pending: '⏳',
            preparing: '👨‍🍳',
            ready: '✅',
            completed: '✨',
        }
        return (
            <span className={`px-2 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest border ${colors[status] || 'bg-gray-700'} flex items-center gap-1.5 shadow-sm`}>
                <span>{icons[status]}</span>
                {status}
            </span>
        );
    };

    return (
        <div
            className={`p-5 rounded-3xl shadow-2xl border backdrop-blur-xl transition-all hover:scale-[1.02] duration-300 flex flex-col group relative overflow-hidden ${order.status === 'ready'
                ? 'bg-emerald-900/20 border-emerald-500/30 shadow-emerald-500/10'
                : order.status === 'preparing'
                    ? 'bg-blue-900/20 border-blue-500/30 shadow-blue-500/10'
                    : 'glass-card border-white/5 bg-slate-900/60'}`}
        >
            {/* Status Stripe */}
            <div className={`absolute top-0 left-0 w-full h-1 ${order.status === 'ready' ? 'bg-emerald-500' : order.status === 'preparing' ? 'bg-blue-500' : 'bg-amber-500'}`}></div>

            {/* Header */}
            <div className="flex justify-between items-start mb-4">
                <div>
                    <h3 className="font-bold text-xl flex items-center gap-2 text-white">
                        {order.order_type === 'dine-in' ? (
                            <span className="bg-emerald-500/20 text-emerald-300 px-3 py-1.5 rounded-xl border border-emerald-500/20 text-xs font-black uppercase tracking-wider flex items-center gap-1">
                                <span>🍽️</span> Table {order.table?.table_number || '?'}
                            </span>
                        ) : (
                            <span className="bg-blue-500/20 text-blue-300 px-3 py-1.5 rounded-xl border border-blue-500/20 text-xs font-black uppercase tracking-wider flex items-center gap-1">
                                <span>🛍️</span> Takeaway
                            </span>
                        )}
                    </h3>
                    {order.customer_name && (
                        <div className="font-display font-medium text-gray-200 mt-3 text-lg flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-slate-700 to-slate-800 flex items-center justify-center text-xs text-white font-bold shadow-inner border border-white/10">
                                {order.customer_name.charAt(0)}
                            </div>
                            {order.customer_name}
                        </div>
                    )}
                    <span className="text-[10px] opacity-40 font-mono mt-1 block text-gray-400 font-bold ml-1">#{order.id.slice(0, 4)}</span>
                </div>
                <div className="text-right flex flex-col items-end gap-2">
                    <span className="text-xs font-black font-mono block text-gray-400 bg-black/20 px-2 py-1 rounded-lg">
                        {new Date(order.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                    <StatusBadge status={order.status} />
                    <span className="text-xs font-mono font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20 mt-1">
                        ₹{order.total_amount}
                    </span>
                </div>
            </div>

            {/* Items */}
            <div className="flex-1 space-y-2 mb-6 bg-black/20 p-4 rounded-xl border border-white/5 overflow-y-auto custom-scrollbar max-h-[200px] shadow-inner">
                {order.order_items?.map((item, idx) => (
                    <div key={idx} className="flex justify-between items-center text-sm border-b border-white/5 last:border-0 pb-2 last:pb-0">
                        <span className="text-gray-200 font-medium flex items-center gap-3">
                            <span className="font-black text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20 text-xs">{item.quantity}x</span>
                            {item.menu_items?.name || 'Unknown Item'}
                        </span>
                    </div>
                ))}
            </div>

            {/* Footer / Actions */}
            <div className="flex gap-3 mt-auto">
                {order.status === 'pending' && (
                    <button
                        onClick={() => updateStatus(order.id, 'preparing')}
                        className="flex-1 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white font-bold py-3.5 rounded-xl shadow-lg shadow-amber-500/20 transition-all active:scale-95 text-xs uppercase tracking-widest border border-transparent hover:border-amber-400/50 flex items-center justify-center gap-2"
                    >
                        <span>👨‍🍳</span> Start
                    </button>
                )}

                {order.status === 'preparing' && (
                    <button
                        onClick={() => updateStatus(order.id, 'ready')}
                        className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold py-3.5 rounded-xl shadow-lg shadow-blue-500/20 transition-all active:scale-95 text-xs uppercase tracking-widest border border-transparent hover:border-blue-400/50 flex items-center justify-center gap-2"
                    >
                        <span>✅</span> Ready
                    </button>
                )}

                {order.status === 'ready' && !isKitchen && (
                    <button
                        onClick={onPaymentClick}
                        className="flex-1 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold py-3.5 rounded-xl shadow-lg shadow-emerald-500/20 transition-all active:scale-95 text-xs uppercase tracking-widest border border-transparent hover:border-emerald-400/50 flex items-center justify-center gap-2"
                    >
                        <span>💸</span> Paid
                    </button>
                )}

                {/* Edit Button (Universal) */}
                <button
                    onClick={onEditClick}
                    className="px-4 py-3 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 border border-indigo-500/20 rounded-xl transition-all hover:scale-105 active:scale-95 flex items-center justify-center"
                    title="Edit Order"
                >
                    ✏️
                </button>

                {!isKitchen && (
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
                )}
            </div>
        </div>
    );
}

// Payment Modal Component
const PaymentModal = ({ isOpen, onClose, onConfirm }: { isOpen: boolean, onClose: () => void, onConfirm: (method: string) => void }) => {
    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Select Payment Method">
            <div className="space-y-4">
                <button
                    onClick={() => { onConfirm('Cash'); onClose(); }}
                    className="w-full py-4 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 rounded-xl flex items-center justify-center gap-3 text-emerald-400 font-bold text-lg transition-all"
                >
                    <span className="text-2xl">💵</span> Cash
                </button>
                <button
                    onClick={() => { onConfirm('UPI'); onClose(); }}
                    className="w-full py-4 bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/20 rounded-xl flex items-center justify-center gap-3 text-blue-400 font-bold text-lg transition-all"
                >
                    <span className="text-2xl">📱</span> UPI / Online
                </button>
            </div>
        </Modal>
    );
};

export const LiveOrdersBoard = ({ restaurantId, showToast, setConfirmAction, isKitchen = false, onEditOrder }: { restaurantId: string, showToast: (msg: string, type?: any) => void, setConfirmAction: (action: any) => void, isKitchen?: boolean, onEditOrder?: (order: Order) => void }) => {

    const [orders, setOrders] = useState<Order[]>([]);
    const [selectedOrderForPayment, setSelectedOrderForPayment] = useState<string | null>(null);

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
            // Kitchen sees all pending/preparing/ready. Counter also sees them.
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

    const updateStatus = async (orderId: string, newStatus: string, paymentMethod?: string) => {
        try {
            const updatePayload: any = { status: newStatus };
            if (paymentMethod) {
                updatePayload.payment_method = paymentMethod;
            }

            await supabase
                .from('orders')
                .update(updatePayload)
                .eq('id', orderId);
            showToast(`Order marked as ${newStatus}`, 'success');
        } catch (error) {
            showToast('Failed to update status', 'error');
        }
    };

    const handlePaymentConfirm = (method: string) => {
        if (selectedOrderForPayment) {
            updateStatus(selectedOrderForPayment, 'completed', method);
            setSelectedOrderForPayment(null);
        }
    };

    const totalActiveAmount = orders.reduce((sum, order) => sum + (order.total_amount || 0), 0);

    return (
        <div className="h-full overflow-y-auto p-4 md:p-8 bg-transparent relative z-10 custom-scrollbar">

            {/* Counter Total Display */}
            {!isKitchen && orders.length > 0 && (
                <div className="mb-8 flex justify-end">
                    <div className="bg-slate-900/80 backdrop-blur-md border border-emerald-500/30 p-4 rounded-2xl shadow-lg shadow-emerald-500/10 flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-emerald-500/20 flex items-center justify-center text-2xl">💰</div>
                        <div>
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Active Orders Total</p>
                            <p className="text-3xl font-display font-black text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-400">
                                ₹{totalActiveAmount.toLocaleString()}
                            </p>
                        </div>
                    </div>
                </div>
            )}

            <div className="space-y-8">
                {/* Dine-In Section */}
                <div>
                    <h2 className="text-xl font-bold text-emerald-400 mb-4 flex items-center gap-2">
                        <span>🍽️</span> Dine-In <span className="text-sm bg-white/10 px-2 rounded-full text-white">{orders.filter(o => o.order_type === 'dine-in').length}</span>
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {orders.filter(o => o.order_type === 'dine-in').map(order => (
                            <OrderCard
                                key={order.id}
                                order={order}
                                isKitchen={isKitchen}
                                updateStatus={updateStatus}
                                setConfirmAction={setConfirmAction}
                                onPaymentClick={() => setSelectedOrderForPayment(order.id)}
                            />
                        ))}
                    </div>
                </div>

                {/* Takeaway Section */}
                <div>
                    <h2 className="text-xl font-bold text-blue-400 mb-4 flex items-center gap-2 border-t border-white/10 pt-8">
                        <span>🛍️</span> Takeaway <span className="text-sm bg-white/10 px-2 rounded-full text-white">{orders.filter(o => o.order_type !== 'dine-in').length}</span>
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {orders.filter(o => o.order_type !== 'dine-in').map(order => (
                            <OrderCard
                                key={order.id}
                                order={order}
                                isKitchen={isKitchen}
                                updateStatus={updateStatus}
                                setConfirmAction={setConfirmAction}
                                onPaymentClick={() => setSelectedOrderForPayment(order.id)}
                            />
                        ))}
                    </div>
                </div>
            </div>

            <PaymentModal
                isOpen={!!selectedOrderForPayment}
                onClose={() => setSelectedOrderForPayment(null)}
                onConfirm={handlePaymentConfirm}
            />
        </div>
    );
};
