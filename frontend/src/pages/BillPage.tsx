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
    const { restaurantId, customerName, tableNumber, resetStore } = useStore();
    const navigate = useNavigate();
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchOrders = () => {
        setLoading(true);
        const namesToCheck = [customerName];
        if (tableNumber) {
            namesToCheck.push(`${customerName} (Table ${tableNumber})`);
        }

        // Backend filters out 'completed' if we implemented that logic.
        // Wait, user asked for Kitchen Dashboard to clear bill. 
        // So here we assume if status is 'served' it shows, if 'completed' (paid) it hides?
        // Or strictly Active Orders.

        api.get(`/orders/active`, {
            params: { restaurantId, customerName, tableNumber }
        })
            .then(res => setOrders(res.data))
            .catch(console.error)
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

    const grandTotal = orders.reduce((sum, order) => sum + order.total_amount, 0);

    const handleLogout = () => {
        if (confirm('Are you sure you want to logout? This will clear your session.')) {
            resetStore();
            navigate('/');
        }
    };

    const handlePrint = () => {
        window.print();
    };

    if (loading) return <div className="min-h-screen flex items-center justify-center bg-gray-50 text-gray-400 font-bold">Generating Bill...</div>;

    return (
        <div className="min-h-screen bg-gray-100 pb-24 print:bg-white print:pb-0">
            {/* Header - Hidden in Print */}
            <header className="bg-white/80 backdrop-blur-md shadow-sm p-4 sticky top-0 z-10 flex justify-between items-center no-print">
                <button onClick={() => navigate('/menu')} className="text-gray-600 font-bold flex items-center gap-1">
                    &larr; Menu
                </button>
                <h1 className="font-bold text-lg font-display">Your Bill</h1>
                <button onClick={fetchOrders} className="text-primary-600 text-sm font-bold bg-primary-50 px-3 py-1 rounded-lg">
                    Refresh
                </button>
            </header>

            <div className="p-6 max-w-md mx-auto print:p-0 print:max-w-none">
                {/* Paper Receipt Look */}
                <div className="bg-white relative shadow-2xl print:shadow-none print:w-full">
                    {/* Zig Zag top pattern could go here with SVG but keeping clean for now */}

                    <div className="p-8 text-center border-b-2 border-dashed border-gray-200">
                        <h2 className="text-3xl font-display font-bold text-gray-900 mb-2">RECEIPT</h2>
                        <p className="text-gray-400 text-sm uppercase tracking-widest">{new Date().toLocaleDateString()}</p>

                        <div className="mt-4 inline-block bg-gray-100 px-4 py-2 rounded-lg">
                            <p className="text-gray-600 font-bold text-sm">
                                {customerName} <span className="mx-2 text-gray-300">|</span> Table {tableNumber || 'N/A'}
                            </p>
                        </div>
                    </div>

                    <div className="p-8">
                        {orders.length === 0 ? (
                            <div className="text-center py-10">
                                <p className="text-gray-400 mb-2">No active orders.</p>
                                <p className="text-xs text-gray-300">Your bill is clear.</p>
                            </div>
                        ) : (
                            <div className="space-y-6">
                                {orders.map((order, idx) => (
                                    <div key={order.id} className="pb-6 border-b border-dashed border-gray-200 last:border-0 last:pb-0">
                                        <div className="flex justify-between items-center mb-2">
                                            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Order #{idx + 1}</span>
                                            <span className="text-xs font-bold bg-gray-100 text-gray-500 px-2 py-0.5 rounded uppercase">{order.status}</span>
                                        </div>
                                        {order.order_items.map(item => (
                                            <div key={item.id} className="flex justify-between text-base py-1">
                                                <span className="text-gray-800">
                                                    <span className="font-bold text-gray-900 mr-2">{item.quantity}x</span>
                                                    {item.menu_items?.name}
                                                    {item.portion !== 'full' && <span className="text-gray-400 text-xs ml-1">({item.portion})</span>}
                                                </span>
                                                <span className="text-gray-900 font-medium">₹{item.price_at_time * item.quantity}</span>
                                            </div>
                                        ))}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="bg-gray-900 p-8 text-white print:bg-white print:text-black print:border-t-2 print:border-black">
                        <div className="flex justify-between items-center text-lg mb-1">
                            <span className="text-gray-400 print:text-gray-600">Total</span>
                            <span className="font-display font-bold text-3xl">₹{grandTotal}</span>
                        </div>
                        <p className="text-gray-500 text-xs mt-4 print:hidden">Includes all taxes. Thank you for dining!</p>
                    </div>
                </div>

                {/* Actions - Hidden in Print */}
                <div className="space-y-4 mt-8 no-print">
                    <button
                        onClick={handlePrint}
                        className="w-full bg-white border-2 border-gray-900 text-gray-900 py-4 rounded-xl font-bold shadow-lg flex items-center justify-center gap-2 hover:bg-gray-50 transition-colors"
                    >
                        <span>🖨️</span> Print Bill
                    </button>

                    <button
                        onClick={() => navigate('/menu')}
                        className="w-full bg-primary-600 text-white py-4 rounded-xl font-bold shadow-lg flex items-center justify-center gap-2 hover:bg-primary-700 transition-colors"
                    >
                        + Add Items
                    </button>

                    <button
                        onClick={handleLogout}
                        className="w-full text-red-500 font-bold py-4 text-sm"
                    >
                        Logout & Exit
                    </button>
                </div>
            </div>
        </div>
    );
};
