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
        <div className="min-h-screen bg-gray-50 p-6 flex flex-col items-center">
            <div className="w-full max-w-md bg-white rounded-3xl shadow-xl p-8 mb-6 animate-fade-in-up">
                <div className="text-center mb-8">
                    <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <span className="text-4xl animate-bounce">🎉</span>
                    </div>
                    <h1 className="text-2xl font-bold text-gray-900">Order Placed!</h1>
                    <p className="text-gray-500">Track your delicious food below.</p>
                </div>

                {/* Status Tracker */}
                <div className="mb-8">
                    <div className="flex justify-between mb-2 relative">
                        {/* Progress Bar Background */}
                        <div className="absolute top-1/2 left-0 w-full h-1 bg-gray-100 -z-10 rounded-full"></div>
                        {/* Active Progress */}
                        <div className="absolute top-1/2 left-0 h-1 bg-green-500 -z-10 rounded-full transition-all duration-1000" style={{ width: `${(currentStepIndex / (STATUS_STEPS.length - 1)) * 100}%` }}></div>

                        {STATUS_STEPS.map((step, idx) => {
                            const isActive = idx <= currentStepIndex;
                            const isCurrent = idx === currentStepIndex;
                            return (
                                <div key={step} className={`flex flex-col items-center transition-all duration-500 ${isActive ? 'opacity-100' : 'opacity-40'}`}>
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold border-2 mb-1 z-10 bg-white ${isActive ? 'border-green-500 text-green-600' : 'border-gray-200 text-gray-400'} ${isCurrent ? 'ring-4 ring-green-100 scale-125' : ''}`}>
                                        {idx + 1}
                                    </div>
                                    <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500">{step}</span>
                                </div>
                            );
                        })}
                    </div>
                    <div className="text-center mt-6 p-4 bg-green-50 rounded-2xl border border-green-100">
                        <p className="text-sm text-green-600 font-bold uppercase tracking-wide mb-1">Current Status</p>
                        <p className="text-xl font-bold text-green-800">{STATUS_LABELS[order?.status] || 'Processing...'}</p>
                    </div>
                </div>

                {/* Estimated Time */}
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl border border-gray-100 mb-6">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-white rounded-xl shadow-sm">⏱️</div>
                        <div>
                            <p className="text-xs text-gray-500 font-bold uppercase">Estimated Time</p>
                            <p className="font-bold text-gray-900">15-20 Mins</p>
                        </div>
                    </div>
                </div>

                <div className="space-y-3">
                    <button className="w-full bg-[#25D366] text-white py-3 rounded-xl font-bold hover:opacity-90 transition-opacity flex items-center justify-center gap-2 shadow-lg shadow-green-100">
                        <span>💬</span> Join WhatsApp Community
                    </button>
                    <button className="w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white py-3 rounded-xl font-bold hover:opacity-90 transition-opacity flex items-center justify-center gap-2 shadow-lg shadow-pink-100">
                        <span>📸</span> Follow on Instagram
                    </button>
                    <button onClick={() => navigate('/menu')} className="w-full text-gray-500 py-3 font-medium hover:text-gray-900">
                        Order More Items
                    </button>
                    <button onClick={() => navigate('/bill')} className="w-full text-primary-600 font-bold py-2 hover:underline">
                        View Full Bill
                    </button>
                </div>
            </div>
        </div>
    );
};
