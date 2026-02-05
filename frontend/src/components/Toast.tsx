import { useEffect, useState } from 'react';

interface ToastProps {
    message: string;
    type?: 'success' | 'error' | 'info';
    duration?: number;
    onClose: () => void;
}

export const Toast = ({ message, type = 'info', duration = 3000, onClose }: ToastProps) => {
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        setIsVisible(true);
        const timer = setTimeout(() => {
            setIsVisible(false);
            setTimeout(onClose, 400); // Wait for fade out animation
        }, duration);

        return () => clearTimeout(timer);
    }, [duration, onClose]);

    const styles = {
        success: {
            bg: 'bg-emerald-950/80 border-emerald-500/30 text-emerald-100',
            iconBg: 'bg-emerald-500/20 text-emerald-400',
            glow: 'shadow-emerald-500/20',
            title: 'Success'
        },
        error: {
            bg: 'bg-red-950/80 border-red-500/30 text-red-100',
            iconBg: 'bg-red-500/20 text-red-400',
            glow: 'shadow-red-500/20',
            title: 'Error'
        },
        info: {
            bg: 'bg-slate-900/80 border-white/10 text-white',
            iconBg: 'bg-white/10 text-white',
            glow: 'shadow-white/5',
            title: 'Notification'
        }
    };

    const currentStyle = styles[type];

    return (
        <div className={`fixed top-8 right-8 z-[100] transition-all duration-500 transform ${isVisible ? 'translate-x-0 opacity-100' : 'translate-x-12 opacity-0'}`}>
            <div className={`flex items-center gap-4 px-6 py-5 rounded-2xl border backdrop-blur-xl shadow-2xl ${currentStyle.bg} ${currentStyle.glow} border-white/10 max-w-sm`}>
                {/* Icon */}
                <div className={`flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center border border-white/5 ${currentStyle.iconBg}`}>
                    {type === 'success' && (
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7"></path></svg>
                    )}
                    {type === 'error' && (
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12"></path></svg>
                    )}
                    {type === 'info' && (
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                    )}
                </div>

                {/* Content */}
                <div className="flex-1">
                    <p className={`text-[10px] uppercase font-black tracking-[0.2em] mb-0.5 opacity-60`}>{currentStyle.title}</p>
                    <p className="text-sm font-bold leading-tight">{message}</p>
                </div>

                {/* Close Button */}
                <button
                    onClick={() => setIsVisible(false)}
                    className="flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center hover:bg-white/5 transition-colors text-gray-500"
                >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                </button>

                {/* Progress bar */}
                <div className="absolute bottom-0 left-0 h-1 bg-white/10 overflow-hidden rounded-b-2xl w-full">
                    <div
                        className={`h-full ${type === 'success' ? 'bg-emerald-500' : type === 'error' ? 'bg-red-500' : 'bg-white'} opacity-40`}
                        style={{
                            width: '100%',
                            animation: `toast-progress ${duration}ms linear forwards`
                        }}
                    ></div>
                </div>
            </div>

            <style>{`
                @keyframes toast-progress {
                    from { width: 100%; }
                    to { width: 0%; }
                }
            `}</style>
        </div>
    );
};

