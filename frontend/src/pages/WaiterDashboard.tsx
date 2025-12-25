import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../utils/api';
import { supabase } from '../utils/supabaseClient';

interface Order {
    id: string;
    customer_name: string | null;
    status: 'pending' | 'preparing' | 'ready' | 'completed' | 'cancelled';
    created_at: string;
    tables?: {
        table_number: string;
    };
    order_type: string;
    total_amount: number;
    order_items: any[];
    waiter_id?: string;
}

export const WaiterDashboard = () => {
    const { restaurantId } = useParams();
    const navigate = useNavigate();

    // Validate URL param
    if (restaurantId === ':restaurantId') {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-950 text-white p-4 text-center">
                <div>
                    <h1 className="text-3xl font-bold mb-4 text-red-500">Invalid URL Access</h1>
                    <p className="text-gray-400 mb-6">The restaurant ID is missing from the URL.</p>
                    <button onClick={() => navigate('/')} className="px-6 py-3 bg-white/10 rounded-xl">Go Home</button>
                </div>
            </div>
        )
    }

    // State
    const [orders, setOrders] = useState<Order[]>([]);
    const [myOrders, setMyOrders] = useState<Order[]>([]);
    const [readyOrders, setReadyOrders] = useState<Order[]>([]); // The "Shark Tank"

    const [waiterProfile, setWaiterProfile] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'pool' | 'mine' | 'history'>('pool');
    const [stats, setStats] = useState({ count: 0, total: 0 });
    const [error, setError] = useState<string | null>(null);

    // const audioRef = useRef<HTMLAudioElement | null>(null);

    // 1. Get Current Waiter Profile
    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const { data: { user } } = await supabase.auth.getUser();
                console.log("Supabase User:", user);
                if (!user) {
                    console.warn("No user found, redirecting to login");
                    navigate(`/waiter/login/${restaurantId}`);
                    return;
                }

                // Fetch waiter details from DB matches
                const cleanId = restaurantId?.split('&')[0];
                console.log("Fetching waiters for restaurant:", cleanId);
                const { data: waiters } = await api.get(`/waiters/${cleanId}`);
                console.log("Waiters found:", waiters);

                const me = waiters.find((w: any) => w.auth_id === user.id || w.id === user.id);
                console.log("Matching waiter profile:", me);

                if (me) {
                    setWaiterProfile(me);
                    setLoading(false); // Explicitly set loading false here if successful
                } else {
                    console.error("No waiter record found for this user");
                    setLoading(false);
                    setError("Account not linked to a waiter profile. Please contact the manager.");
                }
            } catch (error: any) {
                console.error("Profile fetch error", error);
                setLoading(false);
                setError(error.message || "Failed to load profile");
                // navigate(`/waiter/login/${restaurantId}`);
            }
        };
        fetchProfile();
    }, [restaurantId, navigate]);

    // 2. Fetch Orders & Filter
    const fetchOrders = async () => {
        if (!restaurantId || !waiterProfile) return;
        try {
            const cleanId = restaurantId.split('&')[0];
            const res = await api.get(`/orders/restaurant/${cleanId}`);
            const allOrders: Order[] = res.data;

            // Shark Tank: Ready orders with NO waiter assigned
            const pool = allOrders.filter(o => o.status === 'ready' && !o.waiter_id);
            // My Active: Orders assigned to ME and NOT completed
            const mine = allOrders.filter(o => o.waiter_id === waiterProfile.id && o.status !== 'completed' && o.status !== 'cancelled');
            // My History
            const history = allOrders.filter(o => o.waiter_id === waiterProfile.id && o.status === 'completed');

            setReadyOrders(pool);
            setMyOrders(mine);
            setOrders(history); // Using legacy 'orders' state for history

            // Calc stats
            const today = new Date().toISOString().split('T')[0];
            const todayOrders = history.filter(o => o.created_at >= today);
            setStats({
                count: todayOrders.length,
                total: todayOrders.reduce((sum, o) => sum + o.total_amount, 0)
            });

            setLoading(false);

            // Notification logic (simplified for now)
            if (pool.length > 0 && Notification.permission === "granted") {
                // Logic to notify only on NEW orders would require ref holding last count
            }

        } catch (error) {
            console.error('Error fetching orders:', error);
        }
    };

    // Polling
    useEffect(() => {
        if (waiterProfile) {
            fetchOrders();
            const interval = setInterval(fetchOrders, 3000); // Faster polling for shark tank
            return () => clearInterval(interval);
        }
    }, [restaurantId, waiterProfile]);

    // Actions
    const assignToMe = async (orderId: string) => {
        if (!waiterProfile) return;
        try {
            // Optimistic Update
            setReadyOrders(prev => prev.filter(o => o.id !== orderId));

            // Call API to assign
            // We assume backend allows updating waiter_id via generic update or we need specific route.
            // Using direct supabase for now as it's cleaner than creating a new specific backend route just for this right now, 
            // given we have public access or RLS. Wait, RLS might block.
            // Safer: update via API. I'll use the existing /status route if modified, OR just update specifically.
            // Actually, the user asked for "Picking up" orders. 
            // I should double check if I have an endpoint for assigning. I don't.
            // Use supabase direct for now, assuming RLS allows update if authenticated.

            await api.put(`/orders/${orderId}/status`, {
                status: 'ready', // Status doesn't change yet, just assignment? 
                // Actually status is ready.
                // Wait, if I use the PUT status endpoint, it only accepts status and estimated time.
                // I need to update that endpoint to accept waiter_id or create a new one.
                // Or I can just send waiter_id in the body and update backend route quickly.
                waiter_id: waiterProfile.id
            });

            fetchOrders();
        } catch (error) {
            console.error("Assign error", error);
            fetchOrders();
        }
    };

    const markDelivered = async (orderId: string) => {
        if (!window.confirm("Confirm delivery?")) return;
        try {
            await api.put(`/orders/${orderId}/status`, { status: 'completed' });
            fetchOrders();
        } catch (error) { console.error(error); }
    };

    const clearHistory = () => {
        if (window.confirm("Clear your local history view?")) {
            setOrders([]); // Clear local state only
        }
    };

    if (error) return (
        <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 text-center">
            <div className="text-red-500 text-4xl mb-4">⚠️</div>
            <h1 className="text-xl font-bold text-white mb-2">Access Error</h1>
            <p className="text-red-400 mb-6 bg-red-500/10 p-4 rounded-xl border border-red-500/20">{error}</p>
            <button
                onClick={() => navigate(`/waiter/login/${restaurantId}`)}
                className="bg-white/10 hover:bg-white/20 text-white px-6 py-3 rounded-xl font-bold transition-all"
            >
                Back to Login
            </button>
        </div>
    );

    if (!waiterProfile || loading) return (
        <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-emerald-500"></div>
            <p className="text-gray-400 mt-4 animate-pulse">Verifying Waiter Profile...</p>
        </div>
    );

    return (
        <div className="min-h-screen bg-slate-950 pb-20 font-sans text-gray-100">
            {/* Background Effects */}
            <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-emerald-900/10 rounded-full blur-[120px] pointer-events-none"></div>

            {/* Header */}
            <header className="glass-nav px-6 py-4 sticky top-0 z-30 mb-6 w-full border-b border-white/5">
                <div className="flex justify-between items-center max-w-lg mx-auto md:max-w-none">
                    <div>
                        <h1 className="text-xl font-display font-bold text-white flex items-center gap-2">
                            👋 Hi, {waiterProfile.name.split(' ')[0]}
                        </h1>
                        <p className="text-xs text-emerald-400 font-bold uppercase tracking-wider">
                            Active Shift • {stats.count} Delivered
                        </p>
                    </div>
                    <div className="flex gap-2">
                        <button
                            onClick={() => setActiveTab('pool')}
                            className={`p-3 rounded-xl transition-all relative ${activeTab === 'pool' ? 'bg-emerald-500 text-white shadow-glow-emerald' : 'bg-white/5 text-gray-400'}`}
                        >
                            🔔
                            {readyOrders.length > 0 && (
                                <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-[10px] font-bold flex items-center justify-center rounded-full animate-bounce">
                                    {readyOrders.length}
                                </span>
                            )}
                        </button>
                        <button
                            onClick={() => setActiveTab('mine')}
                            className={`p-3 rounded-xl transition-all relative ${activeTab === 'mine' ? 'bg-blue-500 text-white shadow-lg' : 'bg-white/5 text-gray-400'}`}
                        >
                            🥥
                            {myOrders.length > 0 && (
                                <span className="absolute -top-1 -right-1 w-5 h-5 bg-blue-400 text-white text-[10px] font-bold flex items-center justify-center rounded-full">
                                    {myOrders.length}
                                </span>
                            )}
                        </button>
                        <button
                            onClick={() => setActiveTab('history')}
                            className={`p-3 rounded-xl transition-all relative ${activeTab === 'history' ? 'bg-white/20 text-white' : 'bg-white/5 text-gray-400'}`}
                        >
                            📜
                        </button>
                    </div>
                </div>
            </header>

            <div className="max-w-md mx-auto md:max-w-4xl px-4 space-y-4 relative z-10">

                {/* POOL TAB */}
                {activeTab === 'pool' && (
                    <div className="space-y-4 animate-fade-in">
                        <h2 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                            Ready to Serve ({readyOrders.length})
                        </h2>
                        {readyOrders.map(order => (
                            <div key={order.id} className="glass-panel p-5 rounded-2xl border border-emerald-500/30 shadow-[0_0_30px_rgba(16,185,129,0.1)] relative overflow-hidden group">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-2xl -mr-10 -mt-10 pointer-events-none"></div>
                                <div className="flex justify-between items-start mb-4 relative z-10">
                                    <div>
                                        <div className="flex items-center gap-2 mb-1">
                                            {order.tables?.table_number ? (
                                                <span className="bg-emerald-500 text-white px-2 py-1 rounded-lg text-sm font-bold shadow-lg shadow-emerald-500/20">
                                                    Table {order.tables.table_number}
                                                </span>
                                            ) : (
                                                <span className="bg-amber-500 text-white px-2 py-1 rounded-lg text-sm font-bold">Takeaway</span>
                                            )}
                                            <span className="text-xs text-gray-400 font-mono">#{order.id.slice(0, 4)}</span>
                                        </div>
                                        <div className="text-xs text-gray-400 mt-1">
                                            {order.order_items.length} items • wait: {Math.floor((Date.now() - new Date(order.created_at).getTime()) / 60000)}m
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <span className="block text-xl font-bold text-white">READY</span>
                                        <span className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider">Kitchen confirmed</span>
                                    </div>
                                </div>

                                <div className="space-y-2 mb-4 bg-black/20 p-3 rounded-xl relative z-10">
                                    {order.order_items.map((item, idx) => (
                                        <div key={idx} className="flex justify-between text-sm text-gray-300">
                                            <span>{item.quantity}x {item.menu_items.name}</span>
                                        </div>
                                    ))}
                                </div>

                                <button
                                    onClick={() => assignToMe(order.id)}
                                    className="w-full py-4 bg-emerald-500 hover:bg-emerald-400 active:scale-95 transition-all rounded-xl font-bold text-white shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2 text-lg"
                                >
                                    🚀 I'll Take It!
                                </button>
                            </div>
                        ))}
                        {readyOrders.length === 0 && (
                            <div className="text-center py-20 opacity-50">
                                <div className="text-4xl mb-4">💤</div>
                                <p className="font-bold text-gray-400">No active orders ready.</p>
                            </div>
                        )}
                    </div>
                )}

                {/* MY ORDERS TAB */}
                {activeTab === 'mine' && (
                    <div className="space-y-4 animate-fade-in">
                        <h2 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-4 text-blue-400">My Active Orders ({myOrders.length})</h2>
                        {myOrders.map(order => (
                            <div key={order.id} className="glass-panel p-5 rounded-2xl border border-blue-500/30 shadow-[0_0_20px_rgba(59,130,246,0.1)]">
                                <div className="flex justify-between items-start mb-4">
                                    <h3 className="text-lg font-bold text-white">Table {order.tables?.table_number || 'N/A'}</h3>
                                    <span className="text-xs font-mono bg-blue-500/20 text-blue-300 px-2 py-1 rounded border border-blue-500/20">Serving Now</span>
                                </div>
                                <div className="space-y-2 mb-4 bg-black/20 p-3 rounded-xl">
                                    {order.order_items.map((item, idx) => (
                                        <div key={idx} className="flex justify-between text-sm text-gray-300">
                                            <span>{item.quantity}x {item.menu_items.name}</span>
                                        </div>
                                    ))}
                                </div>
                                <button
                                    onClick={() => markDelivered(order.id)}
                                    className="w-full py-3 bg-white/10 hover:bg-white/20 border border-white/10 text-white rounded-xl font-bold transition-all flex items-center justify-center gap-2"
                                >
                                    ✅ Mark Delivered
                                </button>
                            </div>
                        ))}
                        {myOrders.length === 0 && (
                            <div className="text-center py-10 opacity-50">
                                <p className="text-gray-500">You have no active orders.</p>
                            </div>
                        )}
                    </div>
                )}

                {/* HISTORY TAB */}
                {activeTab === 'history' && (
                    <div className="space-y-6 animate-fade-in">
                        <div className="glass-panel p-6 rounded-2xl border border-white/10 bg-gradient-to-br from-slate-900 to-slate-800">
                            <h3 className="text-gray-400 text-xs font-bold uppercase tracking-widest mb-4">Today's Settlement</h3>
                            <div className="flex justify-between items-end border-b border-white/10 pb-4 mb-4">
                                <div>
                                    <span className="text-3xl font-mono font-bold text-emerald-400">₹{stats.total}</span>
                                    <p className="text-xs text-gray-500">Total Revenue Collected</p>
                                </div>
                                <div className="text-right">
                                    <span className="text-2xl font-bold text-white">{stats.count}</span>
                                    <p className="text-xs text-gray-500">Orders Delivered</p>
                                </div>
                            </div>
                            <button onClick={() => window.print()} className="w-full py-3 bg-white/5 hover:bg-white/10 rounded-xl font-bold text-sm text-gray-300 border border-white/5">
                                🖨️ Print Settlement Bill
                            </button>
                        </div>

                        <div className="flex justify-between items-center">
                            <h2 className="text-sm font-bold text-gray-400 uppercase">Recent History</h2>
                            <button onClick={clearHistory} className="text-xs text-red-400 hover:text-red-300">Clear View</button>
                        </div>
                        {orders.map(order => (
                            <div key={order.id} className="glass-panel p-4 rounded-xl border border-white/5 opacity-60 hover:opacity-100 transition-opacity">
                                <div className="flex justify-between">
                                    <span className="font-bold text-gray-300">Table {order.tables?.table_number}</span>
                                    <span className="font-mono text-emerald-500">₹{order.total_amount}</span>
                                </div>
                                <p className="text-xs text-gray-500 mt-1">{new Date(order.created_at).toLocaleTimeString()}</p>
                            </div>
                        ))}
                    </div>
                )}

            </div>
        </div>
    );
};
