import { useRef, useEffect } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../store/useAuthStore';

type UserRole = 'admin' | 'manager' | 'billing' | 'inventory' | 'staff' | 'counter' | 'waiter' | 'kitchen' | 'vendor_manager' | 'staff_counter' | 'staff_kitchen';

interface ProtectedRouteProps {
    allowedRoles?: UserRole[];
}

export const ProtectedRoute = ({ allowedRoles }: ProtectedRouteProps) => {
    const { user, profile, loading, initialize, initialized } = useAuthStore();
    const location = useLocation();
    const initRef = useRef(false);

    useEffect(() => {
        if (!initRef.current) {
            initialize();
            initRef.current = true;
        }
    }, [initialize]);

    if (loading || !initialized) {
        return (
            <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-white">
                <div className="w-12 h-12 border-4 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin mb-4"></div>
                <p className="text-sm uppercase tracking-widest font-bold text-gray-500">Verifying Identity...</p>
            </div>
        );
    }

    if (!user) {
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    if (allowedRoles && profile && !allowedRoles.includes(profile.role)) {
        return (
            <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-white p-6">
                <span className="text-6xl mb-4 grayscale">🚫</span>
                <h1 className="text-3xl font-bold mb-2">Access Denied</h1>
                <p className="text-gray-400 mb-6 text-center max-w-md">
                    Your role (<span className="text-emerald-400 font-bold uppercase">{profile.role}</span>) does not have permission to view this page.
                </p>
                <div className="flex gap-4">
                    <button onClick={() => window.history.back()} className="px-6 py-2 bg-white/5 rounded-lg font-bold hover:bg-white/10 transition-colors">
                        Go Back
                    </button>
                    <Navigate to="/" />
                </div>
            </div>
        );
    }

    return <Outlet />;
};
