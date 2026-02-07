import { useState, useMemo } from 'react';
import { useInventoryStore } from '../../store/useInventoryStore';

export const PurchaseHistory = ({ restaurantId: _restaurantId }: { restaurantId: string }) => {
    const { purchases, vendors } = useInventoryStore();
    const [selectedVendor, setSelectedVendor] = useState('all');
    const [searchQuery, setSearchQuery] = useState('');

    const filteredPurchases = useMemo(() => {
        return purchases.filter(p => {
            const matchesVendor = selectedVendor === 'all' || p.vendor_id === selectedVendor;
            const matchesSearch =
                (p.invoice_no?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
                (p.notes?.toLowerCase() || '').includes(searchQuery.toLowerCase());
            return matchesVendor && matchesSearch;
        });
    }, [purchases, selectedVendor, searchQuery]);

    const totalSpent = filteredPurchases.reduce((sum, p) => sum + Number(p.total_amount), 0);

    return (
        <div className="space-y-6 animate-fade-in relative z-10">
            {/* Header / Filter Bar */}
            <div className="flex flex-col md:flex-row justify-between items-center bg-slate-900 border border-white/5 p-4 rounded-2xl shadow-lg gap-4 backdrop-blur-md">
                <div className="flex flex-col">
                    <h2 className="text-xl font-bold text-white flex items-center gap-2">
                        📜 Purchase History
                        <span className="text-xs bg-emerald-500/10 text-emerald-500 px-2 py-1 rounded-full border border-emerald-500/20">{filteredPurchases.length} Invoices</span>
                    </h2>
                    <p className="text-xs text-gray-500 uppercase tracking-widest font-bold mt-1">Track Vendor Invoices</p>
                </div>

                <div className="flex flex-1 w-full md:w-auto gap-4 justify-end">
                    <div className="relative group">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-emerald-400 transition-colors">🔍</span>
                        <input
                            type="text"
                            placeholder="Search Invoice #..."
                            className="bg-slate-800 border-none rounded-xl pl-10 pr-4 py-3 text-white w-full md:w-64 focus:ring-1 focus:ring-emerald-500/50 transition-all font-medium placeholder-gray-600"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                    <select
                        className="bg-slate-800 border-none rounded-xl px-4 py-3 text-white font-bold cursor-pointer hover:bg-slate-700 transition-colors"
                        value={selectedVendor}
                        onChange={(e) => setSelectedVendor(e.target.value)}
                    >
                        <option value="all">🏢 All Vendors</option>
                        {vendors.map(v => (
                            <option key={v.id} value={v.id}>{v.name}</option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Total Summary */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-gradient-to-br from-emerald-900/40 to-slate-900 border border-emerald-500/20 p-6 rounded-2xl relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity text-5xl">💰</div>
                    <h3 className="text-emerald-500/80 text-[10px] font-black uppercase tracking-widest">Total Purchases</h3>
                    <p className="text-4xl font-display font-black text-white mt-1 group-hover:scale-105 transition-transform">
                        ₹{totalSpent.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </p>
                </div>
                {/* Could add Pending vs Paid stats here later */}
            </div>

            {/* Table */}
            <div className="bg-slate-900/60 border border-white/5 rounded-2xl overflow-hidden shadow-2xl backdrop-blur-sm">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-white/5 text-[10px] font-black uppercase tracking-widest text-gray-400 border-b border-white/5">
                                <th className="p-4">Date</th>
                                <th className="p-4">Invoice No</th>
                                <th className="p-4">Vendor</th>
                                <th className="p-4">Status</th>
                                <th className="p-4 text-right">Amount</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {filteredPurchases.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="py-20 text-center text-gray-500 italic flex flex-col items-center">
                                        <div className="text-4xl mb-3 grayscale opacity-30">🧾</div>
                                        <p>No purchase records found</p>
                                    </td>
                                </tr>
                            ) : (
                                filteredPurchases.map(purchase => {
                                    // @ts-ignore
                                    const vendorName = purchase.vendors?.name || 'Unknown Vendor';
                                    return (
                                        <tr key={purchase.id} className="hover:bg-white/5 transition-colors group cursor-pointer">
                                            <td className="p-4 text-sm text-gray-300 font-mono">
                                                {new Date(purchase.invoice_date || purchase.date || new Date().toISOString()).toLocaleDateString()}
                                            </td>
                                            <td className="p-4 text-sm font-bold text-white">
                                                {purchase.invoice_no}
                                                {purchase.notes && <div className="text-[10px] text-gray-500 font-normal truncate max-w-[150px]">{purchase.notes}</div>}
                                            </td>
                                            <td className="p-4 text-sm text-emerald-200 font-medium">
                                                {vendorName}
                                            </td>
                                            <td className="p-4">
                                                <span className={`px-2 py-1 rounded text-[10px] font-black uppercase tracking-wider border ${(purchase as any).payment_status === 'Paid' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' :
                                                    (purchase as any).payment_status === 'Pending' ? 'bg-amber-500/10 text-amber-500 border-amber-500/20' :
                                                        'bg-blue-500/10 text-blue-500 border-blue-500/20'
                                                    }`}>
                                                    {(purchase as any).payment_status || 'Pending'}
                                                </span>
                                            </td>
                                            <td className="p-4 text-right font-mono font-bold text-white">
                                                ₹{Number(purchase.total_amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};
