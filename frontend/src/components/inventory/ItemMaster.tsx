import { useState } from 'react';
import { useInventoryStore } from '../../store/useInventoryStore';
import { Modal } from '../Modal';

export const ItemMaster = ({ restaurantId, showToast }: { restaurantId: string, showToast: any }) => {
    const { items, addItem, updateItem, deleteItem } = useInventoryStore();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [formData, setFormData] = useState({
        name: '',
        type: 'Ingredient',
        unit: 'kg',
        min_stock_level: 0,
        storage_location: '',
        restaurant_id: restaurantId
    });

    const handleEdit = (item: any) => {
        setEditingId(item.id);
        setFormData({
            name: item.name,
            type: item.type,
            unit: item.unit,
            min_stock_level: item.min_stock_level,
            storage_location: item.storage_location || '',
            restaurant_id: restaurantId
        });
        setIsModalOpen(true);
    };

    const handleDelete = async (id: string, name: string) => {
        if (confirm(`Delete "${name}"?`)) {
            try {
                await deleteItem(id);
                showToast('Item deleted', 'info');
            } catch (err) {
                showToast('Failed to delete item', 'error');
            }
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (editingId) {
                await updateItem(editingId, formData);
                showToast('Item updated', 'success');
            } else {
                await addItem(formData);
                showToast('Item added', 'success');
            }
            setIsModalOpen(false);
            setEditingId(null);
            setFormData({ ...formData, name: '', min_stock_level: 0, storage_location: '' });
            // Keep type/unit as they might be adding similar items
        } catch (err) {
            showToast('Failed to save item', 'error');
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center bg-slate-900/50 p-4 rounded-2xl border border-white/5 backdrop-blur-sm">
                <div>
                    <h2 className="text-xl font-bold text-white flex items-center gap-2">
                        📦 Item Master
                        <span className="text-xs bg-amber-500/10 text-amber-500 px-2 py-1 rounded-lg border border-amber-500/20">{items.length} Items</span>
                    </h2>
                    <p className="text-xs text-gray-500 font-bold uppercase tracking-wider mt-1">Manage Ingredients & Supplies</p>
                </div>
                <button
                    onClick={() => { setEditingId(null); setIsModalOpen(true); }}
                    className="bg-gradient-to-r from-amber-500 to-orange-600 text-white px-6 py-3 rounded-xl font-bold shadow-lg shadow-amber-500/20 hover:shadow-amber-500/40 transform transition-all active:scale-95 flex items-center gap-2"
                >
                    <span className="text-lg">+</span> Add New Item
                </button>
            </div>

            <div className="glass-panel overflow-hidden rounded-2xl border border-white/5 shadow-2xl">
                <table className="w-full text-left border-collapse">
                    <thead className="bg-white/5">
                        <tr>
                            <th className="p-4 text-xs font-black uppercase tracking-wider text-gray-400">Item Name</th>
                            <th className="p-4 text-xs font-black uppercase tracking-wider text-gray-400">Type</th>
                            <th className="p-4 text-xs font-black uppercase tracking-wider text-gray-400 text-center">Current Stock</th>
                            <th className="p-4 text-xs font-black uppercase tracking-wider text-gray-400 text-center">Min Level</th>
                            <th className="p-4 text-xs font-black uppercase tracking-wider text-gray-400 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                        {items.map(item => {
                            const isLow = Number(item.current_stock) <= Number(item.min_stock_level);
                            const isOut = Number(item.current_stock) <= 0;
                            return (
                                <tr key={item.id} className="hover:bg-white/5 transition-colors group">
                                    <td className="p-4">
                                        <div className="font-bold text-white text-lg">{item.name}</div>
                                        <div className="text-[10px] text-gray-500 uppercase tracking-widest">{item.storage_location || 'No Location'}</div>
                                    </td>
                                    <td className="p-4">
                                        <span className="px-2 py-1 rounded-md text-xs font-bold bg-white/5 text-gray-400 border border-white/5">
                                            {item.type}
                                        </span>
                                    </td>
                                    <td className="p-4 text-center">
                                        <div className={`inline-flex flex-col items-center justify-center px-3 py-1 rounded-xl border ${isOut ? 'bg-red-500/10 border-red-500/20 text-red-500' : isLow ? 'bg-amber-500/10 border-amber-500/20 text-amber-500' : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500'}`}>
                                            <span className="text-lg font-black">{item.current_stock}</span>
                                            <span className="text-[10px] uppercase font-bold opacity-70">{item.unit}</span>
                                        </div>
                                    </td>
                                    <td className="p-4 text-center">
                                        <span className="text-sm font-mono text-gray-500">{item.min_stock_level} {item.unit}</span>
                                    </td>
                                    <td className="p-4 text-right">
                                        <div className="flex gap-2 justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button onClick={() => handleEdit(item)} className="p-2 hover:bg-white/10 rounded-lg text-blue-400 transition-colors" title="Edit">
                                                ✏️
                                            </button>
                                            <button onClick={() => handleDelete(item.id, item.name)} className="p-2 hover:bg-red-500/20 rounded-lg text-red-400 transition-colors" title="Delete">
                                                🗑️
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>

            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingId ? 'Edit Item' : 'Add New Item'}>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-1 block">Item Name</label>
                        <input className="input-field w-full" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} required placeholder="e.g. Tomatoes, Napkins" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-1 block">Type</label>
                            <select className="input-field w-full appearance-none" value={formData.type} onChange={e => setFormData({ ...formData, type: e.target.value })}>
                                <option>Ingredient</option>
                                <option>Material</option>
                                <option>Packaging</option>
                            </select>
                        </div>
                        <div>
                            <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-1 block">Unit</label>
                            <select className="input-field w-full appearance-none" value={formData.unit} onChange={e => setFormData({ ...formData, unit: e.target.value })}>
                                <option value="kg">kg (Kilograms)</option>
                                <option value="g">g (Grams)</option>
                                <option value="l">l (Liters)</option>
                                <option value="ml">ml (Milliliters)</option>
                                <option value="pcs">pcs (Pieces)</option>
                                <option value="packs">packs (Packs)</option>
                            </select>
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-1 block">Min Stock (Alert)</label>
                            <input type="number" step="0.01" className="input-field w-full" value={formData.min_stock_level} onChange={e => setFormData({ ...formData, min_stock_level: Number(e.target.value) })} />
                        </div>
                        <div>
                            <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-1 block">Storage Loc.</label>
                            <input className="input-field w-full" value={formData.storage_location} onChange={e => setFormData({ ...formData, storage_location: e.target.value })} placeholder="e.g. Shelf A2" />
                        </div>
                    </div>
                    <button className="w-full bg-gradient-to-r from-amber-500 to-orange-600 text-white py-4 rounded-xl font-bold shadow-lg shadow-amber-500/20 hover:shadow-amber-500/40 transform transition-all active:scale-95 uppercase tracking-widest mt-4">
                        {editingId ? 'Update Item' : 'Save Item'}
                    </button>
                </form>
            </Modal>
        </div>
    );
};
