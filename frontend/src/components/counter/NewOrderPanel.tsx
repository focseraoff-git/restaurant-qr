import { useState, useEffect, useMemo } from 'react';
import { supabase } from '../../utils/supabaseClient';
import api from '../../utils/api';
import { useStore } from '../../store/useStore';

interface MenuCategory {
    id: string;
    name: string;
    type: string;
}

interface MenuItem {
    id: string;
    category_id: string;
    name: string;
    price_full: number;
    price_half?: number; // optional
    image?: string;
    is_veg: boolean;
    is_available: boolean;
}

interface Table {
    id: string;
    table_number: string;
}

export const NewOrderPanel = ({ restaurantId, showToast }: { restaurantId: string, showToast: (msg: string, type?: any) => void }) => {
    const {
        cart, addToCart, updateQuantity,
        resetOrderState, orderType, setOrderType,
        tableId, setTableId,
        customerName, setCustomerName
    } = useStore();

    const [categories, setCategories] = useState<MenuCategory[]>([]);
    const [items, setItems] = useState<MenuItem[]>([]);
    const [tables, setTables] = useState<Table[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState<string>('all');
    const [customerPhone, setCustomerPhone] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Initial Fetch (Using API utility)
    useEffect(() => {
        const fetchData = async () => {
            if (!restaurantId) return;

            try {
                const cleanId = restaurantId.split('&')[0];
                const [menuRes, tableRes] = await Promise.all([
                    api.get(`/menu/${cleanId}`),
                    supabase.from('tables').select('*').eq('restaurant_id', cleanId).order('table_number')
                ]);

                if (menuRes.data) {
                    setCategories(menuRes.data);

                    // Flatten items from the nested response structure: [{ ..., menu_items: [...] }]
                    const allItems: MenuItem[] = menuRes.data.flatMap((cat: any) =>
                        (cat.menu_items || []).map((item: any) => ({
                            ...item,
                            category_id: item.category_id || cat.id
                        }))
                    );
                    setItems(allItems);
                }

                if (tableRes.data) setTables(tableRes.data);
                if (!orderType) setOrderType('takeaway');

            } catch (error) {
                console.error("Error fetching data:", error);
            }
        };
        fetchData();
    }, [restaurantId, setOrderType, orderType]);

    const filteredItems = useMemo(() => {
        return items.filter(item => {
            const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase());
            const matchesCategory = selectedCategory === 'all' || item.category_id === selectedCategory;
            return matchesSearch && matchesCategory;
        });
    }, [items, searchQuery, selectedCategory]);

    const totalAmount = useMemo(() => {
        return cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    }, [cart]);

    const printBill = (orderData: any, tableNumber?: string) => {
        const printWindow = window.open('', '_blank');
        if (!printWindow) {
            console.warn('Popup blocked - bill not printed');
            return;
        }

        const billHTML = `
            <!DOCTYPE html>
            <html>
            <head>
                <title>Bill #${orderData.id.slice(0, 6)}</title>
                <style>
                    body { font-family: monospace; padding: 20px; max-width: 300px; margin: 0 auto; }
                    h1 { text-align: center; font-size: 18px; margin-bottom: 10px; }
                    .divider { border-top: 1px dashed #000; margin: 10px 0; }
                    .row { display: flex; justify-content: space-between; margin: 5px 0; }
                    .item { margin: 8px 0; }
                    .total { font-weight: bold; font-size: 16px; margin-top: 10px; }
                    .center { text-align: center; }
                    @media print { body { padding: 0; } }
                </style>
            </head>
            <body>
                <h1>RESTAURANT BILL</h1>
                <div class="center">Order #${orderData.id.slice(0, 6)}</div>
                <div class="center">${new Date().toLocaleString()}</div>
                <div class="divider"></div>
                <div class="row">
                    <span>Type:</span>
                    <span>${orderType === 'dine-in' ? `Table ${tableNumber || '?'}` : 'Takeaway'}</span>
                </div>
                ${customerName ? `<div class="row"><span>Customer:</span><span>${customerName}</span></div>` : ''}
                <div class="divider"></div>
                <div style="margin: 10px 0;">
                    ${cart.map(item => `
                        <div class="item">
                            <div class="row">
                                <span>${item.quantity}x ${item.name}</span>
                                <span>₹${item.price * item.quantity}</span>
                            </div>
                            ${item.portion !== 'full' ? `<div style="font-size: 11px; color: #666; margin-left: 20px;">(${item.portion})</div>` : ''}
                        </div>
                    `).join('')}
                </div>
                <div class="divider"></div>
                <div class="row">
                    <span>Subtotal:</span>
                    <span>₹${totalAmount}</span>
                </div>
                <div class="row">
                    <span>Tax (5%):</span>
                    <span>₹${Math.round(totalAmount * 0.05)}</span>
                </div>
                <div class="row total">
                    <span>TOTAL:</span>
                    <span>₹${Math.round(totalAmount * 1.05)}</span>
                </div>
                <div class="divider"></div>
                <div class="center">Thank you for your visit!</div>
                <script>
                    window.onload = function() {
                        window.print();
                        setTimeout(function() { window.close(); }, 100);
                    }
                </script>
            </body>
            </html>
        `;

        printWindow.document.write(billHTML);
        printWindow.document.close();
    };

    const handlePlaceOrder = async () => {
        if (cart.length === 0) {
            showToast("Cart is empty", "error");
            return;
        }
        if (orderType === 'dine-in' && !tableId) {
            showToast("Please select a table", "error");
            return;
        }
        if (orderType === 'takeaway' && !customerName) {
            showToast("Please enter customer name", "error");
            return;
        }

        setIsSubmitting(true);
        try {
            // 1. Create Order
            const { data: order, error: orderError } = await supabase
                .from('orders')
                .insert({
                    restaurant_id: restaurantId,
                    order_type: orderType,
                    status: 'preparing', // Directly to preparing for kitchen
                    total_amount: totalAmount,
                    table_id: orderType === 'dine-in' ? tableId : null,
                    customer_name: customerName,
                    customer_phone: customerPhone || null
                    // waiter_id could be added if we tracked logged in user
                })
                .select()
                .single();

            if (orderError) throw orderError;

            // 2. Create Order Items
            const orderItems = cart.map(item => ({
                order_id: order.id,
                item_id: item.id,
                quantity: item.quantity,
                portion: item.portion,
                price_at_time: item.price,
                taste_preference: item.taste || null
            }));

            const { error: itemsError } = await supabase
                .from('order_items')
                .insert(orderItems);

            if (itemsError) throw itemsError;

            // 3. Print Bill Immediately
            const selectedTable = tables.find(t => t.id === tableId);
            printBill(order, selectedTable?.table_number);

            // 4. Success
            showToast("Order Placed & Bill Printed!", "success");
            resetOrderState();
            setCustomerPhone('');
            // Optional: navigate to Live Orders or stay here?
            // "Stay using" implies high frequency. Stay here.

        } catch (err: unknown) {
            console.error(err);
            showToast("Error placing order", "error");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="flex flex-col lg:flex-row h-full gap-6 pb-20 lg:pb-0">
            {/* Left: Menu & Selection (65%) */}
            <div className="w-full lg:w-[65%] flex flex-col glass-panel rounded-3xl overflow-hidden border-white/5 bg-slate-900/60 shadow-2xl relative">
                {/* Decorative Glow */}
                <div className="absolute -top-20 -left-20 w-64 h-64 bg-emerald-500/10 rounded-full blur-[80px] pointer-events-none"></div>

                {/* Search & Filter Bar */}
                <div className="p-5 border-b border-white/5 flex flex-col md:flex-row gap-4 bg-black/20 backdrop-blur-md sticky top-0 z-20">
                    <div className="relative flex-1 group">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-emerald-400 transition-colors">🔍</span>
                        <input
                            type="text"
                            placeholder="Search menu items..."
                            className="input-field w-full pl-11 bg-slate-900/80 border-slate-800 focus:border-emerald-500/50"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                    <select
                        className="input-field bg-slate-900/80 border-slate-800 focus:border-emerald-500/50 appearance-none cursor-pointer font-bold text-gray-300 min-w-[200px]"
                        value={selectedCategory}
                        onChange={(e) => setSelectedCategory(e.target.value)}
                    >
                        <option value="all">🍽️ All Categories</option>
                        {categories.map(c => (
                            <option key={c.id} value={c.id}>{c.name}</option>
                        ))}
                    </select>
                </div>

                {/* Grid of Items */}
                <div className="flex-1 overflow-y-auto p-4 md:p-6 grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 content-start custom-scrollbar z-10">
                    {filteredItems.map(item => (
                        <div
                            key={item.id}
                            onClick={() => addToCart({
                                id: item.id,
                                name: item.name,
                                price: item.price_full,
                                quantity: 1,
                                portion: 'full'
                            })}
                            className="glass-card p-0 rounded-2xl cursor-pointer active:scale-95 group relative overflow-hidden flex flex-col h-full border hover:border-emerald-500/50 transition-all duration-300 bg-slate-800/40 hover:bg-slate-800/60 hover:shadow-emerald-500/10 hover:shadow-lg"
                        >
                            <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-white/5 to-transparent rounded-bl-[50px] -mr-4 -mt-4 transition-all group-hover:from-emerald-500/20 z-0"></div>

                            <div className="p-5 flex flex-col h-full z-10 relative">
                                <div className="flex justify-between items-start mb-3">
                                    <div className={`w-3 h-3 rounded-full shrink-0 ring-2 ring-offset-2 ring-offset-slate-900 shadow-lg ${item.is_veg ? 'bg-green-500 ring-green-500/30' : 'bg-red-500 ring-red-500/30'}`} />
                                    {item.price_half && <span className="text-[10px] bg-white/10 px-1.5 py-0.5 rounded text-gray-400 font-bold uppercase tracking-wider">Half Avail.</span>}
                                </div>

                                <h3 className="font-bold text-lg text-gray-100 leading-tight mb-auto group-hover:text-emerald-200 transition-colors line-clamp-2">{item.name}</h3>

                                <div className="mt-4 flex items-end justify-between">
                                    <div className="text-xl font-display font-bold text-emerald-400 drop-shadow-lg">
                                        ₹{item.price_full}
                                    </div>
                                    <div className="w-8 h-8 rounded-full bg-white/5 border border-white/5 flex items-center justify-center text-white text-lg font-light group-hover:bg-emerald-500 group-hover:text-black group-hover:border-emerald-500 transition-all shadow-lg group-hover:shadow-emerald-500/50">
                                        +
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                    {filteredItems.length === 0 && (
                        <div className="col-span-full py-20 text-center flex flex-col items-center opacity-40">
                            <span className="text-6xl mb-4 grayscale animate-pulse">🍽️</span>
                            <p className="text-xl font-medium">No items found</p>
                            <p className="text-sm">Try a different search or category</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Right: Cart & Details (35%) */}
            <div className="w-full lg:w-[35%] flex flex-col glass-panel rounded-3xl overflow-hidden border-white/5 bg-slate-900/80 shadow-2xl relative z-10">
                {/* Decorative background for cart */}
                <div className="absolute top-0 right-0 w-full h-full bg-gradient-to-b from-indigo-500/5 to-transparent pointer-events-none"></div>

                {/* Order Type Selector */}
                <div className="p-6 border-b border-white/10 bg-black/20 space-y-6 relative z-10">
                    <div className="flex bg-slate-950 rounded-xl p-1.5 border border-white/10 shadow-inner">
                        <button
                            className={`flex-1 py-3 rounded-lg font-bold text-sm uppercase tracking-wider transition-all flex items-center justify-center gap-2 ${orderType === 'dine-in' ? 'bg-emerald-500 text-black shadow-lg shadow-emerald-500/20' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
                            onClick={() => setOrderType('dine-in')}
                        >
                            <span>🍽️</span> Dine-In
                        </button>
                        <button
                            className={`flex-1 py-3 rounded-lg font-bold text-sm uppercase tracking-wider transition-all flex items-center justify-center gap-2 ${orderType === 'takeaway' ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/20' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
                            onClick={() => setOrderType('takeaway')}
                        >
                            <span>🛍️</span> Takeaway
                        </button>
                    </div>

                    <div className="animate-in fade-in slide-in-from-top-2 duration-300">
                        {orderType === 'dine-in' ? (
                            <div className="relative">
                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 z-10 pointer-events-none">🪑</span>
                                <select
                                    className="input-field w-full pl-11 appearance-none cursor-pointer bg-slate-900 text-white border-slate-700 focus:border-emerald-500/50 [&>option]:bg-slate-900 [&>option]:text-white [&>option:checked]:bg-emerald-600 [&>option:checked]:text-white font-bold"
                                    value={tableId || ''}
                                    onChange={(e) => setTableId(e.target.value)}
                                >
                                    <option value="" className="bg-slate-900 text-gray-400">Select Table Number</option>
                                    {tables.map(t => (
                                        <option key={t.id} value={t.id} className="bg-slate-900 text-white hover:bg-emerald-600">Table {t.table_number}</option>
                                    ))}
                                </select>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                <div className="relative">
                                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">👤</span>
                                    <input
                                        type="text"
                                        placeholder="Customer Name"
                                        className="input-field w-full pl-11 bg-slate-900"
                                        value={customerName || ''}
                                        onChange={(e) => setCustomerName(e.target.value)}
                                    />
                                </div>
                                <div className="relative">
                                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">📱</span>
                                    <input
                                        type="tel"
                                        placeholder="Phone Number (Optional)"
                                        className="input-field w-full pl-11 bg-slate-900"
                                        value={customerPhone}
                                        onChange={(e) => setCustomerPhone(e.target.value)}
                                    />
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Cart Items */}
                <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar relative z-10">
                    <div className="flex justify-between items-center px-2 mb-2">
                        <h3 className="text-[10px] font-black uppercase tracking-widest text-gray-400">Current Items</h3>
                        <span className="text-xs bg-emerald-500/10 text-emerald-500 px-2 py-1 rounded-full border border-emerald-500/20 font-bold">{cart.length}</span>
                    </div>

                    {cart.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center text-gray-600 opacity-60">
                            <div className="w-24 h-24 rounded-full bg-white/5 flex items-center justify-center mb-6 border border-dashed border-white/10 animate-pulse">
                                <span className="text-4xl grayscale">🛒</span>
                            </div>
                            <p className="font-bold text-lg">Cart is empty</p>
                            <p className="text-xs uppercase tracking-wider font-bold">Ready to take orders</p>
                        </div>
                    ) : (
                        cart.map((item, idx) => (
                            <div key={`${item.id}-${idx}`} className="bg-slate-900/50 p-4 rounded-xl flex items-center justify-between border border-white/5 animate-in fade-in slide-in-from-right-4 group hover:border-emerald-500/30 transition-all shadow-sm hover:shadow-md">
                                <div className="flex-1">
                                    <div className="font-bold text-white group-hover:text-emerald-200 transition-colors text-sm">{item.name}</div>
                                    <div className="text-xs text-gray-400 font-mono mt-1 flex gap-2 items-center">
                                        <span className="text-emerald-400 font-bold">₹{item.price}</span>
                                        <span className="w-1 h-1 bg-gray-600 rounded-full"></span>
                                        <span>Full</span>
                                    </div>
                                </div>
                                <div className="flex items-center gap-1 bg-black/40 rounded-lg p-1 border border-white/10">
                                    <button
                                        onClick={() => updateQuantity(item.id, item.portion, -1)}
                                        className="text-gray-400 hover:text-white hover:bg-white/10 w-8 h-8 flex items-center justify-center text-lg font-bold rounded-md transition-colors active:scale-90"
                                    >-</button>
                                    <span className="font-black text-white w-8 text-center text-sm">{item.quantity}</span>
                                    <button
                                        onClick={() => updateQuantity(item.id, item.portion, 1)}
                                        className="text-gray-400 hover:text-white hover:bg-white/10 w-8 h-8 flex items-center justify-center text-lg font-bold rounded-md transition-colors active:scale-90"
                                    >+</button>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                {/* Footer Totals */}
                <div className="p-6 bg-black/40 border-t border-white/10 backdrop-blur-md relative z-20">
                    <div className="space-y-3 mb-6 bg-white/5 p-4 rounded-xl border border-white/5 shadow-inner">
                        <div className="flex justify-between items-center text-gray-400 text-sm">
                            <span className="font-medium">Subtotal</span>
                            <span className="font-mono text-white">₹{totalAmount}</span>
                        </div>
                        <div className="flex justify-between items-center text-gray-400 text-sm">
                            <span className="font-medium">GST (5%)</span>
                            <span className="font-mono text-white">₹{Math.round(totalAmount * 0.05)}</span>
                        </div>
                        <div className="border-t border-white/10 pt-3 flex justify-between items-center">
                            <span className="text-lg font-black text-white uppercase tracking-wider">Total</span>
                            <span className="text-3xl font-display font-black text-emerald-400 drop-shadow-md">₹{Math.round(totalAmount * 1.05)}</span>
                        </div>
                    </div>

                    <button
                        onClick={handlePlaceOrder}
                        disabled={isSubmitting || cart.length === 0}
                        className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white py-4 rounded-xl text-lg shadow-xl shadow-emerald-500/20 disabled:opacity-50 disabled:grayscale disabled:cursor-not-allowed group relative overflow-hidden ring-1 ring-white/20 transition-all active:scale-95"
                    >
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
                        <span className="relative z-10 flex items-center justify-center gap-2 font-black tracking-widest uppercase">
                            {isSubmitting ? 'Processing...' : <><span>⚡</span> CONFIRM ORDER</>}
                        </span>
                    </button>
                </div>
            </div>
        </div>
    );
};
