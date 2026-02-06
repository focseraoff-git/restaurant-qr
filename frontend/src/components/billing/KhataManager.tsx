import { useState, useEffect } from 'react';
import { useBillingStore } from '../../store/useBillingStore';
import { Modal } from '../Modal';

export const KhataManager = ({ restaurantId, showToast }: { restaurantId: string, showToast: any }) => {
    const { customers, fetchCustomers, createCustomer, addTransaction, fetchLedger, ledger } = useBillingStore();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedCustomer, setSelectedCustomer] = useState<any>(null);
    const [activeView, setActiveView] = useState<'list' | 'ledger'>('list');
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Forms
    const [customerForm, setCustomerForm] = useState({ name: '', phone: '', credit_limit: 1000, is_khata_active: true });
    const [payForm, setPayForm] = useState({ amount: '', type: 'PAYMENT', description: 'Cash Settlement' });

    useEffect(() => {
        fetchCustomers(restaurantId);
    }, [restaurantId, fetchCustomers]);

    const handleCreateCustomer = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            await createCustomer({ ...customerForm, restaurant_id: restaurantId });
            showToast('Customer added to Khata', 'success');
            setIsModalOpen(false);
        } catch (err) {
            showToast('Failed to add customer', 'error');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleViewLedger = (customer: any) => {
        setSelectedCustomer(customer);
        fetchLedger(customer.id);
        setActiveView('ledger');
    };

    const handleTransaction = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedCustomer) return;
        setIsSubmitting(true);
        try {
            await addTransaction({
                restaurant_id: restaurantId,
                customer_id: selectedCustomer.id,
                type: payForm.type,
                amount: Number(payForm.amount),
                payment_method: 'Cash',
                description: payForm.description
            });
            showToast('Transaction Recorded', 'success');
            fetchLedger(selectedCustomer.id); // Refresh ledger
            setPayForm({ ...payForm, amount: '' });
        } catch (err) {
            showToast('Transaction Failed', 'error');
        } finally {
            setIsSubmitting(false);
        }
    };

    if (activeView === 'ledger' && selectedCustomer) {
        return (
            <div className="space-y-6 animate-fade-in">
                <button onClick={() => setActiveView('list')} className="flex items-center gap-2 text-indigo-400 hover:text-indigo-300 font-bold mb-4 bg-white/5 px-4 py-2 rounded-xl border border-white/5 transition-colors">
                    <span>←</span> Back to Customers
                </button>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="glass-panel p-6 rounded-2xl relative overflow-hidden">
                        <h2 className="text-2xl font-bold text-white">{selectedCustomer.name}</h2>
                        <p className="text-gray-400 font-mono text-sm mt-1">{selectedCustomer.phone}</p>
                        <div className="absolute bottom-0 left-0 h-1 bg-indigo-500 w-full opacity-50"></div>
                    </div>
                    <div className="glass-panel p-6 rounded-2xl relative overflow-hidden">
                        <h3 className="text-gray-400 text-[10px] font-black uppercase tracking-widest">Current Due</h3>
                        <p className={`text-4xl font-display font-black mt-2 ${selectedCustomer.current_due > 0 ? 'text-red-500' : 'text-emerald-500'}`}>
                            ₹{selectedCustomer.current_due}
                        </p>
                    </div>
                    <div className="glass-panel p-6 rounded-2xl relative overflow-hidden">
                        <h3 className="text-gray-400 text-[10px] font-black uppercase tracking-widest">Quick Payment</h3>
                        <form onSubmit={handleTransaction} className="mt-4 flex gap-3">
                            <input
                                type="number"
                                className="w-full bg-slate-950/50 border border-white/10 rounded-xl px-4 py-2 text-white font-bold outline-none focus:border-emerald-500/50"
                                placeholder="Amount (₹)"
                                value={payForm.amount}
                                onChange={e => setPayForm({ ...payForm, amount: e.target.value })}
                                required
                            />
                            <button disabled={isSubmitting} className="bg-emerald-600 hover:bg-emerald-500 text-white px-6 py-2 rounded-xl font-bold shadow-lg shadow-emerald-500/20 active:scale-95 transition-all disabled:opacity-50">
                                {isSubmitting ? '...' : 'Pay'}
                            </button>
                        </form>
                    </div>
                </div>

                <div className="glass-panel p-6 rounded-2xl">
                    <h3 className="font-bold text-lg mb-6 border-b border-white/5 pb-4">Transaction History</h3>
                    <table className="w-full text-left text-sm border-collapse">
                        <thead className="text-[10px] text-gray-500 font-black uppercase tracking-widest bg-white/5">
                            <tr>
                                <th className="p-4 rounded-l-lg">Date</th>
                                <th className="p-4">Description</th>
                                <th className="p-4 text-right">Credit (+)</th>
                                <th className="p-4 rounded-r-lg text-right">Payment (-)</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {ledger.map(tx => (
                                <tr key={tx.id} className="hover:bg-white/5 transition-colors">
                                    <td className="p-4 text-gray-400 font-mono text-xs">{new Date(tx.transaction_date).toLocaleDateString()}</td>
                                    <td className="p-4 text-white font-bold">{tx.description}</td>
                                    <td className="p-4 text-right font-mono text-red-400 font-bold">
                                        {tx.type === 'CREDIT' ? `₹${tx.amount}` : '-'}
                                    </td>
                                    <td className="p-4 text-right font-mono text-emerald-400 font-bold">
                                        {tx.type === 'PAYMENT' ? `₹${tx.amount}` : '-'}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center bg-slate-900/50 p-6 rounded-2xl border border-white/5 backdrop-blur-sm">
                <div>
                    <h2 className="text-xl font-bold text-white flex items-center gap-2">
                        📓 Khata Register
                        <span className="text-xs bg-indigo-500/10 text-indigo-500 px-2 py-1 rounded-lg border border-indigo-500/20">{customers.length} Accounts</span>
                    </h2>
                    <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mt-1">Manage Customer Credits</p>
                </div>
                <button onClick={() => setIsModalOpen(true)} className="bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 text-white px-6 py-3 rounded-xl text-sm font-bold shadow-lg shadow-indigo-500/20 active:scale-95 transition-all flex items-center gap-2">
                    <span className="text-lg">+</span> Add Customer
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {customers.map(c => (
                    <div key={c.id} onClick={() => handleViewLedger(c)} className="cursor-pointer glass-panel p-6 rounded-2xl hover:border-indigo-500/30 transition-all duration-300 group relative overflow-hidden">
                        <div className={`absolute top-0 right-0 px-3 py-1 text-[10px] font-black uppercase tracking-widest rounded-bl-xl ${c.is_khata_active ? 'bg-emerald-500/20 text-emerald-400' : 'bg-gray-800 text-gray-500'}`}>
                            {c.is_khata_active ? 'ACTIVE' : 'INACTIVE'}
                        </div>
                        <h3 className="font-bold text-lg text-white group-hover:text-indigo-400 transition-colors mb-1">{c.name}</h3>
                        <p className="text-xs text-gray-500 font-mono mb-6">{c.phone}</p>

                        <div className="flex justify-between items-end border-t border-white/5 pt-4">
                            <div>
                                <p className="text-[10px] text-gray-500 uppercase font-black tracking-widest">Total Due</p>
                                <p className={`text-2xl font-black mt-1 ${c.current_due > 0 ? 'text-red-500' : 'text-gray-300'}`}>
                                    ₹{c.current_due}
                                </p>
                            </div>
                            <div className="text-right">
                                <p className="text-[10px] text-gray-500 uppercase font-black tracking-widest">Credit Limit</p>
                                <p className="text-sm font-bold text-gray-300 mt-1">₹{c.credit_limit}</p>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Enable Khata for Customer">
                <form onSubmit={handleCreateCustomer} className="space-y-4">
                    <div>
                        <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-2 block">Name</label>
                        <input className="input-field w-full" value={customerForm.name} onChange={e => setCustomerForm({ ...customerForm, name: e.target.value })} required placeholder="Enter customer name" />
                    </div>
                    <div>
                        <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-2 block">Phone</label>
                        <input className="input-field w-full" value={customerForm.phone} onChange={e => setCustomerForm({ ...customerForm, phone: e.target.value })} required placeholder="Enter phone number" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-2 block">Credit Limit (₹)</label>
                            <input type="number" className="input-field w-full" value={customerForm.credit_limit} onChange={e => setCustomerForm({ ...customerForm, credit_limit: Number(e.target.value) })} />
                        </div>
                        <div className="flex items-center pt-6 px-2">
                            <label className="flex items-center gap-3 cursor-pointer group">
                                <input type="checkbox" checked={customerForm.is_khata_active} onChange={e => setCustomerForm({ ...customerForm, is_khata_active: e.target.checked })} className="w-5 h-5 rounded border-gray-600 bg-slate-800 text-indigo-500 focus:ring-indigo-500" />
                                <span className="text-gray-300 font-bold group-hover:text-white transition-colors">Enable Credit</span>
                            </label>
                        </div>
                    </div>
                    <button disabled={isSubmitting} className="w-full bg-gradient-to-r from-indigo-600 to-blue-600 text-white py-4 rounded-xl font-black uppercase tracking-widest shadow-lg shadow-indigo-500/20 hover:shadow-indigo-500/40 active:scale-95 transition-all mt-4 disabled:opacity-50">
                        {isSubmitting ? 'Activating...' : 'Activate Khata'}
                    </button>
                </form>
            </Modal>
        </div>
    );
};
