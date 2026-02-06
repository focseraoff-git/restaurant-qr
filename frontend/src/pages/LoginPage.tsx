import { useState } from 'react';
import { useAuthStore } from '../store/useAuthStore';
import { useNavigate, Link } from 'react-router-dom';

export const LoginPage = () => {
    const { signIn } = useAuthStore();
    const navigate = useNavigate();

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsSubmitting(true);

        // Simulate a slight delay for better UX interactions
        await new Promise(resolve => setTimeout(resolve, 800));

        const { error } = await signIn(email, password);

        if (error) {
            setError(error.message);
            setIsSubmitting(false);
        } else {
            navigate('/dashboard');
        }
    };

    return (
        <div className="min-h-screen bg-[#02040a] flex items-center justify-center p-4 relative overflow-hidden font-sans text-slate-200">
            {/* Ambient Background Lights */}
            <div className="absolute top-[-20%] left-[-10%] w-[800px] h-[800px] bg-emerald-900/10 rounded-full blur-[180px] opacity-40"></div>
            <div className="absolute bottom-[-20%] right-[-10%] w-[600px] h-[600px] bg-indigo-900/10 rounded-full blur-[150px] opacity-30"></div>

            {/* Subtle Grid Texture */}
            <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.03]"></div>

            <div className="w-full max-w-[420px] relative z-10 animate-fade-in-up">

                {/* Brand Header */}
                <div className="text-center mb-10">
                    <h1 className="text-6xl font-serif font-medium tracking-tighter mb-3 flex items-center justify-center gap-1 group cursor-default">
                        <span className="text-white group-hover:text-emerald-50 transition-colors duration-700">Focsera</span>
                        <span className="text-emerald-500 italic font-light relative">
                            DineQR
                            {/* Subtle particle glow */}
                            <span className="absolute -top-1 -right-2 w-2 h-2 bg-emerald-400 rounded-full blur-[2px] opacity-80 animate-pulse"></span>
                        </span>
                    </h1>
                    <p className="text-slate-500 font-sans uppercase tracking-[0.3em] text-[10px] font-semibold opacity-60">
                        Premium Restaurant OS
                    </p>
                </div>

                {/* Login Card */}
                <div className="bg-white/[0.02] backdrop-blur-2xl border border-white/[0.06] rounded-3xl p-8 shadow-2xl shadow-black/80 relative overflow-hidden group/card hover:border-white/[0.08] transition-colors duration-500">

                    {/* Top highligh line */}
                    <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-emerald-500/30 to-transparent"></div>

                    <div className="text-center mb-8">
                        <h2 className="text-lg font-medium text-slate-200">Welcome Back</h2>
                        <p className="text-slate-500 text-sm mt-1">Authenticate to access your dashboard</p>
                    </div>

                    {error && (
                        <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-3 rounded-xl mb-6 text-xs font-medium text-center animate-shake">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div className="space-y-2 group/input">
                            <label className="text-[10px] uppercase font-bold tracking-widest text-slate-500 group-focus-within/input:text-emerald-500 transition-colors ml-1">Email Access</label>
                            <input
                                type="email"
                                required
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3.5 text-sm text-white placeholder-slate-700 focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/50 transition-all hover:bg-black/50"
                                placeholder="name@restaurant.com"
                            />
                        </div>

                        <div className="space-y-2 group/input">
                            <div className="flex justify-between items-center px-1">
                                <label className="text-[10px] uppercase font-bold tracking-widest text-slate-500 group-focus-within/input:text-emerald-500 transition-colors">Passkey</label>
                                <Link to="/forgot-password" className="text-[10px] font-bold text-slate-500 hover:text-emerald-400 transition-colors">
                                    Recover Access?
                                </Link>
                            </div>
                            <input
                                type="password"
                                required
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3.5 text-sm text-white placeholder-slate-700 focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/50 transition-all hover:bg-black/50 tracking-widest"
                                placeholder="••••••••"
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="w-full bg-emerald-600 hover:bg-emerald-500 text-white py-4 rounded-xl text-xs font-bold uppercase tracking-[0.15em] shadow-lg shadow-emerald-900/40 hover:shadow-emerald-900/60 hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 mt-2 relative overflow-hidden group/btn"
                        >
                            <span className="relative z-10 flex items-center justify-center gap-2">
                                {isSubmitting ? 'Verifying...' : 'Access Terminal'}
                                {!isSubmitting && <svg className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M17 8l4 4m0 0l-4 4m4-4H3"></path></svg>}
                            </span>

                            {/* Shine effect */}
                            <div className="absolute inset-0 -translate-x-full group-hover/btn:translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent transition-transform duration-700 ease-in-out"></div>
                        </button>
                    </form>
                </div>

                <div className="mt-8 text-center">
                    <p className="text-slate-600 text-xs">
                        New Establishment? <Link to="/signup" className="text-emerald-500 hover:text-emerald-400 font-medium transition-colors ml-1">Connect with us</Link>
                    </p>
                </div>
            </div>

            <div className="absolute bottom-8 text-[10px] text-slate-700 font-mono flex gap-4">
                <span>V2.4.0 (STABLE)</span>
                <span>•</span>
                <span>SECURE ENCLAVE</span>
            </div>
        </div>
    );
};
