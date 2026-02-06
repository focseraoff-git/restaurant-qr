import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom'; // Added useNavigate
import { LogoutButton } from '../components/auth/LogoutButton';
import { NewOrderPanel } from '../components/counter/NewOrderPanel';
import { LiveOrdersBoard } from '../components/counter/LiveOrdersBoard';
import { OrderHistory } from '../components/counter/OrderHistory';
import { useStore } from '../store/useStore';
import { Toast } from '../components/Toast';
import { Modal } from '../components/Modal';

const ConfirmModal = ({ isOpen, onClose, onConfirm, title, message, type = 'danger' }: any) => {
    return (
        <Modal isOpen={isOpen} onClose={onClose} title={title}>
            <div className="text-center">
                <div className={`w-20 h-20 rounded-3xl flex items-center justify-center mx-auto mb-6 border ${type === 'danger' ? 'bg-red-500/10 border-red-500/20 text-red-500' : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500'}`}>
                    {type === 'danger' ? (
                        <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                    ) : (
                        <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                    )}
                </div>
                <h3 className="text-xl font-bold text-white mb-2">{title}</h3>
                <p className="text-gray-400 mb-8 leading-relaxed">
                    {message}
                </p>
                <div className="flex gap-4">
                    <button
                        onClick={onClose}
                        className="flex-1 px-6 py-4 rounded-2xl bg-white/5 text-gray-400 font-bold hover:bg-white/10 transition-all border border-white/10"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={() => { onConfirm(); onClose(); }}
                        className={`flex-1 px-6 py-4 rounded-2xl font-bold text-white shadow-lg transition-all transform active:scale-95 ${type === 'danger' ? 'bg-gradient-to-r from-red-600 to-rose-600 shadow-red-500/20 hover:shadow-red-500/40' : 'bg-gradient-to-r from-emerald-600 to-teal-600 shadow-emerald-500/20 hover:shadow-emerald-500/40'}`}
                    >
                        Confirm
                    </button>
                </div>
            </div>
        </Modal>
    );
};

