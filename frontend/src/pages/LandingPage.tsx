import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useStore } from '../store/useStore';
import api from '../utils/api';
import { Html5Qrcode } from 'html5-qrcode';

export const LandingPage = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const {
        setRestaurantId, setTableId, setCustomerName, setOrderType,
        restaurantId, customerName, tableNumber, cart, resetStore
    } = useStore();

    // Force reset if visiting Home without specific Restaurant ID (Scan Mode)
    useEffect(() => {
        if (!searchParams.get('restaurantId')) {
            resetStore();
        }
    }, [searchParams, resetStore]);

    const [name, setName] = useState('');
    const [step, setStep] = useState(1); // 1: Name, 2: Order Type

    // UI State
    const [restaurant, setRestaurant] = useState<any>(null);

    useEffect(() => {
        const rId = searchParams.get('restaurantId') || restaurantId;
        const tId = searchParams.get('tableId');

        if (rId) {
            setRestaurantId(rId);
            // Fetch Restaurant Info
            api.get(`/restaurants/${rId}`).then(res => {
                setRestaurant(res.data);
            }).catch(console.error);
        }

        if (tId) {
            api.get(`/tables/${tId}`).then(res => {
                if (res.data) {
                    setTableId(tId, res.data.table_number);
                }
            }).catch(console.error);
        }
    }, [searchParams, restaurantId]);

    // Auto-Skip to Step 2 if name exists (Persistence)
    useEffect(() => {
        if (customerName) {
            setName(customerName);
            setStep(2);
        }
    }, [customerName]);

    // QR Mobile Scanner Logic (unchanged from previous step, but re-included here)
    useEffect(() => {
        if (!restaurantId && !searchParams.get('restaurantId')) {
            const html5QrCode = new Html5Qrcode("reader");
            const startScanner = async () => {
                try {
                    await html5QrCode.start(
                        { facingMode: "environment" },
                        { fps: 10, qrbox: { width: 250, height: 250 } },
                        (decodedText: string) => {
                            try {
                                const url = new URL(decodedText);
                                const rId = url.searchParams.get('restaurantId');
                                if (rId) {
                                    html5QrCode.stop().then(() => {
                                        window.location.href = decodedText;
                                    });
                                }
                            } catch (e) { console.log('Not a URL'); }
                        },
                        (_error: any) => { }
                    );
                } catch (err) { console.error("Error starting scanner", err); }
            };
            startScanner();
            return () => {
                if (html5QrCode.isScanning) { html5QrCode.stop().catch(console.error); }
                html5QrCode.clear();
            };
        }
    }, [restaurantId, searchParams]);

    const handleNameSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (name.trim()) {
            setCustomerName(name);
            setStep(2);
        }
    };

    const handleOrderType = (type: 'dine-in' | 'takeaway') => {
        setOrderType(type);
        navigate('/menu');
    };

    const [showTableInput, setShowTableInput] = useState(false);
    const [manualTable, setManualTable] = useState('');

    const handleDineInClick = () => {
        if (tableNumber) {
            handleOrderType('dine-in');
        } else {
            setShowTableInput(true);
        }
    };

    const submitManualTable = (e: React.FormEvent) => {
        e.preventDefault();
        if (manualTable.trim()) {
            setTableId('manual', manualTable);
            handleOrderType('dine-in');
        }
    };

    // Manual Table Input Modal
    if (showTableInput) {
        return (
            <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
                <div className="glass-panel rounded-3xl p-8 w-full max-w-sm animate-scale-in border border-white/10">
                    <h3 className="text-3xl font-display font-bold mb-2 text-white text-center">Enter Table</h3>
                    <p className="text-gray-400 mb-8 text-center text-sm">Find the number on your table sticker.</p>
                    <form onSubmit={submitManualTable}>
                        <div className="relative mb-8">
                            <input
                                type="text"
                                value={manualTable}
                                onChange={(e) => setManualTable(e.target.value)}
                                placeholder="09"
                                className="w-full text-center text-5xl font-display font-bold py-6 rounded-2xl bg-black/30 border-2 border-white/10 focus:border-emerald-500/50 outline-none text-white placeholder-white/10 transition-all font-mono tracking-widest"
                                autoFocus
                            />
                            {manualTable && <div className="absolute top-1/2 right-4 -translate-y-1/2 text-emerald-400 animate-pulse">✓</div>}
                        </div>
                        <div className="flex gap-4">
                            <button type="button" onClick={() => setShowTableInput(false)} className="flex-1 py-4 text-gray-400 font-bold hover:text-white transition-colors">Cancel</button>
                            <button type="submit" disabled={!manualTable} className="flex-1 btn-primary text-white py-4 rounded-xl font-bold shadow-lg shadow-emerald-500/20 disabled:opacity-50 disabled:shadow-none">Confirm</button>
                        </div>
                    </form>
                </div>
            </div>
        );
    }

    if (!restaurantId && !searchParams.get('restaurantId')) {
        return (
            <div className="fixed inset-0 bg-slate-950 flex flex-col items-center justify-center p-4 overflow-hidden">
                {/* Cinematic Background */}
                <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?q=80&w=2070&auto=format&fit=crop')] bg-cover bg-center opacity-20 blur-sm"></div>
                <div className="absolute inset-0 bg-gradient-to-b from-slate-950 via-slate-950/80 to-slate-950"></div>

                <div className="relative z-10 flex flex-col items-center animate-fade-in-down w-full max-w-md">
                    <div className="mb-8 p-4 rounded-full border border-white/10 bg-white/5 backdrop-blur-md shadow-2xl animate-float">
                        <span className="text-4xl">📱</span>
                    </div>

                    <h1 className="text-5xl font-display font-bold mb-4 text-transparent bg-clip-text bg-gradient-to-r from-emerald-200 via-white to-emerald-200 drop-shadow-lg text-center leading-tight">
                        Scan to<br />Dine
                    </h1>
                    <p className="text-gray-400 tracking-[0.2em] text-xs uppercase font-bold mb-12 text-center">Premium Contactless Experience</p>

                    <div id="reader" className="w-72 h-72 overflow-hidden rounded-[2.5rem] border-4 border-white/10 shadow-2xl relative shadow-glow-emerald">
                        <div className="absolute inset-0 border-[40px] border-slate-950/50 pointer-events-none z-10 rounded-[2.5rem] backdrop-blur-[2px]"></div>
                        {/* Scanning Line */}
                        <div className="absolute top-0 left-0 w-full h-1 bg-emerald-400/80 shadow-[0_0_20px_rgba(52,211,153,0.8)] z-20 animate-[scan_2s_ease-in-out_infinite]"></div>
                    </div>

                    <p className="mt-12 bg-white/5 px-8 py-4 rounded-full text-xs font-bold text-gray-300 backdrop-blur-md border border-white/5 flex items-center gap-3">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                        Align QR Code within frame
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 relative overflow-hidden">
            {/* 🌟 Premium Ambient Background */}
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900 via-slate-950 to-slate-950 z-0"></div>
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[500px] bg-emerald-500/10 rounded-full blur-[100px] pointer-events-none"></div>
            <div className="absolute bottom-0 right-0 w-96 h-96 bg-amber-500/5 rounded-full blur-[80px] pointer-events-none"></div>

            {/* Cart Floating Action Button */}
            {cart.length > 0 && (
                <button
                    onClick={() => navigate('/cart')}
                    className="fixed top-6 right-6 bg-white/10 backdrop-blur-xl p-4 rounded-full shadow-2xl border border-white/20 z-50 transition-all hover:scale-110 active:scale-95 group hover:bg-white/20 hover:border-white/30"
                >
                    <span className="text-2xl group-hover:rotate-12 transition-transform block filter drop-shadow hover:drop-shadow-lg">🛒</span>
                    <span className="absolute -top-1 -right-1 bg-gradient-to-r from-emerald-500 to-teal-400 text-white text-xs font-bold w-6 h-6 flex items-center justify-center rounded-full border-2 border-slate-900 shadow-lg">
                        {cart.reduce((sum, i) => sum + i.quantity, 0)}
                    </span>
                </button>
            )}

            {/* Main Content */}
            <div className="relative z-10 w-full max-w-lg">
                <div className={`transition-all duration-700 ease-out transform ${step ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}>

                    {/* Brand Header */}
                    <div className="text-center mb-12">
                        {restaurant ? (
                            <div className="flex flex-col items-center">
                                {restaurant.logo_url ? (
                                    <div className="relative group mb-8">
                                        <div className="absolute inset-0 bg-gradient-to-tr from-emerald-500 to-amber-500 rounded-full blur-xl opacity-20 group-hover:opacity-40 transition-duration-700"></div>
                                        <img src={restaurant.logo_url} alt={restaurant.name} className="relative w-32 h-32 rounded-full object-cover shadow-2xl border-4 border-white/10" />
                                    </div>
                                ) : (
                                    <div className="w-32 h-32 bg-gradient-to-br from-slate-800 to-slate-900 rounded-full flex items-center justify-center shadow-2xl border-4 border-white/10 text-6xl text-transparent bg-clip-text bg-gradient-to-br from-white to-gray-400 font-display font-bold mb-8 relative overflow-hidden">
                                        <div className="absolute inset-0 bg-white/5 animate-pulse"></div>
                                        {restaurant.name.charAt(0)}
                                    </div>
                                )}
                                <h1 className="text-5xl font-display font-bold text-white tracking-tight leading-tight mb-4 drop-shadow-xl">{restaurant.name}</h1>

                                <div className="flex items-center gap-4">
                                    <div className="h-[1px] w-8 bg-gradient-to-r from-transparent to-white/20"></div>
                                    <p className="text-amber-200/80 uppercase tracking-[0.3em] text-[10px] font-bold">Premium Dining</p>
                                    <div className="h-[1px] w-8 bg-gradient-to-l from-transparent to-white/20"></div>
                                </div>
                            </div>
                        ) : (
                            <div className="animate-pulse flex flex-col items-center space-y-4">
                                <div className="w-32 h-32 bg-white/5 rounded-full"></div>
                                <div className="h-4 bg-white/5 w-48 rounded"></div>
                            </div>
                        )}
                    </div>

                    {/* Step 1: Name Input - Glass Card */}
                    {step === 1 && (
                        <div className="glass-panel rounded-[2.5rem] p-10 animate-slide-up">
                            <form onSubmit={handleNameSubmit} className="space-y-10">
                                <div className="space-y-2 text-center">
                                    <label className="block text-xs font-bold text-emerald-400 uppercase tracking-widest">Welcome Guest</label>
                                    <h2 className="text-3xl font-display font-medium text-white">Who are we serving?</h2>
                                </div>

                                <div className="relative group">
                                    <input
                                        type="text"
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        placeholder="Your Name"
                                        className="w-full text-center py-4 bg-transparent border-b border-white/20 text-4xl font-display text-white placeholder-white/20 focus:outline-none focus:border-emerald-500 transition-all"
                                        autoFocus
                                    />
                                </div>

                                <button
                                    type="submit"
                                    disabled={!name.trim()}
                                    className="w-full group relative overflow-hidden btn-primary text-white p-5 rounded-2xl font-bold text-lg shadow-2xl transition-all disabled:opacity-50 disabled:shadow-none"
                                >
                                    <span className="relative z-10 flex items-center justify-center gap-3">
                                        Begin Experience <span className="group-hover:translate-x-1 transition-transform">→</span>
                                    </span>
                                </button>
                            </form>
                        </div>
                    )}

                    {/* Step 2: Selection - Glass Cards */}
                    {step === 2 && (
                        <div className="space-y-6 animate-fade-in-up">
                            <div className="text-center mb-8">
                                <h2 className="text-3xl font-display font-bold text-white mb-2">Good Evening, <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-200 to-teal-200">{name}</span></h2>
                                <p className="text-gray-400 text-sm font-light">How would you like to dine with us?</p>
                            </div>

                            <div className="grid gap-5">
                                {/* Dine In Card */}
                                <button
                                    onClick={handleDineInClick}
                                    className="relative group overflow-hidden bg-white/5 border border-white/10 p-8 rounded-[2rem] hover:bg-white/10 transition-all duration-500 text-left hover:border-emerald-500/30 hover:shadow-glow-emerald"
                                >
                                    <div className="absolute top-0 right-0 w-48 h-48 bg-emerald-500/10 rounded-full blur-3xl group-hover:bg-emerald-500/20 transition-all duration-700 -mr-12 -mt-12"></div>

                                    <div className="relative z-10 flex items-center justify-between">
                                        <div>
                                            <div className="flex items-center gap-3 mb-3">
                                                <h3 className="text-2xl font-display font-bold text-white group-hover:text-emerald-300 transition-colors">Dine In</h3>
                                                {tableNumber && (
                                                    <span className="bg-emerald-500/20 text-emerald-300 px-3 py-1 rounded-full text-[10px] font-bold border border-emerald-500/20 uppercase tracking-widest">
                                                        Table {tableNumber}
                                                    </span>
                                                )}
                                            </div>
                                            <p className="text-gray-400 text-sm leading-relaxed max-w-[200px]">Experience our ambiance and hospitality at your table.</p>
                                        </div>
                                        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-white/10 to-transparent border border-white/10 flex items-center justify-center text-3xl group-hover:scale-110 group-hover:rotate-6 transition-all shadow-xl">
                                            🍽️
                                        </div>
                                    </div>
                                </button>

                                {/* Takeaway Card */}
                                <button
                                    onClick={() => handleOrderType('takeaway')}
                                    className="relative group overflow-hidden bg-white/5 border border-white/10 p-8 rounded-[2rem] hover:bg-white/10 transition-all duration-500 text-left hover:border-amber-500/30 hover:shadow-glow-gold"
                                >
                                    <div className="absolute top-0 right-0 w-48 h-48 bg-amber-500/10 rounded-full blur-3xl group-hover:bg-amber-500/20 transition-all duration-700 -mr-12 -mt-12"></div>

                                    <div className="relative z-10 flex items-center justify-between">
                                        <div>
                                            <div className="flex items-center gap-3 mb-3">
                                                <h3 className="text-2xl font-display font-bold text-white group-hover:text-amber-200 transition-colors">Takeaway</h3>
                                                <span className="bg-amber-500/20 text-amber-300 px-3 py-1 rounded-full text-[10px] font-bold border border-amber-500/20 uppercase tracking-widest">
                                                    To Go
                                                </span>
                                            </div>
                                            <p className="text-gray-400 text-sm leading-relaxed max-w-[200px]">Expertly packed meals to enjoy wherever you are.</p>
                                        </div>
                                        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-white/10 to-transparent border border-white/10 flex items-center justify-center text-3xl group-hover:scale-110 group-hover:-rotate-6 transition-all shadow-xl">
                                            🛍️
                                        </div>
                                    </div>
                                </button>
                            </div>

                            <button
                                onClick={() => { setCustomerName(''); setStep(1); }}
                                className="w-full text-center text-[10px] font-bold text-white/30 hover:text-white/60 uppercase tracking-[0.2em] mt-8 transition-colors"
                            >
                                Not {name}? Switch Account
                            </button>
                        </div>
                    )}
                </div>
            </div>
            {/* Footer */}
            <div className="absolute bottom-6 text-center w-full pointer-events-none opacity-30">
                <p className="text-[10px] uppercase tracking-[0.3em] font-light text-white">Powered by Focsera</p>
            </div>
        </div>
    );
};
