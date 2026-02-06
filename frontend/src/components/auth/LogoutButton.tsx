import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/useAuthStore';

export const LogoutButton = () => {
    const { signOut } = useAuthStore();
    const navigate = useNavigate();

    const handleLogout = async () => {
        if (window.confirm("Are you sure you want to log out?")) {
            await signOut();
            navigate('/login');
        }
    };

    return (
        <button
            onClick={handleLogout}
            className="group flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/5 hover:bg-red-500/10 hover:border-red-500/20 text-gray-400 hover:text-red-400 transition-all ml-2"
            title="Sign Out"
        >
            <svg className="w-5 h-5 group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"></path>
            </svg>
            <span className="text-xs font-bold uppercase tracking-wider hidden md:block">Logout</span>
        </button>
    );
};
