import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';
import api from '../utils/api';
import { Toast } from '../components/Toast';
import { Modal } from '../components/Modal';

// Interfaces
interface Order {
    id: string;
    table_id: string;
    status: string;
    order_type: string;
    total_amount: number;
    created_at: string;
    customer_name?: string;
    payment_method?: string;
    tables?: { table_number: string };
}

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

export const AdminDashboard = () => {
    const { restaurantId } = useParams();
    const navigate = useNavigate();
    const { signOut, profile } = useAuthStore();

    // Tab State
    const [activeTab, setActiveTab] = useState<'waiters' | 'settlement' | 'payments' | 'info'>('waiters');

    // Staff State (Renamed from Waiters)
    const [staff, setStaff] = useState<any[]>([]);
    const [isAddStaffOpen, setIsAddStaffOpen] = useState(false);
    const [editingStaff, setEditingStaff] = useState<any>(null);
    const [newStaff, setNewStaff] = useState({ name: '', email: '', password: '', role: 'staff' });

    // Financial Reports State
    const [allCompletedOrders, setAllCompletedOrders] = useState<Order[]>([]);
    const [reportPeriod, setReportPeriod] = useState<'daily' | 'monthly' | 'yearly'>('daily');

    // Info Tab State
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
    const [stats, setStats] = useState<any>(null);
    const [restaurant, setRestaurant] = useState<any>(null);
    const [isEditRestaurantOpen, setIsEditRestaurantOpen] = useState(false);
    const [editingRestaurant, setEditingRestaurant] = useState<any>(null);

    // Toast State
    const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);
    const [loading, setLoading] = useState(true);

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

    const showToast = (message: string, type: 'success' | 'error' | 'info') => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 3000);
    };

    // Fetch Functions
    const fetchStaff = async () => {
        if (!restaurantId) return;
        setLoading(true);
        try {
            const cleanId = restaurantId.split('&')[0];
            // We use the same endpoint (now upgraded) but conceptualize it as 'staff'
            const res = await api.get(`/waiters/${cleanId}`);
            setStaff(res.data);
        } catch (error) { console.error(error); }
        finally { setLoading(false); }
    };

    const fetchStats = async () => {
        if (!restaurantId) return;
        try {
            const cleanId = restaurantId.split('&')[0];
            const res = await api.get(`/waiters/${cleanId}/stats`);
            setStats(res.data);
        } catch (error) { console.error(error); }
    };

    const fetchRestaurant = async () => {
        if (!restaurantId) return;
        try {
            const cleanId = restaurantId.split('&')[0];
            const res = await api.get(`/restaurants/${cleanId}`);
            setRestaurant(res.data);
            setEditingRestaurant(res.data);
        } catch (error) { console.error(error); }
    };

    const fetchAllCompletedOrders = async () => {
        if (!restaurantId) return;
        setLoading(true);
        try {
            const cleanId = restaurantId.split('&')[0];
            const res = await api.get(`/orders/restaurant/${cleanId}`);
            const completedOrders = res.data.filter((o: Order) => o.status === 'completed');
            setAllCompletedOrders(completedOrders);
        } catch (error) {
            console.error('Error fetching orders:', error);
        } finally {
            setLoading(false);
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

    // Handlers
    const handleLogout = async () => {
        await signOut();
        navigate('/login');
    }

    const handleCreateStaff = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const cleanId = restaurantId?.split('&')[0];
            // Post to same endpoint, but now includes 'role'
            await api.post('/waiters/create', { ...newStaff, restaurantId: cleanId });
            setNewStaff({ name: '', email: '', password: '', role: 'staff' });
            setIsAddStaffOpen(false);
            showToast('Staff Member Added Successfully!', 'success');
            fetchStaff();
        } catch (error: any) {
            showToast(error.response?.data?.error || 'Failed to create staff', 'error');
        }
    };

    const handleDeleteStaff = async (id: string) => {
        setConfirmAction({
            isOpen: true,
            title: "Delete Staff",
            message: "Are you sure you want to delete this account? They will lose access immediately.",
            onConfirm: async () => {
                try {
                    await api.delete(`/waiters/${id}`);

                    // Check for Self-Deletion
                    if (profile?.id === id) {
                        await signOut();
                        navigate('/login');
                        return;
                    }

                    showToast('Staff Deleted', 'success');
                    fetchStaff();
                } catch (error: any) {
                    showToast(error.response?.data?.error || 'Failed to delete staff', 'error');
                    console.error('Delete Staff Error:', error);
                }
            }
        });
    };

    const handleUpdateStaff = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await api.put(`/waiters/${editingStaff.id}`, editingStaff);
            setEditingStaff(null);
            showToast('Staff Updated Successfully!', 'success');
            fetchStaff();
        } catch (error: any) {
            showToast(error.response?.data?.error || 'Failed to update staff', 'error');
        }
    };

    const handleDeleteOrder = async (id: string) => {
        setConfirmAction({
            isOpen: true,
            title: "Delete Order",
            message: "Permanently delete this order record? This will affect your financial reports and cannot be undone.",
            onConfirm: async () => {
                try {
                    await api.delete(`/orders/${id}`);
                    showToast('Order Record Deleted', 'success');
                    fetchAllCompletedOrders();
                    fetchStats();
                } catch (error) {
                    showToast('Failed to delete order', 'error');
                }
            }
        });
    };

    const handleUpdateRestaurant = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const cleanId = restaurantId?.split('&')[0];
            const res = await api.put(`/restaurants/${cleanId}`, editingRestaurant);
            setRestaurant(res.data);
            setIsEditRestaurantOpen(false);
            showToast('Restaurant Details Updated!', 'success');
        } catch (error) {
            showToast('Failed to update restaurant details', 'error');
        }
    };

    // Effects
    useEffect(() => {
        if (activeTab === 'waiters') fetchStaff();
        if (activeTab === 'settlement') {
            fetchStats();
            fetchAllCompletedOrders();
        }
        if (activeTab === 'info') {
            fetchStats();
            fetchAllCompletedOrders();
            fetchRestaurant();
        }
    }, [restaurantId, activeTab]);

    return (
        <div className="min-h-screen bg-slate-950 flex flex-col relative overflow-hidden text-gray-100 font-sans">
            {/* Background Effects */}
            <div className="absolute top-0 left-0 w-full h-[500px] bg-indigo-900/20 rounded-full blur-[120px] pointer-events-none"></div>
            <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-emerald-900/10 rounded-full blur-[100px] pointer-events-none"></div>

            {/* Toast */}
            {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

            {/* Header */}
            <header className="glass-nav px-8 py-5 flex justify-between items-center sticky top-0 z-30 mb-6 shrink-0">
                <div className="flex items-center gap-6">
                    <h1 className="text-2xl font-display font-bold text-white tracking-tight flex items-center gap-2">
                        <span className="text-3xl">👑</span> Admin<span className="text-emerald-400">OS</span>
                    </h1>
                    <div className="hidden md:flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                        <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse shadow-lg shadow-emerald-500/50"></span>
                        <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider">OWNER ACCESS</span>
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    {loading && (
                        <div className="flex items-center gap-3 bg-emerald-500/10 px-4 py-2 rounded-xl border border-emerald-500/20">
                            <div className="animate-spin rounded-full h-4 w-4 border-2 border-emerald-500 border-t-transparent"></div>
                            <span className="text-xs font-bold text-emerald-400">SYNCING...</span>
                        </div>
                    )}

                    <button
                        onClick={handleLogout}
                        className="px-4 py-2 rounded-xl bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20 transition-all text-xs font-bold uppercase tracking-wider flex items-center gap-2"
                    >
                        <span>Logout</span>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"></path></svg>
                    </button>
                </div>
            </header>

            {/* Main Content */}
            <div className="p-4 md:p-8 max-w-6xl mx-auto w-full animate-fade-in relative z-10 overflow-y-auto">
                {/* Tab Navigation */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 md:mb-10 gap-4">
                    <div>
                        <h2 className="text-3xl md:text-4xl font-display font-bold text-white mb-2">Business Management</h2>
                        <div className="flex gap-4 mt-4 flex-wrap">
                            <button onClick={() => setActiveTab('waiters')} className={`px-4 py-2 rounded-xl text-sm font-bold border transition-all ${activeTab === 'waiters' ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white border-transparent shadow-lg shadow-emerald-500/30' : 'text-gray-400 border-white/10 hover:text-white hover:border-white/20'}`}>👥 Staff & Roles</button>
                            <button onClick={() => setActiveTab('settlement')} className={`px-4 py-2 rounded-xl text-sm font-bold border transition-all ${activeTab === 'settlement' ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white border-transparent shadow-lg shadow-emerald-500/30' : 'text-gray-400 border-white/10 hover:text-white hover:border-white/20'}`}>💰 Settlement</button>
                            <button onClick={() => setActiveTab('payments')} className={`px-4 py-2 rounded-xl text-sm font-bold border transition-all ${activeTab === 'payments' ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white border-transparent shadow-lg shadow-emerald-500/30' : 'text-gray-400 border-white/10 hover:text-white hover:border-white/20'}`}>💳 Payments</button>
                            <button onClick={() => setActiveTab('info')} className={`px-4 py-2 rounded-xl text-sm font-bold border transition-all ${activeTab === 'info' ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white border-transparent shadow-lg shadow-emerald-500/30' : 'text-gray-400 border-white/10 hover:text-white hover:border-white/20'}`}>ℹ️ Info</button>
                        </div>
                    </div>
                    {activeTab === 'waiters' && (
                        <button
                            className="w-full md:w-auto btn-primary text-white px-6 py-3 md:px-8 md:py-4 rounded-2xl font-bold shadow-2xl hover:shadow-emerald-500/20 transition-all transform active:scale-95 flex items-center justify-center gap-2 group"
                            onClick={() => setIsAddStaffOpen(true)}
                        >
                            <span className="text-xl group-hover:rotate-90 transition-transform bg-white/20 w-8 h-8 rounded-full flex items-center justify-center">+</span> Add Staff
                        </button>
                    )}
                </div>

                {/* Tab Content - Staff / Waiters */}
                {activeTab === 'waiters' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {staff.map(member => (
                            <div key={member.id} className="glass-panel p-6 rounded-2xl border border-white/10 flex justify-between items-center group relative overflow-hidden">
                                {member.role === 'admin' && <div className="absolute top-0 right-0 bg-emerald-500 text-[10px] font-bold px-2 py-1 rounded-bl-xl text-white">ADMIN</div>}
                                {member.role === 'manager' && <div className="absolute top-0 right-0 bg-blue-500 text-[10px] font-bold px-2 py-1 rounded-bl-xl text-white">MANAGER</div>}

                                <div className="flex items-center gap-4">
                                    <div className={`w-12 h-12 rounded-full flex items-center justify-center text-xl font-bold text-white ${member.role === 'admin' ? 'bg-gradient-to-tr from-emerald-500 to-teal-500' :
                                        member.role === 'kitchen' ? 'bg-gradient-to-tr from-orange-500 to-red-500' :
                                            'bg-gradient-to-tr from-slate-600 to-slate-500'
                                        }`}>
                                        {member.full_name?.charAt(0) || member.name?.charAt(0) || '?'}
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-white text-lg">{member.full_name || member.name}</h3>
                                        <p className="text-xs text-gray-400">{member.email}</p>
                                        <span className="text-[10px] uppercase font-bold tracking-wider text-gray-500 border border-gray-700 px-2 py-0.5 rounded-full mt-1 inline-block">
                                            {member.role || 'Staff'}
                                        </span>
                                    </div>
                                </div>
                                <div className="flex gap-2">
                                    <button onClick={() => setEditingStaff(member)} className="text-blue-400 hover:bg-blue-500/10 p-2 rounded-lg transition-colors opacity-0 group-hover:opacity-100">
                                        📝
                                    </button>
                                    <button onClick={() => handleDeleteStaff(member.id)} className="text-red-400 hover:bg-red-500/10 p-2 rounded-lg transition-colors opacity-0 group-hover:opacity-100">
                                        🗑️
                                    </button>
                                </div>
                            </div>
                        ))}
                        <Modal isOpen={isAddStaffOpen} onClose={() => setIsAddStaffOpen(false)} title="Add Staff Member">
                            <form onSubmit={handleCreateStaff} className="space-y-4">
                                <input placeholder="Name" className="input-field w-full" value={newStaff.name} onChange={e => setNewStaff({ ...newStaff, name: e.target.value })} required />
                                <input placeholder="Email" type="email" className="input-field w-full" value={newStaff.email} onChange={e => setNewStaff({ ...newStaff, email: e.target.value })} required />
                                <input placeholder="Password" type="password" className="input-field w-full" value={newStaff.password} onChange={e => setNewStaff({ ...newStaff, password: e.target.value })} required />
                                <select
                                    className="input-field w-full appearance-none capitalize"
                                    value={newStaff.role}
                                    onChange={e => setNewStaff({ ...newStaff, role: e.target.value })}
                                >
                                    <option value="admin">Admin (Owner)</option>
                                    <option value="manager">Manager (Supervisor)</option>
                                    <option value="staff_manager">Staff Manager (HR)</option>
                                    <option value="waiter">Waiter (Service)</option>
                                    <option value="kitchen">Kitchen (KDS)</option>
                                    <option value="counter">Counter (POS & Billing)</option>
                                    <option value="inventory">Inventory (Store)</option>
                                </select>
                                <button type="submit" className="btn-primary w-full py-3 rounded-xl font-bold text-white">Create Account</button>
                            </form>
                        </Modal>

                        <Modal isOpen={!!editingStaff} onClose={() => setEditingStaff(null)} title="Edit Staff Member">
                            {editingStaff && (
                                <form onSubmit={handleUpdateStaff} className="space-y-4">
                                    <div>
                                        <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Full Name</label>
                                        <input className="input-field w-full" value={editingStaff.full_name || editingStaff.name} onChange={e => setEditingStaff({ ...editingStaff, name: e.target.value, full_name: e.target.value })} required />
                                    </div>
                                    <div>
                                        <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Email Address</label>
                                        {/* Typically email isn't editable easily without re-confirmation, but we allow admin override here */}
                                        <input type="email" className="input-field w-full" value={editingStaff.email || ''} onChange={e => setEditingStaff({ ...editingStaff, email: e.target.value })} />
                                    </div>
                                    <div>
                                        <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Role</label>
                                        <select
                                            className="input-field w-full appearance-none capitalize"
                                            value={editingStaff.role || 'staff'}
                                            onChange={e => setEditingStaff({ ...editingStaff, role: e.target.value })}
                                        >
                                            <option value="admin">Admin (Owner)</option>
                                            <option value="manager">Manager (Supervisor)</option>
                                            <option value="staff_manager">Staff Manager (HR)</option>
                                            <option value="waiter">Waiter (Service)</option>
                                            <option value="kitchen">Kitchen (KDS)</option>
                                            <option value="counter">Counter (POS & Billing)</option>
                                            <option value="inventory">Inventory (Store)</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Change Password (optional)</label>
                                        <input placeholder="Leave blank to keep current" type="password" className="input-field w-full" value={editingStaff.password || ''} onChange={e => setEditingStaff({ ...editingStaff, password: e.target.value })} />
                                    </div>
                                    <div className="flex gap-4 pt-2">
                                        <button type="button" onClick={() => setEditingStaff(null)} className="flex-1 bg-white/5 text-gray-400 py-3 rounded-xl font-bold hover:bg-white/10 transition-colors border border-white/5">Cancel</button>
                                        <button type="submit" className="flex-1 btn-primary py-3 rounded-xl font-bold text-white">Update Staff</button>
                                    </div>
                                </form>
                            )}
                        </Modal>
                    </div>
                )}

                {/* Tab Content - Settlement (Financial Reports) */}
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

                            {/* Metrics Cards */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <div className="relative group overflow-hidden">
                                    <div className="absolute-inset-2 bg-gradient-to-r from-emerald-500/20 to-teal-500/20 rounded-3xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
                                    <div className="relative glass-panel p-8 rounded-3xl border-2 border-emerald-500/40 shadow-[0_8px_32px_rgba(16,185,129,0.2)] hover:shadow-[0_20px_60px_rgba(16,185,129,0.4)] transition-all duration-500 bg-gradient-to-br from-emerald-500/10 to-black/30">
                                        <div className="absolute top-4 right-4 w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-400/20 to-teal-500/20 flex items-center justify-center backdrop-blur-md border border-emerald-500/20">
                                            <span className="text-3xl">💎</span>
                                        </div>
                                        <p className="text-xs font-black text-emerald-400/70 uppercase tracking-[0.2em] mb-3">Total Revenue</p>
                                        <p className="text-5xl font-display font-black text-transparent bg-clip-text bg-gradient-to-r from-emerald-300 to-teal-300 mt-2 drop-shadow-[0_0_20px_rgba(16,185,129,0.5)]">₹{currentPeriod.total.toLocaleString()}</p>
                                        <p className="text-xs text-gray-400 mt-3 font-medium">{reportPeriod.charAt(0).toUpperCase() + reportPeriod.slice(1)} Period</p>
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

                            {/* Waiter Performance */}
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
                                                        <th className="py-4">Items (Orders)</th>
                                                        <th className="py-4 text-right">Total Sales</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-white/5">
                                                    {stats.waiters.map((w: any) => (
                                                        <tr key={w.id}>
                                                            <td className="py-4 font-bold text-white">{w.name}</td>
                                                            <td className="py-4">{w.items_count || 0} <span className="text-xs text-gray-500">({w.count} Orders)</span></td>
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

                {/* Tab Content - Payments */}
                {activeTab === 'payments' && (
                    <div className="glass-panel p-8 rounded-3xl border border-white/10">
                        <h3 className="text-2xl font-bold text-white mb-6">💳 Payment Transactions</h3>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-gray-300">
                                <thead className="text-xs font-bold uppercase text-gray-500 border-b border-white/10">
                                    <tr>
                                        <th className="py-4">Order ID</th>
                                        <th className="py-4">Date</th>
                                        <th className="py-4">Method</th>
                                        <th className="py-4 text-right">Amount</th>
                                        <th className="py-4 text-right px-4">Action</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/5">
                                    {allCompletedOrders.map(order => (
                                        <tr key={order.id}>
                                            <td className="py-4 font-mono text-sm">#{order.id.slice(0, 8)}</td>
                                            <td className="py-4">{new Date(order.created_at).toLocaleDateString()}</td>
                                            <td className="py-4">
                                                <span className={`px-3 py-1 rounded-full text-xs font-bold ${order.payment_method === 'cash' ? 'bg-green-500/20 text-green-400' : 'bg-blue-500/20 text-blue-400'}`}>
                                                    {order.payment_method || 'N/A'}
                                                </span>
                                            </td>
                                            <td className="py-4 text-right font-mono font-bold text-emerald-400">₹{order.total_amount}</td>
                                            <td className="py-4 text-right px-4">
                                                <button
                                                    onClick={() => handleDeleteOrder(order.id)}
                                                    className="text-red-400 hover:text-white hover:bg-red-500/20 p-2 rounded-lg transition-colors border border-transparent hover:border-red-500/20"
                                                    title="Delete Transaction Record"
                                                >
                                                    🗑️
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* Tab Content - Info */}
                {activeTab === 'info' && (
                    <div className="space-y-6">
                        <div className="glass-panel p-8 rounded-3xl border border-white/10">
                            <div className="flex justify-between items-start mb-6">
                                <h3 className="text-2xl font-bold text-white">ℹ️ Business Information</h3>
                                <button
                                    onClick={() => setIsEditRestaurantOpen(true)}
                                    className="px-4 py-2 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-xl text-sm font-bold hover:bg-emerald-500/20 transition-all"
                                >
                                    📝 Edit Details
                                </button>
                            </div>

                            {restaurant && (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-10">
                                    <div className="space-y-4">
                                        <div>
                                            <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-1">Restaurant Name</p>
                                            <p className="text-xl font-bold text-white">{restaurant.name}</p>
                                        </div>
                                        <div>
                                            <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-1">Address</p>
                                            <p className="text-gray-300">{restaurant.address || 'Not set'}</p>
                                        </div>
                                    </div>
                                    <div className="space-y-4">
                                        <div>
                                            <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-1">Contact Phone</p>
                                            <p className="text-gray-300">{restaurant.phone || 'Not set'}</p>
                                        </div>
                                        <div>
                                            <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-1">GST Number</p>
                                            <p className="text-gray-300">{restaurant.gst_number || 'Not set'}</p>
                                        </div>
                                    </div>
                                </div>
                            )}

                            <div className="h-px bg-white/5 mb-10"></div>

                            <h3 className="text-2xl font-bold text-white mb-6">📈 Daily Performance</h3>
                            <div className="space-y-4">
                                <div>
                                    <label className="text-sm text-gray-400 mb-2 block">Select View Date</label>
                                    <input
                                        type="date"
                                        value={selectedDate}
                                        onChange={(e) => setSelectedDate(e.target.value)}
                                        className="input-field bg-slate-900 border-slate-700 focus:border-emerald-500/50"
                                    />
                                </div>
                                {stats && (
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
                                        <div className="glass-card p-6 rounded-2xl border border-emerald-500/20">
                                            <p className="text-sm text-gray-400 mb-2">Total Revenue</p>
                                            <p className="text-3xl font-bold text-emerald-400">₹{stats.summary.revenue}</p>
                                        </div>
                                        <div className="glass-card p-6 rounded-2xl border border-blue-500/20">
                                            <p className="text-sm text-gray-400 mb-2">Orders Delivered</p>
                                            <p className="text-3xl font-bold text-blue-400">{stats.summary.deliveredOrders}</p>
                                        </div>
                                        <div className="glass-card p-6 rounded-2xl border border-amber-500/20">
                                            <p className="text-sm text-gray-400 mb-2">Active Waiters</p>
                                            <p className="text-3xl font-bold text-amber-400">{stats.waiters.length}</p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        <Modal isOpen={isEditRestaurantOpen} onClose={() => setIsEditRestaurantOpen(false)} title="Edit Business Details">
                            {editingRestaurant && (
                                <form onSubmit={handleUpdateRestaurant} className="space-y-4">
                                    <div>
                                        <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Restaurant Name</label>
                                        <input className="input-field w-full" value={editingRestaurant.name} onChange={e => setEditingRestaurant({ ...editingRestaurant, name: e.target.value })} required />
                                    </div>
                                    <div>
                                        <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Address</label>
                                        <textarea className="input-field w-full h-20 resize-none" value={editingRestaurant.address || ''} onChange={e => setEditingRestaurant({ ...editingRestaurant, address: e.target.value })} />
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Phone</label>
                                            <input className="input-field w-full" value={editingRestaurant.phone || ''} onChange={e => setEditingRestaurant({ ...editingRestaurant, phone: e.target.value })} />
                                        </div>
                                        <div>
                                            <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">GST Number</label>
                                            <input className="input-field w-full" value={editingRestaurant.gst_number || ''} onChange={e => setEditingRestaurant({ ...editingRestaurant, gst_number: e.target.value })} />
                                        </div>
                                    </div>
                                    <div className="flex gap-4 pt-2">
                                        <button type="button" onClick={() => setIsEditRestaurantOpen(false)} className="flex-1 bg-white/5 text-gray-400 py-3 rounded-xl font-bold">Cancel</button>
                                        <button type="submit" className="flex-1 btn-primary py-3 rounded-xl font-bold text-white">Save Changes</button>
                                    </div>
                                </form>
                            )}
                        </Modal>
                    </div>
                )}
            </div>

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
