import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../store/useStore';
import api from '../utils/api';
import { Toast } from '../components/Toast';
import { Modal } from '../components/Modal';

interface OrderItem {
    id: string;
    quantity: number;
    portion: string;
    price_at_time: number;
    menu_items: {
        name: string;
    };
}

interface Order {
    id: string;
    status: string;
    total_amount: number;
    created_at: string;
    order_items: OrderItem[];
    estimated_prep_time?: number;
}

export const BillPage = () => {
    const { restaurantId, customerName, tableNumber, resetStore, myOrderIds } = useStore();
    const navigate = useNavigate();
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);
    const [showHistory, setShowHistory] = useState(false);
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

    const fetchOrders = () => {
        setLoading(true);
        const params: any = { restaurantId };

        // Use device history IDs if available
        if (myOrderIds && myOrderIds.length > 0) {
            params.orderIds = myOrderIds.join(',');
        }
        // Fallback for migration/safety
        if (customerName) {
            params.customerName = customerName;
            params.tableNumber = tableNumber;
        }

        api.get(`/orders/active`, { params })
            .then(res => {
                setOrders(res.data);
                showToast('Orders updated', 'info');
            })
            .catch(err => {
                console.error(err);
                showToast('Failed to sync orders', 'error');
            })
            .finally(() => setLoading(false));
    };

    useEffect(() => {
        if (restaurantId && customerName) {
            fetchOrders();
            const interval = setInterval(fetchOrders, 10000);
            return () => clearInterval(interval);
        } else {
            setLoading(false);
        }
    }, [restaurantId, customerName, tableNumber]);

    // SPLIT ORDERS: Active vs Past (Paid/Cancelled)
    const activeOrders = orders.filter(o => o.status !== 'completed' && o.status !== 'cancelled');
    const paidOrders = orders.filter(o => o.status === 'completed' || o.status === 'cancelled');

    const totalDue = activeOrders.reduce((sum, order) => sum + order.total_amount, 0);

    const handleLogout = () => {
        setConfirmAction({
            isOpen: true,
            title: "End Session",
            message: "Are you sure you want to logout? This will clear your current session data.",
            onConfirm: () => {
                resetStore();
                navigate('/');
            }
        });
    };

    const handlePrint = () => {
        window.print();
    };

    if (loading) return (
        <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-emerald-500"></div>
            <p className="mt-4 text-emerald-500 font-bold animate-pulse">Retrieving Bill...</p>
        </div>
    );

    // Helper Component for Order List
    const OrderList = ({ listOrders }: { listOrders: Order[] }) => (
        <div className="space-y-6">
            {listOrders.map((order) => (
                <div key={order.id} className="pb-6 border-b border-dashed border-white/10 last:border-0 last:pb-0">
                    <div className="flex justify-between items-center mb-3">
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest font-mono">
                            {new Date(order.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                        <span className={`text-[10px] font-bold px-2 py-1 rounded-md uppercase tracking-wider border
                            ${order.status === 'completed' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                                order.status === 'cancelled' ? 'bg-red-500/10 text-red-400 border-red-500/20' : 'bg-white/5 text-gray-400 border-white/10'}`}>
                            {order.status === 'completed' ? 'PAID' : order.status}
                        </span>
                    </div>
                    {order.order_items.map(item => (
                        <div key={item.id} className="flex justify-between text-sm py-1.5 font-mono text-gray-300">
                            <span className={`${order.status === 'cancelled' ? 'line-through opacity-40' : ''}`}>
                                <span className="font-bold text-white mr-2">{item.quantity}x</span>
                                {item.menu_items?.name}
                                {item.portion !== 'full' && <span className="text-amber-500 text-[10px] ml-2 uppercase">({item.portion})</span>}
                            </span>
                            <span className={`font-bold ${order.status === 'cancelled' ? 'line-through opacity-40' : 'text-gray-100'}`}>
                                ₹{item.price_at_time * item.quantity}
                            </span>
                        </div>
                    ))}
                    {order.status === 'completed' && (
                        <div className="mt-3 text-right">
                            <span className="text-xs font-bold text-emerald-500 uppercase tracking-wider">Paid: ₹{order.total_amount}</span>
                        </div>
                    )}
                </div>
            ))}
        </div>
    );

    return (
        <div className="min-h-screen bg-slate-950 pb-24 print:bg-white print:pb-0 relative overflow-hidden font-sans">
            {/* Background Effects (Screen Only) */}
            <div className="absolute top-0 left-0 w-full h-[500px] bg-indigo-900/10 rounded-full blur-[120px] pointer-events-none no-print"></div>

            {/* Header - Hidden in Print */}
            <header className="glass-nav px-6 py-4 sticky top-0 z-30 flex justify-between items-center no-print shadow-lg border-b border-white/5 mb-6">
                <button onClick={() => navigate('/menu')} className="text-gray-300 font-bold flex items-center gap-2 hover:text-white transition-colors">
                    <span className="text-xl">←</span> Menu
                </button>
                <h1 className="font-display font-bold text-lg text-white">Your Bill</h1>
                <button onClick={fetchOrders} className="text-emerald-400 text-xs font-bold bg-emerald-500/10 border border-emerald-500/20 px-3 py-1.5 rounded-lg hover:bg-emerald-500/20 transition-all uppercase tracking-wider">
                    Refresh
                </button>
            </header>

            <div className="p-6 max-w-md mx-auto print:p-0 print:max-w-none space-y-6 relative z-10">

                {/* 1. ACTIVE BILL SECTION */}
                <div className="bg-slate-900 relative shadow-2xl print:shadow-none print:w-full rounded-2xl overflow-hidden border border-white/5 print:border-black">
                    {/* Decorative Receipt Edge (Top) */}
                    <div className="h-2 bg-gradient-to-r from-emerald-500 to-teal-600 no-print"></div>

                    <div className="bg-slate-800/50 p-8 text-center border-b border-white/5 print:bg-white print:text-black">
                        <p className="text-gray-400 text-[10px] uppercase tracking-[0.3em] mb-2 font-bold print:text-gray-600">TOTAL DUE</p>
                        <h2 className="text-5xl font-display font-bold text-white print:text-black mb-1">₹{totalDue}</h2>
                        <div className="flex items-center justify-center gap-2 mt-4 text-xs font-mono text-gray-500 uppercase tracking-wider">
                            <span className="bg-white/5 px-2 py-1 rounded">{customerName}</span>
                            <span className="text-gray-600">•</span>
                            <span className="bg-white/5 px-2 py-1 rounded">Table {tableNumber || 'N/A'}</span>
                        </div>
                    </div>

                    <div className="p-8 bg-slate-900 print:bg-white">
                        {activeOrders.length === 0 ? (
                            <div className="text-center py-8">
                                <div className="w-16 h-16 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto mb-4 text-3xl">🎉</div>
                                <p className="text-gray-400 mb-2 font-display">No active unpaid orders.</p>
                                <p className="text-xs text-emerald-500 font-bold uppercase tracking-widest">You're all settled!</p>
                            </div>
                        ) : (
                            <>
                                <h3 className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-6 border-b border-white/5 pb-2">Current Orders</h3>
                                <OrderList listOrders={activeOrders} />
                                {/* Global Timer for 'Preparing' Orders */}
                                {activeOrders.some(o => o.status === 'preparing' && o.estimated_prep_time) && (
                                    <div className="mt-4 p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex items-center justify-between">
                                        <span className="text-emerald-400 font-bold text-xs uppercase tracking-wider">Estimated Wait</span>
                                        <span className="text-white font-mono font-bold">~{Math.max(...activeOrders.map(o => o.estimated_prep_time || 0))} Mins</span>
                                    </div>
                                )}
                            </>
                        )}
                    </div>

                    {/* Decorative Receipt Zigzag (Bottom) - CSS trick */}
                    <div className="h-4 w-full bg-slate-900 border-t border-white/5 relative print:hidden" style={{
                        backgroundImage: 'linear-gradient(45deg, transparent 75%, #0f172a 75%), linear-gradient(-45deg, transparent 75%, #0f172a 75%)',
                        backgroundSize: '20px 20px',
                        backgroundPosition: '0 0, 0 0'
                    }}></div>
                </div>

                {/* 2. HISTORY TOGGLE BUTTON */}
                {paidOrders.length > 0 && (
                    <div className="no-print">
                        <button
                            onClick={() => setShowHistory(!showHistory)}
                            className={`w-full py-4 rounded-xl font-bold flex items-center justify-between px-6 transition-all border border-white/5
                                ${showHistory ? 'bg-slate-800 text-white' : 'bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white'}`}
                        >
                            <span className="flex items-center gap-2">
                                <span className="text-xl">🕒</span>
                                <span className="text-sm">Order History ({paidOrders.length})</span>
                            </span>
                            <span className="text-xs opacity-50">{showHistory ? 'Hide ▲' : 'Show ▼'}</span>
                        </button>

                        {/* Collapsible History Section */}
                        {showHistory && (
                            <div className="glass-panel p-6 mt-4 rounded-2xl border border-white/5 animate-slide-up">
                                <OrderList listOrders={paidOrders} />
                            </div>
                        )}
                    </div>
                )}

                {/* Actions - Hidden in Print */}
                <div className="space-y-4 pt-4 no-print">
                    <button
                        onClick={handlePrint}
                        className="w-full bg-slate-800 text-white py-4 rounded-xl font-bold shadow-lg flex items-center justify-center gap-3 hover:bg-slate-700 transition-colors border border-white/5"
                    >
                        <span>🖨️</span> Print Receipt
                    </button>

                    <button
                        onClick={() => navigate('/menu')}
                        className="w-full btn-primary text-white py-4 rounded-xl font-bold shadow-lg flex items-center justify-center gap-3 hover:shadow-emerald-500/20 transition-all"
                    >
                        Add More Items <span className="font-sans text-lg">+</span>
                    </button>

                    <button
                        onClick={handleLogout}
                        className="w-full text-red-400 hover:text-red-300 font-bold py-4 text-xs uppercase tracking-widest transition-colors"
                    >
                        End Session & Logout
                    </button>
                </div>
            </div>

            {/* Confirmation Modal */}
            <Modal isOpen={confirmAction.isOpen} onClose={() => setConfirmAction({ ...confirmAction, isOpen: false })} title={confirmAction.title}>
                <div className="text-center">
                    <div className={`w-20 h-20 rounded-3xl flex items-center justify-center mx-auto mb-6 border ${confirmAction.type === 'danger' ? 'bg-red-500/10 border-red-500/20 text-red-500' : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500'}`}>
                        <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"></path></svg>
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
                            className="flex-1 px-6 py-4 rounded-2xl font-bold text-white shadow-lg transition-all transform active:scale-95 bg-gradient-to-r from-red-600 to-rose-600 shadow-red-500/20 hover:shadow-red-500/40"
                        >
                            Confirm Logout
                        </button>
                    </div>
                </div>
            </Modal>

            {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
        </div>
    );
};
