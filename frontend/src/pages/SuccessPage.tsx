import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import api from '../utils/api';

const STATUS_STEPS = ['pending', 'preparing', 'ready', 'completed'];
const STATUS_LABELS: Record<string, string> = {
    pending: 'Order Received',
    preparing: 'Chefs are Cooking',
    ready: 'Ready to Serve',
    completed: 'Enjoy your Meal!'
};

const STATUS_DESCRIPTIONS: Record<string, string> = {
    pending: 'We have received your order.',
    preparing: 'Our chefs are working their magic.',
    ready: 'Your food is plated and ready.',
    completed: 'Have a wonderful dining experience!'
};

export const SuccessPage = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const orderId = searchParams.get('orderId');
    const [order, setOrder] = useState<any>(null);

    useEffect(() => {
        if (orderId) {
            const fetchStatus = () => {
                api.get(`/orders/${orderId}`).then(res => setOrder(res.data)).catch(console.error);
            };
            // Initial fetch
            fetchStatus();
            // Poll
            const interval = setInterval(fetchStatus, 5000);
            return () => clearInterval(interval);
        }
    }, [orderId]);

    if (!orderId) return <div className="p-8 text-center text-white">No Order Found</div>;

    const currentStepIndex = STATUS_STEPS.indexOf(order?.status || 'pending');

    return (
        <div className="min-h-screen bg-slate-950 flex flex-col items-center p-6 relative overflow-hidden">
            {/* Background Effects */}
            <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-emerald-500/10 rounded-full blur-[120px] pointer-events-none"></div>
            <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-indigo-500/10 rounded-full blur-[120px] pointer-events-none"></div>

            <div className="w-full max-w-md glass-panel rounded-[2.5rem] shadow-2xl border border-white/10 p-8 mb-6 animate-fade-in-up relative z-10 transition-all hover:shadow-emerald-500/10">
                <div className="text-center mb-10">
                    <div className="relative inline-block mb-6">
                        <div className="absolute inset-0 bg-emerald-500 rounded-full blur-2xl opacity-20 animate-pulse"></div>
                        <div className="w-24 h-24 bg-gradient-to-br from-emerald-500/20 to-teal-500/20 rounded-full flex items-center justify-center relative z-10 shadow-inner border border-emerald-500/30 backdrop-blur-md">
                            <span className="text-5xl animate-bounce-short drop-shadow-[0_0_15px_rgba(52,211,153,0.5)]">🎉</span>
                        </div>
                    </div>
                    <h1 className="text-3xl font-display font-bold text-white mb-2 tracking-tight">Order Confirmed!</h1>
                    <p className="text-gray-400 font-medium">Sit back, relax, and get ready to eat.</p>
                </div>

                {/* Status Tracker */}
                <div className="mb-10">
                    <div className="flex justify-between mb-8 relative px-2">
                        {/* Progress Bar Background */}
                        <div className="absolute top-1/2 left-2 right-2 h-1 bg-white/10 -z-10 rounded-full"></div>
                        {/* Active Progress */}
                        <div
                            className="absolute top-1/2 left-2 h-1 bg-gradient-to-r from-emerald-500 to-teal-400 -z-10 rounded-full transition-all duration-1000 ease-out shadow-[0_0_10px_rgba(16,185,129,0.5)]"
                            style={{ width: `calc(${(currentStepIndex / (STATUS_STEPS.length - 1)) * 100}% - 16px)` }}
                        ></div>

                        {STATUS_STEPS.map((step, idx) => {
                            const isActive = idx <= currentStepIndex;
                            const isCurrent = idx === currentStepIndex;
                            return (
                                <div key={step} className={`flex flex-col items-center transition-all duration-500 relative ${isActive ? 'opacity-100' : 'opacity-30'}`}>
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border-2 mb-2 z-10 transition-all duration-500
                                        ${isActive ? 'border-emerald-500 bg-emerald-500 text-white shadow-[0_0_15px_rgba(16,185,129,0.5)]' : 'border-white/10 bg-slate-900 text-gray-500'}
                                        ${isCurrent ? 'ring-4 ring-emerald-500/20 scale-125' : ''}
                                    `}>
                                        {isActive ? '✓' : idx + 1}
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    <div className="text-center bg-white/5 rounded-2xl p-6 border border-white/5 shadow-inner backdrop-blur-sm">
                        <p className="text-[10px] text-emerald-400 font-bold uppercase tracking-[0.2em] mb-2 text-shadow-glow">Current Status</p>
                        <p className="text-2xl font-display font-bold text-white mb-1 animate-fade-in tracking-tight">
                            {STATUS_LABELS[order?.status] || 'Processing...'}
                        </p>
                        <p className="text-sm text-gray-400">
                            {STATUS_DESCRIPTIONS[order?.status] || 'Please wait while we update your status.'}
                        </p>
                    </div>
                </div>

                {/* Estimated Time */}
                {order?.status !== 'completed' && (
                    <div className="flex items-center justify-between p-5 bg-gradient-to-r from-slate-900 to-slate-800 rounded-2xl border border-white/5 mb-8 shadow-lg">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-white/5 rounded-xl shadow-inner text-2xl border border-white/5">⏱️</div>
                            <div>
                                <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wide">Estimated Wait</p>
                                <p className="text-lg font-bold text-white">15-20 Mins</p>
                            </div>
                        </div>
                    </div>
                )}

                <div className="space-y-4">
                    <button className="w-full bg-[#25D366] hover:bg-[#20bd5a] text-white py-4 rounded-xl font-bold shadow-lg hover:shadow-green-500/20 transition-all flex items-center justify-center gap-3 active:scale-[0.98] group">
                        <span className="text-xl group-hover:scale-110 transition-transform">💬</span>
                        <span>Join WhatsApp Community</span>
                    </button>
                    <button className="w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white py-4 rounded-xl font-bold shadow-lg hover:shadow-pink-500/20 transition-all flex items-center justify-center gap-3 active:scale-[0.98] group">
                        <span className="text-xl group-hover:scale-110 transition-transform">📸</span>
                        <span>Follow on Instagram</span>
                    </button>

                    <div className="grid grid-cols-2 gap-3 pt-4">
                        <button
                            onClick={() => navigate('/menu')}
                            className="w-full py-3 font-bold text-gray-300 bg-white/5 hover:bg-white/10 rounded-xl transition-colors border border-white/5 hover:text-white"
                        >
                            Order More
                        </button>
                        <button
                            onClick={() => navigate('/bill')}
                            className="w-full py-3 font-bold text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20 rounded-xl transition-colors border border-emerald-500/20 shadow-glow-emerald"
                        >
                            View Bill
                        </button>
                    </div>
                </div>
            </div>

            <p className="text-white/20 text-xs font-medium mt-4 tracking-widest uppercase">Thank you for dining with us</p>
        </div>
    );
};