export const CounterDashboard = () => {
    const { restaurantId } = useParams();
    const navigate = useNavigate(); // Added for back navigation consistency
    const [activeTab, setActiveTab] = useState<'new' | 'live' | 'history'>('new');
    const { setRestaurantId } = useStore();
    const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);
    const [confirmAction, setConfirmAction] = useState<{
        isOpen: boolean;
        title: string;
        message: string;
        onConfirm: () => void;
        type?: 'danger' | 'info';
    }>({
        isOpen: false,
        title: '',
        message: '',
        onConfirm: () => { },
    });

    const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
        setToast({ message, type });
    };

    useEffect(() => {
        if (restaurantId) {
            setRestaurantId(restaurantId);
        }
    }, [restaurantId, setRestaurantId]);

    return (
        <div className="min-h-screen bg-slate-950 flex flex-col relative overflow-hidden text-gray-100 font-sans">
            {/* Background Effects */}
            <div className="absolute top-0 left-0 w-full h-[500px] bg-indigo-900/20 rounded-full blur-[120px] pointer-events-none"></div>
            <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-emerald-900/10 rounded-full blur-[100px] pointer-events-none"></div>

            {/* Top Navigation Bar */}
            <header className="glass-nav px-8 py-5 flex justify-between items-center sticky top-0 z-30 mb-6 shrink-0 backdrop-blur-md bg-slate-900/80 border-b border-white/5">
                <div className="flex items-center gap-6">
                    {/* Back Button added for consistency */}
                    <button onClick={() => navigate(-1)} className="text-gray-400 hover:text-white transition-colors bg-white/5 p-2 rounded-xl hover:bg-white/10 md:hidden">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path></svg>
                    </button>

                    <h1 className="text-2xl font-serif font-medium tracking-tight flex items-center gap-1 group cursor-default">
                        <span className="text-white group-hover:text-emerald-50 transition-colors">Focsera</span>
                        <span className="text-emerald-400 italic font-light relative">
                            DineQR
                            <span className="absolute -top-0.5 -right-1 w-1.5 h-1.5 bg-emerald-400 rounded-full blur-[1px] opacity-80 animate-pulse"></span>
                        </span>
                    </h1>
                    <div className="h-6 w-px bg-white/10 hidden md:block"></div>

                    {/* Desktop Navigation */}
                    <nav className="hidden md:flex gap-3">
                        <button
                            onClick={() => setActiveTab('new')}
                            className={`px-5 py-2.5 rounded-xl text-sm font-bold border transition-all flex items-center gap-2 ${activeTab === 'new'
                                ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white border-transparent shadow-lg shadow-emerald-500/20'
                                : 'bg-white/5 text-gray-400 border-white/5 hover:bg-white/10 hover:text-white'}`}
                        >
                            <span>🛍️</span> New Order
                        </button>
                        <button
                            onClick={() => setActiveTab('live')}
                            className={`px-5 py-2.5 rounded-xl text-sm font-bold border transition-all flex items-center gap-2 ${activeTab === 'live'
                                ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white border-transparent shadow-lg shadow-emerald-500/20'
                                : 'bg-white/5 text-gray-400 border-white/5 hover:bg-white/10 hover:text-white'}`}
                        >
                            <span>⚡</span> Live Orders
                        </button>
                        <button
                            onClick={() => setActiveTab('history')}
                            className={`px-5 py-2.5 rounded-xl text-sm font-bold border transition-all flex items-center gap-2 ${activeTab === 'history'
                                ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white border-transparent shadow-lg shadow-emerald-500/20'
                                : 'bg-white/5 text-gray-400 border-white/5 hover:bg-white/10 hover:text-white'}`}
                        >
                            <span>📜</span> History
                        </button>
                    </nav>
                </div>

                <div className="flex items-center gap-4">
                    <div className="text-xs font-bold px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-2 animate-pulse">
                        <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></span>
                        LIVE SYSTEM
                    </div>
                    <LogoutButton />
                </div>

            </header>

            {/* Mobile Navigation (Bottom) */}
            <div className="md:hidden fixed bottom-0 left-0 w-full z-40 bg-slate-900/90 backdrop-blur-xl border-t border-white/10 p-4 flex justify-around">
                <button
                    onClick={() => setActiveTab('new')}
                    className={`flex flex-col items-center gap-1 ${activeTab === 'new' ? 'text-emerald-400' : 'text-gray-500'}`}
                >
                    <span className="text-2xl">🛍️</span>
                    <span className="text-[10px] font-bold uppercase tracking-wider">Order</span>
                </button>
                <button
                    onClick={() => setActiveTab('live')}
                    className={`flex flex-col items-center gap-1 ${activeTab === 'live' ? 'text-emerald-400' : 'text-gray-500'}`}
                >
                    <span className="text-2xl">⚡</span>
                    <span className="text-[10px] font-bold uppercase tracking-wider">Live</span>
                </button>
                <button
                    onClick={() => setActiveTab('history')}
                    className={`flex flex-col items-center gap-1 ${activeTab === 'history' ? 'text-emerald-400' : 'text-gray-500'}`}
                >
                    <span className="text-2xl">📜</span>
                    <span className="text-[10px] font-bold uppercase tracking-wider">History</span>
                </button>
            </div>

            {/* Main Content Area */}
            <main className="flex-1 overflow-hidden relative z-10 px-0 md:px-8 pb-24 md:pb-8">
                <div className="h-full w-full max-w-7xl mx-auto">
                    {activeTab === 'new' && <NewOrderPanel restaurantId={restaurantId || ''} showToast={showToast} />}
                    {activeTab === 'live' && <LiveOrdersBoard restaurantId={restaurantId || ''} showToast={showToast} setConfirmAction={setConfirmAction} />}
                    {activeTab === 'history' && <OrderHistory restaurantId={restaurantId || ''} showToast={showToast} />}
                </div>
            </main>

            <ConfirmModal
                isOpen={confirmAction.isOpen}
                onClose={() => setConfirmAction({ ...confirmAction, isOpen: false })}
                title={confirmAction.title}
                message={confirmAction.message}
                onConfirm={confirmAction.onConfirm}
                type={confirmAction.type}
            />

            {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
        </div>
    );
};
