import { useInventoryStore } from '../../store/useInventoryStore';

export const InventoryDashboard = ({ restaurantId: _restaurantId, showToast: _showToast }: { restaurantId: string, showToast: any }) => {
    const { items } = useInventoryStore();

    // Derived State
    const lowStockItems = items.filter(i => Number(i.current_stock) <= Number(i.min_stock_level));
    const outOfStockItems = items.filter(i => Number(i.current_stock) <= 0);
    // For value, assume purchase_price exists, else 0.
    const totalInventoryValue = items.reduce((sum, item) => sum + (Number(item.current_stock) * Number(item.purchase_price || 0)), 0);

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Stats Cards */}
            <div className="glass-panel p-6 rounded-2xl relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity text-4xl">📦</div>
                <h3 className="text-gray-400 text-[10px] font-black uppercase tracking-widest">Total Items</h3>
                <p className="text-4xl font-display font-black text-white mt-2 group-hover:scale-105 transition-transform">{items.length}</p>
                <div className="absolute bottom-0 left-0 h-1 bg-gradient-to-r from-blue-500 to-cyan-500 w-full opacity-50"></div>
            </div>

            <div className="glass-panel p-6 rounded-2xl relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity text-4xl">💰</div>
                <h3 className="text-gray-400 text-[10px] font-black uppercase tracking-widest">Inventory Value</h3>
                <p className="text-4xl font-display font-black text-emerald-400 mt-2 group-hover:scale-105 transition-transform">₹{totalInventoryValue.toLocaleString()}</p>
                <div className="absolute bottom-0 left-0 h-1 bg-gradient-to-r from-emerald-500 to-teal-500 w-full opacity-50"></div>
            </div>

            <div className="glass-panel p-6 rounded-2xl relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity text-4xl">⚠️</div>
                <h3 className="text-amber-500/80 text-[10px] font-black uppercase tracking-widest">Low Stock</h3>
                <p className="text-4xl font-display font-black text-amber-500 mt-2 group-hover:scale-105 transition-transform">{lowStockItems.length}</p>
                <div className="absolute bottom-0 left-0 h-1 bg-gradient-to-r from-amber-500 to-orange-500 w-full opacity-50"></div>
            </div>

            <div className="glass-panel p-6 rounded-2xl relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity text-4xl">🚫</div>
                <h3 className="text-red-500/80 text-[10px] font-black uppercase tracking-widest">Out of Stock</h3>
                <p className="text-4xl font-display font-black text-red-500 mt-2 group-hover:scale-105 transition-transform">{outOfStockItems.length}</p>
                <div className="absolute bottom-0 left-0 h-1 bg-gradient-to-r from-red-500 to-rose-500 w-full opacity-50"></div>
            </div>

            {/* Low Stock Alerts */}
            <div className="md:col-span-2 lg:col-span-3 glass-panel p-6 rounded-2xl">
                <h3 className="text-xl font-bold mb-6 flex items-center gap-3 text-white">
                    <span className="relative flex h-3 w-3">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-3 w-3 bg-amber-500"></span>
                    </span>
                    Low Stock Alerts
                </h3>
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="text-[10px] text-gray-500 font-black uppercase tracking-widest border-b border-white/5">
                                <th className="py-4">Item Name</th>
                                <th className="py-4">Status</th>
                                <th className="py-4">Stock / Min</th>
                                <th className="py-4 text-right">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {lowStockItems.length === 0 ? (
                                <tr>
                                    <td colSpan={4} className="py-12 text-center text-gray-500 italic">
                                        <div className="text-2xl mb-2">🎉</div>
                                        <div>All stocked up! No alerts.</div>
                                    </td>
                                </tr>
                            ) : (
                                lowStockItems.map(item => (
                                    <tr key={item.id} className="group hover:bg-white/5 transition-colors">
                                        <td className="py-4 font-bold text-white text-lg">{item.name}</td>
                                        <td className="py-4">
                                            {Number(item.current_stock) <= 0 ? (
                                                <span className="px-3 py-1 rounded-lg text-[10px] font-black uppercase bg-red-500/10 text-red-500 border border-red-500/20">OUT OF STOCK</span>
                                            ) : (
                                                <span className="px-3 py-1 rounded-lg text-[10px] font-black uppercase bg-amber-500/10 text-amber-500 border border-amber-500/20">LOW STOCK</span>
                                            )}
                                        </td>
                                        <td className="py-4 text-sm font-mono">
                                            <span className={`font-bold ${Number(item.current_stock) <= 0 ? 'text-red-500' : 'text-amber-500'}`}>{item.current_stock}</span>
                                            <span className="text-gray-600 mx-2">/</span>
                                            <span className="text-gray-400">{item.min_stock_level} {item.unit}</span>
                                        </td>
                                        <td className="py-4 text-right">
                                            <button className="text-emerald-400 font-bold hover:text-emerald-300 text-xs uppercase tracking-wider border border-emerald-500/30 px-3 py-1.5 rounded-lg hover:bg-emerald-500/10 transition-all">
                                                + Reorder
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Quick Actions */}
            <div className="glass-panel p-6 rounded-2xl flex flex-col justify-center space-y-4">
                <h3 className="text-gray-400 text-[10px] font-black uppercase tracking-widest mb-2">Quick Actions</h3>
                <button className="w-full bg-white/5 hover:bg-white/10 p-5 rounded-2xl text-left transition-all border border-white/5 hover:border-emerald-500/30 group flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center text-xl group-hover:scale-110 transition-transform">📥</div>
                    <div>
                        <div className="font-bold text-white group-hover:text-emerald-400 transition-colors">Restock</div>
                        <div className="text-[10px] text-gray-500 uppercase tracking-wider font-bold">Log Incoming</div>
                    </div>
                </button>
                <button className="w-full bg-white/5 hover:bg-white/10 p-5 rounded-2xl text-left transition-all border border-white/5 hover:border-red-500/30 group flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-red-500/20 flex items-center justify-center text-xl group-hover:scale-110 transition-transform">🗑️</div>
                    <div>
                        <div className="font-bold text-white group-hover:text-red-400 transition-colors">Wastage</div>
                        <div className="text-[10px] text-gray-500 uppercase tracking-wider font-bold">Log Spoiled Items</div>
                    </div>
                </button>
            </div>
        </div>
    );
};
