import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../store/useStore';
import api from '../utils/api';

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
}

export const BillPage = () => {
    const { restaurantId, customerName, tableNumber, clearCart, setCustomerName } = useStore();
    const navigate = useNavigate();
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (restaurantId && customerName) {
            api.get(`/orders/active`, {
                params: { restaurantId, customerName }
            })
                .then(res => setOrders(res.data))
                .catch(console.error)
                .finally(() => setLoading(false));
        } else {
            setLoading(false);
        }
    }, [restaurantId, customerName]);

    const grandTotal = orders.reduce((sum, order) => sum + order.total_amount, 0);

    const handleLogout = () => {
        if (confirm('Are you sure you want to logout? This will clear your session.')) {
            setCustomerName('');
            clearCart();
            navigate('/');
        }
    };

    if (loading) return <div className="p-8 text-center">Loading Bill...</div>;

    return (
        <div className="min-h-screen bg-gray-50 pb-24">
            <header className="bg-white shadow-sm p-4 sticky top-0 z-10 flex justify-between items-center">
                <button onClick={() => navigate('/menu')} className="text-gray-600 font-bold flex items-center gap-1">
                    &larr; Menu
                </button>
                <h1 className="font-bold text-lg">Your Table Bill</h1>
                <div className="w-16"></div> {/* Spacer */}
            </header>

            <div className="p-6 max-w-md mx-auto">
                <div className="bg-white rounded-3xl shadow-lg overflow-hidden mb-6">
                    <div className="bg-primary-600 p-6 text-white text-center">
                        <p className="text-white/80 uppercase text-xs font-bold tracking-widest mb-1">Total Due</p>
                        <p className="text-4xl font-display font-bold">₹{grandTotal}</p>
                        <div className="flex justify-center gap-2 mt-4 text-xs font-medium bg-white/20 py-2 rounded-full inline-flex px-4">
                            <span>{customerName}</span>
                            <span>•</span>
                            <span>Table {tableNumber || 'N/A'}</span>
                        </div>
                    </div>

                    <div className="p-6">
                        {orders.length === 0 ? (
                            <p className="text-center text-gray-500 py-8">No active orders found.</p>
                        ) : (
                            <div className="space-y-8">
                                {orders.map((order, idx) => (
                                    <div key={order.id} className="relative">
                                        <div className="flex justify-between items-center mb-3">
                                            <span className="bg-gray-100 text-gray-600 text-xs px-2 py-1 rounded font-bold">
                                                Order #{idx + 1}
                                            </span>
                                            <span className={`text-xs font-bold uppercase ${order.status === 'served' ? 'text-green-600' : 'text-orange-500'
                                                }`}>
                                                {order.status}
                                            </span>
                                        </div>
                                        {order.order_items.map(item => (
                                            <div key={item.id} className="flex justify-between text-sm py-1 border-b border-gray-50 last:border-0">
                                                <span className="text-gray-800">
                                                    {item.quantity}x {item.menu_items?.name}
                                                    {item.portion !== 'full' && <span className="text-xs text-gray-400 ml-1">({item.portion})</span>}
                                                </span>
                                                <span className="font-medium">₹{item.price_at_time * item.quantity}</span>
                                            </div>
                                        ))}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="bg-gray-50 p-4 text-center border-t border-gray-100">
                        <p className="text-xs text-gray-400">Please pay at the counter.</p>
                    </div>
                </div>

                <div className="space-y-4">
                    <button
                        onClick={() => navigate('/menu')}
                        className="w-full bg-black text-white py-4 rounded-xl font-bold shadow-lg"
                    >
                        + Add More Items
                    </button>

                    <button
                        onClick={handleLogout}
                        className="w-full text-red-500 font-bold py-4"
                    >
                        Logout & Exit
                    </button>
                </div>
            </div>
        </div>
    );
};
