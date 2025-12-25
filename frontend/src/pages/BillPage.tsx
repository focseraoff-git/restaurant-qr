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

    // SPLIT ORDERS: Active vs Paid
    const activeOrders = orders.filter(o => o.status !== 'completed');
    const paidOrders = orders.filter(o => o.status === 'completed');

    const totalDue = activeOrders.reduce((sum, order) => sum + order.total_amount, 0);

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

    // Helper Component for Order List
    const OrderList = ({ listOrders }: { listOrders: Order[] }) => (
        <div className="space-y-6">
            {listOrders.map((order, idx) => (
                <div key={order.id} className="pb-6 border-b border-dashed border-gray-200 last:border-0 last:pb-0">
                    <div className="flex justify-between items-center mb-2">
                        <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                            {new Date(order.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                        <span className={`text-xs font-bold px-2 py-0.5 rounded uppercase 
                            ${order.status === 'completed' ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-500'}`}>
                            {order.status === 'completed' ? 'PAID' : order.status}
                        </span>
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
                    {order.status === 'completed' && (
                        <div className="mt-2 text-right">
                            <span className="text-sm font-bold text-gray-400">Paid: ₹{order.total_amount}</span>
                        </div>
                    )}
                </div>
            ))}
        </div>
    );

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

            <div className="p-6 max-w-md mx-auto print:p-0 print:max-w-none space-y-6">

                {/* 1. ACTIVE BILL SECTION */}
                <div className="bg-white relative shadow-2xl print:shadow-none print:w-full rounded-xl overflow-hidden">
                    <div className="bg-gray-900 p-6 text-white text-center">
                        <p className="text-gray-400 text-xs uppercase tracking-widest mb-1">TOTAL DUE</p>
                        <h2 className="text-4xl font-display font-bold">₹{totalDue}</h2>
                        <p className="text-gray-500 text-xs mt-2">{customerName} | Table {tableNumber || 'N/A'}</p>
                    </div>

                    <div className="p-8">
                        {activeOrders.length === 0 ? (
                            <div className="text-center py-6">
                                <p className="text-gray-400 mb-2">No active unpaid orders.</p>
                                <p className="text-xs text-green-500 font-bold">You're all settled! 🎉</p>
                            </div>
                        ) : (
                            <>
                                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4 border-b pb-2">Current Orders</h3>
                                <OrderList listOrders={activeOrders} />
                            </>
                        )}
                    </div>
                </div>

                {/* 2. HISTORY SECTION (PAID ORDERS) */}
                {paidOrders.length > 0 && (
                    <div className="bg-gray-50 border border-gray-200 rounded-xl p-6 no-print">
                        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                            <span>🕒</span> Previous Paid Orders
                        </h3>
                        <OrderList listOrders={paidOrders} />
                    </div>
                )}

                {/* Actions - Hidden in Print */}
                <div className="space-y-4 pt-4 no-print">
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
