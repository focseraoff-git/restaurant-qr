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
                customerPhone: '9999999999' // Keep hardcoded for now or add input
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
        return <div className="text-center mt-10">Your cart is empty.</div>;
    }

    return (
        <div className="pb-24 pt-6">
            <h2 className="text-3xl font-display font-bold text-gray-900 mb-6 flex items-center gap-3">
                <button onClick={() => window.history.back()} className="text-gray-400 hover:text-gray-900 transition-colors">
                    &larr;
                </button>
                Your Order
            </h2>

            {cart.length === 0 ? (
                <div className="text-center py-20 opacity-60">
                    <p className="text-xl font-medium">Your cart is empty</p>
                    <p className="text-sm mt-2">Add some delicious items from the menu!</p>
                </div>
            ) : (
                <>
                    <div className="space-y-4 mb-8">
                        {cart.map(item => (
                            <div key={`${item.id}-${item.portion}-${item.taste}`} className="glass-panel p-4 rounded-2xl flex justify-between items-center">
                                <div>
                                    <h4 className="font-bold text-lg text-gray-900">{item.name}</h4>
                                    <p className="text-sm text-gray-500 font-medium">₹{item.price} x {item.quantity}</p>
                                    {item.portion !== 'full' && <span className="text-xs bg-primary-100 text-primary-900 px-2 py-0.5 rounded-full mt-1 inline-block uppercase tracking-wider">{item.portion}</span>}
                                </div>
                                <div className="flex items-center gap-3 bg-gray-50 rounded-xl p-1">
                                    <button
                                        onClick={() => updateQuantity(item.id, item.portion, -1)}
                                        className="w-8 h-8 flex items-center justify-center bg-white rounded-lg shadow-sm text-gray-600 font-bold hover:bg-gray-100 active:scale-95 transition"
                                    >
                                        -
                                    </button>
                                    <span className="font-bold w-4 text-center">{item.quantity}</span>
                                    <button
                                        onClick={() => updateQuantity(item.id, item.portion, 1)}
                                        className="w-8 h-8 flex items-center justify-center bg-white rounded-lg shadow-sm text-primary-600 font-bold hover:bg-primary-50 active:scale-95 transition"
                                    >
                                        +
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="glass-panel p-6 rounded-3xl sticky bottom-24">
                        <div className="flex justify-between items-center mb-6 border-b border-gray-100 pb-4">
                            <span className="text-gray-500 font-medium">Total Amount</span>
                            <span className="text-3xl font-display font-bold text-gray-900">₹{total}</span>
                        </div>

                        <button
                            onClick={placeOrder}
                            disabled={submitting}
                            className={`w-full py-4 rounded-xl font-bold text-lg shadow-premium hover:shadow-premium-hover transform transition-all active:scale-[0.98]
                                ${submitting
                                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                    : 'bg-primary-600 text-white hover:bg-primary-500'}`}
                        >
                            {submitting ? 'Placing Order...' : 'Place Order'}
                        </button>
                    </div>
                </>
            )}
        </div>
    );
};
