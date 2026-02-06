import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';

export const ForgotPasswordPage = () => {
    const { resetPasswordForEmail } = useAuthStore();

    const [email, setEmail] = useState('');
    const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');
    const [message, setMessage] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setStatus('submitting');
        setMessage('');

        const { error } = await resetPasswordForEmail(email);

        if (error) {
            setStatus('error');
            setMessage(error.message);
        } else {
            setStatus('success');
            setMessage('Password reset link has been sent to your email.');
        }
    };

    return (
        <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 relative overflow-hidden">
            {/* Background Effects */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
                <div className="absolute top-[-20%] right-[-10%] w-[500px] h-[500px] bg-indigo-500/10 rounded-full blur-[120px]"></div>
                <div className="absolute bottom-[-10%] left-[-5%] w-[400px] h-[400px] bg-emerald-500/10 rounded-full blur-[100px]"></div>
            </div>

            <div className="glass-panel w-full max-w-md p-8 rounded-3xl relative z-10 border-white/10 shadow-2xl bg-slate-900/60 backdrop-blur-xl">
                <div className="text-center mb-8">
                    <h1 className="text-4xl font-serif font-bold tracking-tight mb-4">
                        <span className="text-white">Focsera</span>
                        <span className="text-emerald-400 italic">DineQR</span>
                    </h1>
                    <h2 className="text-xl text-gray-400 font-sans">Password Recovery</h2>
                </div>

                {status === 'error' && (
                    <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-3 rounded-xl mb-6 text-sm font-bold text-center animate-shake">
                        {message}
                    </div>
                )}

                {status === 'success' ? (
                    <div className="text-center space-y-6 animate-fade-in">
                        <div className="w-16 h-16 bg-emerald-500/10 text-emerald-400 rounded-full flex items-center justify-center mx-auto border border-emerald-500/20">
                            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path></svg>
                        </div>
                        <h3 className="text-xl font-bold text-white">Check your email</h3>
                        <p className="text-gray-400 text-sm">
                            We've sent a password reset link to <span className="text-white font-bold">{email}</span>.
                        </p>
                        <Link to="/login" className="block w-full btn-primary py-4 text-sm font-black uppercase tracking-widest shadow-lg shadow-emerald-500/20 rounded-xl">
                            Return to Login
                        </Link>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="space-y-2">
                            <label className="text-[10px] uppercase font-black tracking-widest text-gray-400 ml-1">Email Address</label>
                            <input
                                type="email"
                                required
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="input-field w-full py-3 bg-slate-950/50 focus:bg-slate-950"
                                placeholder="Enter your registered email"
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={status === 'submitting'}
                            className="w-full btn-primary py-4 text-sm font-black uppercase tracking-widest shadow-lg shadow-indigo-500/20 group relative overflow-hidden bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500"
                        >
                            <span className="relative z-10 flex items-center justify-center gap-2">
                                {status === 'submitting' ? 'Sending Link...' : 'Send Reset Link'}
                            </span>
                        </button>

                        <div className="text-center">
                            <Link to="/login" className="text-gray-500 text-sm hover:text-white transition-colors">
                                ← Back to Login
                            </Link>
                        </div>
                    </form>
                )}
            </div>
        </div>
    );
};
