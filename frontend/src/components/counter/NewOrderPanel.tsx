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

export const NewOrderPanel = ({ restaurantId, showToast, initialOrder, onOrderUpdated }: {
    restaurantId: string,
    showToast: (msg: string, type?: any) => void,
    initialOrder?: any,
    onOrderUpdated?: () => void
}) => {
    const {
        cart, addToCart, updateQuantity, removeFromCart, clearCart,
        resetOrderState, orderType, setOrderType,
        tableId, setTableId,
        customerName, setCustomerName
    } = useStore();

    // Local State
    const [categories, setCategories] = useState<MenuCategory[]>([]);
    const [items, setItems] = useState<MenuItem[]>([]);
    const [tables, setTables] = useState<Table[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState<string>('all');
    const [customerPhone, setCustomerPhone] = useState('');
    const [orderNote, setOrderNote] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Custom Item State
    const [isCustomMode, setIsCustomMode] = useState(false);
    const [customItemName, setCustomItemName] = useState('');
    const [customItemPrice, setCustomItemPrice] = useState('');

    // Load Initial Order (Edit Mode)
    useEffect(() => {
        if (initialOrder) {
            clearCart();
            // Populate Store & Local State
            setOrderType(initialOrder.order_type);
            setTableId(initialOrder.table_id);
            setCustomerName(initialOrder.customer_name || '');
            setCustomerPhone(initialOrder.customer_phone || '');
            setOrderNote(initialOrder.order_note || '');

            // Populate Cart
            initialOrder.order_items.forEach((item: any) => {
                addToCart({
                    id: item.menu_items ? item.item_id : `custom-${Date.now()}-${Math.random()}`, // Handle custom items
                    name: item.menu_items ? item.menu_items.name : item.custom_name,
                    price: item.price_at_time,
                    quantity: item.quantity,
                    portion: item.portion,
                    taste: item.taste_preference
                });
            });
        }
    }, [initialOrder]);

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
                    const allItems: MenuItem[] = menuRes.data.flatMap((cat: any) =>
                        (cat.menu_items || []).map((item: any) => ({
                            ...item,
                            category_id: item.category_id || cat.id
                        }))
                    );
                    setItems(allItems);
                }

                if (tableRes.data) {
                    const sortedTables = tableRes.data.sort((a: any, b: any) =>
                        a.table_number.localeCompare(b.table_number, undefined, { numeric: true })
                    );
                    setTables(sortedTables);
                }
                if (!orderType && !initialOrder) setOrderType('takeaway');

            } catch (error) {
                console.error("Error fetching data:", error);
            }
        };
        fetchData();
    }, [restaurantId, setOrderType, orderType, initialOrder]);

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

    const handleAddCustomItem = () => {
        if (!customItemName || !customItemPrice) {
            showToast("Please enter name and price", "error");
            return;
        }
        addToCart({
            id: `custom-${Date.now()}`,
            name: customItemName,
            price: parseFloat(customItemPrice),
            quantity: 1,
            portion: 'full', // Use 'full' to satisfy type, but we handle it as custom in backend by ID
            taste: ''
        });
        setCustomItemName('');
        setCustomItemPrice('');
        setIsCustomMode(false);
        showToast("Custom item added", "success");
    };

    const handlePlaceOrder = async () => {
        if (cart.length === 0) {
            showToast("Cart is empty", "error");
            return;
        }

        setIsSubmitting(true);
        try {
            const cleanId = restaurantId.split('&')[0];
            const orderPayload = {
                restaurantId: cleanId,
                tableId: orderType === 'dine-in' ? tableId : null,
                items: cart.map(item => ({
                    itemId: item.id.startsWith('custom-') ? null : item.id,
                    name: item.name, // For custom items
                    price: item.price, // For custom items
                    quantity: item.quantity,
                    portion: item.portion,
                    tastePreference: item.taste // Pass note
                })),
                orderNote,
                customerName,
                customerPhone,
                orderType
            };

            if (initialOrder) {
                // UPDATE / REPLACE
                await api.put(`/orders/${initialOrder.id}/replace`, orderPayload);
                showToast("Order Updated Successfully!", "success");
                if (onOrderUpdated) onOrderUpdated();
            } else {
                // CREATE
                await api.post('/orders', orderPayload);
                showToast("Order Placed Successfully!", "success");
                resetOrderState();
                setCustomerPhone('');
                setOrderNote('');
            }

        } catch (err: unknown) {
            console.error(err);
            showToast("Error processing order", "error");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="flex flex-col lg:flex-row h-full gap-6 pb-20 lg:pb-0 font-sans">
            {/* Left: Menu & Selection (60%) */}
            <div className={`w-full lg:w-[60%] flex flex-col glass-panel rounded-3xl overflow-hidden border-white/5 bg-slate-900/60 shadow-2xl relative ${initialOrder ? 'ring-2 ring-emerald-500/50' : ''}`}>

                {/* Header / Search */}
                <div className="p-5 border-b border-white/5 flex flex-col gap-4 bg-black/20 backdrop-blur-md sticky top-0 z-20">
                    <div className="flex gap-4">
                        <div className="relative flex-1 group">
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">🔍</span>
                            <input
                                type="text"
                                placeholder="Search..."
                                className="input-field w-full pl-11 bg-slate-900/80 border-slate-800 focus:border-emerald-500/50"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                        <button
                            onClick={() => setIsCustomMode(!isCustomMode)}
                            className={`px-4 rounded-xl font-bold transition-all border ${isCustomMode ? 'bg-emerald-500 text-white border-emerald-500' : 'bg-slate-800 text-gray-300 border-slate-700'}`}
                        >
                            + Custom
                        </button>
                    </div>

                    {/* Custom Item Form */}
                    {isCustomMode && (
                        <div className="flex gap-2 animate-in slide-in-from-top-2">
                            <input
                                type="text"
                                placeholder="Item Name"
                                className="input-field flex-[2] bg-slate-900/80"
                                value={customItemName}
                                onChange={(e) => setCustomItemName(e.target.value)}
                            />
                            <input
                                type="number"
                                placeholder="Price"
                                className="input-field flex-1 bg-slate-900/80"
                                value={customItemPrice}
                                onChange={(e) => setCustomItemPrice(e.target.value)}
                            />
                            <button onClick={handleAddCustomItem} className="bg-emerald-500 text-white px-4 rounded-xl font-bold">Add</button>
                        </div>
                    )}

                    <div className="flex gap-2 overflow-x-auto pb-2 custom-scrollbar">
                        <button
                            onClick={() => setSelectedCategory('all')}
                            className={`px-4 py-2 rounded-lg text-sm font-bold whitespace-nowrap transition-all ${selectedCategory === 'all' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-slate-800 text-gray-400 border border-transparent'}`}
                        >
                            All
                        </button>
                        {categories.map(c => (
                            <button
                                key={c.id}
                                onClick={() => setSelectedCategory(c.id)}
                                className={`px-4 py-2 rounded-lg text-sm font-bold whitespace-nowrap transition-all ${selectedCategory === c.id ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-slate-800 text-gray-400 border border-transparent'}`}
                            >
                                {c.name}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Grid */}
                <div className="flex-1 overflow-y-auto p-4 grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 content-start">
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
                            className="glass-card p-4 rounded-xl cursor-pointer hover:bg-slate-800 transition-all group flex flex-col justify-between"
                        >
                            <div>
                                <h3 className="font-bold text-gray-200 leading-tight mb-2 group-hover:text-emerald-400">{item.name}</h3>
                                <div className={`w-2 h-2 rounded-full mb-2 ${item.is_veg ? 'bg-green-500' : 'bg-red-500'}`} />
                            </div>
                            <div className="flex justify-between items-end">
                                <span className="font-mono text-emerald-500 font-bold">₹{item.price_full}</span>
                                <span className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-white text-xl hover:bg-emerald-500 hover:text-black transition-colors">+</span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Right: Cart (40%) */}
            <div className="w-full lg:w-[40%] flex flex-col glass-panel rounded-3xl overflow-hidden border-white/5 bg-slate-900/80 shadow-2xl z-10">
                <div className="p-5 border-b border-white/10 bg-black/20">
                    <div className="flex bg-slate-950 rounded-xl p-1 mb-4">
                        <button
                            className={`flex-1 py-2 rounded-lg font-bold text-xs uppercase ${orderType === 'dine-in' ? 'bg-emerald-600 text-white' : 'text-gray-400'}`}
                            onClick={() => setOrderType('dine-in')}
                        >
                            Dine-In
                        </button>
                        <button
                            className={`flex-1 py-2 rounded-lg font-bold text-xs uppercase ${orderType === 'takeaway' ? 'bg-blue-600 text-white' : 'text-gray-400'}`}
                            onClick={() => setOrderType('takeaway')}
                        >
                            Takeaway
                        </button>
                    </div>

                    {orderType === 'dine-in' ? (
                        <select
                            className="input-field w-full bg-slate-900 text-white"
                            value={tableId || ''}
                            onChange={(e) => setTableId(e.target.value)}
                        >
                            <option value="">Select Table</option>
                            {tables.map(t => <option key={t.id} value={t.id}>Table {t.table_number}</option>)}
                        </select>
                    ) : (
                        <input
                            type="text"
                            placeholder="Customer Name"
                            className="input-field w-full bg-slate-900"
                            value={customerName || ''}
                            onChange={(e) => setCustomerName(e.target.value)}
                        />
                    )}
                </div>

                {/* Cart Items */}
                <div className="flex-1 overflow-y-auto p-4 space-y-3 relative">
                    {cart.map((item, idx) => (
                        <div key={`${item.id}-${idx}`} className="bg-slate-900/50 p-3 rounded-xl border border-white/5 hover:border-emerald-500/30 transition-all group">
                            <div className="flex justify-between items-start mb-2">
                                <div className="flex-1">
                                    <div className="font-bold text-white text-sm">{item.name}</div>
                                    <div className="text-xs text-emerald-400 font-mono">₹{item.price} x {item.quantity}</div>
                                </div>
                                <div className="flex items-center gap-2 bg-black/40 rounded-lg p-1">
                                    <button onClick={() => updateQuantity(item.id, item.portion, -1)} className="w-6 h-6 flex items-center justify-center text-gray-400 hover:text-white font-bold">-</button>
                                    <span className="text-sm font-bold w-4 text-center">{item.quantity}</span>
                                    <button onClick={() => updateQuantity(item.id, item.portion, 1)} className="w-6 h-6 flex items-center justify-center text-gray-400 hover:text-white font-bold">+</button>
                                </div>
                                <button onClick={() => removeFromCart(item.id, item.portion)} className="ml-2 text-red-400 hover:text-red-300">×</button>
                            </div>

                            {/* Item Note Input */}
                            <input
                                type="text"
                                placeholder="+ Note (e.g. spicy)"
                                className="w-full bg-transparent border-b border-white/5 text-[10px] text-gray-400 focus:text-white focus:border-emerald-500 outline-none pb-1 transition-colors"
                                defaultValue={item.taste || ''}
                                onBlur={(e) => {
                                    item.taste = e.target.value; // Direct mutation workaround for now
                                }}
                            />
                        </div>
                    ))}
                </div>

                {/* Footer */}
                <div className="p-5 bg-black/40 border-t border-white/10 space-y-4">
                    {/* Order Note */}
                    <textarea
                        placeholder="General Order Instructions..."
                        className="w-full bg-slate-900/50 border border-white/10 rounded-lg p-3 text-sm text-white resize-none h-16"
                        value={orderNote}
                        onChange={(e) => setOrderNote(e.target.value)}
                    />

                    <div className="flex justify-between items-end">
                        <span className="text-gray-400 text-sm">Total</span>
                        <span className="text-3xl font-display font-black text-emerald-400">₹{totalAmount}</span>
                    </div>

                    <div className="flex gap-3">
                        {initialOrder && (
                            <button
                                onClick={onOrderUpdated} // Cancel edit
                                className="px-6 py-4 bg-slate-800 text-gray-300 rounded-xl font-bold"
                            >
                                Cancel
                            </button>
                        )}
                        <button
                            onClick={handlePlaceOrder}
                            disabled={isSubmitting || cart.length === 0}
                            className={`flex-1 py-4 rounded-xl text-lg font-black uppercase tracking-widest shadow-xl transition-all ${isSubmitting ? 'bg-gray-700' : 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-emerald-500/20'}`}
                        >
                            {isSubmitting ? 'Processing...' : (initialOrder ? 'UPDATE ORDER' : 'CONFIRM ORDER')}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
