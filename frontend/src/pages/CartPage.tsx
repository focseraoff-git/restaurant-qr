import { useStore } from '../store/useStore';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';
import { useState } from 'react';

export const CartPage = () => {
    const { cart, updateQuantity, restaurantId, tableId, clearCart, customerName, orderType } = useStore();
    const navigate = useNavigate();
    const [submitting, setSubmitting] = useState(false);

    const total = cart.reduce((acc, item) => acc + (item.price * item.quantity), 0);

    const placeOrder = async () => {
        if (!restaurantId) return alert('Restaurant ID missing');
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
            clearCart();
            navigate(`/success?orderId=${res.data.order.id}`);
        } catch (err) {
            console.error(err);
            alert('Failed to place order');
        } finally {
            setSubmitting(false);
        }
    };

    if (cart.length === 0) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-6 text-center">
                <div className="w-24 h-24 bg-gray-200 rounded-full flex items-center justify-center mb-6 text-4xl animate-pulse">🛒</div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Cart is Empty</h2>
                <p className="text-gray-500 mb-8">Looks like you haven't added anything yet.</p>
                <button onClick={() => navigate('/menu')} className="bg-gray-900 text-white px-8 py-3 rounded-xl font-bold shadow-lg hover:shadow-xl transition-all">Go to Menu</button>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 pb-32">

            {/* Minimalist Header */}
            <div className="bg-white/80 backdrop-blur-md sticky top-0 z-30 px-6 py-4 flex items-center gap-4 border-b border-gray-100">
                <button onClick={() => navigate('/menu')} className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center text-gray-600 hover:bg-gray-100 transition-colors">
                    &larr;
                </button>
                <h1 className="text-xl font-display font-bold text-gray-900">Your Order</h1>
            </div>

            <div className="p-6 space-y-6">
                {cart.map(item => (
                    <div key={`${item.id}-${item.portion}-${item.taste}`} className="bg-white p-5 rounded-3xl shadow-sm border border-gray-100 relative overflow-hidden group">
                        {/* Interactive Hover Glow */}
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-transparent to-gray-50 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"></div>

                        <div className="relative z-10 flex justify-between items-start">
                            <div>
                                <h4 className="font-bold text-lg text-gray-900 leading-tight mb-1">{item.name}</h4>
                                <div className="flex items-center gap-2">
                                    <span className="font-display font-bold text-gray-500">₹{item.price}</span>
                                    {item.portion !== 'full' && (
                                        <span className="text-[10px] uppercase font-bold bg-orange-100 text-orange-600 px-2 py-0.5 rounded-md tracking-wide">{item.portion}</span>
                                    )}
                                </div>
                            </div>

                            {/* Quantity Controls */}
                            <div className="flex items-center bg-gray-900 rounded-xl p-1 shadow-md">
                                <button
                                    onClick={() => updateQuantity(item.id, item.portion, -1)}
                                    className="w-8 h-8 flex items-center justify-center text-white hover:bg-white/20 rounded-lg transition-colors font-bold"
                                >
                                    -
                                </button>
                                <span className="w-6 text-center text-white font-bold text-sm">{item.quantity}</span>
                                <button
                                    onClick={() => updateQuantity(item.id, item.portion, 1)}
                                    className="w-8 h-8 flex items-center justify-center text-white hover:bg-white/20 rounded-lg transition-colors font-bold"
                                >
                                    +
                                </button>
                            </div>
                        </div>

                        {/* Total per Item */}
                        <div className="mt-4 pt-4 border-t border-gray-50 flex justify-between items-center">
                            <span className="text-xs text-gray-400 font-medium">Subtotal</span>
                            <span className="font-bold text-gray-900">₹{item.price * item.quantity}</span>
                        </div>
                    </div>
                ))}
            </div>

            {/* Floating Checkout Bar */}
            <div className="fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-xl border-t border-gray-100 p-6 z-50 rounded-t-3xl shadow-[0_-10px_40px_-15px_rgba(0,0,0,0.1)]">
                <div className="flex justify-between items-end mb-4 px-2">
                    <div>
                        <p className="text-xs text-gray-400 font-bold uppercase tracking-wider mb-1">Total to Pay</p>
                        <p className="text-3xl font-display font-bold text-gray-900">₹{total}</p>
                    </div>
                </div>

                <button
                    onClick={placeOrder}
                    disabled={submitting}
                    className={`w-full py-4 rounded-2xl font-bold text-lg shadow-xl flex items-center justify-center gap-3 transition-all transform active:scale-[0.98]
                        ${submitting
                            ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                            : 'bg-primary-600 text-white hover:bg-primary-700 hover:shadow-primary-hover'}`}
                >
                    {submitting ? (
                        <><span>Processing...</span></>
                    ) : (
                        <><span>Confirm Order</span> <span>&rarr;</span></>
                    )}
                </button>
            </div>
        </div>
    );
};
