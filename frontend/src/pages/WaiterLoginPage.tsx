import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '../utils/supabaseClient';

export const WaiterLoginPage = () => {
    const { restaurantId } = useParams();
    const navigate = useNavigate();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Validate URL
    if (restaurantId === ':restaurantId') {
        return (
            <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 text-center">
                <h1 className="text-2xl font-bold text-white mb-4">Invalid URL</h1>
                <p className="text-red-400 mb-6">You seem to have come from a malformed link.</p>
                <p className="text-gray-400 text-sm mb-4">Please verify your restaurant ID.</p>
            </div>
        );
    }

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            // 1. Auth Login
            const { data, error } = await supabase.auth.signInWithPassword({
                email,
                password
            });

            if (error) throw error;

            // 2. Verify if user is actually a waiter for this restaurant
            // We can fetch from local API or Supabase directly. API is safer if configured.
            // But for now, we trust the Auth ID and redirect.
            // Ideally: await api.get('/waiters/me'); 

            // Redirect to dashboard
            navigate(`/waiter/${restaurantId}/dashboard`);
        } catch (err: any) {
            setError(err.message || 'Login failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 relative overflow-hidden font-sans">
            <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-emerald-500/10 rounded-full blur-[120px] pointer-events-none"></div>

            <div className="w-full max-w-md glass-panel p-8 rounded-3xl border border-white/10 relative z-10 shadow-2xl">
                <div className="text-center mb-8">
                    <div className="w-20 h-20 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-4 border border-emerald-500/30">
                        <span className="text-4xl">👋</span>
                    </div>
                    <h1 className="text-2xl font-bold text-white mb-2">Waiter Login</h1>
                    <p className="text-gray-400 text-sm">Access your service dashboard</p>
                </div>

                {error && (
                    <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-xl text-sm mb-6 text-center font-bold">
                        {error}
                    </div>
                )}

                <form onSubmit={handleLogin} className="space-y-5">
                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Email</label>
                        <input
                            type="email"
                            required
                            value={email}
                            onChange={e => setEmail(e.target.value)}
                            className="input-field w-full text-lg"
                            placeholder="waiter@restaurant.com"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Password</label>
                        <input
                            type="password"
                            required
                            value={password}
                            onChange={e => setPassword(e.target.value)}
                            className="input-field w-full text-lg"
                            placeholder="••••••••"
                        />
                    </div>
                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full btn-primary py-4 rounded-xl font-bold text-white shadow-lg text-lg mt-4 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {loading ? 'Verifying...' : 'Start Shift →'}
                    </button>
                </form>

                <p className="text-center text-xs text-gray-600 mt-8">
                    Contact kitchen manager for account issues.
                </p>
            </div>
        </div>
    );
};
