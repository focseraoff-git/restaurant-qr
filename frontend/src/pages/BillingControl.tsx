import { useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { LogoutButton } from '../components/auth/LogoutButton';

// Components
import { BillsDashboard } from '../components/billing/BillsDashboard';
import { KhataManager } from '../components/billing/KhataManager';
import { OffersManager } from '../components/billing/OffersManager';
import { CancellationRegister } from '../components/billing/CancellationRegister';
import { OnlineOrdersAnalytics } from '../components/billing/OnlineOrdersAnalytics';
import { Toast } from '../components/Toast';

export const BillingControl = () => {
    const { restaurantId } = useParams();
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('dashboard');

    // Toast State
    const [toast, setToast] = useState<{ message: string, type: 'success' | 'error' | 'info' } | null>(null);

    const showToast = useCallback((message: string, type: 'success' | 'error' | 'info') => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 3000);
    }, []);

    const tabs = [
        { id: 'dashboard', label: 'Sales & Bills', icon: '📊' },
        { id: 'khata', label: 'Khata/Credit', icon: '📓' },
        { id: 'online', label: 'Online Orders', icon: '🛵' },
        { id: 'offers', label: 'Offers', icon: '🏷️' },
        { id: 'cancellations', label: 'Damages', icon: '📉' },
    ];

    if (!restaurantId) return null;

    return (
        <div className="min-h-screen bg-slate-950 text-white font-sans pb-20 relative overflow-hidden">
            {/* Background Effects - Indigo Themed for Finance */}
            <div className="absolute top-0 left-0 w-full h-[500px] bg-indigo-900/20 rounded-full blur-[120px] pointer-events-none"></div>
            <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-blue-900/10 rounded-full blur-[100px] pointer-events-none"></div>

            {/* Header */}
            <header className="glass-nav px-8 py-5 flex justify-between items-center sticky top-0 z-30 mb-6 shrink-0 backdrop-blur-md bg-slate-900/80 border-b border-white/5">
                <div className="flex items-center gap-6">
                    <button onClick={() => navigate(-1)} className="text-gray-400 hover:text-white transition-colors bg-white/5 p-2 rounded-xl hover:bg-white/10">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path></svg>
                    </button>
                    <h1 className="text-2xl font-serif font-medium tracking-tight flex items-center gap-1 group cursor-default">
                        <span className="text-white group-hover:text-indigo-50 transition-colors">Focsera</span>
                        <span className="text-indigo-400 italic font-light relative">
                            DineQR
                            <span className="absolute -top-0.5 -right-1 w-1.5 h-1.5 bg-indigo-400 rounded-full blur-[1px] opacity-80 animate-pulse"></span>
                        </span>
                        <span className="ml-3 px-2 py-0.5 rounded-md bg-white/5 border border-white/5 text-[10px] font-sans text-indigo-400/50 font-bold uppercase tracking-wider">Billing</span>
                    </h1>
                </div>
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => navigate(`/counter/${restaurantId}`)}
                        className="px-4 py-2 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 rounded-xl text-sm font-bold transition-all flex items-center gap-2"
                    >
                        <span>🍽️</span>
                        <span className="hidden md:inline">Operations</span>
                    </button>
                    <div className="text-xs font-bold px-3 py-1 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 flex items-center gap-2 animate-pulse">
                        <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full"></span>
                        SECURE
                    </div>
                    <LogoutButton />
                </div>

            </header>

            <main className="p-4 md:p-8 max-w-7xl mx-auto w-full relative z-10">
                <div className="flex gap-3 overflow-x-auto no-scrollbar pb-6">
                    {tabs.map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold whitespace-nowrap transition-all border ${activeTab === tab.id
                                ? 'bg-gradient-to-r from-indigo-600 to-blue-600 text-white border-transparent shadow-lg shadow-indigo-500/20'
                                : 'bg-white/5 text-gray-400 border-white/5 hover:bg-white/10 hover:text-white'
                                }`}
                        >
                            <span>{tab.icon}</span>
                            <span>{tab.label}</span>
                        </button>
                    ))}
                </div>

                <div className="min-h-[500px] animate-fade-in">
                    {activeTab === 'dashboard' && <BillsDashboard restaurantId={restaurantId} />}
                    {activeTab === 'khata' && <KhataManager restaurantId={restaurantId} showToast={showToast} />}
                    {activeTab === 'online' && <OnlineOrdersAnalytics restaurantId={restaurantId} />}
                    {activeTab === 'offers' && <OffersManager restaurantId={restaurantId} showToast={showToast} />}
                    {activeTab === 'cancellations' && <CancellationRegister restaurantId={restaurantId} showToast={showToast} />}
                </div>
            </main>

            {/* Global Toast */}
            {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
        </div>
    );
};
