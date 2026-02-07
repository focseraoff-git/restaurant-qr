import { useStore } from '../store/useStore';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';
import { useState } from 'react';
import { Toast } from '../components/Toast';

export const CartPage = () => {
    const { cart, updateQuantity, restaurantId, tableId, clearCart, customerName, orderType } = useStore();
    const navigate = useNavigate();
    const [submitting, setSubmitting] = useState(false);
    const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

    const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
        setToast({ message, type });
    };

    const total = cart.reduce((acc, item) => acc + (item.price * item.quantity), 0);

    const placeOrder = async () => {
        if (!restaurantId) {
            showToast('Restaurant ID missing', 'error');
            return;
        }
        setSubmitting(true);

        try {
            // Handle Manual Table ID (which is not a UUID)
            let finalTableId = tableId;
            let finalCustomerName = customerName || 'Guest';

            if (tableId === 'manual') {
                finalTableId = null;
                const { tableNumber } = useStore.getState();
                if (tableNumber) {
                    finalCustomerName += ` (Table ${tableNumber})`;
                }
            }

            const payload = {
                restaurantId,
                tableId: finalTableId,
                items: cart.map(i => ({
                    itemId: i.id,
                    quantity: i.quantity,
                    portion: i.portion,
                    tastePreference: i.taste
                })),
                orderType: orderType || 'dine-in',
                customerName: finalCustomerName,
                customerPhone: '9999999999' // Keep hardcoded for now
            };

            const res = await api.post('/orders', payload);
            console.log('Order placed:', res.data);
            useStore.getState().addOrderId(res.data.order.id); // Save to Device History
            clearCart();
            navigate(`/success?orderId=${res.data.order.id}`);
        } catch (err) {
            console.error(err);
            showToast('Failed to place order. Please try again.', 'error');
        } finally {
            setSubmitting(false);
        }
    };

    if (cart.length === 0) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-slate-950 p-8 text-center relative overflow-hidden">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-slate-900 via-slate-950 to-slate-950 z-0"></div>

                <div className="relative z-10 flex flex-col items-center animate-fade-in-up">
                    <div className="w-32 h-32 bg-white/5 rounded-full flex items-center justify-center mb-8 border border-white/10 shadow-glow-emerald">
                        <span className="text-6xl filter drop-shadow">🛒</span>
                    </div>
                    <h2 className="text-3xl font-display font-bold text-white mb-3">Cart is Empty</h2>
                    <p className="text-gray-400 mb-10 text-lg font-light leading-relaxed max-w-xs">Your culinary journey awaits. Explore our menu to find something delicious.</p>
                    <button onClick={() => navigate('/menu')} className="btn-primary text-white px-10 py-4 rounded-2xl font-bold shadow-2xl hover:shadow-emerald-500/20 transition-all transform hover:-translate-y-1">
                        Explore Menu
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-950 pb-40 relative">
            {/* Background Effects */}
            <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/5 rounded-full blur-[100px] pointer-events-none"></div>

            {/* Minimalist Header */}
            <div className="glass-nav sticky top-0 z-30 px-6 py-4 flex items-center gap-4 border-b border-white/5 shadow-lg">
                <button onClick={() => navigate('/menu')} className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white hover:bg-white/20 transition-colors backdrop-blur-md">
                    <span className="text-xl">←</span>
                </button>
                <h1 className="text-xl font-display font-bold text-white">Your Selection</h1>
            </div>

            <div className="p-6 space-y-5 relative z-10">
                {cart.map((item, idx) => (
                    <div
                        key={`${item.id}-${item.portion}-${item.taste}`}
                        className="glass-panel p-5 rounded-3xl border border-white/10 relative overflow-hidden group animate-slide-up"
                        style={{ animationDelay: `${idx * 50}ms` }}
                    >
                        {/* Interactive Hover Glow */}
                        <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"></div>

                        <div className="relative z-10 flex justify-between items-start mb-4">
                            <div>
                                <h4 className="font-display font-bold text-xl text-white leading-tight mb-2 group-hover:text-emerald-300 transition-colors">{item.name}</h4>
                                <div className="flex items-center gap-2">
                                    <span className="font-bold text-emerald-400 text-lg">₹{item.price * item.quantity}</span>
                                    {item.portion !== 'full' && (
                                        <span className="text-[10px] uppercase font-bold bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded-md tracking-widest border border-amber-500/20">{item.portion}</span>
                                    )}
                                </div>
                            </div>

                            {/* Quantity Controls */}
                            <div className="flex items-center bg-slate-900 rounded-xl p-1 shadow-inner border border-white/5">
                                <button
                                    onClick={() => updateQuantity(item.id, item.portion, -1)}
                                    className="w-10 h-10 flex items-center justify-center text-white hover:bg-white/10 rounded-lg transition-colors font-bold text-lg"
                                >
                                    -
                                </button>
                                <span className="w-8 text-center text-white font-display font-bold text-lg">{item.quantity}</span>
                                <button
                                    onClick={() => updateQuantity(item.id, item.portion, 1)}
                                    className="w-10 h-10 flex items-center justify-center text-white hover:bg-white/10 rounded-lg transition-colors font-bold text-lg"
                                >
                                    +
                                </button>
                            </div>
                        </div>

                        {/* Item Details Footer */}
                        <div className="flex justify-between items-center text-xs text-gray-500 font-medium">
                            <span>₹{item.price} each</span>
                            {item.taste && <span className="italic text-gray-400">Note: {item.taste}</span>}
                        </div>
                    </div>
                ))}
            </div>

            {/* Floating Checkout Bar */}
            <div className="fixed bottom-0 left-0 right-0 bg-slate-900/80 backdrop-blur-xl border-t border-white/10 p-6 z-50 rounded-t-[2.5rem] shadow-[0_-10px_60px_-15px_rgba(0,0,0,0.5)] pb-safe">
                <div className="flex justify-between items-end mb-6 px-2">
                    <div>
                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-[0.2em] mb-1">Total Amount</p>
                        <p className="text-4xl font-display font-bold text-white tracking-tight">₹{total}</p>
                    </div>
                </div>

                <button
                    onClick={placeOrder}
                    disabled={submitting}
                    className={`w-full py-5 rounded-2xl font-bold text-lg shadow-2xl flex items-center justify-center gap-3 transition-all transform active:scale-[0.98] group relative overflow-hidden
                        ${submitting
                            ? 'bg-slate-800 text-gray-500 cursor-not-allowed'
                            : 'btn-primary text-white hover:shadow-emerald-500/25'}`}
                >
                    <div className="absolute inset-0 bg-white/20 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></div>
                    {submitting ? (
                        <>
                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                            <span>Processing...</span>
                        </>
                    ) : (
                        <>
                            <span>Confirm Order</span>
                            <span className="group-hover:translate-x-1 transition-transform">→</span>
                        </>
                    )}
                </button>
            </div>

            {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
        </div>
    );
};
