import { useState, useEffect } from 'react';

export const Protect = ({ children }: { children: React.ReactNode }) => {
    const [auth, setAuth] = useState(false);
    const [pin, setPin] = useState('');

    useEffect(() => {
        if (sessionStorage.getItem('staff_auth') === 'true') {
            setAuth(true);
        }
    }, []);

    const verify = (e: React.FormEvent) => {
        e.preventDefault();
        if (pin === '1234') {
            sessionStorage.setItem('staff_auth', 'true');
            setAuth(true);
        } else {
            alert('Invalid PIN');
        }
    };

    if (auth) return <>{children}</>;

    return (
        <div className="h-screen flex items-center justify-center bg-gray-900 text-white p-4">
            <form onSubmit={verify} className="bg-gray-800 p-8 rounded-2xl text-center w-full max-w-sm shadow-2xl">
                <h2 className="text-2xl font-bold mb-2">Staff Login</h2>
                <p className="text-gray-400 mb-6">Enter access PIN to continue.</p>

                <input
                    type="password"
                    value={pin}
                    onChange={e => setPin(e.target.value)}
                    className="w-full bg-gray-700 text-white text-center text-4xl p-4 rounded-xl mb-6 tracking-widest outline-none focus:ring-2 focus:ring-primary-500"
                    maxLength={4}
                    placeholder="••••"
                    autoFocus
                />

                <button className="w-full bg-primary-600 hover:bg-primary-500 text-white py-4 rounded-xl font-bold text-lg transition-colors">
                    Access Dashboard
                </button>
            </form>
        </div>
    )
};
