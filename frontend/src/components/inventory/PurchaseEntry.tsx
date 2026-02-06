import { useState } from 'react';
import { useInventoryStore } from '../../store/useInventoryStore';

export const PurchaseEntry = ({ restaurantId, showToast }: { restaurantId: string, showToast: any }) => {
    const { vendors, items, createPurchase, loading } = useInventoryStore();

    // Header Data
    const [vendorId, setVendorId] = useState('');
    const [invoiceNo, setInvoiceNo] = useState('');
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [paymentStatus, setPaymentStatus] = useState('Pending');
    const [notes, setNotes] = useState('');

    // Items Data
    const [cart, setCart] = useState<any[]>([]);

    // Current Adding Item
    const [currentItemId, setCurrentItemId] = useState('');
    const [currentQty, setCurrentQty] = useState('');
    const [currentPrice, setCurrentPrice] = useState(''); // Unit price

    const addItemToCart = () => {
        if (!currentItemId || !currentQty || !currentPrice) return;
        const itemDef = items.find(i => i.id === currentItemId);
        if (!itemDef) return;

        const newItem = {
            item_id: currentItemId,
            name: itemDef.name,
            unit: itemDef.unit,
            quantity: parseFloat(currentQty),
            unit_price: parseFloat(currentPrice),
            total_price: parseFloat(currentQty) * parseFloat(currentPrice)
        };

        setCart([...cart, newItem]);
        setCurrentItemId('');
        setCurrentQty('');
        setCurrentPrice('');
        // Focus ref or UX improvement could go here
    };

    const removeItemFromCart = (index: number) => {
        setCart(cart.filter((_, i) => i !== index));
    };

    const calculateTotal = () => cart.reduce((sum, item) => sum + item.total_price, 0);

    const handleSubmit = async () => {
        if (!vendorId || cart.length === 0) {
            showToast('Please select vendor and add items', 'error');
            return;
        }

        try {
            await createPurchase({
                restaurant_id: restaurantId,
                vendor_id: vendorId,
                invoice_no: invoiceNo,
                invoice_date: date,
                total_amount: calculateTotal(),
                paid_amount: 0, // Simplified for now
                payment_status: paymentStatus,
                notes,
                items: cart
            });
            showToast('Purchase Invoice Recorded!', 'success');
            // Reset
            setCart([]);
            setVendorId('');
            setInvoiceNo('');
        } catch (err) {
            showToast('Failed to record purchase', 'error');
        }
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left: Purchase Details */}
            <div className="lg:col-span-2 space-y-6">
                <div className="bg-slate-900 border border-white/5 rounded-2xl p-6 shadow-xl">
                    <h3 className="font-bold text-lg mb-4 text-emerald-400">1. Invoice Details</h3>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-xs text-gray-500 uppercase font-bold">Vendor</label>
                            <select className="w-full bg-slate-800 border-none rounded-lg p-3 text-white mt-1" value={vendorId} onChange={e => setVendorId(e.target.value)}>
                                <option value="">Select Vendor...</option>
                                {vendors.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="text-xs text-gray-500 uppercase font-bold">Invoice Date</label>
                            <input type="date" className="w-full bg-slate-800 border-none rounded-lg p-3 text-white mt-1" value={date} onChange={e => setDate(e.target.value)} />
                        </div>
                        <div>
                            <label className="text-xs text-gray-500 uppercase font-bold">Invoice No.</label>
                            <input className="w-full bg-slate-800 border-none rounded-lg p-3 text-white mt-1" placeholder="e.g. INV-001" value={invoiceNo} onChange={e => setInvoiceNo(e.target.value)} />
                        </div>
                        <div>
                            <label className="text-xs text-gray-500 uppercase font-bold">Payment Status</label>
                            <select className="w-full bg-slate-800 border-none rounded-lg p-3 text-white mt-1" value={paymentStatus} onChange={e => setPaymentStatus(e.target.value)}>
                                <option>Pending</option>
                                <option>Paid</option>
                                <option>Credit</option>
                            </select>
                        </div>
                        <div className="col-span-2">
                            <label className="text-xs text-gray-500 uppercase font-bold">Notes</label>
                            <input className="w-full bg-slate-800 border-none rounded-lg p-3 text-white mt-1" placeholder="e.g. Delivered by John" value={notes} onChange={e => setNotes(e.target.value)} />
                        </div>
                    </div>
                </div>

                <div className="bg-slate-900 border border-white/5 rounded-2xl p-6 shadow-xl">
                    <h3 className="font-bold text-lg mb-4 text-emerald-400">2. Add Items</h3>
                    <div className="grid grid-cols-7 gap-2 items-end">
                        <div className="col-span-3">
                            <label className="text-xs text-gray-500 uppercase font-bold">Item</label>
                            <select className="w-full bg-black/30 border border-white/10 rounded-lg p-2 text-white" value={currentItemId} onChange={e => setCurrentItemId(e.target.value)}>
                                <option value="">Select Item...</option>
                                {items.map(i => <option key={i.id} value={i.id}>{i.name} ({i.unit})</option>)}
                            </select>
                        </div>
                        <div className="col-span-1">
                            <label className="text-xs text-gray-500 uppercase font-bold">Qty</label>
                            <input type="number" className="w-full bg-black/30 border border-white/10 rounded-lg p-2 text-white" placeholder="0" value={currentQty} onChange={e => setCurrentQty(e.target.value)} />
                        </div>
                        <div className="col-span-2">
                            <label className="text-xs text-gray-500 uppercase font-bold">Price / Unit</label>
                            <input type="number" className="w-full bg-black/30 border border-white/10 rounded-lg p-2 text-white" placeholder="0.00" value={currentPrice} onChange={e => setCurrentPrice(e.target.value)} />
                        </div>
                        <div className="col-span-1">
                            <button onClick={addItemToCart} className="w-full bg-emerald-500 hover:bg-emerald-600 text-white p-2 rounded-lg font-bold">
                                +
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Right: Summary Cart */}
            <div className="bg-slate-900 border border-white/5 rounded-2xl p-6 shadow-xl flex flex-col h-full">
                <h3 className="font-bold text-lg mb-4 text-emerald-400">3. Purchase Summary</h3>
                <div className="flex-1 overflow-y-auto space-y-2 mb-4">
                    {cart.map((item, idx) => (
                        <div key={idx} className="flex justify-between items-center bg-white/5 p-3 rounded-lg text-sm">
                            <div>
                                <div className="font-bold">{item.name}</div>
                                <div className="text-gray-400 text-xs">{item.quantity} {item.unit} x {item.unit_price}</div>
                            </div>
                            <div className="flex items-center gap-3">
                                <span className="font-mono">{item.total_price.toFixed(2)}</span>
                                <button onClick={() => removeItemFromCart(idx)} className="text-red-400 hover:text-red-300">×</button>
                            </div>
                        </div>
                    ))}
                    {cart.length === 0 && <div className="text-center text-gray-500 py-10 italic">No items added</div>}
                </div>

                <div className="border-t border-white/10 pt-4 mt-auto">
                    <div className="flex justify-between text-xl font-bold mb-6">
                        <span>Total Payable</span>
                        <span className="text-emerald-400">${calculateTotal().toFixed(2)}</span>
                    </div>
                    <button
                        onClick={handleSubmit}
                        disabled={loading || cart.length === 0}
                        className="w-full bg-amber-500 hover:bg-amber-600 text-black font-black py-4 rounded-xl shadow-lg shadow-amber-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {loading ? 'Processing...' : 'CONFIRM PURCHASE'}
                    </button>
                </div>
            </div>
        </div>
    );
};
