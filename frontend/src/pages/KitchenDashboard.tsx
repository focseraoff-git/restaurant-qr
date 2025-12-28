import { useEffect, useState, useRef } from 'react';
import { useParams } from 'react-router-dom';
import api from '../utils/api';
import { Toast } from '../components/Toast';

// Interfaces
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
    tables?: Table;
    customer_name?: string;
    payment_method?: string;
}

// Constants
const STATUS_COLORS: Record<string, string> = {
    pending: 'bg-orange-500/10 border-orange-500/50 text-orange-400',
    preparing: 'bg-blue-500/10 border-blue-500/50 text-blue-400',
    ready: 'bg-emerald-500/10 border-emerald-500/50 text-emerald-400',
    completed: 'bg-slate-800/50 border-slate-700 text-gray-400',
    cancelled: 'bg-red-500/10 border-red-500/50 text-red-400'
};

const NEXT_STATUS: Record<string, string> = {
    pending: 'preparing',
    preparing: 'ready',
    ready: 'completed'
};

// Modal Component
const Modal = ({ isOpen, onClose, title, children }: any) => {
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
            <div className="glass-panel w-full max-w-md overflow-hidden animate-slide-up rounded-3xl border border-white/10">
                <div className="px-6 py-5 border-b border-white/10 flex justify-between items-center bg-white/5">
                    <h3 className="font-display font-bold text-xl text-white">{title}</h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors text-2xl">×</button>
                </div>
                <div className="p-6">
                    {children}
                </div>
            </div>
        </div>
    );
};

