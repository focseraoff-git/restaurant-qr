import { useEffect, useState, useRef } from 'react';
import { useParams } from 'react-router-dom';
import api from '../utils/api';

interface Order {
    id: string;
    customer_name: string | null;
    status: 'pending' | 'preparing' | 'ready' | 'completed';
    created_at: string;
    tables?: {
        table_number: string;
    };
    order_type: string;
    total_amount: number;
    order_items: any[];
}

export const WaiterDashboard = () => {
    const { restaurantId } = useParams();
    const [orders, setOrders] = useState<Order[]>([]);
    const [lastCount, setLastCount] = useState(0);
    const audioRef = useRef<HTMLAudioElement | null>(null);

    // Poll for orders
    useEffect(() => {
        const fetchOrders = async () => {
            try {
                const res = await api.get(`/orders/restaurant/${restaurantId}`);
                if (res.data) {
                    // Sort by newest first
                    const sorted = res.data.sort((a: Order, b: Order) =>
                        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
                    );
                    setOrders(sorted);
                }
            } catch (err) {
                console.error("Failed to fetch orders", err);
            }
        };

        fetchOrders();
        const interval = setInterval(fetchOrders, 5000);
        return () => clearInterval(interval);
    }, [restaurantId]);

    // Check for new orders
    useEffect(() => {
        if (orders.length > lastCount && lastCount !== 0) {
            // New order arrived!
            if (Notification.permission === "granted") {
                new Notification("New Order!", { body: "A new order has been placed." });
            }
            // Play sound
            if (audioRef.current) {
                audioRef.current.play().catch(e => console.log("Audio play failed", e));
            }
        }
        setLastCount(orders.length);
    }, [orders.length, lastCount]);

    useEffect(() => {
        if (Notification.permission !== "granted") {
            Notification.requestPermission();
        }
    }, []);

    const markServed = async (orderId: string) => {
        if (confirm('Mark this order as Served?')) {
            try {
                await api.put(`/orders/${orderId}/status`, { status: 'completed' });
                // Optimistic update
                setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: 'completed' } : o));
            } catch (err) {
                alert('Failed to update status');
            }
        }
    };

    return (
        <div className="min-h-screen bg-gray-100 p-6">
            <audio ref={audioRef} src="https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3" />

            <h1 className="text-3xl font-bold mb-6 text-gray-800">Waiter Dashboard 🔔</h1>

            <div className="grid gap-4 max-w-2xl mx-auto">
                {orders.filter(o => o.status !== 'completed').map(order => (
                    <div key={order.id} className={`p-6 rounded-xl shadow-md border-l-8 bg-white flex justify-between items-center
                        ${order.status === 'pending' ? 'border-red-500' :
                            order.status === 'ready' ? 'border-green-500' : 'border-yellow-500'}
                    `}>
                        <div>
                            <div className="flex items-center gap-3 mb-1">
                                <span className={`px-2 py-1 rounded text-xs font-bold uppercase text-white
                                    ${order.status === 'pending' ? 'bg-red-500' :
                                        order.status === 'ready' ? 'bg-green-500' : 'bg-yellow-500'}
                                `}>
                                    {order.status}
                                </span>
                                <span className="text-gray-400 text-xs">#{order.id.slice(0, 4)}</span>
                            </div>
                            <h2 className="text-xl font-bold text-gray-900">
                                {order.tables?.table_number ? `Table ${order.tables.table_number}` : 'Takeaway'}
                            </h2>
                            <p className="text-gray-600 font-medium">Customer: {order.customer_name || 'Guest'}</p>
                            <p className="text-sm text-gray-500 mt-1">Items: {order.order_items.length}</p>
                        </div>

                        {order.status === 'ready' && (
                            <button
                                onClick={() => markServed(order.id)}
                                className="bg-green-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-green-700 shadow-lg animate-pulse"
                            >
                                SERVE 🍽️
                            </button>
                        )}

                        {order.status === 'pending' && (
                            <div className="text-red-500 font-bold text-sm text-right">
                                New Order<br />Pending Kitchen
                            </div>
                        )}
                    </div>
                ))}

                {orders.filter(o => o.status !== 'completed').length === 0 && (
                    <div className="text-center py-20 text-gray-400">
                        <p className="text-xl">All caught up! No active orders.</p>
                    </div>
                )}
            </div>
        </div>
    );
};
