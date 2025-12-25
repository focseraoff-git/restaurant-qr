import { Outlet, Link, useLocation } from 'react-router-dom';
import { useStore } from '../store/useStore';

const TableInfo = () => {
    const { tableNumber } = useStore();
    if (!tableNumber) return null;
    return (
        <span className="bg-emerald-500/10 text-emerald-400 px-3 py-1 rounded-full text-xs font-bold border border-emerald-500/20 backdrop-blur-md shadow-sm">
            Table {tableNumber}
        </span>
    );
};

export const Layout = () => {
    return (
        <div className="min-h-screen bg-slate-950 flex flex-col relative font-sans">
            {/* Global Background Effects - Subtle to not interfere with page specific ones */}
            <div className="absolute top-0 left-0 right-0 h-64 bg-gradient-to-b from-indigo-900/10 to-transparent pointer-events-none"></div>

            <header className="glass-nav sticky top-0 z-50">
                <div className="container mx-auto px-4 py-3 flex justify-between items-center max-w-4xl">
                    <Link to="/" className="text-2xl font-display font-bold text-white tracking-tight hover:opacity-80 transition-opacity">
                        Focsera<span className="text-emerald-400">DineQR</span>
                    </Link>

                    <div className="flex items-center gap-4">
                        <TableInfo />
                        {/* Avatar Placeholder */}
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-slate-700 to-slate-800 border border-white/10 shadow-inner flex items-center justify-center">
                            <span className="text-xs">👤</span>
                        </div>
                    </div>
                </div>
            </header>

            <main className="flex-grow container mx-auto max-w-4xl z-10 relative">
                <Outlet />
            </main>

            <footer className="py-8 text-center text-gray-600 text-[10px] uppercase tracking-widest mt-auto border-t border-white/5 bg-slate-950">
                <p>&copy; 2025 FocseraDineQR System</p>
            </footer>
        </div>
    );
};