export const KitchenDashboard = () => {
    const { restaurantId } = useParams();

    // Orders State
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);
    const [lastCount, setLastCount] = useState(0);
    const audioRef = useRef<HTMLAudioElement | null>(null);

    // Manager Mode State
    const [isManagerMode, setIsManagerMode] = useState(true); // Default to Manager Mode for nicer first impression
    const [menuCategories, setMenuCategories] = useState<any[]>([]);
    const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

    // Manager Tabs
    const [activeTab, setActiveTab] = useState<'menu' | 'waiters' | 'settlement' | 'payments' | 'info'>('menu');
    const [waiters, setWaiters] = useState<any[]>([]);
    const [stats, setStats] = useState<any>(null);
    const [isAddWaiterOpen, setIsAddWaiterOpen] = useState(false);
    const [newWaiter, setNewWaiter] = useState({ name: '', email: '', password: '' });

    // Financial Reports State
    const [allCompletedOrders, setAllCompletedOrders] = useState<Order[]>([]);
    const [reportPeriod, setReportPeriod] = useState<'daily' | 'monthly' | 'yearly'>('daily');

    // Info Tab State
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

    // Modal & Form State
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [editingItem, setEditingItem] = useState<any | null>(null);
    const [newItem, setNewItem] = useState({ name: '', price: '', description: '', is_veg: true, category_id: '' });

    // Request notification permission on mount
    useEffect(() => {
        if (Notification.permission !== "granted") {
            Notification.requestPermission();
        }
    }, []);

    const fetchOrders = async () => {
        if (!restaurantId) return;
        try {
            // Sanitize ID in case query params got appended to the URL path
            const cleanId = restaurantId.split('&')[0];
            const res = await api.get(`/orders/restaurant/${cleanId}`);
            setOrders(res.data);
            setLoading(false);
        } catch (error) {
            console.error('Error fetching orders:', error);
        }
    };

    const fetchMenu = async () => {
        if (!restaurantId) return;
        try {
            const cleanId = restaurantId.split('&')[0];
            const res = await api.get(`/menu/${cleanId}`);
            setMenuCategories(res.data);
            // Set default category for new items
            if (res.data.length > 0 && !newItem.category_id) {
                setNewItem(prev => ({ ...prev, category_id: res.data[0].id }));
            }
        } catch (error) {
            console.error('Error fetching menu:', error);
        }
    };

    // Effect for handling sound/notifications for Orders
    useEffect(() => {
        // Only play if we have more orders than before (and not the initial load)
        if (orders.length > lastCount && lastCount !== 0) {
            // New order!
            if (Notification.permission === "granted") {
                new Notification("New Order in Kitchen!", { body: "Check the dashboard." });
            }
            if (audioRef.current) {
                audioRef.current.play().catch(e => console.log("Audio play failed", e));
            }
        }
        // Always update lastCount
        setLastCount(orders.length);
    }, [orders.length]);

    // Polling for Orders
    useEffect(() => {
        fetchOrders();
        fetchMenu();
        if (isManagerMode && activeTab === 'waiters') fetchWaiters();
        if (isManagerMode && (activeTab === 'settlement' || activeTab === 'info')) {
            fetchStats();
            fetchAllCompletedOrders();
        }

        const interval = setInterval(fetchOrders, 5000);
        return () => clearInterval(interval);
    }, [restaurantId, isManagerMode, activeTab]);

    const fetchWaiters = async () => {
        if (!restaurantId) return;
        try {
            const cleanId = restaurantId.split('&')[0];
            const res = await api.get(`/waiters/${cleanId}`);
            setWaiters(res.data);
        } catch (error) { console.error(error); }
    };

    const fetchStats = async () => {
        if (!restaurantId) return;
        try {
            const cleanId = restaurantId.split('&')[0];
            const res = await api.get(`/waiters/${cleanId}/stats`);
            setStats(res.data);
        } catch (error) { console.error(error); }
    };

    const fetchAllCompletedOrders = async () => {
        if (!restaurantId) return;
        try {
            const cleanId = restaurantId.split('&')[0];
            const res = await api.get(`/orders/restaurant/${cleanId}`);
            const completedOrders = res.data.filter((o: Order) => o.status === 'completed');
            console.log('📊 All Orders:', res.data.length);
            console.log('✅ Completed Orders:', completedOrders.length);
            console.log('🔍 Sample Order:', completedOrders[0]);
            setAllCompletedOrders(completedOrders);
        } catch (error) {
            console.error('❌ Error fetching orders:', error);
        }
    };

    const generateFinancialReport = () => {
        const now = new Date();
        const today = now.toISOString().split('T')[0];
        const thisMonth = now.toISOString().slice(0, 7);
        const thisYear = now.getFullYear().toString();

        const dailyOrders = allCompletedOrders.filter(o => o.created_at.slice(0, 10) === today);
        const monthlyOrders = allCompletedOrders.filter(o => o.created_at.slice(0, 7) === thisMonth);
        const yearlyOrders = allCompletedOrders.filter(o => o.created_at.slice(0, 4) === thisYear);

        const calculateTotals = (orders: Order[]) => {
            const total = orders.reduce((sum, o) => sum + o.total_amount, 0);
            const cash = orders.filter(o => o.payment_method === 'cash').reduce((sum, o) => sum + o.total_amount, 0);
            const online = orders.filter(o => o.payment_method === 'online').reduce((sum, o) => sum + o.total_amount, 0);
            const upi = orders.filter(o => o.payment_method === 'upi').reduce((sum, o) => sum + o.total_amount, 0);
            const onlineTotal = online + upi;

            return {
                total,
                count: orders.length,
                cash,
                cashCount: orders.filter(o => o.payment_method === 'cash').length,
                online: onlineTotal,
                onlineCount: orders.filter(o => o.payment_method === 'online' || o.payment_method === 'upi').length,
                cashPercent: total > 0 ? ((cash / total) * 100).toFixed(1) : 0,
                onlinePercent: total > 0 ? ((onlineTotal / total) * 100).toFixed(1) : 0
            };
        };

        return {
            daily: calculateTotals(dailyOrders),
            monthly: calculateTotals(monthlyOrders),
            yearly: calculateTotals(yearlyOrders)
        };
    };

    const handleCreateWaiter = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const cleanId = restaurantId?.split('&')[0];
            await api.post('/waiters/create', { ...newWaiter, restaurantId: cleanId });
            setNewWaiter({ name: '', email: '', password: '' });
            setIsAddWaiterOpen(false);
            showToast('Waiter Added Successfully!', 'success');
            fetchWaiters();
        } catch (error: any) {
            showToast(error.response?.data?.error || 'Failed to create waiter', 'error');
        }
    };

    const handleDeleteWaiter = async (id: string) => {
        if (!window.confirm('Delete this waiter?')) return;
        try {
            await api.delete(`/waiters/${id}`);
            showToast('Waiter Removed', 'success');
            fetchWaiters();
        } catch (error) { showToast('Failed to delete', 'error'); }
    };

    const updateStatus = async (orderId: string, newStatus: string, estimatedTime?: number) => {
        try {
            // Optimistic update
            setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: newStatus } : o));

            const payload: any = { status: newStatus };
            if (newStatus === 'preparing' && estimatedTime) {
                payload.estimated_prep_time = estimatedTime;
            }

            await api.put(`/orders/${orderId}/status`, payload);
            // Re-fetch to confirm
            fetchOrders();
        } catch (error) {
            console.error('Error updating status:', error);
            fetchOrders(); // Revert on error
        }
    };

    const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
        setToast({ message, type });
    };

    const handleAddItem = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newItem.name || !newItem.price || !newItem.category_id) {
            showToast("Please fill in all required fields.", "error");
            return;
        }
        try {
            await api.post('/menu', {
                ...newItem,
                price_full: parseInt(newItem.price),
            });
            setIsAddModalOpen(false);
            setNewItem({ name: '', price: '', description: '', is_veg: true, category_id: menuCategories[0]?.id || '' });
            fetchMenu();
            showToast("Recipe Added Successfully! 🍳", "success");
        } catch (error: any) {
            console.error(error);
            const msg = error.response?.data?.error || error.message || "Failed to add item.";
            showToast(msg, "error");
        }
    };

    const [timerModal, setTimerModal] = useState<{ isOpen: boolean; orderId: string | null }>({
        isOpen: false,
        orderId: null
    });
    const [estimatedTime, setEstimatedTime] = useState(15);

    const openTimerModal = (orderId: string) => {
        setTimerModal({ isOpen: true, orderId });
        setEstimatedTime(15);
    };

    const confirmTimer = () => {
        if (timerModal.orderId) {
            updateStatus(timerModal.orderId, 'preparing', estimatedTime);
            setTimerModal({ isOpen: false, orderId: null });
        }
    };

    // ... items handlers ...
    const handleUpdateItem = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingItem) return;
        try {
            await api.put(`/menu/${editingItem.id}`, {
                name: editingItem.name,
                price_full: parseInt(editingItem.price_full),
                description: editingItem.description,
                is_veg: editingItem.is_veg
            });
            setEditingItem(null);
            fetchMenu();
            showToast("Recipe Updated Successfully!", "success");
        } catch (error: any) {
            const msg = error.response?.data?.error || error.message || "Failed to update item.";
            showToast(msg, "error");
        }
    };

    const [deleteConfirmation, setDeleteConfirmation] = useState<{ isOpen: boolean; itemId: string | null }>({
        isOpen: false,
        itemId: null
    });

    const confirmDelete = (itemId: string) => {
        setDeleteConfirmation({ isOpen: true, itemId });
    };

    const handleConfirmDelete = async () => {
        if (!deleteConfirmation.itemId) return;

        const itemId = deleteConfirmation.itemId;
        setDeleteConfirmation({ isOpen: false, itemId: null });

        try {
            await api.delete(`/menu/${itemId}`);
            fetchMenu();
            showToast("Recipe Removed Successfully", "success");
        } catch (error: any) {
            const msg = error.response?.data?.error || error.message || "Failed to delete item.";
            showToast(msg, "error");
        }
    };

    // Kept for compatibility if called elsewhere, but we switch the UI to call confirmDelete
    const handleDeleteItem = confirmDelete;

    const getOrdersByStatus = (status: string) => orders.filter(o => o.status === status);

    const OrderCard = ({ order }: { order: Order }) => (
        <div className={`p-5 rounded-2xl shadow-lg border mb-4 backdrop-blur-sm transition-all hover:scale-[1.02] duration-300 ${STATUS_COLORS[order.status] || 'bg-slate-800 border-white/10'}`}>
            <div className="flex justify-between items-start mb-3">
                <div>
                    <h3 className="font-bold text-xl flex items-center gap-2 text-white">
                        {order.tables?.table_number ? (
                            <span className="bg-white/10 px-2 py-1 rounded-lg border border-white/10 text-sm">
                                🍽️ T-{order.tables.table_number}
                            </span>
                        ) : (
                            <span className="bg-amber-500/20 text-amber-300 px-2 py-1 rounded-lg border border-amber-500/20 text-sm">
                                🥡 Takeaway
                            </span>
                        )}
                    </h3>
                    {order.customer_name && (
                        <div className="font-display font-medium text-gray-200 mt-2 text-lg flex items-center gap-2">
                            <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-emerald-500 to-teal-500 flex items-center justify-center text-[10px] text-white font-bold">
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
                    <span className="text-[10px] opacity-60 text-gray-400 uppercase tracking-wider">ordered time</span>
                </div>
            </div>

            <div className="space-y-2 mb-4 bg-black/20 p-3 rounded-xl border border-white/5">
                {order.order_items.map((item, idx) => (
                    <div key={idx} className="flex justify-between items-center text-sm border-b border-white/5 last:border-0 pb-2 last:pb-0">
                        <span className="text-gray-200 font-medium">
                            <span className="font-bold text-emerald-400 mr-2">{item.quantity}x</span>
                            {item.menu_items?.name || 'Unknown Item'}
                        </span>
                        {item.portion !== 'full' && <span className="text-[10px] text-amber-300 bg-amber-500/10 px-1.5 py-0.5 border border-amber-500/20 rounded uppercase font-bold tracking-wide">{item.portion}</span>}
                    </div>
                ))}
            </div>

            <div className="flex gap-2 mt-3">
                {NEXT_STATUS[order.status] && (
                    <button
                        onClick={() => {
                            if (NEXT_STATUS[order.status] === 'preparing') {
                                openTimerModal(order.id);
                            } else {
                                updateStatus(order.id, NEXT_STATUS[order.status]);
                            }
                        }}
                        className={`flex-1 border px-3 py-2 rounded-xl text-sm font-bold shadow-lg uppercase tracking-wide transition-all transform active:scale-95
                            ${NEXT_STATUS[order.status] === 'completed'
                                ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white border-transparent hover:shadow-emerald-500/20'
                                : 'bg-white/10 border-white/10 text-white hover:bg-white/20'}`}
                    >
                        Mark {NEXT_STATUS[order.status] === 'completed' ? 'Paid & Clear' : NEXT_STATUS[order.status]}
                    </button>
                )}
                {order.status !== 'completed' && order.status !== 'cancelled' && (
                    <button
                        onClick={() => updateStatus(order.id, 'cancelled')}
                        className="text-red-400 hover:text-white hover:bg-red-500/20 border border-transparent hover:border-red-500/20 rounded-xl px-3 transition-colors"
                        title="Cancel Order"
                    >
                        ✕
                    </button>
                )}
            </div>
        </div>
    );

    if (loading) return (
        <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-emerald-500"></div>
            <p className="mt-4 text-emerald-500 font-bold animate-pulse">Loading Dashboard...</p>
        </div>
    );

    return (
        <div className="min-h-screen bg-slate-950 flex flex-col relative overflow-hidden text-gray-100 font-sans">
            {/* Background Effects */}
            <div className="absolute top-0 left-0 w-full h-[500px] bg-indigo-900/20 rounded-full blur-[120px] pointer-events-none"></div>
            <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-emerald-900/10 rounded-full blur-[100px] pointer-events-none"></div>

            {toast && (
                <Toast
                    message={toast.message}
                    type={toast.type}
                    onClose={() => setToast(null)}
                />
            )}
            <audio ref={audioRef} src="https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3" />

            <header className="glass-nav px-8 py-5 flex justify-between items-center sticky top-0 z-30 mb-6 shrink-0">
                <div className="flex items-center gap-6">
                    <h1 className="text-2xl font-display font-bold text-white tracking-tight flex items-center gap-2">
                        <span className="text-3xl">👨‍🍳</span> Kitchen<span className="text-emerald-400">OS</span>
                    </h1>
                    <div className="h-6 w-px bg-white/10"></div>
                    <button
                        onClick={() => { setIsManagerMode(!isManagerMode); if (!isManagerMode) fetchMenu(); }}
                        className={`px-4 py-2 rounded-xl text-sm font-bold border transition-all ${isManagerMode
                            ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30 shadow-glow-emerald'
                            : 'bg-white/5 text-gray-400 border-white/5 hover:bg-white/10 hover:text-white'}`}
                    >
                        {isManagerMode ? '← View Live Orders' : '📝 Manage Menu'}
                    </button>
                </div>
                <div className="flex items-center gap-4">
                    <div className="text-xs font-bold px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-2 animate-pulse">
                        <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></span>
                        LIVE SYSTEM
                    </div>
                </div>
            </header>

            {isManagerMode ? (
                <div className="p-4 md:p-8 max-w-6xl mx-auto w-full animate-fade-in relative z-10 overflow-y-auto">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 md:mb-10 gap-4">
                        <div>
                            <h2 className="text-3xl md:text-4xl font-display font-bold text-white mb-2">Manager Validation</h2>
                            <div className="flex gap-4 mt-4">
                                <button onClick={() => setActiveTab('menu')} className={`px-4 py-2 rounded-xl text-sm font-bold border transition-all ${activeTab === 'menu' ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white border-transparent shadow-lg shadow-emerald-500/30' : 'text-gray-400 border-white/10 hover:text-white hover:border-white/20'}`}>🍽️ Menu</button>
                                <button onClick={() => setActiveTab('waiters')} className={`px-4 py-2 rounded-xl text-sm font-bold border transition-all ${activeTab === 'waiters' ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white border-transparent shadow-lg shadow-emerald-500/30' : 'text-gray-400 border-white/10 hover:text-white hover:border-white/20'}`}>👨‍🍳 Waiters</button>
                                <button onClick={() => setActiveTab('settlement')} className={`px-4 py-2 rounded-xl text-sm font-bold border transition-all ${activeTab === 'settlement' ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white border-transparent shadow-lg shadow-emerald-500/30' : 'text-gray-400 border-white/10 hover:text-white hover:border-white/20'}`}>💰 Settlement</button>
                                <button onClick={() => setActiveTab('payments')} className={`px-4 py-2 rounded-xl text-sm font-bold border transition-all ${activeTab === 'payments' ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white border-transparent shadow-lg shadow-emerald-500/30' : 'text-gray-400 border-white/10 hover:text-white hover:border-white/20'}`}>💳 Payments</button>
                                <button onClick={() => setActiveTab('info')} className={`px-4 py-2 rounded-xl text-sm font-bold border transition-all ${activeTab === 'info' ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white border-transparent shadow-lg shadow-emerald-500/30' : 'text-gray-400 border-white/10 hover:text-white hover:border-white/20'}`}>ℹ️ Info</button>
                            </div>
                        </div>
                        {activeTab === 'menu' && (
                            <button
                                className="w-full md:w-auto btn-primary text-white px-6 py-3 md:px-8 md:py-4 rounded-2xl font-bold shadow-2xl hover:shadow-emerald-500/20 transition-all transform active:scale-95 flex items-center justify-center gap-2 group"
                                onClick={() => setIsAddModalOpen(true)}
                            >
                                <span className="text-xl group-hover:rotate-90 transition-transform bg-white/20 w-8 h-8 rounded-full flex items-center justify-center">+</span> Add New Recipe
                            </button>
                        )}
                        {activeTab === 'waiters' && (
                            <button
                                className="w-full md:w-auto btn-primary text-white px-6 py-3 md:px-8 md:py-4 rounded-2xl font-bold shadow-2xl hover:shadow-emerald-500/20 transition-all transform active:scale-95 flex items-center justify-center gap-2 group"
                                onClick={() => setIsAddWaiterOpen(true)}
                            >
                                <span className="text-xl group-hover:rotate-90 transition-transform bg-white/20 w-8 h-8 rounded-full flex items-center justify-center">+</span> Add Waiter
                            </button>
                        )}
                    </div>

                    {activeTab === 'waiters' && (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {waiters.map(waiter => (
                                <div key={waiter.id} className="glass-panel p-6 rounded-2xl border border-white/10 flex justify-between items-center group">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 bg-gradient-to-tr from-blue-500 to-indigo-500 rounded-full flex items-center justify-center text-xl font-bold text-white">
                                            {waiter.name.charAt(0)}
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-white text-lg">{waiter.name}</h3>
                                            <p className="text-xs text-gray-400">{waiter.email}</p>
                                        </div>
                                    </div>
                                    <button onClick={() => handleDeleteWaiter(waiter.id)} className="text-red-400 hover:bg-red-500/10 p-2 rounded-lg transition-colors opacity-0 group-hover:opacity-100">
                                        🗑️
                                    </button>
                                </div>
                            ))}
                            <Modal isOpen={isAddWaiterOpen} onClose={() => setIsAddWaiterOpen(false)} title="Add Waiter">
                                <form onSubmit={handleCreateWaiter} className="space-y-4">
                                    <input placeholder="Name" className="input-field w-full" value={newWaiter.name} onChange={e => setNewWaiter({ ...newWaiter, name: e.target.value })} required />
                                    <input placeholder="Email" type="email" className="input-field w-full" value={newWaiter.email} onChange={e => setNewWaiter({ ...newWaiter, email: e.target.value })} required />
                                    <input placeholder="Password" type="password" className="input-field w-full" value={newWaiter.password} onChange={e => setNewWaiter({ ...newWaiter, password: e.target.value })} required />
                                    <button type="submit" className="btn-primary w-full py-3 rounded-xl font-bold text-white">Create Account</button>
                                </form>
                            </Modal>
                        </div>
                    )}

                    {activeTab === 'settlement' && (() => {
                        const report = generateFinancialReport();
                        const currentPeriod = report[reportPeriod];

                        return (
                            <div className="space-y-8 animate-fade-in">
                                {/* Luxury Header */}
                                <div className="text-center mb-8 relative">
                                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-emerald-500/10 to-transparent blur-xl"></div>
                                    <h2 className="text-5xl font-display font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-emerald-200 to-teal-200 mb-3 tracking-tight relative animate-shimmer bg-[length:200%_100%]">Financial Overview</h2>
                                    <p className="text-gray-400 text-sm font-medium">Premium Analytics Dashboard</p>
                                </div>

                                {/* Period Selection with Premium Style */}
                                <div className="flex gap-3 justify-center backdrop-blur-md">
                                    {(['daily', 'monthly', 'yearly'] as const).map(period => (
                                        <button
                                            key={period}
                                            onClick={() => setReportPeriod(period)}
                                            className={`relative px-8 py-4 rounded-2xl font-bold text-sm transition-all overflow-hidden group ${reportPeriod === period
                                                ? 'bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-500 bg-[length:200%_100%] text-white shadow-[0_0_30px_rgba(16,185,129,0.4)] border-2 border-emerald-400/30'
                                                : 'bg-black/30 text-gray-400 hover:bg-black/40 hover:text-white border-2 border-white/5 hover:border-emerald-500/20'
                                                }`}
                                        >
                                            {/* Shimmer effect */}
                                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
                                            <span className="relative z-10 uppercase tracking-wider">{period.charAt(0).toUpperCase() + period.slice(1)}</span>
                                        </button>
                                    ))}
                                </div>

                                {/* Expenditure Summary with Premium Cards */}
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                    <div className="relative group overflow-hidden">
                                        {/* Floating glow */}
                                        <div className="absolute-inset-2 bg-gradient-to-r from-emerald-500/20 to-teal-500/20 rounded-3xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
                                        <div className="relative glass-panel p-8 rounded-3xl border-2 border-emerald-500/40 shadow-[0_8px_32px_rgba(16,185,129,0.2)] hover:shadow-[0_20px_60px_rgba(16,185,129,0.4)] transition-all duration-500 bg-gradient-to-br from-emerald-500/10 to-black/30">
                                            {/* Icon */}
                                            <div className="absolute top-4 right-4 w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-400/20 to-teal-500/20 flex items-center justify-center backdrop-blur-md border border-emerald-500/20">
                                                <span className="text-3xl">💎</span>
                                            </div>
                                            <p className="text-xs font-black text-emerald-400/70 uppercase tracking-[0.2em] mb-3">Total Revenue</p>
                                            <p className="text-5xl font-display font-black text-transparent bg-clip-text bg-gradient-to-r from-emerald-300 to-teal-300 mt-2 drop-shadow-[0_0_20px_rgba(16,185,129,0.5)]">₹{currentPeriod.total.toLocaleString()}</p>
                                            <p className="text-xs text-gray-400 mt-3 font-medium">{reportPeriod.charAt(0).toUpperCase() + reportPeriod.slice(1)} Period</p>
                                            {/* Animated underline */}
                                            <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500 to-teal-500 opacity-50 group-hover:opacity-100 transition-opacity"></div>
                                        </div>
                                    </div>
                                    <div className="relative group overflow-hidden">
                                        <div className="absolute -inset-2 bg-gradient-to-r from-blue-500/20 to-indigo-500/20 rounded-3xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
                                        <div className="relative glass-panel p-8 rounded-3xl border-2 border-white/20 shadow-[0_8px_32px_rgba(0,0,0,0.3)] hover:shadow-[0_20px_60px_rgba(100,100,255,0.2)] transition-all duration-500 bg-gradient-to-br from-blue-500/5 to-black/30">
                                            <div className="absolute top-4 right-4 w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-400/20 to-indigo-500/20 flex items-center justify-center backdrop-blur-md border border-blue-500/20">
                                                <span className="text-3xl">📊</span>
                                            </div>
                                            <p className="text-xs font-black text-blue-400/70 uppercase tracking-[0.2em] mb-3">Total Orders</p>
                                            <p className="text-5xl font-display font-black text-white mt-2 drop-shadow-[0_0_15px_rgba(255,255,255,0.3)]">{currentPeriod.count}</p>
                                            <p className="text-xs text-gray-400 mt-3 font-medium">Completed Orders</p>
                                            <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 to-indigo-500 opacity-50 group-hover:opacity-100 transition-opacity"></div>
                                        </div>
                                    </div>
                                    <div className="relative group overflow-hidden">
                                        <div className="absolute -inset-2 bg-gradient-to-r from-amber-500/20 to-orange-500/20 rounded-3xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
                                        <div className="relative glass-panel p-8 rounded-3xl border-2 border-amber-500/30 shadow-[0_8px_32px_rgba(245,158,11,0.2)] hover:shadow-[0_20px_60px_rgba(245,158,11,0.3)] transition-all duration-500 bg-gradient-to-br from-amber-500/10 to-black/30">
                                            <div className="absolute top-4 right-4 w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-400/20 to-orange-500/20 flex items-center justify-center backdrop-blur-md border border-amber-500/20">
                                                <span className="text-3xl">⭐</span>
                                            </div>
                                            <p className="text-xs font-black text-amber-400/70 uppercase tracking-[0.2em] mb-3">Avg Order Value</p>
                                            <p className="text-5xl font-display font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-300 to-orange-300 mt-2 drop-shadow-[0_0_20px_rgba(245,158,11,0.5)]">₹{currentPeriod.count > 0 ? Math.round(currentPeriod.total / currentPeriod.count) : 0}</p>
                                            <p className="text-xs text-gray-400 mt-3 font-medium">Per Order</p>
                                            <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-500 to-orange-500 opacity-50 group-hover:opacity-100 transition-opacity"></div>
                                        </div>
                                    </div>
                                </div>

                                {/* Payment Methods Breakdown */}
                                <div className="glass-panel p-8 rounded-3xl border border-white/10">
                                    <div className="flex justify-between items-center mb-6">
                                        <h3 className="text-2xl font-bold text-white">💳 Payment Methods</h3>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        {/* Cash Payments */}
                                        <div className="bg-gradient-to-br from-green-500/10 to-emerald-500/5 border border-green-500/20 rounded-2xl p-6">
                                            <div className="flex items-center gap-3 mb-4">
                                                <div className="w-12 h-12 rounded-xl bg-green-500/20 flex items-center justify-center text-2xl">💵</div>
                                                <div>
                                                    <h4 className="font-bold text-white text-lg">Cash</h4>
                                                    <p className="text-xs text-gray-400">{currentPeriod.cashCount} transactions</p>
                                                </div>
                                            </div>
                                            <div className="space-y-3">
                                                <div className="flex justify-between items-end">
                                                    <span className="text-3xl font-mono font-bold text-green-400">₹{currentPeriod.cash.toLocaleString()}</span>
                                                    <span className="text-lg font-bold text-green-300">{currentPeriod.cashPercent}%</span>
                                                </div>
                                                <div className="w-full bg-black/20 rounded-full h-3 overflow-hidden">
                                                    <div className="bg-gradient-to-r from-green-500 to-emerald-500 h-full rounded-full transition-all" style={{ width: `${currentPeriod.cashPercent}%` }}></div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Online/UPI Payments */}
                                        <div className="bg-gradient-to-br from-blue-500/10 to-indigo-500/5 border border-blue-500/20 rounded-2xl p-6">
                                            <div className="flex items-center gap-3 mb-4">
                                                <div className="w-12 h-12 rounded-xl bg-blue-500/20 flex items-center justify-center text-2xl">💳</div>
                                                <div>
                                                    <h4 className="font-bold text-white text-lg">Online / UPI</h4>
                                                    <p className="text-xs text-gray-400">{currentPeriod.onlineCount} transactions</p>
                                                </div>
                                            </div>
                                            <div className="space-y-3">
                                                <div className="flex justify-between items-end">
                                                    <span className="text-3xl font-mono font-bold text-blue-400">₹{currentPeriod.online.toLocaleString()}</span>
                                                    <span className="text-lg font-bold text-blue-300">{currentPeriod.onlinePercent}%</span>
                                                </div>
                                                <div className="w-full bg-black/20 rounded-full h-3 overflow-hidden">
                                                    <div className="bg-gradient-to-r from-blue-500 to-indigo-500 h-full rounded-full transition-all" style={{ width: `${currentPeriod.onlinePercent}%` }}></div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Waiter Performance with Premium Style */}
                                {stats && (
                                    <div className="relative group">
                                        <div className="absolute -inset-2 bg-gradient-to-r from-emerald-500/10 to-teal-500/10 rounded-[2rem] blur-2xl opacity-50 group-hover:opacity-100 transition-opacity"></div>
                                        <div className="relative glass-panel p-10 rounded-[2rem] border-2 border-white/20 shadow-[0_20px_70px_rgba(0,0,0,0.4)] bg-gradient-to-br from-slate-900/90 to-black/80">
                                            <div className="flex justify-between items-center mb-8 pb-6 border-b border-white/10">
                                                <div>
                                                    <h3 className="text-3xl font-display font-black text-transparent bg-clip-text bg-gradient-to-r from-emerald-200 to-teal-200 mb-2">👨‍🍳 Waiter Performance</h3>
                                                    <p className="text-sm text-gray-400">Today's Statistics</p>
                                                </div>
                                                <button onClick={() => window.print()} className="relative px-6 py-3 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 rounded-xl text-sm font-bold text-white transition-all shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/40 overflow-hidden group/btn">
                                                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover/btn:translate-x-full transition-transform duration-1000"></div>
                                                    <span className="relative z-10">🖨️ Print Report</span>
                                                </button>
                                            </div>
                                            <div className="overflow-x-auto">
                                                <table className="w-full text-left text-gray-300">
                                                    <thead className="text-xs font-bold uppercase text-gray-500 border-b border-white/10">
                                                        <tr>
                                                            <th className="py-4">Waiter</th>
                                                            <th className="py-4">Delivered Qty</th>
                                                            <th className="py-4 text-right">Total Sales</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody className="divide-y divide-white/5">
                                                        {stats.waiters.map((w: any) => (
                                                            <tr key={w.id}>
                                                                <td className="py-4 font-bold text-white">{w.name}</td>
                                                                <td className="py-4">{w.count}</td>
                                                                <td className="py-4 text-right font-mono">₹{w.total}</td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                    <tfoot className="border-t border-white/10">
                                                        <tr>
                                                            <td className="py-4 font-bold text-emerald-400 text-lg">TOTAL</td>
                                                            <td className="py-4 font-bold text-white text-lg">{stats.summary.deliveredOrders}</td>
                                                            <td className="py-4 font-bold text-emerald-400 text-lg text-right font-mono">₹{stats.summary.revenue}</td>
                                                        </tr>
                                                    </tfoot>
                                                </table>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        );
                    })()}

                    {/* NEW PAYMENTS TAB */}
                    {activeTab === 'payments' && (() => {
                        const report = generateFinancialReport();
                        const currentPeriod = report[reportPeriod];

                        return (
                            <div className="space-y-8 animate-fade-in relative">
                                {/* Luxury Animated Background - Emerald Theme */}
                                <div className="fixed inset-0 pointer-events-none opacity-30 overflow-hidden">
                                    <div className="absolute top-20 right-10 w-96 h-96 bg-gradient-to-br from-emerald-500/30 to-teal-500/20 rounded-full blur-[120px] animate-pulse"></div>
                                    <div className="absolute bottom-20 left-10 w-96 h-96 bg-gradient-to-tl from-teal-500/20 to-emerald-500/30 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '1.5s' }}></div>
                                </div>

                                <div className="relative z-10 space-y-8">
                                    {/* Header */}
                                    <div className="text-center mb-8 relative">
                                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-emerald-500/10 to-transparent blur-xl"></div>
                                        <h2 className="text-5xl font-display font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-emerald-200 to-teal-200 mb-3 tracking-tight relative animate-shimmer bg-[length:200%_100%]">Payment Analytics</h2>
                                        <p className="text-gray-400 text-sm font-medium">Transaction Insights & Distribution</p>
                                    </div>

                                    {/* Period Selection */}
                                    <div className="flex gap-3 justify-center backdrop-blur-md">
                                        {(['daily', 'monthly', 'yearly'] as const).map(period => (
                                            <button
                                                key={period}
                                                onClick={() => setReportPeriod(period)}
                                                className={`relative px-8 py-4 rounded-2xl font-bold text-sm transition-all overflow-hidden group ${reportPeriod === period
                                                    ? 'bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-500 bg-[length:200%_100%] text-white shadow-[0_0_30px_rgba(16,185,129,0.4)] border-2 border-emerald-400/30'
                                                    : 'bg-black/30 text-gray-400 hover:bg-black/40 hover:text-white border-2 border-white/5 hover:border-emerald-500/20'
                                                    }`}
                                            >
                                                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
                                                <span className="relative z-10 uppercase tracking-wider">{period.charAt(0).toUpperCase() + period.slice(1)}</span>
                                            </button>
                                        ))}
                                    </div>

                                    {/* Payment Methods - Premium Cards */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                        {/* Cash Payments - Ultra Premium */}
                                        <div className="relative group">
                                            <div className="absolute -inset-3 bg-gradient-to-br from-green-500/30 to-emerald-500/30 rounded-[2.5rem] blur-2xl opacity-50 group-hover:opacity-100 transition-all duration-700"></div>
                                            <div className="relative bg-gradient-to-br from-green-500/10 via-emerald-500/5 to-black/40 border-2 border-green-500/30 rounded-[2rem] p-10 backdrop-blur-xl shadow-[0_20px_70px_rgba(34,197,94,0.3)] hover:shadow-[0_30px_90px_rgba(34,197,94,0.5)] transition-all duration-500">
                                                {/* Sparkles */}
                                                <div className="absolute top-6 right-6 w-3 h-3 bg-green-400 rounded-full animate-ping"></div>
                                                <div className="absolute top-10 right-12 w-2 h-2 bg-emerald-400 rounded-full animate-ping" style={{ animationDelay: '0.5s' }}></div>

                                                <div className="flex items-center gap-4 mb-6">
                                                    <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-green-500/30 to-emerald-500/30 flex items-center justify-center border-2 border-green-500/30 shadow-lg shadow-green-500/20">
                                                        <span className="text-5xl">💵</span>
                                                    </div>
                                                    <div>
                                                        <h4 className="font-display font-black text-3xl text-transparent bg-clip-text bg-gradient-to-r from-green-300 to-emerald-300">Cash</h4>
                                                        <p className="text-sm text-gray-400 font-medium mt-1">{currentPeriod.cashCount} transactions</p>
                                                    </div>
                                                </div>

                                                <div className="space-y-5">
                                                    <div className="flex justify-between items-end">
                                                        <div>
                                                            <p className="text-xs text-green-400/70 font-bold uppercase tracking-widest mb-2">Amount</p>
                                                            <span className="text-5xl font-display font-black text-transparent bg-clip-text bg-gradient-to-r from-green-300 to-emerald-300 drop-shadow-[0_0_25px_rgba(34,197,94,0.6)]">₹{currentPeriod.cash.toLocaleString()}</span>
                                                        </div>
                                                        <div className="text-right">
                                                            <p className="text-xs text-green-400/70 font-bold uppercase tracking-widest mb-2">Share</p>
                                                            <span className="text-4xl font-black text-green-300">{currentPeriod.cashPercent}%</span>
                                                        </div>
                                                    </div>

                                                    {/* Animated Progress Bar */}
                                                    <div className="relative">
                                                        <div className="w-full bg-black/40 rounded-full h-4 overflow-hidden border border-green-500/20 shadow-inner">
                                                            <div className="bg-gradient-to-r from-green-500 via-emerald-500 to-green-500 bg-[length:200%_100%] h-full rounded-full transition-all duration-1000 shadow-[0_0_20px_rgba(34,197,94,0.5)] animate-shimmer" style={{ width: `${currentPeriod.cashPercent}%` }}></div>
                                                        </div>
                                                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-shimmer rounded-full"></div>
                                                    </div>
                                                </div>

                                                {/* Bottom accent line */}
                                                <div className="absolute bottom-0 left-0 right-0 h-2 bg-gradient-to-r from-green-500 via-emerald-500 to-green-500 opacity-60 rounded-b-[2rem]"></div>
                                            </div>
                                        </div>

                                        {/* Online/UPI Payments - Ultra Premium */}
                                        <div className="relative group">
                                            <div className="absolute -inset-3 bg-gradient-to-br from-blue-500/30 to-indigo-500/30 rounded-[2.5rem] blur-2xl opacity-50 group-hover:opacity-100 transition-all duration-700"></div>
                                            <div className="relative bg-gradient-to-br from-blue-500/10 via-indigo-500/5 to-black/40 border-2 border-blue-500/30 rounded-[2rem] p-10 backdrop-blur-xl shadow-[0_20px_70px_rgba(59,130,246,0.3)] hover:shadow-[0_30px_90px_rgba(59,130,246,0.5)] transition-all duration-500">
                                                {/* Sparkles */}
                                                <div className="absolute top-6 right-6 w-3 h-3 bg-blue-400 rounded-full animate-ping"></div>
                                                <div className="absolute top-10 right-12 w-2 h-2 bg-indigo-400 rounded-full animate-ping" style={{ animationDelay: '0.5s' }}></div>

                                                <div className="flex items-center gap-4 mb-6">
                                                    <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-500/30 to-indigo-500/30 flex items-center justify-center border-2 border-blue-500/30 shadow-lg shadow-blue-500/20">
                                                        <span className="text-5xl">💳</span>
                                                    </div>
                                                    <div>
                                                        <h4 className="font-display font-black text-3xl text-transparent bg-clip-text bg-gradient-to-r from-blue-300 to-indigo-300">Online / UPI</h4>
                                                        <p className="text-sm text-gray-400 font-medium mt-1">{currentPeriod.onlineCount} transactions</p>
                                                    </div>
                                                </div>

                                                <div className="space-y-5">
                                                    <div className="flex justify-between items-end">
                                                        <div>
                                                            <p className="text-xs text-blue-400/70 font-bold uppercase tracking-widest mb-2">Amount</p>
                                                            <span className="text-5xl font-display font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-300 to-indigo-300 drop-shadow-[0_0_25px_rgba(59,130,246,0.6)]">₹{currentPeriod.online.toLocaleString()}</span>
                                                        </div>
                                                        <div className="text-right">
                                                            <p className="text-xs text-blue-400/70 font-bold uppercase tracking-widest mb-2">Share</p>
                                                            <span className="text-4xl font-black text-blue-300">{currentPeriod.onlinePercent}%</span>
                                                        </div>
                                                    </div>

                                                    {/* Animated Progress Bar */}
                                                    <div className="relative">
                                                        <div className="w-full bg-black/40 rounded-full h-4 overflow-hidden border border-blue-500/20 shadow-inner">
                                                            <div className="bg-gradient-to-r from-blue-500 via-indigo-500 to-blue-500 bg-[length:200%_100%] h-full rounded-full transition-all duration-1000 shadow-[0_0_20px_rgba(59,130,246,0.5)] animate-shimmer" style={{ width: `${currentPeriod.onlinePercent}%` }}></div>
                                                        </div>
                                                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-shimmer rounded-full"></div>
                                                    </div>
                                                </div>

                                                {/* Bottom accent line */}
                                                <div className="absolute bottom-0 left-0 right-0 h-2 bg-gradient-to-r from-blue-500 via-indigo-500 to-blue-500 opacity-60 rounded-b-[2rem]"></div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Summary Statistics */}
                                    <div className="relative group">
                                        <div className="absolute -inset-2 bg-gradient-to-r from-emerald-500/10 to-teal-500/10 rounded-[2rem] blur-2xl opacity-50 group-hover:opacity-100 transition-opacity"></div>
                                        <div className="relative glass-panel p-10 rounded-[2rem] border-2 border-emerald-500/20 shadow-[0_20px_70px_rgba(16,185,129,0.2)] bg-gradient-to-br from-emerald-500/5 to-black/60">
                                            <h3 className="text-2xl font-display font-black text-transparent bg-clip-text bg-gradient-to-r from-emerald-200 to-teal-200 mb-6">📈 Transaction Summary</h3>
                                            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                                                <div className="text-center p-4 bg-white/5 rounded-2xl border border-white/10">
                                                    <p className="text-xs text-gray-400 uppercase font-bold mb-2">Total Transactions</p>
                                                    <p className="text-3xl font-black text-white">{currentPeriod.count}</p>
                                                </div>
                                                <div className="text-center p-4 bg-white/5 rounded-2xl border border-white/10">
                                                    <p className="text-xs text-gray-400 uppercase font-bold mb-2">Cash Count</p>
                                                    <p className="text-3xl font-black text-green-400">{currentPeriod.cashCount}</p>
                                                </div>
                                                <div className="text-center p-4 bg-white/5 rounded-2xl border border-white/10">
                                                    <p className="text-xs text-gray-400 uppercase font-bold mb-2">Online Count</p>
                                                    <p className="text-3xl font-black text-blue-400">{currentPeriod.onlineCount}</p>
                                                </div>
                                                <div className="text-center p-4 bg-gradient-to-br from-emerald-500/10 to-teal-500/10 rounded-2xl border border-emerald-500/30">
                                                    <p className="text-xs text-emerald-400 uppercase font-bold mb-2">Total Revenue</p>
                                                    <p className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-emerald-300 to-teal-300">₹{currentPeriod.total.toLocaleString()}</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })()}

                    {/* NEW INFO TAB */}
                    {activeTab === 'info' && (() => {
                        // Calculate daily data for selected date
                        const selectedOrders = allCompletedOrders.filter(o =>
                            o.created_at.split('T')[0] === selectedDate
                        );

                        const totalRevenue = selectedOrders.reduce((sum, o) => sum + o.total_amount, 0);
                        const cashRevenue = selectedOrders.filter(o => o.payment_method === 'cash').reduce((sum, o) => sum + o.total_amount, 0);
                        const onlineRevenue = selectedOrders.filter(o => o.payment_method === 'online' || o.payment_method === 'upi').reduce((sum, o) => sum + o.total_amount, 0);

                        // Calculate food items sold
                        const foodStats: Record<string, { name: string; quantity: number; revenue: number }> = {};
                        selectedOrders.forEach(order => {
                            order.order_items.forEach((item: any) => {
                                const itemName = item.menu_items?.name || 'Unknown';
                                if (!foodStats[itemName]) {
                                    foodStats[itemName] = { name: itemName, quantity: 0, revenue: 0 };
                                }
                                foodStats[itemName].quantity += item.quantity;
                                // Approximate revenue per item
                                foodStats[itemName].revenue += (order.total_amount / order.order_items.length) * item.quantity;
                            });
                        });

                        const foodArray = Object.values(foodStats).sort((a, b) => b.quantity - a.quantity);
                        const topFood = foodArray[0];

                        return (
                            <div className="space-y-8 animate-fade-in relative">
                                {/* Luxury Background - Emerald Theme */}
                                <div className="fixed inset-0 pointer-events-none opacity-30 overflow-hidden">
                                    <div className="absolute top-20 left-20 w-96 h-96 bg-gradient-to-br from-emerald-500/30 to-teal-500/20 rounded-full blur-[120px] animate-pulse"></div>
                                    <div className="absolute bottom-20 right-20 w-96 h-96 bg-gradient-to-tl from-teal-500/20 to-emerald-500/30 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '1s' }}></div>
                                </div>

                                <div className="relative z-10 space-y-8">
                                    {/* Header with Date Picker */}
                                    <div className="text-center mb-8 relative">
                                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-emerald-500/10 to-transparent blur-xl"></div>
                                        <h2 className="text-5xl font-display font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-emerald-200 to-teal-200 mb-3 tracking-tight relative animate-shimmer bg-[length:200%_100%]">Daily Insights</h2>
                                        <p className="text-gray-400 text-sm font-medium mb-6">Comprehensive Analytics for Selected Date</p>

                                        {/* Date Picker */}
                                        <div className="flex justify-center items-center gap-4 mt-6">
                                            <label htmlFor="date-picker" className="text-emerald-400 font-bold text-sm uppercase tracking-wider">Select Date:</label>
                                            <input
                                                id="date-picker"
                                                type="date"
                                                value={selectedDate}
                                                onChange={(e) => setSelectedDate(e.target.value)}
                                                min={new Date(new Date().setFullYear(new Date().getFullYear() - 1)).toISOString().split('T')[0]}
                                                max={new Date().toISOString().split('T')[0]}
                                                className="px-6 py-3 bg-black/40 border-2 border-emerald-500/30 rounded-2xl text-white font-mono text-lg focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all cursor-pointer relative z-50"
                                            />
                                        </div>
                                    </div>

                                    {selectedOrders.length === 0 ? (
                                        <div className="text-center py-20">
                                            <div className="text-6xl mb-4">📅</div>
                                            <p className="text-2xl font-bold text-gray-400">No orders found for this date</p>
                                            <p className="text-gray-500 mt-2">Try selecting a different date</p>
                                        </div>
                                    ) : (
                                        <>
                                            {/* Summary Cards */}
                                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                                {/* Total Settlement */}
                                                <div className="relative group">
                                                    <div className="absolute -inset-2 bg-gradient-to-br from-emerald-500/30 to-teal-500/30 rounded-3xl blur-xl opacity-50 group-hover:opacity-100 transition-opacity duration-700"></div>
                                                    <div className="relative bg-gradient-to-br from-emerald-500/10 to-black/40 border-2 border-emerald-500/30 rounded-2xl p-8 backdrop-blur-xl shadow-[0_20px_70px_rgba(16,185,129,0.3)]">
                                                        <div className="absolute top-4 right-4 w-16 h-16 rounded-2xl bg-emerald-500/20 flex items-center justify-center text-3xl border border-emerald-500/30">💰</div>
                                                        <p className="text-xs font-black text-emerald-400/70 uppercase tracking-[0.2em] mb-2">Total Settlement</p>
                                                        <p className="text-4xl font-display font-black text-transparent bg-clip-text bg-gradient-to-r from-emerald-300 to-teal-300 drop-shadow-[0_0_20px_rgba(16,185,129,0.5)]">₹{totalRevenue.toLocaleString()}</p>
                                                        <p className="text-xs text-gray-400 mt-2">{selectedOrders.length} orders</p>
                                                    </div>
                                                </div>

                                                {/* Cash Payment */}
                                                <div className="relative group">
                                                    <div className="absolute -inset-2 bg-gradient-to-br from-green-500/30 to-emerald-500/30 rounded-3xl blur-xl opacity-50 group-hover:opacity-100 transition-opacity duration-700"></div>
                                                    <div className="relative bg-gradient-to-br from-green-500/10 to-black/40 border-2 border-green-500/30 rounded-2xl p-8 backdrop-blur-xl shadow-[0_20px_70px_rgba(34,197,94,0.3)]">
                                                        <div className="absolute top-4 right-4 w-16 h-16 rounded-2xl bg-green-500/20 flex items-center justify-center text-3xl border border-green-500/30">💵</div>
                                                        <p className="text-xs font-black text-green-400/70 uppercase tracking-[0.2em] mb-2">Cash Payments</p>
                                                        <p className="text-4xl font-display font-black text-transparent bg-clip-text bg-gradient-to-r from-green-300 to-emerald-300 drop-shadow-[0_0_20px_rgba(34,197,94,0.5)]">₹{cashRevenue.toLocaleString()}</p>
                                                        <p className="text-xs text-gray-400 mt-2">{((cashRevenue / totalRevenue) * 100).toFixed(1)}% of total</p>
                                                    </div>
                                                </div>

                                                {/* Online/UPI Payment */}
                                                <div className="relative group">
                                                    <div className="absolute -inset-2 bg-gradient-to-br from-blue-500/30 to-indigo-500/30 rounded-3xl blur-xl opacity-50 group-hover:opacity-100 transition-opacity duration-700"></div>
                                                    <div className="relative bg-gradient-to-br from-blue-500/10 to-black/40 border-2 border-blue-500/30 rounded-2xl p-8 backdrop-blur-xl shadow-[0_20px_70px_rgba(59,130,246,0.3)]">
                                                        <div className="absolute top-4 right-4 w-16 h-16 rounded-2xl bg-blue-500/20 flex items-center justify-center text-3xl border border-blue-500/30">💳</div>
                                                        <p className="text-xs font-black text-blue-400/70 uppercase tracking-[0.2em] mb-2">Online/UPI</p>
                                                        <p className="text-4xl font-display font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-300 to-indigo-300 drop-shadow-[0_0_20px_rgba(59,130,246,0.5)]">₹{onlineRevenue.toLocaleString()}</p>
                                                        <p className="text-xs text-gray-400 mt-2">{((onlineRevenue / totalRevenue) * 100).toFixed(1)}% of total</p>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Top Selling Item */}
                                            {topFood && (
                                                <div className="relative group">
                                                    <div className="absolute -inset-2 bg-gradient-to-r from-amber-500/20 to-orange-500/20 rounded-[2rem] blur-2xl opacity-50 group-hover:opacity-100 transition-opacity"></div>
                                                    <div className="relative glass-panel p-10 rounded-[2rem] border-2 border-amber-500/30 shadow-[0_20px_70px_rgba(245,158,11,0.3)] bg-gradient-to-br from-amber-500/10 to-black/60">
                                                        <div className="flex items-center gap-6">
                                                            <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-amber-500/30 to-orange-500/30 flex items-center justify-center text-5xl border-2 border-amber-500/30 shadow-lg shadow-amber-500/20">
                                                                🏆
                                                            </div>
                                                            <div className="flex-1">
                                                                <p className="text-xs font-black text-amber-400/70 uppercase tracking-[0.2em] mb-2">Top Selling Item</p>
                                                                <h3 className="text-4xl font-display font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-300 to-orange-300 mb-3">{topFood.name}</h3>
                                                                <div className="flex gap-8">
                                                                    <div>
                                                                        <p className="text-xs text-gray-400 uppercase font-bold">Quantity Sold</p>
                                                                        <p className="text-3xl font-black text-amber-400">{topFood.quantity}</p>
                                                                    </div>
                                                                    <div>
                                                                        <p className="text-xs text-gray-400 uppercase font-bold">Revenue</p>
                                                                        <p className="text-3xl font-black text-amber-400">₹{Math.round(topFood.revenue).toLocaleString()}</p>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}

                                            {/* All Foods Ordered - Emerald Theme */}
                                            <div className="relative group">
                                                <div className="absolute -inset-2 bg-gradient-to-r from-emerald-500/10 to-teal-500/10 rounded-[2rem] blur-2xl opacity-50 group-hover:opacity-100 transition-opacity"></div>
                                                <div className="relative glass-panel p-10 rounded-[2rem] border-2 border-emerald-500/20 shadow-[0_20px_70px_rgba(16,185,129,0.2)] bg-gradient-to-br from-emerald-500/5 to-black/60">
                                                    <h3 className="text-2xl font-display font-black text-transparent bg-clip-text bg-gradient-to-r from-emerald-200 to-teal-200 mb-6">🍽️ All Foods Ordered</h3>
                                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-h-96 overflow-y-auto custom-scrollbar pr-2">
                                                        {foodArray.map((food, idx) => (
                                                            <div key={idx} className="bg-white/5 border border-white/10 rounded-2xl p-4 hover:bg-white/10 hover:border-emerald-500/30 transition-all">
                                                                <div className="flex justify-between items-start mb-2">
                                                                    <h4 className="font-bold text-white text-lg">{food.name}</h4>
                                                                    <span className="px-3 py-1 bg-emerald-500/20 text-emerald-300 rounded-lg text-xs font-bold border border-emerald-500/30">#{idx + 1}</span>
                                                                </div>
                                                                <div className="flex justify-between text-sm mt-3">
                                                                    <div>
                                                                        <p className="text-xs text-gray-400">Qty</p>
                                                                        <p className="font-black text-emerald-400">{food.quantity}</p>
                                                                    </div>
                                                                    <div className="text-right">
                                                                        <p className="text-xs text-gray-400">Revenue</p>
                                                                        <p className="font-mono font-bold text-blue-400">₹{Math.round(food.revenue)}</p>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            </div>
                                        </>
                                    )}
                                </div>
                            </div>
                        );
                    })()}

                    {activeTab === 'menu' && (
                        <div className="space-y-6 md:space-y-8 pb-20">
                            {menuCategories.map(cat => (
                                <div key={cat.id} className="glass-panel rounded-3xl p-5 md:p-8 border border-white/5 relative overflow-hidden group/cat">
                                    {/* Decor */}
                                    <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/5 rounded-full blur-3xl -mr-16 -mt-16 transition-opacity opacity-50 group-hover/cat:opacity-100"></div>

                                    <div className="flex items-center justify-between mb-8 relative z-10 border-b border-white/5 pb-4">
                                        <h3 className="text-2xl font-bold text-white flex items-center gap-3">
                                            {cat.name}
                                            <span className="text-[10px] font-bold text-gray-400 bg-white/5 px-2 py-1 rounded-md border border-white/5 uppercase tracking-widest">
                                                {cat.menu_items.length} Items
                                            </span>
                                        </h3>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 relative z-10">
                                        {cat.menu_items.map((item: any) => (
                                            <div key={item.id} className="flex items-center justify-between p-4 bg-black/20 hover:bg-white/5 rounded-2xl group transition-all border border-white/5 hover:border-emerald-500/30">
                                                <div className="flex items-center gap-5">
                                                    <div className={`w-3 h-3 rounded-full flex-shrink-0 ring-2 ring-offset-2 ring-offset-slate-900 ${item.is_veg ? 'bg-green-500 ring-green-500/30' : 'bg-red-500 ring-red-500/30'}`}></div>
                                                    <div>
                                                        <div className="font-display font-bold text-gray-100 text-lg leading-tight mb-1 group-hover:text-emerald-300 transition-colors">{item.name}</div>
                                                        <div className="text-sm font-mono text-emerald-400/80 mb-1">₹{item.price_full}</div>
                                                        <p className="text-xs text-gray-500 line-clamp-1 max-w-[200px]">{item.description}</p>
                                                    </div>
                                                </div>
                                                <div className="flex gap-2 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-all transform sm:translate-x-4 sm:group-hover:translate-x-0">
                                                    <button
                                                        onClick={() => setEditingItem(item)}
                                                        className="bg-blue-500/10 text-blue-400 px-4 py-2 rounded-xl text-xs font-bold border border-blue-500/20 hover:bg-blue-500/20 transition-colors"
                                                    >
                                                        Edit
                                                    </button>
                                                    <button
                                                        onClick={() => handleDeleteItem(item.id)}
                                                        className="bg-red-500/10 text-red-400 px-4 py-2 rounded-xl text-xs font-bold border border-red-500/20 hover:bg-red-500/20 transition-colors"
                                                    >
                                                        Delete
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                        {cat.menu_items.length === 0 && (
                                            <div className="col-span-2 text-center py-12 border-2 border-dashed border-white/5 rounded-2xl text-gray-500 text-sm">
                                                No items in this category yet.
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Add Modal */}
                    <Modal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} title="Add New Recipe">
                        <form onSubmit={handleAddItem} className="space-y-5">
                            <div>
                                <label className="block text-xs font-bold text-gray-400 mb-2 uppercase tracking-wider">Recipe Name</label>
                                <input
                                    type="text" required
                                    className="input-field w-full"
                                    value={newItem.name} onChange={e => setNewItem({ ...newItem, name: e.target.value })}
                                    placeholder="e.g. Truffle Pasta"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-5">
                                <div>
                                    <label className="block text-xs font-bold text-gray-400 mb-2 uppercase tracking-wider">Price (₹)</label>
                                    <input
                                        type="number" required min="0"
                                        className="input-field w-full"
                                        value={newItem.price} onChange={e => setNewItem({ ...newItem, price: e.target.value })}
                                        placeholder="299"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-400 mb-2 uppercase tracking-wider">Type</label>
                                    <select
                                        className="input-field w-full appearance-none"
                                        value={newItem.is_veg ? 'veg' : 'non-veg'}
                                        onChange={e => setNewItem({ ...newItem, is_veg: e.target.value === 'veg' })}
                                    >
                                        <option value="veg">🥬 Veg</option>
                                        <option value="non-veg">🍗 Non-Veg</option>
                                    </select>
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-400 mb-2 uppercase tracking-wider">Category</label>
                                <select
                                    className="input-field w-full appearance-none"
                                    value={newItem.category_id} onChange={e => setNewItem({ ...newItem, category_id: e.target.value })}
                                >
                                    {menuCategories.map(cat => (
                                        <option key={cat.id} value={cat.id}>{cat.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-400 mb-2 uppercase tracking-wider">Description</label>
                                <textarea
                                    className="input-field w-full h-24 resize-none"
                                    value={newItem.description} onChange={e => setNewItem({ ...newItem, description: e.target.value })}
                                    placeholder="Describe the dish..."
                                ></textarea>
                            </div>
                            <button type="submit" className="w-full btn-primary text-white py-4 rounded-xl font-bold shadow-lg shadow-emerald-500/20">
                                Save Recipe
                            </button>
                        </form>
                    </Modal>

                    {/* Edit Modal */}
                    <Modal isOpen={!!editingItem} onClose={() => setEditingItem(null)} title="Edit Recipe">
                        {editingItem && (
                            <form onSubmit={handleUpdateItem} className="space-y-5">
                                <div>
                                    <label className="block text-xs font-bold text-gray-400 mb-2 uppercase tracking-wider">Recipe Name</label>
                                    <input
                                        type="text" required
                                        className="input-field w-full"
                                        value={editingItem.name}
                                        onChange={e => setEditingItem({ ...editingItem, name: e.target.value })}
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-5">
                                    <div>
                                        <label className="block text-xs font-bold text-gray-400 mb-2 uppercase tracking-wider">Price (₹)</label>
                                        <input
                                            type="number" required min="0"
                                            className="input-field w-full"
                                            value={editingItem.price_full}
                                            onChange={e => setEditingItem({ ...editingItem, price_full: e.target.value })}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-gray-400 mb-2 uppercase tracking-wider">Type</label>
                                        <select
                                            className="input-field w-full appearance-none"
                                            value={editingItem.is_veg ? 'veg' : 'non-veg'}
                                            onChange={e => setEditingItem({ ...editingItem, is_veg: e.target.value === 'veg' })}
                                        >
                                            <option value="veg">🥬 Veg</option>
                                            <option value="non-veg">🍗 Non-Veg</option>
                                        </select>
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-400 mb-2 uppercase tracking-wider">Description</label>
                                    <textarea
                                        className="input-field w-full h-24 resize-none"
                                        value={editingItem.description || ''}
                                        onChange={e => setEditingItem({ ...editingItem, description: e.target.value })}
                                    ></textarea>
                                </div>
                                <div className="flex gap-4 pt-2">
                                    <button type="button" onClick={() => setEditingItem(null)} className="flex-1 bg-white/5 text-gray-400 py-3 rounded-xl font-bold hover:bg-white/10 transition-colors border border-white/5">
                                        Cancel
                                    </button>
                                    <button type="submit" className="flex-1 btn-primary text-white py-3 rounded-xl font-bold shadow-lg shadow-emerald-500/20">
                                        Update Recipe
                                    </button>
                                </div>
                            </form>
                        )}
                    </Modal>

                    {/* Delete Confirmation Modal */}
                    <Modal isOpen={deleteConfirmation.isOpen} onClose={() => setDeleteConfirmation({ isOpen: false, itemId: null })} title="Confirm Delete">
                        <div className="space-y-6">
                            <div className="text-center space-y-4">
                                <div className="bg-red-500/10 text-red-500 w-20 h-20 rounded-full flex items-center justify-center mx-auto border border-red-500/20 shadow-[0_0_30px_rgba(239,68,68,0.2)]">
                                    <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold text-white mb-2">Delete this recipe?</h3>
                                    <p className="text-gray-400 text-sm max-w-[250px] mx-auto leading-relaxed">
                                        This action cannot be undone. It will be permanently removed.
                                    </p>
                                </div>
                            </div>
                            <div className="flex gap-4">
                                <button
                                    onClick={() => setDeleteConfirmation({ isOpen: false, itemId: null })}
                                    className="flex-1 bg-white/5 text-gray-400 py-3 rounded-xl font-bold hover:bg-white/10 transition-colors border border-white/5"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleConfirmDelete}
                                    className="flex-1 bg-gradient-to-r from-red-500 to-red-600 text-white py-3 rounded-xl font-bold hover:from-red-600 hover:to-red-700 transition-all shadow-lg shadow-red-500/20"
                                >
                                    Delete Forever
                                </button>
                            </div>
                        </div>
                    </Modal>
                </div>
            ) : (
                // LANDSCAPE OPTIMIZED VIEW
                <div className="flex-1 overflow-x-auto p-4 md:p-6 relative z-10 h-[calc(100vh-100px)]">
                    <div className="flex gap-6 md:gap-8 min-w-max h-full">
                        {['pending', 'preparing', 'ready', 'completed'].map(status => (
                            <div key={status} className="w-[300px] md:w-[350px] flex-shrink-0 flex flex-col h-full rounded-2xl bg-white/5 border border-white/5 overflow-hidden">
                                <div className={`p-4 border-b border-white/5 backdrop-blur-xl flex justify-between items-center
                                    ${status === 'pending' ? 'bg-orange-500/10' : ''}
                                    ${status === 'preparing' ? 'bg-blue-500/10' : ''}
                                    ${status === 'ready' ? 'bg-emerald-500/10' : ''}
                                `}>
                                    <h2 className={`font-bold uppercase tracking-[0.2em] text-xs flex items-center gap-2
                                        ${status === 'pending' ? 'text-orange-400' : ''}
                                        ${status === 'preparing' ? 'text-blue-400' : ''}
                                        ${status === 'ready' ? 'text-emerald-400' : ''}
                                        ${status === 'completed' ? 'text-gray-400' : ''}
                                    `}>
                                        {status === 'completed' ? 'History' : status}
                                    </h2>
                                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-black/20 text-white/70">
                                        {getOrdersByStatus(status).length}
                                    </span>
                                </div>
                                <div className="space-y-4 flex-1 overflow-y-auto p-4 custom-scrollbar">
                                    {getOrdersByStatus(status).map(order => (
                                        <OrderCard key={order.id} order={order} />
                                    ))}
                                    {getOrdersByStatus(status).length === 0 && (
                                        <div className="text-center py-10 opacity-30 text-xs uppercase tracking-widest font-bold">
                                            No Orders
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Timer Modal */}
            <Modal
                isOpen={timerModal.isOpen}
                onClose={() => setTimerModal({ isOpen: false, orderId: null })}
                title="⏱️ Set Estimated Time"
            >
                <div className="space-y-6">
                    <p className="text-gray-300">How long will this order take to prepare?</p>
                    <div className="grid grid-cols-3 gap-3">
                        {[15, 30, 45].map(time => (
                            <button
                                key={time}
                                onClick={() => setEstimatedTime(time)}
                                className={`py-4 rounded-xl border font-bold text-lg transition-all ${estimatedTime === time
                                    ? 'bg-emerald-500 text-white border-emerald-500 shadow-glow-emerald'
                                    : 'bg-white/5 text-gray-400 border-white/10 hover:bg-white/10'}`}
                            >
                                {time}m
                            </button>
                        ))}
                    </div>
                    <div className="relative">
                        <label className="text-xs text-gray-500 uppercase font-bold mb-1 block">Custom (Minutes)</label>
                        <input
                            type="number"
                            value={estimatedTime}
                            onChange={(e) => setEstimatedTime(parseInt(e.target.value) || 0)}
                            className="input-field w-full text-center text-2xl font-mono"
                        />
                    </div>
                    <button
                        onClick={confirmTimer}
                        className="w-full btn-primary py-4 rounded-xl font-bold text-white shadow-lg flex items-center justify-center gap-2"
                    >
                        <span>Start Timer</span> →
                    </button>
                </div>
            </Modal>
        </div>
    );
};
