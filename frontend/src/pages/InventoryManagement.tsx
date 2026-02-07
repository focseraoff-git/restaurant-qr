import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { LogoutButton } from '../components/auth/LogoutButton';
import { useInventoryStore } from '../store/useInventoryStore';
// Components
import { VendorDirectory } from '../components/inventory/VendorDirectory';
import { ItemMaster } from '../components/inventory/ItemMaster';
import { StockMovement } from '../components/inventory/StockMovement';
import { InventoryDashboard } from '../components/inventory/InventoryDashboard';
import { PurchaseEntry } from '../components/inventory/PurchaseEntry';
import { PurchaseHistory } from '../components/inventory/PurchaseHistory';
import { Toast } from '../components/Toast';

export const InventoryManagement = () => {
    // Simple Toast State
    const [toast, setToast] = useState<{ message: string, type: 'success' | 'error' | 'info' } | null>(null);

    const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 3000);
    };

    const { restaurantId } = useParams();
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('dashboard');
    const { init, loading } = useInventoryStore();

    useEffect(() => {
        if (restaurantId) {
            init(restaurantId);
        }
    }, [restaurantId, init]);

    const tabs = [
        { id: 'dashboard', label: 'Dashboard', icon: '📊' },
        { id: 'items', label: 'Items & Stock', icon: '📦' },
        { id: 'vendors', label: 'Vendors', icon: '🚚' },
        { id: 'movement', label: 'Stock In/Out', icon: '🔄' },
        { id: 'purchase', label: 'Purchase Entry', icon: '📝' },
        { id: 'history', label: 'Invoices History', icon: '📜' }
    ];

    if (loading) return <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-amber-500"></div>
        <p className="mt-4 text-amber-500 font-bold animate-pulse">Loading Inventory...</p>
    </div>;

    return (
        <div className="min-h-screen bg-slate-950 text-white font-sans pb-20 relative overflow-hidden">
            {/* Background Effects - Amber Themed */}
            <div className="absolute top-0 left-0 w-full h-[500px] bg-amber-900/20 rounded-full blur-[120px] pointer-events-none"></div>
            <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-orange-900/10 rounded-full blur-[100px] pointer-events-none"></div>

            {/* Header */}
            <header className="glass-nav px-8 py-5 flex justify-between items-center sticky top-0 z-30 mb-6 shrink-0 backdrop-blur-md bg-slate-900/80 border-b border-white/5">
                <div className="flex items-center gap-6">
                    <button onClick={() => navigate(-1)} className="text-gray-400 hover:text-white transition-colors bg-white/5 p-2 rounded-xl hover:bg-white/10">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path></svg>
                    </button>
                    <h1 className="text-2xl font-serif font-medium tracking-tight flex items-center gap-1 group cursor-default">
                        <span className="text-white group-hover:text-amber-50 transition-colors">Focsera</span>
                        <span className="text-amber-500 italic font-light relative">
                            DineQR
                            <span className="absolute -top-0.5 -right-1 w-1.5 h-1.5 bg-amber-500 rounded-full blur-[1px] opacity-80 animate-pulse"></span>
                        </span>
                        <span className="ml-3 px-2 py-0.5 rounded-md bg-white/5 border border-white/5 text-[10px] font-sans text-amber-500/50 font-bold uppercase tracking-wider">Inventory</span>
                    </h1>
                </div>
                <div className="flex items-center gap-4">
                    <div className="text-xs font-bold px-3 py-1 rounded-full bg-amber-500/10 text-amber-500 border border-amber-500/20 flex items-center gap-2 animate-pulse">
                        <span className="w-1.5 h-1.5 bg-amber-500 rounded-full"></span>
                        SYNC ACTIVE
                    </div>
                    <LogoutButton />
                </div>

            </header>

            <main className="p-4 md:p-8 max-w-7xl mx-auto w-full relative z-10">
                {/* Navigation Tabs */}
                <div className="flex gap-3 overflow-x-auto no-scrollbar pb-6">
                    {tabs.map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold whitespace-nowrap transition-all border ${activeTab === tab.id
                                ? 'bg-gradient-to-r from-amber-500 to-orange-600 text-white border-transparent shadow-lg shadow-amber-500/20'
                                : 'bg-white/5 text-gray-400 border-white/5 hover:bg-white/10 hover:text-white'
                                }`}
                        >
                            <span>{tab.icon}</span>
                            <span>{tab.label}</span>
                        </button>
                    ))}
                </div>

                {/* Content Area */}
                <div className="min-h-[500px] animate-fade-in">
                    {activeTab === 'dashboard' && <InventoryDashboard restaurantId={restaurantId!} showToast={showToast} />}
                    {activeTab === 'vendors' && <VendorDirectory restaurantId={restaurantId!} showToast={showToast} />}
                    {activeTab === 'items' && <ItemMaster restaurantId={restaurantId!} showToast={showToast} />}
                    {activeTab === 'movement' && <StockMovement restaurantId={restaurantId!} showToast={showToast} />}
                    {activeTab === 'purchase' && <PurchaseEntry restaurantId={restaurantId!} showToast={showToast} />}
                    {activeTab === 'history' && <PurchaseHistory restaurantId={restaurantId!} />}
                </div>
            </main>

            {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
        </div>
    );
};
