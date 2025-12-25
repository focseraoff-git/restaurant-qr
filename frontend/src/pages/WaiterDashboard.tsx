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
                // Sanitize ID in case of malformed URL (e.g. &tableId appended)
                const cleanId = restaurantId?.split('&')[0].split('?')[0];
                if (!cleanId) return;

                const res = await api.get(`/orders/restaurant/${cleanId}`);
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

    const [viewHistory, setViewHistory] = useState(false);

    const filteredOrders = orders.filter(o => viewHistory ? o.status === 'completed' : o.status !== 'completed');

    return (
        <div className="min-h-screen bg-slate-950 p-4 md:p-6 font-sans relative overflow-hidden">
            {/* Background Effects */}
            <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-emerald-900/10 rounded-full blur-[120px] pointer-events-none"></div>

            <audio ref={audioRef} src="https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3" />

            <div className="max-w-3xl mx-auto relative z-10">
                <header className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 md:mb-8 gap-4">
                    <div>
                        <h1 className="text-2xl md:text-3xl font-display font-bold text-white flex items-center gap-3">
                            Waiter Dashboard <span className="text-xl md:text-2xl w-8 h-8 md:w-10 md:h-10 bg-white/10 rounded-full flex items-center justify-center border border-white/10 shadow-glow-gold">🔔</span>
                        </h1>
                        <p className="text-gray-400 text-xs md:text-sm mt-1">Real-time order tracking for service staff.</p>
                    </div>
                    <div className="flex items-center gap-3 self-end md:self-auto">
                        {viewHistory && filteredOrders.length > 0 && (
                            <button
                                onClick={() => {
                                    if (confirm('Clear all completed order history?')) {
                                        setOrders(prev => prev.filter(o => o.status !== 'completed'));
                                    }
                                }}
                                className="px-4 py-2 rounded-xl text-xs font-bold border border-red-500/20 bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-all"
                            >
                                🗑️ Clear
                            </button>
                        )}
                        <button
                            onClick={() => setViewHistory(!viewHistory)}
                            className={`px-4 py-2 rounded-xl text-xs font-bold border transition-all ${viewHistory
                                ? 'bg-white/10 text-white border-white/20'
                                : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 shadow-glow-emerald'}`}
                        >
                            {viewHistory ? '← Back to Active' : '📜 View History'}
                        </button>
                        <div className="px-3 py-1.5 md:px-4 md:py-2 bg-white/5 rounded-xl border border-white/5 text-[10px] md:text-xs font-bold text-emerald-400 flex items-center gap-2 animate-pulse">
                            <span className="w-1.5 h-1.5 md:w-2 md:h-2 bg-emerald-500 rounded-full shadow-[0_0_10px_#10b981]"></span>
                            LIVE
                        </div>
                    </div>
                </header>

                <div className="space-y-4">
                    {filteredOrders.map(order => (
                        <div key={order.id} className={`glass-panel p-5 md:p-6 rounded-2xl border-l-[6px] relative overflow-hidden transition-all active:scale-[0.98] group animate-slide-up
                            ${order.status === 'pending' ? 'border-l-red-500 shadow-[0_0_20px_rgba(239,68,68,0.15)] bg-red-500/5' :
                                order.status === 'ready' ? 'border-l-emerald-500 shadow-[0_0_20px_rgba(16,185,129,0.15)] bg-emerald-500/5' :
                                    order.status === 'completed' ? 'border-l-gray-600 bg-white/5 opacity-80' : 'border-l-blue-500 bg-blue-500/5'}
                        `}>
                            {/* Card Background Glow */}
                            <div className={`absolute inset-0 opacity-0 group-hover:opacity-10 transition-opacity duration-500 pointer-events-none bg-gradient-to-r ${order.status === 'ready' ? 'from-emerald-500/10' : 'from-white/5'} to-transparent`}></div>

                            <div className="flex flex-col md:flex-row justify-between items-start md:items-center relative z-10 gap-4 mb-4">
                                <div className="w-full md:w-auto">
                                    <div className="flex items-center gap-2 md:gap-3 mb-2">
                                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-widest border
                                            ${order.status === 'pending' ? 'bg-red-500/20 text-red-400 border-red-500/30' :
                                                order.status === 'ready' ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30 animate-pulse' :
                                                    order.status === 'completed' ? 'bg-gray-500/20 text-gray-400 border-gray-500/30' : 'bg-blue-500/20 text-blue-400 border-blue-500/30'}
                                        `}>
                                            {order.status}
                                        </span>
                                        <span className="text-gray-500 font-mono text-xs">#{order.id.slice(0, 4)}</span>
                                        <span className="text-gray-500 text-xs">•</span>
                                        <span className="text-gray-400 text-xs font-medium">
                                            {new Date(order.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </span>
                                    </div>
                                    <h2 className="text-xl md:text-2xl font-display font-bold text-white mb-1">
                                        {order.tables?.table_number ? (
                                            <span className="flex items-center gap-2">🍽️ Table {order.tables.table_number}</span>
                                        ) : (
                                            <span className="flex items-center gap-2 text-amber-400">🥡 Takeaway</span>
                                        )}
                                    </h2>
                                    <p className="text-gray-400 font-medium text-sm flex items-center gap-2">
                                        👤 {order.customer_name || 'Guest'}
                                    </p>
                                </div>

                                {order.status === 'ready' && (
                                    <button
                                        onClick={() => markServed(order.id)}
                                        className="w-full md:w-auto btn-primary text-white px-6 py-3 md:px-8 md:py-4 rounded-xl font-bold shadow-lg shadow-emerald-500/30 hover:shadow-emerald-500/50 transition-all transform flex flex-row md:flex-col items-center justify-center gap-2 md:gap-1 group/btn"
                                    >
                                        <span className="text-lg">SERVE</span>
                                        <span className="text-[10px] font-normal opacity-80 md:group-hover/btn:opacity-100 hidden md:block">Click to complete</span>
                                        <span className="md:hidden">→</span>
                                    </button>
                                )}
                            </div>

                            {/* Order Items List */}
                            <div className="bg-black/20 rounded-xl p-4 border border-white/5 space-y-2">
                                {order.order_items.map((item: any, idx) => (
                                    <div key={idx} className="flex justify-between items-center text-sm">
                                        <div className="flex items-center gap-3">
                                            <span className="font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded text-xs border border-emerald-500/20">{item.quantity}x</span>
                                            <span className="text-gray-200 font-medium">{item.menu_items?.name || 'Item'}</span>
                                        </div>
                                        {item.portion && item.portion !== 'full' && (
                                            <span className="text-[10px] text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/20 uppercase font-bold tracking-wide">
                                                {item.portion}
                                            </span>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}

                    {filteredOrders.length === 0 && (
                        <div className="text-center py-20 border-2 border-dashed border-white/5 rounded-3xl bg-white/5">
                            <div className="text-4xl mb-4 grayscale opacity-50">
                                {viewHistory ? '📜' : '☕'}
                            </div>
                            <p className="text-xl font-display font-bold text-gray-500">
                                {viewHistory ? 'No order history yet' : 'All caught up!'}
                            </p>
                            <p className="text-sm text-gray-600">
                                {viewHistory ? 'Completed orders will appear here.' : 'No active orders needing attention.'}
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
