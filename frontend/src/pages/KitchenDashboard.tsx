import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import api from '../utils/api';

interface OrderItem {
    id: string;
    quantity: number;
    portion: string;
    taste_preference?: string;
    menu_items: {
        name: string;
    };
}

interface Table {
    table_number: string;
}

interface Order {
    id: string;
    table_id: string;
    status: string;
    order_type: string;
    total_amount: number;
    created_at: string;
    order_items: OrderItem[];
    tables?: Table; // Join result
    customer_name?: string;
}

const STATUS_COLORS: Record<string, string> = {
    pending: 'bg-orange-100 border-orange-200 text-orange-800',
    preparing: 'bg-blue-100 border-blue-200 text-blue-800',
    ready: 'bg-green-100 border-green-200 text-green-800',
    completed: 'bg-gray-100 border-gray-200 text-gray-600',
    cancelled: 'bg-red-50 border-red-100 text-red-600'
};

const NEXT_STATUS: Record<string, string> = {
    pending: 'preparing',
    preparing: 'ready',
    ready: 'completed'
};

export const KitchenDashboard = () => {
    const { restaurantId } = useParams();
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchOrders = async () => {
        if (!restaurantId) return;
        try {
            const res = await api.get(`/orders/restaurant/${restaurantId}`);
            setOrders(res.data);
            setLoading(false);
        } catch (error) {
            console.error('Error fetching orders:', error);
        }
    };

    useEffect(() => {
        fetchOrders();
        const interval = setInterval(fetchOrders, 15000); // Poll every 15s
        return () => clearInterval(interval);
    }, [restaurantId]);

    const updateStatus = async (orderId: string, newStatus: string) => {
        try {
            // Optimistic update
            setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: newStatus } : o));
            await api.put(`/orders/${orderId}/status`, { status: newStatus });
            // Re-fetch to confirm
            fetchOrders();
        } catch (error) {
            console.error('Error updating status:', error);
            fetchOrders(); // Revert on error
        }
    };

    const getOrdersByStatus = (status: string) => orders.filter(o => o.status === status);

    const OrderCard = ({ order }: { order: Order }) => (
        <div className={`p-4 rounded-xl shadow-sm border mb-4 bg-white transition-all hover:shadow-md ${STATUS_COLORS[order.status] || 'bg-white'}`}>
            <div className="flex justify-between items-start mb-2">
                <div>
                    <h3 className="font-bold text-xl flex items-center gap-2">
                        {order.tables?.table_number ? (
                            <span className="bg-white/50 px-2 py-1 rounded-lg border border-gray-200">
                                🍽️ T-{order.tables.table_number}
                            </span>
                        ) : (
                            <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded-lg border border-yellow-200">
                                🥡 Takeaway
                            </span>
                        )}
                    </h3>
                    {order.customer_name && (
                        <div className="font-semibold text-gray-900 mt-1 text-lg">
                            👤 {order.customer_name}
                        </div>
                    )}
                    <span className="text-xs opacity-50 font-mono mt-1 block">ID: {order.id.slice(0, 4)}</span>
                </div>
                <div className="text-right">
                    <span className="text-lg font-bold font-mono block">
                        {new Date(order.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                    <span className="text-xs opacity-60">ordered time</span>
                </div>
            </div>

            <div className="space-y-2 mb-4 bg-white/50 p-3 rounded-lg">
                {order.order_items.map((item, idx) => (
                    <div key={idx} className="flex justify-between items-center text-sm border-b border-gray-100 last:border-0 pb-2 last:pb-0">
                        <span className="text-gray-900 font-bold">
                            {item.quantity}x {item.menu_items?.name || 'Unknown Item'}
                        </span>
                        {item.portion !== 'full' && <span className="text-xs text-gray-500 bg-white px-1 border rounded">{item.portion}</span>}
                    </div>
                ))}
            </div>

            <div className="flex gap-2 mt-3">
                {NEXT_STATUS[order.status] && (
                    <button
                        onClick={() => updateStatus(order.id, NEXT_STATUS[order.status])}
                        className="flex-1 bg-white border border-current px-3 py-1 rounded-lg text-sm font-bold shadow-sm hover:bg-gray-50 uppercase tracking-wide"
                    >
                        Mark {NEXT_STATUS[order.status]}
                    </button>
                )}
                {order.status !== 'completed' && order.status !== 'cancelled' && (
                    <button
                        onClick={() => updateStatus(order.id, 'cancelled')}
                        className="text-red-500 hover:text-red-700 text-xs px-2"
                        title="Cancel Order"
                    >
                        ✕
                    </button>
                )}
            </div>
        </div>
    );

    if (loading) return <div className="p-8 text-center text-gray-500">Loading Dashboard...</div>;

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            <header className="bg-white border-b px-6 py-4 flex justify-between items-center sticky top-0 z-10">
                <h1 className="text-xl font-bold text-gray-800">Kitchen Dashboard</h1>
                <div className="text-sm text-green-600 flex items-center gap-2">
                    <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                    Live Updates
                </div>
            </header>

            <div className="flex-1 overflow-x-auto p-6">
                <div className="flex gap-6 min-w-max">
                    {['pending', 'preparing', 'ready', 'completed'].map(status => (
                        <div key={status} className="w-80 flex-shrink-0">
                            <h2 className="font-bold text-gray-500 uppercase tracking-widest text-xs mb-4 flex justify-between">
                                {status}
                                <span className="bg-gray-200 text-gray-600 px-2 rounded-full text-xs">
                                    {getOrdersByStatus(status).length}
                                </span>
                            </h2>
                            <div className="space-y-4">
                                {getOrdersByStatus(status).map(order => (
                                    <OrderCard key={order.id} order={order} />
                                ))}
                                {getOrdersByStatus(status).length === 0 && (
                                    <div className="text-center py-8 border-2 border-dashed border-gray-200 rounded-xl text-gray-400 text-sm">
                                        No orders in {status}
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};
