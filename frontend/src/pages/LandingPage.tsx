import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useStore } from '../store/useStore';
import api from '../utils/api';
import { Html5Qrcode } from 'html5-qrcode';

export const LandingPage = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const { setRestaurantId, setTableId, setCustomerName, setOrderType, restaurantId } = useStore();

    const [name, setName] = useState('');
    const [step, setStep] = useState(1); // 1: Name, 2: Order Type
    const [tableNumber, setTableNumber] = useState<string | null>(null);

    useEffect(() => {
        const rId = searchParams.get('restaurantId');
        const tId = searchParams.get('tableId');

        if (rId) setRestaurantId(rId);

        if (tId) {
            // Fetch table details to confirm
            api.get(`/tables/${tId}`).then(res => {
                if (res.data) {
                    setTableId(tId, res.data.table_number);
                    setTableNumber(res.data.table_number);
                }
            }).catch(console.error);
        }
    }, [searchParams, setRestaurantId, setTableId]);

    // QR Scanner Effect
    useEffect(() => {
        if (!restaurantId && !searchParams.get('restaurantId')) {
            const html5QrCode = new Html5Qrcode("reader");

            const startScanner = async () => {
                try {
                    await html5QrCode.start(
                        { facingMode: "environment" },
                        {
                            fps: 10,
                            qrbox: { width: 250, height: 250 }
                        },
                        (decodedText: string) => {
                            try {
                                const url = new URL(decodedText);
                                const rId = url.searchParams.get('restaurantId');
                                if (rId) {
                                    html5QrCode.stop().then(() => {
                                        window.location.href = decodedText;
                                    });
                                }
                            } catch (e) {
                                console.log('Not a URL');
                            }
                        },
                        (_error: any) => {
                            // ignore frame errors
                        }
                    );
                } catch (err) {
                    console.error("Error starting scanner", err);
                }
            };

            startScanner();

            return () => {
                if (html5QrCode.isScanning) {
                    html5QrCode.stop().catch(console.error);
                }
                html5QrCode.clear();
            };
        }
    }, [restaurantId, searchParams]);


    const handleNameSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (name.trim()) {
            setCustomerName(name);
            setStep(2); // Always go to step 2 to let user choose
        }
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
            // We set a dummy UUID or just store the number. Ideally store needs both.
            // For now, we'll just set tableNumber in store mainly for UI.
            // Backend might need a valid UUID if foreign key is enforced, but for now let's reliance on custom logic?
            // Actually, the current "setTableId" takes (id, number).
            // If we don't have an ID, we might have an issue placing order if backend enforces FK.
            // But let's assume for now we just pass the number as reference or finding the table by number is needed?
            // WAIT: The backend order placement usually takes `tableId`.
            // If we only have a number, we can't get the ID easily without an API search.
            // IMPROVEMENT: Just pass the number in a "notes" or handle it loosely. 
            // OR: Modify store to allow table info without ID?
            // Let's stick to simple: Set the number. If needed we can look up table by Number later or just send it as metadata.
            setTableId(null, manualTable); // ID null, but number set
            handleOrderType('dine-in');
        }
    };

    if (showTableInput) {
        return (
            <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                <div className="bg-white rounded-3xl p-6 w-full max-w-sm animate-scale-in">
                    <h3 className="text-2xl font-bold mb-2">Enter Table Number</h3>
                    <p className="text-gray-500 mb-6">Check the sticker on your table.</p>
                    <form onSubmit={submitManualTable}>
                        <input
                            type="number"
                            value={manualTable}
                            onChange={(e) => setManualTable(e.target.value)}
                            placeholder="e.g., 9"
                            className="w-full text-center text-3xl font-bold py-4 rounded-xl bg-gray-50 border-2 border-gray-100 focus:border-primary-500 outline-none mb-6"
                            autoFocus
                        />
                        <div className="flex gap-3">
                            <button
                                type="button"
                                onClick={() => setShowTableInput(false)}
                                className="flex-1 py-3 text-gray-500 font-bold"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={!manualTable}
                                className="flex-1 bg-primary-600 text-white py-3 rounded-xl font-bold shadow-lg disabled:opacity-50"
                            >
                                Start Ordering
                            </button>
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
                <p className="absolute bottom-8 bg-black/50 px-4 py-2 rounded-full text-sm font-medium backdrop-blur-md">
                    Scan Restaurant QR Code header
                </p>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-white flex flex-col items-center justify-center p-6 relative overflow-hidden">
            {/* Background Decorations */}
            <div className="absolute top-0 left-0 w-64 h-64 bg-primary-100 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2 opacity-50"></div>
            <div className="absolute bottom-0 right-0 w-96 h-96 bg-orange-100 rounded-full blur-3xl translate-x-1/3 translate-y-1/3 opacity-50"></div>

            <div className="relative z-10 w-full max-w-md">
                <div className="text-center mb-12">
                    {/* Logo Placeholder */}
                    <div className="w-20 h-20 bg-primary-500 rounded-2xl mx-auto mb-6 flex items-center justify-center shadow-lg shadow-primary-200">
                        <span className="text-4xl">🍽️</span>
                    </div>
                    <h1 className="text-4xl font-display font-bold text-gray-900 mb-2">Welcome!</h1>
                    <p className="text-gray-500">Let's get you some delicious food.</p>
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
