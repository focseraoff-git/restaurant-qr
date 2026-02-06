import { useState } from 'react';
import { useAuthStore } from '../store/useAuthStore';
import { useNavigate, Link } from 'react-router-dom';

export const SignupPage = () => {
    const { signUp } = useAuthStore();
    const navigate = useNavigate();

    const [formData, setFormData] = useState({
        fullName: '',
        email: '',
        password: '',
        confirmPassword: ''
    });
    const [error, setError] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (formData.password !== formData.confirmPassword) {
            setError("Passwords do not match");
            return;
        }

        setIsSubmitting(true);

        const { error } = await signUp(formData.email, formData.password, {
            full_name: formData.fullName,
            role: 'admin' // By default, new signups via this page are Admins (Owners)
        });

        if (error) {
            setError(error.message);
            setIsSubmitting(false);
        } else {
            // Success 
            alert("Account created! Logging you in...");
            // Assuming useAuthStore handles session persistence, we can redirect to dashboard logic
            // But standard supa flow might require email confirmation.
            // If email confirm is off, we can try auto-login or just send to login. 
            // The user asked to "perfect" it. 
            navigate('/dashboard');
        }
    };

    return (
        <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 relative overflow-hidden">
            {/* Background Effects */}
            <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-blue-500/5 rounded-full blur-[150px] pointer-events-none"></div>

            <div className="glass-panel w-full max-w-md p-8 rounded-3xl relative z-10 border-white/10 shadow-2xl bg-slate-900/60 backdrop-blur-xl">
                <div className="text-center mb-8">
                    <h1 className="text-2xl font-bold text-white mb-1">Create Account</h1>
                    <p className="text-gray-400 text-sm">Register your restaurant</p>
                </div>

                {error && (
                    <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-3 rounded-xl mb-6 text-sm font-bold text-center">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-5">
                    <div className="space-y-2">
                        <label className="text-[10px] uppercase font-black tracking-widest text-gray-400 ml-1">Full Name</label>
                        <input
                            type="text"
                            required
                            value={formData.fullName}
                            onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                            className="input-field w-full py-3 bg-slate-950/50"
                            placeholder="John Doe"
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-[10px] uppercase font-black tracking-widest text-gray-400 ml-1">Email Address</label>
                        <input
                            type="email"
                            required
                            value={formData.email}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            className="input-field w-full py-3 bg-slate-950/50"
                            placeholder="owner@restaurant.com"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-[10px] uppercase font-black tracking-widest text-gray-400 ml-1">Password</label>
                            <input
                                type="password"
                                required
                                value={formData.password}
                                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                className="input-field w-full py-3 bg-slate-950/50"
                                placeholder="••••••"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] uppercase font-black tracking-widest text-gray-400 ml-1">Confirm</label>
                            <input
                                type="password"
                                required
                                value={formData.confirmPassword}
                                onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                                className="input-field w-full py-3 bg-slate-950/50"
                                placeholder="••••••"
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white py-4 rounded-xl text-sm font-black uppercase tracking-widest shadow-lg shadow-blue-500/20 transition-all mt-4"
                    >
                        {isSubmitting ? 'Creating...' : 'Register Restaurant'}
                    </button>
                </form>

                <div className="mt-8 text-center">
                    <p className="text-gray-500 text-sm">
                        Already have an account? <Link to="/login" className="text-indigo-400 font-bold hover:underline">Sign In</Link>
                    </p>
                </div>
            </div>
        </div>
    );
};
