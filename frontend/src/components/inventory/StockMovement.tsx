import { useState } from 'react';
import { useInventoryStore } from '../../store/useInventoryStore';

export const StockMovement = ({ restaurantId, showToast }: { restaurantId: string, showToast: any }) => {
    const { items, logMovement, loading } = useInventoryStore();
    const [type, setType] = useState('OUT');
    const [itemId, setItemId] = useState('');
    const [quantity, setQuantity] = useState('');
    const [reason, setReason] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await logMovement({
                restaurant_id: restaurantId,
                item_id: itemId,
                type,
                quantity,
                unit: items.find(i => i.id === itemId)?.unit || 'units',
                reason,
                performed_by: null // Staff ID integration later
            });
            showToast(`Stock ${type} recorded`, 'success');
            setQuantity('');
            setReason('');
        } catch (err) {
            showToast('Failed to record movement', 'error');
        }
    };

    const selectedItem = items.find(i => i.id === itemId);

    return (
        <div className="max-w-2xl mx-auto space-y-6">
            <h2 className="text-xl font-bold text-center">Stock Adjustment & Movement</h2>

            <div className="bg-slate-900 border border-white/5 rounded-2xl p-6 shadow-xl relative overflow-hidden">
                <div className={`absolute top-0 left-0 w-1 h-full ${type === 'IN' ? 'bg-emerald-500' : type === 'OUT' ? 'bg-red-500' : 'bg-blue-500'}`}></div>

                <div className="flex justify-center gap-4 mb-8">
                    {['IN', 'OUT', 'ADJUST'].map(t => (
                        <button
                            key={t}
                            onClick={() => setType(t)}
                            className={`px-6 py-2 rounded-lg font-bold transition-all ${type === t
                                    ? (t === 'IN' ? 'bg-emerald-500 text-white' : t === 'OUT' ? 'bg-red-500 text-white' : 'bg-blue-500 text-white')
                                    : 'bg-white/5 text-gray-400 hover:bg-white/10'
                                }`}
                        >
                            {t === 'IN' ? 'Stock IN' : t === 'OUT' ? 'Stock OUT' : 'Correction'}
                        </button>
                    ))}
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label className="text-sm text-gray-400 font-bold ml-1">Select Item</label>
                        <select
                            className="w-full bg-slate-800 border-none rounded-xl p-4 text-white font-bold text-lg mt-1"
                            value={itemId}
                            onChange={e => setItemId(e.target.value)}
                            required
                        >
                            <option value="">-- Choose Item --</option>
                            {items.map(i => (
                                <option key={i.id} value={i.id}>
                                    {i.name} ({i.current_stock} {i.unit} available)
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="grid grid-cols-2 gap-6">
                        <div>
                            <label className="text-sm text-gray-400 font-bold ml-1">Quantity {selectedItem ? `(${selectedItem.unit})` : ''}</label>
                            <input
                                type="number"
                                step="0.01"
                                className="w-full bg-slate-800 border-none rounded-xl p-4 text-white font-bold text-2xl mt-1"
                                placeholder="0.00"
                                value={quantity}
                                onChange={e => setQuantity(e.target.value)}
                                required
                            />
                        </div>
                        <div>
                            <label className="text-sm text-gray-400 font-bold ml-1">Reason / Note</label>
                            <input
                                className="w-full bg-slate-800 border-none rounded-xl p-4 text-white mt-1 h-[68px]"
                                placeholder={type === 'OUT' ? "e.g. Daily Usage" : type === 'IN' ? "e.g. Market Buy" : "e.g. Calibration"}
                                value={reason}
                                onChange={e => setReason(e.target.value)}
                                required
                            />
                        </div>
                    </div>

                    <button
                        disabled={loading}
                        className={`w-full py-4 rounded-xl font-black text-lg shadow-lg transform transition-transform active:scale-95 ${type === 'IN'
                                ? 'bg-gradient-to-r from-emerald-500 to-green-600 shadow-emerald-500/30'
                                : type === 'OUT'
                                    ? 'bg-gradient-to-r from-red-500 to-rose-600 shadow-red-500/30'
                                    : 'bg-gradient-to-r from-blue-500 to-cyan-600 shadow-blue-500/30'
                            }`}
                    >
                        {loading ? 'Recording...' : `CONFIRM ${type}`}
                    </button>
                </form>
            </div>
        </div>
    );
};
