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

    if (!orderId) return <div className="p-8 text-center">No Order Found</div>;

    const currentStepIndex = STATUS_STEPS.indexOf(order?.status || 'pending');

    return (
        <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 flex flex-col items-center p-6 relative overflow-hidden">
            {/* Background Blobs */}
            <div className="absolute top-0 left-0 w-96 h-96 bg-green-200 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2 opacity-30"></div>
            <div className="absolute bottom-0 right-0 w-96 h-96 bg-emerald-200 rounded-full blur-3xl translate-x-1/2 translate-y-1/2 opacity-30"></div>

            <div className="w-full max-w-md bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/50 p-8 mb-6 animate-fade-in-up relative z-10">
                <div className="text-center mb-10">
                    <div className="relative inline-block mb-4">
                        <div className="absolute inset-0 bg-green-400 rounded-full blur-xl opacity-20 animate-pulse"></div>
                        <div className="w-24 h-24 bg-gradient-to-br from-green-100 to-emerald-50 rounded-full flex items-center justify-center relative z-10 shadow-inner border border-white">
                            <span className="text-5xl animate-bounce-short">🎉</span>
                        </div>
                    </div>
                    <h1 className="text-3xl font-display font-bold text-gray-900 mb-2">Order Confirmed!</h1>
                    <p className="text-gray-500 font-medium">Sit back, relax, and get ready to eat.</p>
                </div>

                {/* Status Tracker */}
                <div className="mb-10">
                    <div className="flex justify-between mb-4 relative px-2">
                        {/* Progress Bar Background */}
                        <div className="absolute top-1/2 left-2 right-2 h-1 bg-gray-100 -z-10 rounded-full"></div>
                        {/* Active Progress */}
                        <div
                            className="absolute top-1/2 left-2 h-1 bg-gradient-to-r from-green-400 to-emerald-600 -z-10 rounded-full transition-all duration-1000 ease-out"
                            style={{ width: `calc(${(currentStepIndex / (STATUS_STEPS.length - 1)) * 100}% - 16px)` }}
                        ></div>

                        {STATUS_STEPS.map((step, idx) => {
                            const isActive = idx <= currentStepIndex;
                            const isCurrent = idx === currentStepIndex;
                            return (
                                <div key={step} className={`flex flex-col items-center transition-all duration-500 relative ${isActive ? 'opacity-100' : 'opacity-40'}`}>
                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold border-2 mb-2 z-10 transition-all duration-500 shadow-sm
                                        ${isActive ? 'border-green-500 bg-green-500 text-white' : 'border-gray-200 bg-white text-gray-300'}
                                        ${isCurrent ? 'ring-4 ring-green-100 scale-110 shadow-lg shadow-green-200' : ''}
                                    `}>
                                        {isActive ? '✓' : idx + 1}
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    <div className="text-center bg-white/60 rounded-2xl p-6 border border-white/50 shadow-sm backdrop-blur-sm">
                        <p className="text-xs text-emerald-600 font-bold uppercase tracking-widest mb-2">Current Status</p>
                        <p className="text-2xl font-display font-bold text-gray-900 mb-1 animate-fade-in">
                            {STATUS_LABELS[order?.status] || 'Processing...'}
                        </p>
                        <p className="text-sm text-gray-500">
                            {STATUS_DESCRIPTIONS[order?.status] || 'Please wait while we update your status.'}
                        </p>
                    </div>
                </div>

                {/* Estimated Time */}
                {order?.status !== 'completed' && (
                    <div className="flex items-center justify-between p-5 bg-gradient-to-r from-gray-50 to-white rounded-2xl border border-gray-100 mb-8 shadow-sm">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-white rounded-xl shadow-sm text-2xl border border-gray-100">⏱️</div>
                            <div>
                                <p className="text-xs text-gray-400 font-bold uppercase tracking-wide">Estimated Wait</p>
                                <p className="text-lg font-bold text-gray-900">15-20 Mins</p>
                            </div>
                        </div>
                    </div>
                )}

                <div className="space-y-3">
                    <button className="w-full bg-[#25D366] text-white py-4 rounded-xl font-bold hover:shadow-lg hover:shadow-green-200 transition-all flex items-center justify-center gap-3 active:scale-[0.98]">
                        <span className="text-xl">💬</span>
                        <span>Join WhatsApp Community</span>
                    </button>
                    <button className="w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white py-4 rounded-xl font-bold hover:shadow-lg hover:shadow-pink-200 transition-all flex items-center justify-center gap-3 active:scale-[0.98]">
                        <span className="text-xl">📸</span>
                        <span>Follow on Instagram</span>
                    </button>

                    <div className="grid grid-cols-2 gap-3 pt-2">
                        <button
                            onClick={() => navigate('/menu')}
                            className="w-full py-3 font-bold text-gray-600 bg-gray-50 hover:bg-gray-100 rounded-xl transition-colors border border-gray-100"
                        >
                            Order More
                        </button>
                        <button
                            onClick={() => navigate('/bill')}
                            className="w-full py-3 font-bold text-emerald-600 bg-emerald-50 hover:bg-emerald-100 rounded-xl transition-colors border border-emerald-100"
                        >
                            View Bill
                        </button>
                    </div>
                </div>
            </div>

            <p className="text-emerald-800/40 text-xs font-medium mt-4">Thank you for dining with us!</p>
        </div>
    );
};
