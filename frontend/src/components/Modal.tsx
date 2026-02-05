import type { ReactNode } from 'react';
import { useEffect, useState } from 'react';

interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    children: ReactNode;
    maxWidth?: string;
}

export const Modal = ({ isOpen, onClose, title, children, maxWidth = 'max-w-md' }: ModalProps) => {
    const [render, setRender] = useState(isOpen);

    useEffect(() => {
        if (isOpen) setRender(true);
    }, [isOpen]);

    if (!render) return null;

    return (
        <div
            className={`fixed inset-0 z-50 flex items-center justify-center p-4 transition-all duration-300 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
            onTransitionEnd={() => { if (!isOpen) setRender(false); }}
        >
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/60 backdrop-blur-md"
                onClick={onClose}
            ></div>

            {/* Modal Content */}
            <div className={`relative w-full ${maxWidth} overflow-hidden rounded-[2rem] border border-white/10 glass-panel shadow-[0_30px_100px_rgba(0,0,0,0.6)] animate-slide-up`}>
                {/* Decorative background glow */}
                <div className="absolute -top-24 -right-24 w-48 h-48 bg-emerald-500/10 rounded-full blur-[80px]"></div>
                <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-teal-500/5 rounded-full blur-[80px]"></div>

                {/* Header */}
                <div className="relative px-8 py-6 border-b border-white/5 flex justify-between items-center bg-white/5">
                    <h3 className="font-display font-bold text-2xl text-white tracking-tight flex items-center gap-3">
                        <span className="w-1.5 h-6 bg-emerald-500 rounded-full"></span>
                        {title}
                    </h3>
                    <button
                        onClick={onClose}
                        className="w-10 h-10 flex items-center justify-center rounded-full bg-white/5 text-gray-400 hover:text-white hover:bg-white/10 transition-all border border-white/10"
                    >
                        ✕
                    </button>
                </div>

                {/* Body */}
                <div className="relative p-8 max-h-[85vh] overflow-y-auto no-scrollbar">
                    {children}
                </div>
            </div>
        </div>
    );
};
