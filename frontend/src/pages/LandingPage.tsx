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
        restaurantId, customerName, tableNumber, cart
    } = useStore();

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
            <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                <div className="bg-white rounded-3xl p-6 w-full max-w-sm animate-scale-in">
                    <h3 className="text-2xl font-bold mb-2">Enter Table Number</h3>
                    <p className="text-gray-500 mb-6">Check the sticker on your table.</p>
                    <form onSubmit={submitManualTable}>
                        <input
                            type="text"
                            value={manualTable}
                            onChange={(e) => setManualTable(e.target.value)}
                            placeholder="e.g., 9"
                            className="w-full text-center text-3xl font-bold py-4 rounded-xl bg-gray-50 border-2 border-gray-100 focus:border-primary-500 outline-none mb-6"
                            autoFocus
                        />
                        <div className="flex gap-3">
                            <button type="button" onClick={() => setShowTableInput(false)} className="flex-1 py-3 text-gray-500 font-bold">Cancel</button>
                            <button type="submit" disabled={!manualTable} className="flex-1 bg-primary-600 text-white py-3 rounded-xl font-bold shadow-lg disabled:opacity-50">Start Ordering</button>
                        </div>
                    </form>
                </div>
            </div>
        );
    }

    if (!restaurantId && !searchParams.get('restaurantId')) {
        return (
            <div className="fixed inset-0 bg-black text-white flex flex-col items-center justify-center p-4">
                <div id="reader" className="w-full h-full max-w-md overflow-hidden rounded-xl"></div>
                <p className="absolute bottom-8 bg-black/50 px-4 py-2 rounded-full text-sm font-medium backdrop-blur-md">Scanning...</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-white flex flex-col items-center justify-center p-6 relative overflow-hidden">
            {/* Background Decorations */}
            <div className="absolute top-0 left-0 w-64 h-64 bg-primary-100 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2 opacity-50"></div>
            <div className="absolute bottom-0 right-0 w-96 h-96 bg-orange-100 rounded-full blur-3xl translate-x-1/3 translate-y-1/3 opacity-50"></div>

            {/* Cart Icon */}
            {cart.length > 0 && (
                <button
                    onClick={() => navigate('/cart')}
                    className="absolute top-6 right-6 bg-white p-3 rounded-full shadow-lg border border-gray-100 z-50 animate-bounce-short"
                >
                    <span className="text-2xl">🛒</span>
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold w-5 h-5 flex items-center justify-center rounded-full border-2 border-white">
                        {cart.reduce((sum, i) => sum + i.quantity, 0)}
                    </span>
                </button>
            )}

            <div className="relative z-10 w-full max-w-md">
                <div className="text-center mb-12">
                    {/* Restaurant Branding */}
                    {restaurant ? (
                        <div className="flex flex-col items-center animate-fade-in-up">
                            {restaurant.logo_url ? (
                                <img src={restaurant.logo_url} alt={restaurant.name} className="w-24 h-24 rounded-full object-cover mb-4 shadow-xl border-4 border-white" />
                            ) : (
                                <div className="w-24 h-24 bg-primary-600 rounded-full mb-4 flex items-center justify-center shadow-xl border-4 border-white text-4xl text-white font-bold">
                                    {restaurant.name.charAt(0)}
                                </div>
                            )}
                            <h1 className="text-3xl font-display font-bold text-gray-900 mb-1">{restaurant.name}</h1>
                            <p className="text-gray-500 text-sm">Delicious food awaits!</p>
                        </div>
                    ) : (
                        <div className="animate-pulse">
                            <div className="w-20 h-20 bg-gray-200 rounded-full mx-auto mb-4"></div>
                            <div className="h-8 bg-gray-200 rounded w-3/4 mx-auto mb-2"></div>
                            <div className="h-4 bg-gray-200 rounded w-1/2 mx-auto"></div>
                        </div>
                    )}
                </div>

                {step === 1 && (
                    <form onSubmit={handleNameSubmit} className="space-y-6 animate-fade-in-up">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">What's your name?</label>
                            <input
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="Enter your name..."
                                className="w-full px-6 py-4 rounded-2xl bg-gray-50 border border-gray-100 text-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:bg-white transition-all"
                                autoFocus
                            />
                        </div>
                        <button
                            type="submit"
                            disabled={!name.trim()}
                            className="w-full bg-gray-900 text-white py-4 rounded-2xl font-bold text-lg shadow-xl hover:bg-black disabled:opacity-50 disabled:cursor-not-allowed transition-all transform hover:scale-[1.02] active:scale-[0.98]"
                        >
                            Continue &rarr;
                        </button>
                    </form>
                )}

                {step === 2 && (
                    <div className="space-y-6 animate-fade-in-up">
                        <div className="text-center mb-8">
                            <h2 className="text-2xl font-bold text-gray-900">Hello, {name}! 👋</h2>
                            <p className="text-primary-600 font-medium italic mt-2">"People who love to eat are always the best people."</p>
                            <button onClick={() => { setCustomerName(''); setStep(1); }} className="text-xs text-red-500 font-bold mt-2 hover:underline">Logout / Change Name</button>
                        </div>

                        <div className="grid gap-4">
                            <button
                                onClick={handleDineInClick}
                                className="relative group p-6 rounded-3xl bg-white border-2 border-primary-100 hover:border-primary-500 transition-all text-left shadow-sm hover:shadow-primary-hover"
                            >
                                <div className="flex items-start justify-between mb-2">
                                    <div className="p-3 bg-primary-50 text-2xl rounded-2xl group-hover:bg-primary-500 group-hover:text-white transition-colors">🍲</div>
                                    {tableNumber && (
                                        <div className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-bold">Table {tableNumber}</div>
                                    )}
                                </div>
                                <h3 className="text-xl font-bold text-gray-900">Dine In</h3>
                                <p className="text-sm text-gray-500 mt-1">Order and enjoy your meal at the restaurant.</p>
                            </button>

                            <button
                                onClick={() => handleOrderType('takeaway')}
                                className="relative group p-6 rounded-3xl bg-white border-2 border-gray-100 hover:border-gray-900 transition-all text-left shadow-sm hover:shadow-lg"
                            >
                                <div className="flex items-start justify-between mb-2">
                                    <div className="p-3 bg-gray-50 text-2xl rounded-2xl group-hover:bg-gray-900 group-hover:text-white transition-colors">🥡</div>
                                </div>
                                <h3 className="text-xl font-bold text-gray-900">Takeaway</h3>
                                <p className="text-sm text-gray-500 mt-1">Pack your food and take it with you.</p>
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
