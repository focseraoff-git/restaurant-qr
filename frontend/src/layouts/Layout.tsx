import { Outlet, Link, useLocation } from 'react-router-dom';
import { useStore } from '../store/useStore';

const TableInfo = () => {
    const { tableNumber } = useStore();
    if (!tableNumber) return null;
    return (
        <span className="bg-primary-50 text-primary-700 px-3 py-1 rounded-full text-xs font-bold border border-primary-100">
            Table {tableNumber}
        </span>
    );
};

export const Layout = () => {
    const { cart } = useStore();
    const location = useLocation();

    // Don't show cart button on cart page
    const showCart = location.pathname !== '/cart' && cart.length > 0;
    const itemCount = cart.reduce((acc, item) => acc + item.quantity, 0);

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col relative font-sans">
            <header className="bg-white/80 backdrop-blur-md border-b border-gray-100 sticky top-0 z-20">
                <div className="container mx-auto px-4 py-3 flex justify-between items-center max-w-2xl">
                    <Link to="/" className="text-2xl font-display font-bold text-gray-900 tracking-tight">
                        Feast<span className="text-primary-600">QR</span>
                    </Link>
                    {/* Placeholder for future nav */}
                    <div className="flex items-center gap-3">
                        <TableInfo />
                        <div className="w-8 h-8 rounded-full bg-gray-100 shadow-inner"></div>
                    </div>
                </div>
            </header>

            <main className="flex-grow container mx-auto p-4 max-w-2xl z-10 relative">
                <Outlet />
            </main>

            {showCart && (
                <div className="fixed bottom-6 left-4 right-4 max-w-2xl mx-auto z-30 pointer-events-none">
                    <Link to="/cart" className="pointer-events-auto bg-gray-900 text-white p-4 rounded-2xl shadow-premium-hover flex justify-between items-center transform transition-transform hover:scale-[1.02] active:scale-[0.98]">
                        <div className="flex items-center gap-3">
                            <span className="bg-primary-500 text-white w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm shadow-sm ring-2 ring-gray-900">
                                {itemCount}
                            </span>
                            <span className="font-medium text-lg">View Cart</span>
                        </div>
                        <span className="font-bold text-gray-400 group-hover:text-white transition-colors">&rarr;</span>
                    </Link>
                </div>
            )}

            <footer className="py-8 text-center text-gray-400 text-xs mt-auto">
                <p>&copy; 2024 FeastQR System</p>
            </footer>
        </div>
    );
};
