import { useState } from 'react';
import { useInventoryStore } from '../../store/useInventoryStore';
import { Modal } from '../Modal';

export const VendorDirectory = ({ restaurantId, showToast }: { restaurantId: string, showToast: any }) => {
    const { vendors, addVendor, updateVendor, deleteVendor } = useInventoryStore();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [formData, setFormData] = useState({
        name: '',
        contact_person: '',
        phone: '',
        email: '',
        category: 'Ingredients',
        payment_terms: 'Cash',
        restaurant_id: restaurantId
    });

    const handleEdit = (v: any) => {
        setEditingId(v.id);
        setFormData({
            name: v.name,
            contact_person: v.contact_person || '',
            phone: v.phone || '',
            email: v.email || '',
            category: v.category || 'Ingredients',
            payment_terms: v.payment_terms || 'Cash',
            restaurant_id: restaurantId
        });
        setIsModalOpen(true);
    };

    const handleDelete = async (id: string, name: string) => {
        if (confirm(`Delete vendor "${name}"?`)) {
            try {
                await deleteVendor(id);
                showToast('Vendor deleted', 'info');
            } catch (err) {
                showToast('Failed to delete vendor', 'error');
            }
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (editingId) {
                await updateVendor(editingId, formData);
                showToast('Vendor updated', 'success');
            } else {
                await addVendor(formData);
                showToast('Vendor added', 'success');
            }
            setIsModalOpen(false);
            setEditingId(null);
            setFormData({ ...formData, name: '', contact_person: '', phone: '', email: '' });
        } catch (err) {
            showToast('Failed to save vendor', 'error');
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold">Vendor Directory</h2>
                <button
                    onClick={() => { setEditingId(null); setIsModalOpen(true); }}
                    className="bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2 rounded-lg font-bold shadow-lg shadow-emerald-500/20"
                >
                    + Add Vendor
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {vendors.map(v => (
                    <div key={v.id} className="bg-slate-900 border border-white/5 rounded-xl p-5 hover:border-emerald-500/30 transition-all group">
                        <div className="flex justify-between items-start mb-4">
                            <div>
                                <h3 className="font-bold text-lg">{v.name}</h3>
                                <span className="text-xs font-bold px-2 py-1 rounded bg-slate-800 text-gray-400 mt-1 inline-block">{v.category}</span>
                            </div>
                            <div className="opacity-0 group-hover:opacity-100 transition-opacity flex gap-2">
                                <button onClick={() => handleEdit(v)} className="p-1 hover:text-amber-400">✏️</button>
                                <button onClick={() => handleDelete(v.id, v.name)} className="p-1 hover:text-red-400">🗑️</button>
                            </div>
                        </div>
                        <div className="space-y-2 text-sm text-gray-400">
                            <div className="flex items-center gap-2">
                                <span>👤</span> {v.contact_person || 'No Contact'}
                            </div>
                            <div className="flex items-center gap-2">
                                <span>📞</span> {v.phone || 'No Phone'}
                            </div>
                            <div className="flex items-center gap-2">
                                <span>💳</span> {v.payment_terms}
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingId ? 'Edit Vendor' : 'New Vendor'}>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="text-sm text-gray-400">Vendor Name</label>
                        <input className="w-full bg-slate-800 border-none rounded p-2 text-white" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} required />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-sm text-gray-400">Contact Person</label>
                            <input className="w-full bg-slate-800 border-none rounded p-2 text-white" value={formData.contact_person} onChange={e => setFormData({ ...formData, contact_person: e.target.value })} />
                        </div>
                        <div>
                            <label className="text-sm text-gray-400">Phone</label>
                            <input className="w-full bg-slate-800 border-none rounded p-2 text-white" value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })} />
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-sm text-gray-400">Category</label>
                            <select className="w-full bg-slate-800 border-none rounded p-2 text-white" value={formData.category} onChange={e => setFormData({ ...formData, category: e.target.value })}>
                                <option>Ingredients</option>
                                <option>Packaging</option>
                                <option>Equipment</option>
                                <option>Services</option>
                            </select>
                        </div>
                        <div>
                            <label className="text-sm text-gray-400">Payment Terms</label>
                            <select className="w-full bg-slate-800 border-none rounded p-2 text-white" value={formData.payment_terms} onChange={e => setFormData({ ...formData, payment_terms: e.target.value })}>
                                <option>Cash</option>
                                <option>Weekly</option>
                                <option>Monthly</option>
                                <option>Credit</option>
                            </select>
                        </div>
                    </div>
                    <button className="w-full bg-emerald-500 py-3 rounded font-bold hover:bg-emerald-600">Save Vendor</button>
                </form>
            </Modal>
        </div>
    );
};
