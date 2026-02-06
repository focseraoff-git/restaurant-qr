import { useEffect, useState, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { LogoutButton } from '../components/auth/LogoutButton';
import api from '../utils/api';
import { Toast } from '../components/Toast';
import { Modal } from '../components/Modal';

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

// ConfirmModal Component
const ConfirmModal = ({ isOpen, onClose, onConfirm, title, message, type = 'danger' }: any) => {
    return (
        <Modal isOpen={isOpen} onClose={onClose} title={title}>
            <div className="text-center">
                <div className={`w-20 h-20 rounded-3xl flex items-center justify-center mx-auto mb-6 border ${type === 'danger' ? 'bg-red-500/10 border-red-500/20 text-red-500' : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500'}`}>
                    {type === 'danger' ? (
                        <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                    ) : (
                        <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                    )}
                </div>
                <p className="text-gray-300 text-lg mb-8 leading-relaxed">
                    {message}
                </p>
                <div className="flex gap-4">
                    <button
                        onClick={onClose}
                        className="flex-1 px-6 py-4 rounded-2xl bg-white/5 text-gray-400 font-bold hover:bg-white/10 transition-all border border-white/10"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={() => { onConfirm(); onClose(); }}
                        className={`flex-1 px-6 py-4 rounded-2xl font-bold text-white shadow-lg transition-all transform active:scale-95 ${type === 'danger' ? 'bg-gradient-to-r from-red-600 to-rose-600 shadow-red-500/20 hover:shadow-red-500/40' : 'bg-gradient-to-r from-emerald-600 to-teal-600 shadow-emerald-500/20 hover:shadow-emerald-500/40'}`}
                    >
                        Confirm
                    </button>
                </div>
            </div>
        </Modal>
    );
};

export const KitchenDashboard = () => {
    const { restaurantId } = useParams();

    // Orders State
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);
    const [backgroundSyncing, setBackgroundSyncing] = useState(false);
    const [lastCount, setLastCount] = useState(0);
    const audioRef = useRef<HTMLAudioElement | null>(null);

    // Manager Mode State
    const [isManagerMode, setIsManagerMode] = useState(true); // Default to Manager Mode for nicer first impression
    const [menuCategories, setMenuCategories] = useState<any[]>([]);
    const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

    // Manager Tabs - Simplified to menu only
    const [activeTab, setActiveTab] = useState<'menu'>('menu');

    // Modal & Form State
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [editingItem, setEditingItem] = useState<any | null>(null);
    const [newItem, setNewItem] = useState({ name: '', price: '', description: '', is_veg: true, category_id: '' });

    // Category Management State
    const [isAddCategoryOpen, setIsAddCategoryOpen] = useState(false);
    const [editingCategory, setEditingCategory] = useState<any | null>(null);
    const [newCategoryName, setNewCategoryName] = useState('');

    // Confirmation State
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

    // Request notification permission on mount
    useEffect(() => {
        if (Notification.permission !== "granted") {
            Notification.requestPermission();
        }
    }, []);

    const fetchOrders = async () => {
        if (!restaurantId) return;
        setBackgroundSyncing(true);
        try {
            // Sanitize ID in case query params got appended to the URL path
            const cleanId = restaurantId.split('&')[0];
            const res = await api.get(`/orders/restaurant/${cleanId}`);
            setOrders(res.data);
            setLoading(false);
        } catch (error) {
            console.error('Error fetching orders:', error);
            setLoading(false);
        } finally {
            setBackgroundSyncing(false);
        }
    };

    const fetchMenu = async () => {
        if (!restaurantId) return;
        setBackgroundSyncing(true);
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
        } finally {
            setBackgroundSyncing(false);
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

        const interval = setInterval(fetchOrders, 5000);
        return () => clearInterval(interval);
    }, [restaurantId]);


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

    const handleDeleteOrder = async (orderId: string) => {
        setConfirmAction({
            isOpen: true,
            title: "Delete History",
            message: "Are you sure you want to permanently delete this order history? This cannot be undone.",
            onConfirm: async () => {
                try {
                    await api.delete(`/orders/${orderId}`);
                    setOrders(prev => prev.filter(o => o.id !== orderId));
                    showToast("Order History Deleted", "success");
                } catch (error) {
                    console.error('Error deleting order:', error);
                    showToast("Failed to delete order", "error");
                }
            }
        });
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

    const handleCreateCategory = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newCategoryName) return;
        try {
            await api.post('/menu/categories', {
                restaurant_id: restaurantId?.split('&')[0],
                name: newCategoryName,
                sort_order: menuCategories.length
            });
            setNewCategoryName('');
            setIsAddCategoryOpen(false);
            fetchMenu();
            showToast("Category Created! 📁", "success");
        } catch (error) {
            showToast("Failed to create category", "error");
        }
    };

    const handleUpdateCategory = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingCategory) return;
        try {
            await api.put(`/menu/categories/${editingCategory.id}`, {
                name: editingCategory.name,
                sort_order: editingCategory.sort_order
            });
            setEditingCategory(null);
            fetchMenu();
            showToast("Category Updated!", "success");
        } catch (error) {
            showToast("Failed to update category", "error");
        }
    };

    const handleDeleteCategory = async (id: string) => {
        setConfirmAction({
            isOpen: true,
            title: "Delete Category",
            message: "Delete this category and all its items? This action is permanent.",
            onConfirm: async () => {
                try {
                    await api.delete(`/menu/categories/${id}`);
                    fetchMenu();
                    showToast("Category Deleted", "success");
                } catch (error) {
                    showToast("Failed to delete category", "error");
                }
            }
        });
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
        setConfirmAction({
            isOpen: true,
            title: "Delete Recipe",
            message: "Are you sure you want to delete this recipe from the menu?",
            onConfirm: async () => {
                try {
                    await api.delete(`/menu/${itemId}`);
                    fetchMenu();
                    showToast("Recipe Removed Successfully", "success");
                } catch (error: any) {
                    const msg = error.response?.data?.error || error.message || "Failed to delete item.";
                    showToast(msg, "error");
                }
            }
        });
        setDeleteConfirmation({ isOpen: false, itemId: null });
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
                {order.status === 'completed' && (
                    <button
                        onClick={() => handleDeleteOrder(order.id)}
                        className="text-red-400 hover:text-white hover:bg-red-500/20 border border-red-500/20 rounded-xl px-3 py-2 transition-colors flex items-center justify-center"
                        title="Delete History permanently"
                    >
                        🗑️
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
                    <h1 className="text-2xl font-serif font-medium tracking-tight flex items-center gap-1 group cursor-default">
                        <span className="text-white group-hover:text-emerald-50 transition-colors">Focsera</span>
                        <span className="text-emerald-400 italic font-light relative">
                            DineQR
                            <span className="absolute -top-0.5 -right-1 w-1.5 h-1.5 bg-emerald-400 rounded-full blur-[1px] opacity-80 animate-pulse"></span>
                        </span>
                        <span className="ml-3 px-2 py-0.5 rounded-md bg-white/5 border border-white/5 text-[10px] font-sans text-gray-400 font-bold uppercase tracking-wider">Kitchen</span>
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
                    {backgroundSyncing && (
                        <div className="flex items-center gap-2 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20">
                            <div className="animate-spin rounded-full h-3 w-3 border-2 border-emerald-500 border-t-transparent"></div>
                            <span className="text-[10px] font-bold text-emerald-400">SYNCING</span>
                        </div>
                    )}
                    <div className="text-xs font-bold px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-2 animate-pulse">
                        <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></span>
                        LIVE SYSTEM
                    </div>
                    <LogoutButton />
                </div>

            </header>

            {isManagerMode ? (
                <div className="p-4 md:p-8 max-w-6xl mx-auto w-full animate-fade-in relative z-10 overflow-y-auto">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 md:mb-10 gap-4">
                        <div>
                            <h2 className="text-3xl md:text-4xl font-display font-bold text-white mb-2">Manager Validation</h2>
                            <div className="flex gap-4 mt-4">
                                <button onClick={() => setActiveTab('menu')} className={`px-4 py-2 rounded-xl text-sm font-bold border transition-all ${activeTab === 'menu' ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white border-transparent shadow-lg shadow-emerald-500/30' : 'text-gray-400 border-white/10 hover:text-white hover:border-white/20'}`}>🍽️ Menu</button>
                            </div>
                        </div>
                        {activeTab === 'menu' && (
                            <div className="flex gap-3 w-full md:w-auto">
                                <button
                                    className="flex-1 md:flex-none bg-white/5 border border-white/10 text-white px-6 py-3 md:px-8 md:py-4 rounded-2xl font-bold hover:bg-white/10 transition-all transform active:scale-95 flex items-center justify-center gap-2 group"
                                    onClick={() => setIsAddCategoryOpen(true)}
                                >
                                    <span className="text-xl">📁</span> Add Category
                                </button>
                                <button
                                    className="flex-1 md:flex-none btn-primary text-white px-6 py-3 md:px-8 md:py-4 rounded-2xl font-bold shadow-2xl hover:shadow-emerald-500/20 transition-all transform active:scale-95 flex items-center justify-center gap-2 group"
                                    onClick={() => setIsAddModalOpen(true)}
                                >
                                    <span className="text-xl group-hover:rotate-90 transition-transform bg-white/20 w-8 h-8 rounded-full flex items-center justify-center">+</span> Add New Recipe
                                </button>
                            </div>
                        )}
                    </div>



                    {/* NEW PAYMENTS TAB */}

                    {/* NEW INFO TAB */}

                    {activeTab === 'menu' && (
                        <div className="space-y-6 md:space-y-8 pb-20">
                            {menuCategories.map(cat => (
                                <div key={cat.id} className="glass-panel rounded-3xl p-5 md:p-8 border border-white/5 relative overflow-hidden group/cat">
                                    {/* Decor */}
                                    <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/5 rounded-full blur-3xl -mr-16 -mt-16 transition-opacity opacity-50 group-hover/cat:opacity-100"></div>

                                    <div className="flex items-center justify-between mb-8 relative z-10 border-b border-white/5 pb-4">
                                        <div className="flex items-center gap-4">
                                            <h3 className="text-2xl font-bold text-white flex items-center gap-3">
                                                {cat.name}
                                                <span className="text-[10px] font-bold text-gray-400 bg-white/5 px-2 py-1 rounded-md border border-white/5 uppercase tracking-widest">
                                                    {cat.menu_items.length} Items
                                                </span>
                                            </h3>
                                        </div>
                                        <div className="flex gap-2">
                                            <button onClick={() => setEditingCategory(cat)} className="p-2 text-gray-400 hover:text-blue-400 transition-colors" title="Edit Category">
                                                📝
                                            </button>
                                            <button onClick={() => handleDeleteCategory(cat.id)} className="p-2 text-gray-400 hover:text-red-400 transition-colors" title="Delete Category">
                                                🗑️
                                            </button>
                                        </div>
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

                    {/* NEW: Add Category Modal */}
                    <Modal isOpen={isAddCategoryOpen} onClose={() => setIsAddCategoryOpen(false)} title="Add Category">
                        <form onSubmit={handleCreateCategory} className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-gray-400 mb-2 uppercase tracking-wider">Category Name</label>
                                <input
                                    type="text" required
                                    className="input-field w-full"
                                    value={newCategoryName}
                                    onChange={e => setNewCategoryName(e.target.value)}
                                    placeholder="e.g. Starters, Main Course..."
                                />
                            </div>
                            <button type="submit" className="w-full btn-primary text-white py-4 rounded-xl font-bold shadow-lg shadow-emerald-500/20">
                                Create Category
                            </button>
                        </form>
                    </Modal>

                    {/* NEW: Edit Category Modal */}
                    <Modal isOpen={!!editingCategory} onClose={() => setEditingCategory(null)} title="Edit Category">
                        {editingCategory && (
                            <form onSubmit={handleUpdateCategory} className="space-y-4">
                                <div>
                                    <label className="block text-xs font-bold text-gray-400 mb-2 uppercase tracking-wider">Category Name</label>
                                    <input
                                        type="text" required
                                        className="input-field w-full"
                                        value={editingCategory.name}
                                        onChange={e => setEditingCategory({ ...editingCategory, name: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-400 mb-2 uppercase tracking-wider">Sort Order</label>
                                    <input
                                        type="number" required
                                        className="input-field w-full"
                                        value={editingCategory.sort_order}
                                        onChange={e => setEditingCategory({ ...editingCategory, sort_order: parseInt(e.target.value) })}
                                    />
                                </div>
                                <div className="flex gap-4 pt-2">
                                    <button type="button" onClick={() => setEditingCategory(null)} className="flex-1 bg-white/5 text-gray-400 py-3 rounded-xl font-bold hover:bg-white/10 transition-colors border border-white/5">
                                        Cancel
                                    </button>
                                    <button type="submit" className="flex-1 btn-primary text-white py-3 rounded-xl font-bold shadow-lg shadow-emerald-500/20">
                                        Update Category
                                    </button>
                                </div>
                            </form>
                        )}
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

            <ConfirmModal
                isOpen={confirmAction.isOpen}
                onClose={() => setConfirmAction({ ...confirmAction, isOpen: false })}
                title={confirmAction.title}
                message={confirmAction.message}
                onConfirm={confirmAction.onConfirm}
                type={confirmAction.type}
            />

            {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
        </div>
    );
};
