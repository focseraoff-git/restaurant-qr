import { useState, useEffect } from 'react';
import { useBillingStore } from '../../store/useBillingStore';
import { Modal } from '../Modal';
import api from '../../utils/api';

export const OffersManager = ({ restaurantId, showToast }: { restaurantId: string, showToast: any }) => {
    const { offers, fetchOffers, toggleOffer } = useBillingStore();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Form State
    const [form, setForm] = useState({
        name: '',
        description: '',
        code: '',
        type: 'FLAT', // FLAT, PERCENTAGE
        value: 0
    });

    useEffect(() => {
        fetchOffers(restaurantId);
    }, [restaurantId, fetchOffers]);

    const handleToggle = async (id: string, currentStatus: boolean) => {
        try {
            await toggleOffer(id, { is_active: !currentStatus });
            showToast(`Offer ${!currentStatus ? 'Active' : 'Paused'}`, 'info');
        } catch (err) {
            showToast('Failed to update offer', 'error');
        }
    };

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            await api.post('/offers', { ...form, restaurant_id: restaurantId, is_active: true });
            showToast('Offer Created Successfully! 🎉', 'success');
            fetchOffers(restaurantId);
            setIsModalOpen(false);
            setForm({ name: '', description: '', code: '', type: 'FLAT', value: 0 });
        } catch (err) {
            showToast('Failed to create offer', 'error');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold">Offers & Promotions</h2>
                <button
                    onClick={() => setIsModalOpen(true)}
                    className="bg-purple-500 hover:bg-purple-600 text-white px-4 py-2 rounded-lg font-bold shadow-lg shadow-purple-500/20"
                >
                    + Create New Offer
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {offers.map(offer => (
                    <div key={offer.id} className={`p-6 rounded-2xl border transition-all ${offer.is_active ? 'bg-purple-500/10 border-purple-500/50' : 'bg-slate-900 border-white/5 opacity-60'}`}>
                        <div className="flex justify-between items-start mb-4">
                            <span className="text-xs font-bold bg-white/10 px-2 py-1 rounded text-white">{offer.type}</span>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input type="checkbox" className="sr-only peer" checked={offer.is_active} onChange={() => handleToggle(offer.id, offer.is_active)} />
                                <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-500"></div>
                            </label>
                        </div>
                        <h3 className="text-xl font-black text-white">{offer.name}</h3>
                        <p className="text-sm text-gray-400 mt-1">{offer.description}</p>

                        <div className="mt-4 pt-4 border-t border-white/5 flex justify-between text-sm">
                            <div className="font-mono text-purple-300">{offer.code || 'NO CODE'}</div>
                            <div className="font-bold">
                                {offer.type === 'FLAT' ? `₹${offer.value} OFF` : `${offer.value}% OFF`}
                            </div>
                        </div>
                    </div>
                ))}
            </div>
            {offers.length === 0 && (
                <div className="text-center py-20 text-gray-500 italic">
                    No offers created yet. Start a promotion to boost sales! 🚀
                </div>
            )}

            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Create New Offer">
                <form onSubmit={handleCreate} className="space-y-4">
                    <div>
                        <label className="text-sm text-gray-400">Offer Name</label>
                        <input className="w-full bg-slate-800 border-none rounded p-3 text-white"
                            placeholder="e.g. Summer Special"
                            value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required
                        />
                    </div>
                    <div>
                        <label className="text-sm text-gray-400">Description</label>
                        <input className="w-full bg-slate-800 border-none rounded p-3 text-white"
                            placeholder="e.g. Get flat ₹50 off on orders above ₹200"
                            value={form.description} onChange={e => setForm({ ...form, description: e.target.value })}
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-sm text-gray-400">Type</label>
                            <select className="w-full bg-slate-800 border-none rounded p-3 text-white" value={form.type} onChange={e => setForm({ ...form, type: e.target.value })}>
                                <option value="FLAT">Flat Amount (₹)</option>
                                <option value="PERCENTAGE">Percentage (%)</option>
                            </select>
                        </div>
                        <div>
                            <label className="text-sm text-gray-400">Value</label>
                            <input type="number" className="w-full bg-slate-800 border-none rounded p-3 text-white font-bold"
                                value={form.value} onChange={e => setForm({ ...form, value: Number(e.target.value) })} required
                            />
                        </div>
                    </div>
                    <div>
                        <label className="text-sm text-gray-400">Promo Code (Optional)</label>
                        <input className="w-full bg-slate-800 border-none rounded p-3 text-white font-mono uppercase"
                            placeholder="e.g. SAVE10"
                            value={form.code} onChange={e => setForm({ ...form, code: e.target.value })}
                        />
                    </div>
                    <button disabled={isSubmitting} className="w-full bg-purple-500 py-4 rounded-xl font-bold hover:bg-purple-600 disabled:opacity-50">
                        {isSubmitting ? 'Creating...' : 'Launch Offer 🚀'}
                    </button>
                </form>
            </Modal>
        </div>
    );
};
