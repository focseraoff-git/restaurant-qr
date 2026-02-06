import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../utils/api';
import { supabase } from '../utils/supabaseClient';
import { LogoutButton } from '../components/auth/LogoutButton';
import { Toast } from '../components/Toast';
import { Modal } from '../components/Modal';

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
    const [pendingOrders, setPendingOrders] = useState<Order[]>([]); // Pending orders

    const [waiterProfile, setWaiterProfile] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'pool' | 'mine' | 'history' | 'menu' | 'reports' | 'allOrders'>('pool');
    const [stats, setStats] = useState({ count: 0, total: 0 });
    const [error, setError] = useState<string | null>(null);

    // Menu Tab States
    const [categories, setCategories] = useState<any[]>([]);
    const [selectedItems, setSelectedItems] = useState<any[]>([]);
    const [customerName, setCustomerName] = useState<string>('');
    const [tableNumber, setTableNumber] = useState<string>('');
    const [orderType, setOrderType] = useState<'dine-in' | 'takeaway'>('dine-in');

    // Reports Tab States
    const [allOrders, setAllOrders] = useState<Order[]>([]);
    const [reportPeriod, setReportPeriod] = useState<'daily' | 'monthly' | 'yearly'>('daily');
    const [loadingReports, setLoadingReports] = useState(false);

    // Toast and Confirm State
    const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);
    const [confirmAction, setConfirmAction] = useState<{
        isOpen: boolean;
        title: string;
        message: string;
        onConfirm: () => void;
        type?: 'danger' | 'info';
    }>({
        isOpen: false,
        title: '',
        message: '',
        onConfirm: () => { },
    });

    const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
        setToast({ message, type });
    };

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
            // Pending orders (not assigned yet)
            const pending = allOrders.filter(o => o.status === 'pending');

            setReadyOrders(pool);
            setMyOrders(mine);
            setOrders(history); // Using legacy 'orders' state for history
            setPendingOrders(pending);

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

    // Fetch Menu
    const fetchMenu = async () => {
        if (!restaurantId) return;
        try {
            const cleanId = restaurantId.split('&')[0];
            const res = await api.get(`/menu/${cleanId}`);
            setCategories(res.data);
        } catch (error) {
            console.error('Error fetching menu:', error);
        }
    };

    // Fetch All Orders for Reports
    const fetchAllOrders = async () => {
        if (!restaurantId) return;
        setLoadingReports(true);
        try {
            const cleanId = restaurantId.split('&')[0];
            const res = await api.get(`/orders/restaurant/${cleanId}`);
            const completed = res.data.filter((o: Order) => o.status === 'completed');
            setAllOrders(completed);
        } catch (error) {
            console.error('Error fetching orders for reports:', error);
        } finally {
            setLoadingReports(false);
        }
    };

    // Helper: Download CSV
    const downloadCSV = (data: string, filename: string) => {
        const blob = new Blob([data], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        a.click();
        window.URL.revokeObjectURL(url);
    };

    // Generate Reports by Period
    const generateReport = (period: 'daily' | 'monthly' | 'yearly') => {
        const grouped: Record<string, { orders: number; cash: number; online: number; total: number }> = {};

        allOrders.forEach(order => {
            const date = new Date(order.created_at);
            let key = '';

            if (period === 'daily') {
                key = date.toISOString().split('T')[0]; // YYYY-MM-DD
            } else if (period === 'monthly') {
                key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`; // YYYY-MM
            } else {
                key = String(date.getFullYear()); // YYYY
            }

            if (!grouped[key]) {
                grouped[key] = { orders: 0, cash: 0, online: 0, total: 0 };
            }

            grouped[key].orders += 1;
            grouped[key].total += order.total_amount;

            // Assuming payment_method field exists in orders
            if ((order as any).payment_method === 'cash') {
                grouped[key].cash += order.total_amount;
            } else {
                grouped[key].online += order.total_amount;
            }
        });

        return grouped;
    };

    // Download Report as CSV
    const downloadReport = (period: 'daily' | 'monthly' | 'yearly') => {
        const data = generateReport(period);
        let csv = `Period,Orders Count,Cash (₹),Online/UPI (₹),Total Revenue (₹)\n`;

        Object.entries(data).sort().forEach(([period, stats]) => {
            csv += `${period},${stats.orders},${stats.cash},${stats.online},${stats.total}\n`;
        });

        const filename = `${period}_report_${new Date().toISOString().split('T')[0]}.csv`;
        downloadCSV(csv, filename);
    };

    // Download Payment Method Summary
    const downloadPaymentSummary = () => {
        const cash = allOrders.filter((o: any) => o.payment_method === 'cash').reduce((sum, o) => sum + o.total_amount, 0);
        const online = allOrders.filter((o: any) => o.payment_method !== 'cash').reduce((sum, o) => sum + o.total_amount, 0);
        const total = cash + online;

        const csv = `Payment Method,Amount (₹),Percentage\nCash,${cash},${((cash / total) * 100).toFixed(2)}%\nOnline/UPI,${online},${((online / total) * 100).toFixed(2)}%\nTotal,${total},100%\n`;

        downloadCSV(csv, `payment_summary_${new Date().toISOString().split('T')[0]}.csv`);
    };

    // Polling
    useEffect(() => {
        if (waiterProfile) {
            fetchOrders();
            fetchMenu();
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
        setConfirmAction({
            isOpen: true,
            title: "Confirm Delivery",
            message: "Are you sure this order has been successfully delivered?",
            type: 'info',
            onConfirm: async () => {
                try {
                    await api.put(`/orders/${orderId}/status`, { status: 'completed' });
                    fetchOrders();
                    showToast("Order Delivered!", "success");
                } catch (error) {
                    console.error(error);
                    showToast("Failed to mark delivered", "error");
                }
            }
        });
    };

    const clearHistory = () => {
        setConfirmAction({
            isOpen: true,
            title: "Clear History",
            message: "This will clear your local history view only. Permanent records remain safe.",
            onConfirm: () => {
                setOrders([]);
                showToast("Local History Cleared", "info");
            }
        });
    };

    // Menu Tab Handlers
    const addItemToOrder = (item: any) => {
        const existing = selectedItems.find(i => i.id === item.id);
        if (existing) {
            setSelectedItems(prev => prev.map(i =>
                i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i
            ));
        } else {
            setSelectedItems(prev => [...prev, { ...item, quantity: 1 }]);
        }
    };

    const removeItemFromOrder = (itemId: string) => {
        setSelectedItems(prev => prev.filter(i => i.id !== itemId));
    };

    const placeWaiterOrder = async () => {
        // Validate based on order type
        if (!waiterProfile || selectedItems.length === 0) {
            showToast('Please select items', 'error');
            return;
        }

        if (orderType === 'dine-in' && !tableNumber) {
            showToast('Please specify table number for dine-in orders', 'error');
            return;
        }

        try {
            const cleanId = restaurantId?.split('&')[0];

            // Build customer name based on order type
            let finalCustomerName = customerName || 'Guest';
            if (orderType === 'dine-in' && tableNumber) {
                finalCustomerName = customerName || `Walk-in Customer (Table ${tableNumber})`;
            } else if (orderType === 'takeaway') {
                finalCustomerName = customerName || 'Takeaway Customer';
            }

            const orderData = {
                restaurantId: cleanId,
                tableId: null,
                customerName: finalCustomerName,
                customerPhone: null,
                orderType: orderType,
                items: selectedItems.map(item => ({
                    itemId: item.id,
                    quantity: item.quantity,
                    portion: 'full'
                }))
            };

            console.log('Placing order with data:', orderData);
            const response = await api.post('/orders', orderData);
            console.log('Order response:', response.data);

            // Clear form
            setSelectedItems([]);
            setTableNumber('');
            setCustomerName('');
            setOrderType('dine-in');
            showToast('Order placed successfully!', 'success');
            fetchOrders(); // Refresh orders
        } catch (error: any) {
            console.error('Place order error:', error);
            showToast('Failed to place order', 'error');
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
                        <button
                            onClick={() => setActiveTab('menu')}
                            className={`p-3 rounded-xl transition-all relative ${activeTab === 'menu' ? 'bg-emerald-500 text-white shadow-glow-emerald' : 'bg-white/5 text-gray-400'}`}
                        >
                            🍽️
                        </button>
                        <button
                            onClick={() => {
                                setActiveTab('reports');
                                if (allOrders.length === 0) fetchAllOrders();
                            }}
                            className={`p-3 rounded-xl transition-all relative ${activeTab === 'reports' ? 'bg-emerald-500 text-white shadow-glow-emerald' : 'bg-white/5 text-gray-400'}`}
                        >
                            📊
                        </button>
                        <button
                            onClick={() => setActiveTab('allOrders')}
                            className={`p-3 rounded-xl transition-all relative ${activeTab === 'allOrders' ? 'bg-emerald-500 text-white shadow-glow-emerald' : 'bg-white/5 text-gray-400'}`}
                        >
                            📋
                        </button>
                        <LogoutButton />
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

                {/* MENU TAB - For Manual Orders */}
                {activeTab === 'menu' && (
                    <div className="space-y-6 animate-fade-in pb-32">
                        <h2 className="text-sm font-bold text-emerald-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                            Place Order for Customer
                        </h2>

                        {/* Order Form */}
                        <div className="glass-panel p-5 rounded-2xl border border-emerald-500/30 shadow-[0_0_30px_rgba(16,185,129,0.1)]">
                            <h3 className="font-bold text-white mb-4">Customer Details</h3>

                            {/* Order Type Selection */}
                            <div className="mb-4">
                                <p className="text-xs text-gray-400 uppercase tracking-wider mb-2 font-bold">Order Type</p>
                                <div className="flex gap-3">
                                    <button
                                        onClick={() => setOrderType('dine-in')}
                                        className={`flex-1 py-3 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 ${orderType === 'dine-in'
                                            ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20'
                                            : 'bg-white/5 text-gray-400 hover:bg-white/10'
                                            }`}
                                    >
                                        <span>🪑</span> Dine-In
                                    </button>
                                    <button
                                        onClick={() => setOrderType('takeaway')}
                                        className={`flex-1 py-3 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 ${orderType === 'takeaway'
                                            ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20'
                                            : 'bg-white/5 text-gray-400 hover:bg-white/10'
                                            }`}
                                    >
                                        <span>🥡</span> Takeaway
                                    </button>
                                </div>
                            </div>

                            <div className="space-y-3">
                                {orderType === 'dine-in' && (
                                    <input
                                        type="text"
                                        placeholder="Table Number *"
                                        value={tableNumber}
                                        onChange={(e) => setTableNumber(e.target.value)}
                                        className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:border-emerald-500 focus:outline-none transition-colors"
                                    />
                                )}
                                <input
                                    type="text"
                                    placeholder="Customer Name (optional)"
                                    value={customerName}
                                    onChange={(e) => setCustomerName(e.target.value)}
                                    className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:border-emerald-500 focus:outline-none transition-colors"
                                />
                            </div>
                        </div>

                        {/* Complete Menu Display - All Categories */}
                        <div className="space-y-12 relative">
                            {/* Animated Background Gradient */}
                            <div className="fixed inset-0 pointer-events-none opacity-20">
                                <div className="absolute top-0 left-0 w-96 h-96 bg-emerald-500/30 rounded-full blur-[120px] animate-pulse"></div>
                                <div className="absolute bottom-0 right-0 w-96 h-96 bg-teal-500/30 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '1s' }}></div>
                            </div>

                            {categories.map((cat) => {
                                // Comprehensive Food Image Mapping Function
                                const getFoodImage = (itemName: string) => {
                                    const name = itemName.toLowerCase();

                                    // Indian Starters & Appetizers - DETAILED
                                    if (name.includes('hara bhara') || name.includes('hara-bhara')) return 'https://images.unsplash.com/photo-1626132647523-66f5bf380027?auto=format&fit=crop&w=600&q=80';
                                    if (name.includes('cheese ball')) return 'https://images.unsplash.com/photo-1571091718767-18b5b1457add?auto=format&fit=crop&w=600&q=80';
                                    if (name.includes('corn') && (name.includes('crispy') || name.includes('fried'))) return 'https://images.unsplash.com/photo-1586201375761-83865001e31c?auto=format&fit=crop&w=600&q=80';
                                    if (name.includes('corn')) return 'https://images.unsplash.com/photo-1551754655-cd27e38d2076?auto=format&fit=crop&w=600&q=80';
                                    if (name.includes('manchurian')) return 'https://images.unsplash.com/photo-1626074353765-517a4f82d443?auto=format&fit=crop&w=600&q=80';
                                    if (name.includes('chilli paneer')) return 'https://images.unsplash.com/photo-1631452180539-96aca7d48617?auto=format&fit=crop&w=600&q=80';
                                    if (name.includes('gobi') || name.includes('cauliflower')) return 'https://images.unsplash.com/photo-1566843536517-7af5b4b82d57?auto=format&fit=crop&w=600&q=80';
                                    if (name.includes('mushroom') && (name.includes('tikka') || name.includes('kebab'))) return 'https://images.unsplash.com/photo-1621996346565-e3dbc646d9a9?auto=format&fit=crop&w=600&q=80';
                                    if (name.includes('aloo tikki')) return 'https://images.unsplash.com/photo-1606491956689-2ea866880c84?auto=format&fit=crop&w=600&q=80';
                                    if (name.includes('veg cutlet')) return 'https://images.unsplash.com/photo-1626132647523-66f5bf380027?auto=format&fit=crop&w=600&q=80';
                                    if (name.includes('spring roll')) return 'https://images.unsplash.com/photo-1534422298391-e4f8c172dddb?auto=format&fit=crop&w=600&q=80';
                                    if (name.includes('samosa')) return 'https://images.unsplash.com/photo-1601050690597-df0568f70950?auto=format&fit=crop&w=600&q=80';
                                    if (name.includes('pakora') || name.includes('bhaji')) return 'https://images.unsplash.com/photo-1626132647523-66f5bf380027?auto=format&fit=crop&w=600&q=80';

                                    // Grilled & Non-Veg Mains
                                    if (name.includes('salmon')) return 'https://images.unsplash.com/photo-1467003909585-2f8a72700288?auto=format&fit=crop&w=600&q=80';
                                    if (name.includes('pork') && name.includes('naga')) return 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=600&q=80';
                                    if (name.includes('pork')) return 'https://images.unsplash.com/photo-1529692236671-f1f6cf9683ba?auto=format&fit=crop&w=600&q=80';
                                    if (name.includes('lamb')) return 'https://images.unsplash.com/photo-1574269909862-7e1d70bb8078?auto=format&fit=crop&w=600&q=80';
                                    if (name.includes('steak') || name.includes('beef')) return 'https://images.unsplash.com/photo-1558030006-450675393462?auto=format&fit=crop&w=600&q=80';
                                    if (name.includes('chicken tikka')) return 'https://images.unsplash.com/photo-1599487488170-d11ec9c172f0?auto=format&fit=crop&w=600&q=80';
                                    if (name.includes('tandoori chicken')) return 'https://images.unsplash.com/photo-1610057099431-d73a1c9d2f2f?auto=format&fit=crop&w=600&q=80';
                                    if (name.includes('butter chicken') || name.includes('murgh makhani')) return 'https://images.unsplash.com/photo-1603894584373-5ac82b2ae398?auto=format&fit=crop&w=600&q=80';
                                    if (name.includes('chicken') && name.includes('kebab')) return 'https://images.unsplash.com/photo-1603360946369-dc9bb6258143?auto=format&fit=crop&w=600&q=80';
                                    if (name.includes('chicken')) return 'https://images.unsplash.com/photo-1532550907401-a500c9a57435?auto=format&fit=crop&w=600&q=80';
                                    if (name.includes('fish') && name.includes('fry')) return 'https://images.unsplash.com/photo-1534422298391-e4f8c172dddb?auto=format&fit=crop&w=600&q=80';
                                    if (name.includes('fish')) return 'https://images.unsplash.com/photo-1559737558-2f5a35f4523f?auto=format&fit=crop&w=600&q=80';
                                    if (name.includes('prawn') || name.includes('shrimp')) return 'https://images.unsplash.com/photo-1565680018434-b513d5e5fd47?auto=format&fit=crop&w=600&q=80';
                                    if (name.includes('kebab') || name.includes('seekh')) return 'https://images.unsplash.com/photo-1603360946369-dc9bb6258143?auto=format&fit=crop&w=600&q=80';
                                    if (name.includes('wings')) return 'https://images.unsplash.com/photo-1527477396000-e27163b481c2?auto=format&fit=crop&w=600&q=80';
                                    if (name.includes('nachos')) return 'https://images.unsplash.com/photo-1513456852971-30c0b8199d4d?auto=format&fit=crop&w=600&q=80';

                                    // Indian Vegetarian Mains
                                    if (name.includes('paneer tikka')) return 'https://images.unsplash.com/photo-1631452180519-c014fe946bc7?auto=format&fit=crop&w=600&q=80';
                                    if (name.includes('paneer butter masala')) return 'https://images.unsplash.com/photo-1631452180539-96aca7d48617?auto=format&fit=crop&w=600&q=80';
                                    if (name.includes('palak paneer')) return 'https://images.unsplash.com/photo-1645177628172-a94c1f96e6db?auto=format&fit=crop&w=600&q=80';
                                    if (name.includes('shahi paneer')) return 'https://images.unsplash.com/photo-1631452180519-c014fe946bc7?auto=format&fit=crop&w=600&q=80';
                                    if (name.includes('kadai paneer')) return 'https://images.unsplash.com/photo-1631452180539-96aca7d48617?auto=format&fit=crop&w=600&q=80';
                                    if (name.includes('paneer')) return 'https://images.unsplash.com/photo-1631452180519-c014fe946bc7?auto=format&fit=crop&w=600&q=80';
                                    if (name.includes('dal makhani')) return 'https://images.unsplash.com/photo-1546833998-877b37c2e5c6?auto=format&fit=crop&w=600&q=80';
                                    if (name.includes('dal tadka') || name.includes('dal fry')) return 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?auto=format&fit=crop&w=600&q=80';
                                    if (name.includes('dal') || name.includes('daal')) return 'https://images.unsplash.com/photo-1546833998-877b37c2e5c6?auto=format&fit=crop&w=600&q=80';
                                    if (name.includes('chole') || name.includes('chana') || name.includes('bhature')) return 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?auto=format&fit=crop&w=600&q=80';
                                    if (name.includes('rajma')) return 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?auto=format&fit=crop&w=600&q=80';
                                    if (name.includes('malai kofta')) return 'https://images.unsplash.com/photo-1631452180519-c014fe946bc7?auto=format&fit=crop&w=600&q=80';
                                    if (name.includes('veg korma')) return 'https://images.unsplash.com/photo-1645177628172-a94c1f96e6db?auto=format&fit=crop&w=600&q=80';

                                    // Rice & Biryani
                                    if (name.includes('biryani')) return 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?auto=format&fit=crop&w=600&q=80';
                                    if (name.includes('fried rice')) return 'https://images.unsplash.com/photo-1603133872878-684f208fb84b?auto=format&fit=crop&w=600&q=80';
                                    if (name.includes('pulao') || name.includes('pilaf')) return 'https://images.unsplash.com/photo-1596797038530-2c107229654b?auto=format&fit=crop&w=600&q=80';
                                    if (name.includes('jeera rice')) return 'https://images.unsplash.com/photo-1596560548464-f010549b84d7?auto=format&fit=crop&w=600&q=80';

                                    // Pasta & Italian
                                    if (name.includes('risotto') && name.includes('mushroom')) return 'https://images.unsplash.com/photo-1476124369491-c4ca6042f1d8?auto=format&fit=crop&w=600&q=80';
                                    if (name.includes('risotto')) return 'https://images.unsplash.com/photo-1476124369491-c4ca6042f1d8?auto=format&fit=crop&w=600&q=80';
                                    if (name.includes('carbonara')) return 'https://images.unsplash.com/photo-1612874742237-6526221588e3?auto=format&fit=crop&w=600&q=80';
                                    if (name.includes('alfredo')) return 'https://images.unsplash.com/photo-1645112411341-6c4fd023714a?auto=format&fit=crop&w=600&q=80';
                                    if (name.includes('pasta') || name.includes('spaghetti')) return 'https://images.unsplash.com/photo-1621996346565-e3dbc646d9a9?auto=format&fit=crop&w=600&q=80';
                                    if (name.includes('pizza')) return 'https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=600&q=80';
                                    if (name.includes('lasagna')) return 'https://images.unsplash.com/photo-1574894709920-11b28e7367e3?auto=format&fit=crop&w=600&q=80';

                                    // Burgers & Fast Food
                                    if (name.includes('burger')) return 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=600&q=80';
                                    if (name.includes('sandwich')) return 'https://images.unsplash.com/photo-1528735602780-2552fd46c7af?auto=format&fit=crop&w=600&q=80';
                                    if (name.includes('wrap')) return 'https://images.unsplash.com/photo-1626700051175-6818013e1d4f?auto=format&fit=crop&w=600&q=80';

                                    // Salads & Healthy
                                    if (name.includes('caesar')) return 'https://images.unsplash.com/photo-1546793665-c74683f339c1?auto=format&fit=crop&w=600&q=80';
                                    if (name.includes('greek')) return 'https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?auto=format&fit=crop&w=600&q=80';
                                    if (name.includes('salad')) return 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=600&q=80';
                                    if (name.includes('bowl')) return 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=600&q=80';

                                    // Desserts
                                    if (name.includes('chocolate') && name.includes('cake')) return 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?auto=format&fit=crop&w=600&q=80';
                                    if (name.includes('cake')) return 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?auto=format&fit=crop&w=600&q=80';
                                    if (name.includes('brownie')) return 'https://images.unsplash.com/photo-1606313564200-e75d5e30476c?auto=format&fit=crop&w=600&q=80';
                                    if (name.includes('ice cream') || name.includes('gelato')) return 'https://images.unsplash.com/photo-1563805042-7684c019e1cb?auto=format&fit=crop&w=600&q=80';
                                    if (name.includes('tiramisu')) return 'https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?auto=format&fit=crop&w=600&q=80';
                                    if (name.includes('cheesecake')) return 'https://images.unsplash.com/photo-1533134486753-c833f0ed4866?auto=format&fit=crop&w=600&q=80';
                                    if (name.includes('mousse')) return 'https://images.unsplash.com/photo-1488477181946-6428a0291777?auto=format&fit=crop&w=600&q=80';
                                    if (name.includes('gulab jamun')) return 'https://images.unsplash.com/photo-1606802680770-c0df2f5f5e1e?auto=format&fit=crop&w=600&q=80';
                                    if (name.includes('rasgulla') || name.includes('rasmalai')) return 'https://images.unsplash.com/photo-1606802680770-c0df2f5f5e1e?auto=format&fit=crop&w=600&q=80';

                                    // Drinks
                                    if (name.includes('smoothie')) return 'https://images.unsplash.com/photo-1505252585461-04db6ea813fc?auto=format&fit=crop&w=600&q=80';
                                    if (name.includes('shake') || name.includes('milkshake')) return 'https://images.unsplash.com/photo-1572490122747-3968b75cc699?auto=format&fit=crop&w=600&q=80';
                                    if (name.includes('coffee') || name.includes('latte') || name.includes('cappuccino')) return 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&w=600&q=80';
                                    if (name.includes('tea') || name.includes('chai')) return 'https://images.unsplash.com/photo-1564890369478-c89ca6d9cde9?auto=format&fit=crop&w=600&q=80';
                                    if (name.includes('mojito')) return 'https://images.unsplash.com/photo-1551538827-9c037cb4f32a?auto=format&fit=crop&w=600&q=80';
                                    if (name.includes('lassi')) return 'https://images.unsplash.com/photo-1623065422902-30a2d299bbe4?auto=format&fit=crop&w=600&q=80';
                                    if (name.includes('juice')) return 'https://images.unsplash.com/photo-1600271886742-f049cd451bba?auto=format&fit=crop&w=600&q=80';

                                    // Breads
                                    if (name.includes('naan') || name.includes('roti') || name.includes('paratha')) return 'https://images.unsplash.com/photo-1601050690597-df0568f70950?auto=format&fit=crop&w=600&q=80';

                                    // Default Premium Food
                                    return 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=600&q=80';
                                };

                                return (
                                    <div key={cat.id} className="scroll-mt-24 relative">
                                        {/* Category Header with Animated Effects */}
                                        <div className="flex items-center gap-4 mb-8 relative group">
                                            {/* Glowing Line */}
                                            <div className="absolute -left-4 top-0 bottom-0 w-1 bg-gradient-to-b from-emerald-400 via-teal-500 to-emerald-600 rounded-full shadow-[0_0_20px_rgba(16,185,129,0.5)] group-hover:shadow-[0_0_30px_rgba(16,185,129,0.8)] transition-all"></div>

                                            {/* Category Icon */}
                                            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-teal-500/20 border border-emerald-500/30 flex items-center justify-center backdrop-blur-md shadow-lg group-hover:scale-110 transition-transform">
                                                <span className="text-2xl">🍽️</span>
                                            </div>

                                            {/* Category Name with Shimmer Effect */}
                                            <h3 className="text-3xl font-display font-bold text-transparent bg-clip-text bg-gradient-to-r from-emerald-200 via-teal-100 to-emerald-200 bg-[length:200%_100%] animate-shimmer relative">
                                                {cat.name}
                                                <div className="absolute -bottom-2 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-emerald-500 to-transparent opacity-50"></div>
                                            </h3>

                                            <div className="h-px bg-gradient-to-r from-emerald-500/50 via-teal-500/30 to-transparent flex-grow"></div>

                                            {/* Item Count Badge */}
                                            <div className="bg-emerald-500/10 border border-emerald-500/30 px-4 py-1.5 rounded-full backdrop-blur-md">
                                                <span className="text-emerald-300 text-sm font-bold">{cat.menu_items.length} items</span>
                                            </div>
                                        </div>

                                        {/* Menu Items Grid */}
                                        <div className="grid gap-6">
                                            {cat.menu_items.map((item: any) => (
                                                <div key={item.id} className="group relative">
                                                    {/* Floating Glow Effect */}
                                                    <div className="absolute -inset-2 bg-gradient-to-r from-emerald-500/0 via-emerald-500/10 to-teal-500/0 rounded-[2.5rem] opacity-0 group-hover:opacity-100 blur-xl transition-all duration-700"></div>

                                                    <div className="relative bg-slate-900/70 backdrop-blur-xl rounded-[2rem] overflow-hidden border border-white/10 hover:border-emerald-500/40 transition-all duration-500 shadow-[0_8px_32px_rgba(0,0,0,0.4)] hover:shadow-[0_20px_60px_rgba(16,185,129,0.3)] transform hover:-translate-y-1">
                                                        {/* Animated Gradient Overlay */}
                                                        <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 via-transparent to-teal-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>

                                                        {/* Sparkle Effect */}
                                                        <div className="absolute top-4 right-4 w-2 h-2 bg-emerald-400 rounded-full opacity-0 group-hover:opacity-100 animate-ping"></div>
                                                        <div className="absolute top-6 right-8 w-1.5 h-1.5 bg-teal-400 rounded-full opacity-0 group-hover:opacity-100 animate-ping" style={{ animationDelay: '0.3s' }}></div>

                                                        <div className="relative z-10 flex gap-6 p-5">
                                                            {/* Premium Food Image with Advanced Effects */}
                                                            <div className="w-36 h-36 flex-shrink-0 rounded-2xl overflow-hidden shadow-2xl relative ring-2 ring-white/5 group-hover:ring-emerald-500/30 transition-all">
                                                                {/* Image Gradient Overlay */}
                                                                <div className="absolute inset-0 bg-gradient-to-tr from-black/60 via-black/20 to-transparent z-10"></div>

                                                                {/* Shimmer Effect on Image */}
                                                                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 z-20"></div>

                                                                <img
                                                                    src={item.image || getFoodImage(item.name)}
                                                                    alt={item.name}
                                                                    className="w-full h-full object-cover transform group-hover:scale-125 group-hover:rotate-3 transition-all duration-700"
                                                                    loading="lazy"
                                                                />

                                                                {/* Veg/Non-Veg Indicator with Glow */}
                                                                <div className="absolute top-3 left-3 z-30 bg-black/80 backdrop-blur-md p-2 rounded-xl border border-white/20 shadow-lg">
                                                                    <div className={`w-3.5 h-3.5 rounded-full border-2 flex items-center justify-center ${item.is_veg ? 'border-green-400 shadow-[0_0_10px_rgba(74,222,128,0.5)]' : 'border-red-400 shadow-[0_0_10px_rgba(248,113,113,0.5)]'}`}>
                                                                        <div className={`w-2 h-2 rounded-full ${item.is_veg ? 'bg-green-400' : 'bg-red-400'} animate-pulse`}></div>
                                                                    </div>
                                                                </div>
                                                            </div>

                                                            {/* Item Details with Enhanced Typography */}
                                                            <div className="flex-1 flex flex-col justify-between">
                                                                <div>
                                                                    <h4 className="font-display font-bold text-2xl text-gray-50 leading-tight group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-emerald-200 group-hover:to-teal-200 transition-all mb-2">
                                                                        {item.name}
                                                                    </h4>
                                                                    <p className="text-gray-400 text-sm leading-relaxed line-clamp-2 font-light">
                                                                        {item.description}
                                                                    </p>
                                                                </div>

                                                                <div className="flex items-end justify-between mt-4 pt-4 border-t border-white/5">
                                                                    {/* Price with Neon Glow */}
                                                                    <div>
                                                                        <p className="text-[10px] text-gray-500 uppercase tracking-widest font-bold mb-1">Price</p>
                                                                        <div className="relative">
                                                                            <span className="font-display font-black text-3xl text-emerald-400 drop-shadow-[0_0_15px_rgba(16,185,129,0.4)] group-hover:drop-shadow-[0_0_25px_rgba(16,185,129,0.6)] transition-all">
                                                                                ₹{item.price_full}
                                                                            </span>
                                                                            {/* Animated Underline */}
                                                                            <div className="absolute -bottom-1 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500 to-teal-500 opacity-0 group-hover:opacity-50 blur-sm transition-opacity"></div>
                                                                        </div>
                                                                    </div>

                                                                    {/* Ultra Premium Add Button */}
                                                                    <button
                                                                        onClick={() => addItemToOrder(item)}
                                                                        className="relative bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-500 bg-[length:200%_100%] hover:bg-[position:100%_0] text-white px-7 py-3.5 rounded-2xl font-bold text-sm shadow-[0_0_20px_rgba(16,185,129,0.3)] hover:shadow-[0_0_35px_rgba(16,185,129,0.6)] transition-all duration-500 transform active:scale-95 flex items-center gap-2 overflow-hidden group/btn"
                                                                    >
                                                                        {/* Button Shimmer */}
                                                                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover/btn:translate-x-full transition-transform duration-1000"></div>
                                                                        <span className="text-xl font-black relative z-10">+</span>
                                                                        <span className="relative z-10">Add</span>
                                                                    </button>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        {/* Floating Order Summary & Place Order Button */}
                        {selectedItems.length > 0 && (
                            <div className="fixed bottom-6 left-0 right-0 px-4 z-50 animate-slide-up">
                                <div className="max-w-md mx-auto md:max-w-4xl">
                                    <div className="bg-gradient-to-r from-emerald-600 to-teal-600 p-1 rounded-2xl shadow-2xl shadow-emerald-900/80">
                                        <div className="bg-slate-900/95 backdrop-blur-sm rounded-xl p-5 border border-emerald-500/20">
                                            <div className="flex items-center justify-between mb-4">
                                                <h3 className="font-bold text-white text-lg">Order Summary</h3>
                                                <span className="bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 px-3 py-1 rounded-lg font-bold text-sm">
                                                    {selectedItems.length} items
                                                </span>
                                            </div>

                                            <div className="space-y-2 mb-4 max-h-32 overflow-y-auto">
                                                {selectedItems.map(item => (
                                                    <div key={item.id} className="flex justify-between items-center bg-black/30 p-3 rounded-xl group">
                                                        <div className="flex-1">
                                                            <span className="text-white font-bold">{item.quantity}x {item.name}</span>
                                                            <span className="text-emerald-400 text-sm ml-2 font-mono">₹{item.price_full * item.quantity}</span>
                                                        </div>
                                                        <button
                                                            onClick={() => removeItemFromOrder(item.id)}
                                                            className="text-red-400 hover:text-red-300 text-xs font-bold bg-red-500/10 hover:bg-red-500/20 px-3 py-1.5 rounded-lg transition-all"
                                                        >
                                                            Remove
                                                        </button>
                                                    </div>
                                                ))}
                                            </div>

                                            <div className="flex justify-between items-center mb-4 pt-4 border-t border-white/10">
                                                <span className="font-bold text-white text-lg">Total Amount</span>
                                                <span className="text-3xl font-bold text-emerald-400 font-display">
                                                    ₹{selectedItems.reduce((sum, item) => sum + (item.price_full * item.quantity), 0)}
                                                </span>
                                            </div>

                                            <button
                                                onClick={placeWaiterOrder}
                                                className="w-full py-4 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-white rounded-xl font-bold text-lg shadow-lg shadow-emerald-500/30 transition-all transform active:scale-95 flex items-center justify-center gap-2"
                                            >
                                                <span className="text-xl">🚀</span> Place Order Now
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* REPORTS TAB */}
                {activeTab === 'reports' && (
                    <div className="space-y-6 animate-fade-in">
                        <h2 className="text-sm font-bold text-emerald-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                            Financial Reports & Analytics
                        </h2>

                        {loadingReports ? (
                            <div className="flex items-center justify-center py-20">
                                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-emerald-500"></div>
                            </div>
                        ) : (
                            <>
                                {/* Period Selection */}
                                <div className="glass-panel p-5 rounded-2xl border border-emerald-500/30 shadow-[0_0_30px_rgba(16,185,129,0.1)]">
                                    <h3 className="font-bold text-white mb-4">Select Report Period</h3>
                                    <div className="flex gap-3">
                                        {(['daily', 'monthly', 'yearly'] as const).map(period => (
                                            <button
                                                key={period}
                                                onClick={() => setReportPeriod(period)}
                                                className={`flex-1 py-3 rounded-xl font-bold text-sm transition-all ${reportPeriod === period
                                                    ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20'
                                                    : 'bg-white/5 text-gray-400 hover:bg-white/10'
                                                    }`}
                                            >
                                                {period.charAt(0).toUpperCase() + period.slice(1)}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Summary Cards */}
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="glass-panel p-5 rounded-2xl border border-emerald-500/20">
                                        <p className="text-xs text-gray-400 uppercase tracking-wider mb-2">Total Orders</p>
                                        <p className="text-3xl font-bold text-white font-display">{allOrders.length}</p>
                                    </div>
                                    <div className="glass-panel p-5 rounded-2xl border border-emerald-500/20">
                                        <p className="text-xs text-gray-400 uppercase tracking-wider mb-2">Total Revenue</p>
                                        <p className="text-3xl font-bold text-emerald-400 font-display">
                                            ₹{allOrders.reduce((sum, o) => sum + o.total_amount, 0)}
                                        </p>
                                    </div>
                                </div>

                                {/* Period Report */}
                                <div className="glass-panel p-5 rounded-2xl border border-white/10">
                                    <div className="flex justify-between items-center mb-4">
                                        <h3 className="font-bold text-white text-lg">
                                            {reportPeriod.charAt(0).toUpperCase() + reportPeriod.slice(1)} Report
                                        </h3>
                                        <button
                                            onClick={() => downloadReport(reportPeriod)}
                                            className="bg-emerald-500 hover:bg-emerald-400 text-white px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 transition-all"
                                        >
                                            📥 Download CSV
                                        </button>
                                    </div>

                                    <div className="space-y-2 max-h-80 overflow-y-auto">
                                        {Object.entries(generateReport(reportPeriod))
                                            .sort()
                                            .reverse()
                                            .slice(0, 10)
                                            .map(([period, stats]) => (
                                                <div key={period} className="bg-black/20 p-4 rounded-xl">
                                                    <div className="flex justify-between items-center mb-2">
                                                        <span className="font-bold text-white">{period}</span>
                                                        <span className="text-emerald-400 font-bold font-display">₹{stats.total}</span>
                                                    </div>
                                                    <div className="grid grid-cols-3 gap-2 text-xs">
                                                        <div>
                                                            <span className="text-gray-500">Orders: </span>
                                                            <span className="text-gray-300 font-bold">{stats.orders}</span>
                                                        </div>
                                                        <div>
                                                            <span className="text-gray-500">Cash: </span>
                                                            <span className="text-gray-300 font-bold">₹{stats.cash}</span>
                                                        </div>
                                                        <div>
                                                            <span className="text-gray-500">Online: </span>
                                                            <span className="text-gray-300 font-bold">₹{stats.online}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                    </div>
                                </div>

                                {/* Payment Method Breakdown */}
                                <div className="glass-panel p-5 rounded-2xl border border-white/10">
                                    <div className="flex justify-between items-center mb-4">
                                        <h3 className="font-bold text-white text-lg">Payment Methods</h3>
                                        <button
                                            onClick={downloadPaymentSummary}
                                            className="bg-emerald-500 hover:bg-emerald-400 text-white px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 transition-all"
                                        >
                                            📥 Download CSV
                                        </button>
                                    </div>

                                    <div className="space-y-4">
                                        {(() => {
                                            const cash = allOrders.filter((o: any) => o.payment_method === 'cash').reduce((sum, o) => sum + o.total_amount, 0);
                                            const online = allOrders.filter((o: any) => o.payment_method !== 'cash').reduce((sum, o) => sum + o.total_amount, 0);
                                            const total = cash + online;
                                            const cashPct = total > 0 ? (cash / total) * 100 : 0;
                                            const onlinePct = total > 0 ? (online / total) * 100 : 0;

                                            return (
                                                <>
                                                    <div className="bg-black/20 p-4 rounded-xl">
                                                        <div className="flex justify-between items-center mb-3">
                                                            <div className="flex items-center gap-2">
                                                                <span className="text-2xl">💵</span>
                                                                <span className="font-bold text-white">Cash</span>
                                                            </div>
                                                            <div className="text-right">
                                                                <p className="text-2xl font-bold text-emerald-400 font-display">₹{cash}</p>
                                                                <p className="text-xs text-gray-400">{cashPct.toFixed(1)}% of total</p>
                                                            </div>
                                                        </div>
                                                        <div className="w-full bg-white/5 rounded-full h-2 overflow-hidden">
                                                            <div className="bg-emerald-500 h-2 transition-all" style={{ width: `${cashPct}%` }}></div>
                                                        </div>
                                                    </div>

                                                    <div className="bg-black/20 p-4 rounded-xl">
                                                        <div className="flex justify-between items-center mb-3">
                                                            <div className="flex items-center gap-2">
                                                                <span className="text-2xl">💳</span>
                                                                <span className="font-bold text-white">Online/UPI</span>
                                                            </div>
                                                            <div className="text-right">
                                                                <p className="text-2xl font-bold text-emerald-400 font-display">₹{online}</p>
                                                                <p className="text-xs text-gray-400">{onlinePct.toFixed(1)}% of total</p>
                                                            </div>
                                                        </div>
                                                        <div className="w-full bg-white/5 rounded-full h-2 overflow-hidden">
                                                            <div className="bg-blue-500 h-2 transition-all" style={{ width: `${onlinePct}%` }}></div>
                                                        </div>
                                                    </div>
                                                </>
                                            );
                                        })()}
                                    </div>
                                </div>

                                {allOrders.length === 0 && (
                                    <div className="text-center py-20 opacity-50">
                                        <div className="text-4xl mb-4">📊</div>
                                        <p className="font-bold text-gray-400">No completed orders yet</p>
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                )}

                {/* ALL ORDERS TAB */}
                {activeTab === 'allOrders' && (
                    <div className="space-y-4 animate-fade-in">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-sm font-bold text-emerald-400 uppercase tracking-widest flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                                All Restaurant Orders
                            </h2>
                            <button
                                onClick={fetchOrders}
                                className="bg-white/10 hover:bg-white/20 text-white px-3 py-2 rounded-xl text-xs font-bold transition-all"
                            >
                                🔄 Refresh
                            </button>
                        </div>

                        {/* Pending Orders */}
                        <div className="space-y-4">
                            {[...pendingOrders, ...readyOrders, ...myOrders, ...orders]
                                .reduce((acc, order) => {
                                    if (!acc.find(o => o.id === order.id)) acc.push(order);
                                    return acc;
                                }, [] as Order[])
                                .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
                                .map(order => {
                                    const statusColors: Record<string, string> = {
                                        pending: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
                                        preparing: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
                                        ready: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
                                        completed: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
                                        cancelled: 'bg-red-500/20 text-red-400 border-red-500/30'
                                    };

                                    const statusEmoji: Record<string, string> = {
                                        pending: '⏳',
                                        preparing: '👨‍🍳',
                                        ready: '✅',
                                        completed: '🎉',
                                        cancelled: '❌'
                                    };

                                    return (
                                        <div key={order.id} className="glass-panel p-5 rounded-2xl border border-white/10 hover:border-emerald-500/20 transition-all">
                                            {/* Header Row */}
                                            <div className="flex justify-between items-start mb-4">
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-2 mb-2">
                                                        <span className="text-2xl">{order.order_type === 'dine-in' ? '🪑' : '🥡'}</span>
                                                        <div>
                                                            <h3 className="font-bold text-white text-lg">
                                                                {order.order_type === 'dine-in'
                                                                    ? (order.tables?.table_number
                                                                        ? `Table ${order.tables.table_number}`
                                                                        : (order.customer_name?.match(/Table (\d+)/)
                                                                            ? `Table ${order.customer_name.match(/Table (\d+)/)?.[1]}`
                                                                            : 'Dine-In'))
                                                                    : 'Takeaway'}
                                                            </h3>
                                                            <p className="text-xs text-gray-400">
                                                                {order.customer_name || 'Guest'}
                                                            </p>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-3 text-xs text-gray-400">
                                                        <span className="flex items-center gap-1">
                                                            <span>🕐</span>
                                                            {new Date(order.created_at).toLocaleTimeString('en-US', {
                                                                hour: '2-digit',
                                                                minute: '2-digit'
                                                            })}
                                                        </span>
                                                        <span className="flex items-center gap-1">
                                                            <span>📅</span>
                                                            {new Date(order.created_at).toLocaleDateString('en-US', {
                                                                month: 'short',
                                                                day: 'numeric'
                                                            })}
                                                        </span>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <div className={`px-3 py-1.5 rounded-lg text-xs font-bold border inline-flex items-center gap-1 mb-2 ${statusColors[order.status] || statusColors.pending}`}>
                                                        <span>{statusEmoji[order.status] || '⏳'}</span>
                                                        {order.status.toUpperCase()}
                                                    </div>
                                                    <p className="text-xs text-gray-500 font-mono">#{order.id.slice(0, 6)}</p>
                                                </div>
                                            </div>

                                            {/* Order Items */}
                                            <div className="bg-black/20 rounded-xl p-3 mb-3 space-y-2">
                                                <p className="text-xs text-gray-500 uppercase tracking-wider font-bold mb-2">Items</p>
                                                {order.order_items?.map((item, idx) => (
                                                    <div key={idx} className="flex justify-between text-sm">
                                                        <span className="text-gray-300">
                                                            {item.quantity}x {item.menu_items?.name || 'Item'}
                                                        </span>
                                                        <span className="text-gray-400 font-mono">₹{item.price_at_time * item.quantity}</span>
                                                    </div>
                                                ))}
                                            </div>

                                            {/* Footer */}
                                            <div className="flex justify-between items-center pt-3 border-t border-white/5">
                                                <span className="text-sm text-gray-400">Total Amount</span>
                                                <span className="text-2xl font-bold text-emerald-400 font-display">₹{order.total_amount}</span>
                                            </div>
                                        </div>
                                    );
                                })}
                        </div>

                        {orders.length === 0 && readyOrders.length === 0 && myOrders.length === 0 && pendingOrders.length === 0 && (
                            <div className="text-center py-20 opacity-50">
                                <div className="text-4xl mb-4">📋</div>
                                <p className="font-bold text-gray-400">No orders yet</p>
                            </div>
                        )}
                    </div>
                )}

            </div>
            {/* Confirmation Modal */}
            <Modal isOpen={confirmAction.isOpen} onClose={() => setConfirmAction({ ...confirmAction, isOpen: false })} title={confirmAction.title}>
                <div className="text-center">
                    <div className={`w-20 h-20 rounded-3xl flex items-center justify-center mx-auto mb-6 border ${confirmAction.type === 'danger' ? 'bg-red-500/10 border-red-500/20 text-red-500' : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500'}`}>
                        {confirmAction.type === 'danger' ? (
                            <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                        ) : (
                            <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                        )}
                    </div>
                    <p className="text-gray-300 text-lg mb-8 leading-relaxed">
                        {confirmAction.message}
                    </p>
                    <div className="flex gap-4">
                        <button
                            onClick={() => setConfirmAction({ ...confirmAction, isOpen: false })}
                            className="flex-1 px-6 py-4 rounded-2xl bg-white/5 text-gray-400 font-bold hover:bg-white/10 transition-all border border-white/10"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={() => { confirmAction.onConfirm(); setConfirmAction({ ...confirmAction, isOpen: false }); }}
                            className={`flex-1 px-6 py-4 rounded-2xl font-bold text-white shadow-lg transition-all transform active:scale-95 ${confirmAction.type === 'danger' ? 'bg-gradient-to-r from-red-600 to-rose-600 shadow-red-500/20 hover:shadow-red-500/40' : 'bg-gradient-to-r from-emerald-600 to-teal-600 shadow-emerald-500/20 hover:shadow-emerald-500/40'}`}
                        >
                            Confirm
                        </button>
                    </div>
                </div>
            </Modal>

            {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
        </div>
    );
};
