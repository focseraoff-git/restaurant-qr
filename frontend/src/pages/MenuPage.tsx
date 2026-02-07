import { useEffect, useState, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import api from '../utils/api';
import { useStore } from '../store/useStore';

interface MenuItem {
    id: string;
    name: string;
    description: string;
    price_full: number;
    price_half?: number;
    is_veg: boolean;
    image?: string;
}

interface Category {
    id: string;
    name: string;
    menu_items: MenuItem[];
}

export const MenuPage = () => {
    const navigate = useNavigate();
    const [categories, setCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchParams] = useSearchParams();
    const [activeCategory, setActiveCategory] = useState<string>('');
    const categoryRefs = useRef<Record<string, HTMLDivElement | null>>({});

    // Customization State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedItemForCustomization, setSelectedItemForCustomization] = useState<MenuItem | null>(null);
    const [spiceLevel, setSpiceLevel] = useState('Normal');
    const [customNote, setCustomNote] = useState('');

    const { addToCart, restaurantId, setRestaurantId, setTableId, cart } = useStore();

    const fetchMenu = async (rId: string) => {
        try {
            const res = await api.get(`/menu/${rId}`);
            setCategories(res.data);
            if (res.data.length > 0) setActiveCategory(res.data[0].id);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const fetchTable = async (tId: string) => {
        try {
            const res = await api.get(`/tables/${tId}`);
            if (res.data) {
                setTableId(tId, res.data.table_number);
            }
        } catch (err) {
            console.error(err);
        }
    };

    useEffect(() => {
        const idFromUrl = searchParams.get('restaurantId');
        const tableIdFromUrl = searchParams.get('tableId');

        if (idFromUrl) {
            setRestaurantId(idFromUrl);
            fetchMenu(idFromUrl);
        } else if (restaurantId) {
            fetchMenu(restaurantId);
        } else {
            setLoading(false);
        }

        if (tableIdFromUrl) {
            fetchTable(tableIdFromUrl);
        }
    }, [restaurantId, searchParams]);

    const scrollToCategory = (catId: string) => {
        setActiveCategory(catId);
        const element = categoryRefs.current[catId];
        if (element) {
            const yOffset = -180; // Offset for sticky headers
            const y = element.getBoundingClientRect().top + window.pageYOffset + yOffset;
            window.scrollTo({ top: y, behavior: 'smooth' });
        }
    };

    // Intersection Observer for scroll spying to update active category
    useEffect(() => {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    setActiveCategory(entry.target.id);
                }
            });
        }, { rootMargin: '-40% 0px -60% 0px' });

        Object.values(categoryRefs.current).forEach(el => {
            if (el) observer.observe(el);
        });

        return () => observer.disconnect();
    }, [categories]);


    if (loading) return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
            <div className="animate-pulse flex flex-col items-center">
                <div className="h-4 w-32 bg-gray-200 rounded mb-4"></div>
                <div className="h-2 w-24 bg-gray-200 rounded"></div>
            </div>
        </div>
    );

    if (!restaurantId && categories.length === 0) return <div>Please Scan QR Code first.</div>;

    const cartCount = cart.reduce((acc, item) => acc + item.quantity, 0);

    // Reliable Food Image Mapping
    const getFoodImage = (itemName: string) => {
        const lowerName = itemName.toLowerCase();
        if (lowerName.includes('burger')) return 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=400&q=80';
        if (lowerName.includes('pizza')) return 'https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=400&q=80';
        if (lowerName.includes('pasta') || lowerName.includes('spaghetti')) return 'https://images.unsplash.com/photo-1621996346565-e3dbc646d9a9?auto=format&fit=crop&w=400&q=80';
        if (lowerName.includes('salad') || lowerName.includes('veg')) return 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=400&q=80';
        if (lowerName.includes('chicken') || lowerName.includes('grill')) return 'https://images.unsplash.com/photo-1532550907401-a500c9a57435?auto=format&fit=crop&w=400&q=80';
        if (lowerName.includes('briyani') || lowerName.includes('rice')) return 'https://images.unsplash.com/photo-1589302168068-964664d93dc0?auto=format&fit=crop&w=400&q=80';
        if (lowerName.includes('cake') || lowerName.includes('dessert')) return 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?auto=format&fit=crop&w=400&q=80';
        if (lowerName.includes('coffee') || lowerName.includes('tea') || lowerName.includes('drink')) return 'https://images.unsplash.com/photo-1551024709-8f23befc6f87?auto=format&fit=crop&w=400&q=80';

        // Default Premium Fallback (Abstract Dark Food)
        return 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=400&q=80';
    };

    const getCategoryIcon = (catName: string) => {
        const lower = catName.toLowerCase();
        if (lower.includes('special')) return '👨‍🍳';
        if (lower.includes('veg') && !lower.includes('non')) return '🥬';
        if (lower.includes('non')) return '🍗';
        if (lower.includes('main') || lower.includes('course')) return '🍛';
        if (lower.includes('dessert') || lower.includes('sweet')) return '🍰';
        if (lower.includes('bev') || lower.includes('drink')) return '🍹';
        if (lower.includes('starter')) return '🥟';
        if (lower.includes('pizza')) return '🍕';
        if (lower.includes('burger')) return '🍔';
        return '🍽️';
    };

    return (
        <div className="bg-slate-950 min-h-screen pb-32 relative">
            {/* 🌟 Premium Ambient Background */}
            <div className="fixed inset-0 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-indigo-900/20 via-slate-950 to-slate-950 z-0 pointer-events-none"></div>

            {/* Cinematic Header */}
            <div className="relative h-64 overflow-hidden shadow-2xl">
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-900/50 to-transparent z-10"></div>
                {/* Abstract or Restaurant Image Background */}
                <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1552566626-52f8b828add9?auto=format&fit=crop&q=80')] bg-cover bg-center animate-pan-slow opacity-60"></div>
                <div className="absolute inset-0 bg-slate-950/30 backdrop-blur-[2px]"></div>

                <div className="absolute bottom-0 left-0 p-8 z-20 w-full animate-fade-in-up">
                    <h2 className="text-5xl font-display font-bold text-white mb-2 shadow-sm drop-shadow-lg tracking-tight">
                        Our Menu
                    </h2>
                    <div className="flex items-center gap-3">
                        <div className="h-[1px] w-8 bg-emerald-500"></div>
                        <p className="text-gray-200 text-sm font-light tracking-[0.2em] uppercase">Handcrafted Culinary Delights</p>
                    </div>
                </div>

                {/* Bill Button (Top Right) */}
                <button
                    onClick={() => navigate('/bill')}
                    className="absolute top-6 right-6 z-30 bg-black/40 backdrop-blur-xl border border-white/10 text-white px-5 py-2.5 rounded-full text-xs font-bold hover:bg-white/10 hover:border-emerald-500/50 transition-all flex items-center gap-2 group shadow-lg"
                >
                    <span className="group-hover:rotate-12 transition-transform">📜</span> View Bill
                </button>
            </div>

            {/* Premium Sticky Category Slider */}
            <div className="sticky top-16 z-40 bg-slate-950/80 backdrop-blur-xl border-b border-white/5 py-4 shadow-2xl shadow-black/50">
                <div className="relative">
                    {/* Hiding Scrollbar but keeping functionality */}
                    <div className="flex overflow-x-auto no-scrollbar gap-3 px-6 pb-2 items-center scroll-smooth snap-x">
                        {categories.map(cat => (
                            <button
                                key={cat.id}
                                onClick={() => scrollToCategory(cat.id)}
                                className={`flex items-center gap-2 px-6 py-3 rounded-2xl text-sm font-bold transition-all transform duration-300 border snap-center
                                    ${activeCategory === cat.id
                                        ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white border-transparent shadow-lg shadow-emerald-900/50 scale-105'
                                        : 'bg-white/5 text-gray-400 border-white/5 hover:bg-white/10 hover:border-white/10 hover:text-white'}`}
                            >
                                <span className="text-lg filter drop-shadow-md">{getCategoryIcon(cat.name)}</span>
                                <span className="whitespace-nowrap tracking-wide">{cat.name}</span>
                            </button>
                        ))}
                    </div>
                    {/* Fade Edges for Scroll Implied */}
                    <div className="absolute inset-y-0 right-0 w-12 bg-gradient-to-l from-slate-950 to-transparent pointer-events-none"></div>
                    <div className="absolute inset-y-0 left-0 w-8 bg-gradient-to-r from-slate-950 to-transparent pointer-events-none"></div>
                </div>
            </div>

            {/* Menu Items */}
            <div className="px-4 pt-8 space-y-16 relative z-10">
                {categories.map((cat, idx) => (
                    <div
                        key={cat.id}
                        id={cat.id}
                        ref={(el) => { if (el) categoryRefs.current[cat.id] = el; }}
                        className="scroll-mt-48 transition-opacity duration-700"
                        style={{ animationDelay: `${idx * 100}ms` }}
                    >
                        <div className="flex items-end gap-6 mb-8 relative">
                            <h3 className="text-3xl font-display font-bold text-transparent bg-clip-text bg-gradient-to-r from-emerald-200 to-teal-100 pl-2">{cat.name}</h3>
                            <div className="h-px bg-gradient-to-r from-white/20 to-transparent flex-grow mb-2"></div>
                            <div className="absolute -left-2 top-0 bottom-0 w-1 bg-gradient-to-b from-emerald-500 to-transparent rounded-full opacity-50"></div>
                        </div>

                        <div className="grid gap-6">
                            {cat.menu_items.map(item => (
                                <div key={item.id} className="group bg-slate-900/50 backdrop-blur-sm rounded-[2rem] p-4 shadow-xl border border-white/5 hover:bg-slate-800/60 hover:border-white/10 transition-all duration-500 relative overflow-hidden">
                                    {/* Selection Highlight */}
                                    <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"></div>

                                    <div className="relative z-10 flex gap-5">
                                        {/* Image - Left Side for Layout Balance */}
                                        <div className="w-32 h-32 rounded-2xl overflow-hidden shadow-2xl flex-shrink-0 relative">
                                            <div className="absolute inset-0 bg-gradient-to-tr from-black/40 to-transparent z-10"></div>
                                            <img
                                                src={item.image || getFoodImage(item.name)}
                                                alt={item.name}
                                                className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-700"
                                            />
                                            {/* Veg/Non-Veg Badge on Image */}
                                            <div className="absolute top-2 left-2 z-20 bg-black/60 backdrop-blur-md p-1 rounded-full border border-white/10">
                                                <div className={`w-3 h-3 rounded-full border-[1.5px] flex items-center justify-center ${item.is_veg ? 'border-green-500' : 'border-red-500'}`}>
                                                    <div className={`w-1.5 h-1.5 rounded-full ${item.is_veg ? 'bg-green-500' : 'bg-red-500'}`}></div>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex-1 flex flex-col">
                                            <div className="mb-2">
                                                <h4 className="font-bold text-xl text-gray-100 leading-tight group-hover:text-emerald-300 transition-colors mb-2 font-display">{item.name}</h4>
                                                <p className="text-gray-400 text-xs leading-relaxed line-clamp-2 font-light tracking-wide">{item.description}</p>
                                            </div>

                                            <div className="flex items-center justify-between mt-auto pt-4 border-t border-white/5">
                                                <div className="flex flex-col">
                                                    <span className="text-[10px] text-gray-500 uppercase tracking-wider font-bold">Price</span>
                                                    <span className="font-display font-bold text-xl text-white">₹{item.price_full}</span>
                                                </div>
                                                <button
                                                    onClick={() => {
                                                        setSelectedItemForCustomization(item);
                                                        setSpiceLevel('Normal'); // Default
                                                        setCustomNote('');
                                                        setIsModalOpen(true);
                                                    }}
                                                    className="bg-white text-slate-950 px-5 py-2.5 rounded-xl font-bold text-sm shadow-lg hover:bg-emerald-400 transition-all transform active:scale-95 group-hover:shadow-emerald-500/20"
                                                >
                                                    Add <span className="ml-1">+</span>
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>

            {/* Floating Cart Button */}
            {cartCount > 0 && (
                <div className="fixed bottom-6 left-0 right-0 px-6 z-50 animate-slide-up pb-safe">
                    <button
                        onClick={() => navigate('/cart')}
                        className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 text-white p-1 rounded-2xl shadow-2xl shadow-emerald-900/80 hover:shadow-emerald-500/30 transition-shadow group"
                    >
                        <div className="bg-slate-900/90 backdrop-blur-sm rounded-xl p-4 flex items-center justify-between border border-emerald-500/20 group-hover:bg-slate-900/80 transition-colors">
                            <div className="flex items-center gap-4">
                                <div className="bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 px-3 py-1.5 rounded-lg font-bold text-sm backdrop-blur-md shadow-inner">
                                    {cartCount} ITEMS
                                </div>
                                <span className="text-gray-300 text-sm tracking-wide font-medium">View Cart</span>
                            </div>
                            <div className="flex items-center gap-2 pr-2">
                                <span className="font-bold text-lg font-display text-white group-hover:text-emerald-400 transition-colors">Checkout</span>
                                <span className="bg-white text-emerald-600 rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold group-hover:translate-x-1 transition-transform">→</span>
                            </div>
                        </div>
                    </button>
                </div>
            )}
            {/* Customization Modal */}
            {
                isModalOpen && selectedItemForCustomization && (
                    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 sm:p-6 animate-fade-in">
                        <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm transition-opacity" onClick={() => setIsModalOpen(false)}></div>
                        <div className="relative bg-slate-900 border border-white/10 w-full max-w-md rounded-3xl p-6 shadow-2xl animate-slide-up transform transition-all">
                            <div className="flex justify-between items-start mb-6">
                                <div>
                                    <h3 className="text-2xl font-display font-bold text-white mb-1">{selectedItemForCustomization.name}</h3>
                                    <p className="text-emerald-400 font-bold">₹{selectedItemForCustomization.price_full}</p>
                                </div>
                                <button onClick={() => setIsModalOpen(false)} className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-white hover:bg-white/20">✕</button>
                            </div>

                            <div className="space-y-6">
                                {/* Spice Level */}
                                <div>
                                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Spice Level</label>
                                    <div className="grid grid-cols-4 gap-2">
                                        {['Mild', 'Normal', 'Spicy', 'Extra'].map((level) => (
                                            <button
                                                key={level}
                                                onClick={() => setSpiceLevel(level)}
                                                className={`py-2 rounded-xl text-xs font-bold transition-all border ${spiceLevel === level
                                                    ? 'bg-emerald-500 text-white border-emerald-500 shadow-lg shadow-emerald-900/50'
                                                    : 'bg-slate-800 text-gray-400 border-white/5 hover:bg-slate-700'
                                                    }`}
                                            >
                                                {level === 'Extra' ? '🔥 Extra' : level}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Custom Note */}
                                <div>
                                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Special Requests</label>
                                    <textarea
                                        value={customNote}
                                        onChange={(e) => setCustomNote(e.target.value)}
                                        placeholder="e.g. No onions, extra sauce..."
                                        className="w-full bg-slate-950 border border-white/10 rounded-xl p-4 text-white placeholder-gray-600 focus:border-emerald-500 focus:outline-none transition-colors h-24 resize-none text-sm"
                                    />
                                </div>

                                {/* Action Buttons */}
                                <button
                                    onClick={() => {
                                        const tasteProfile = [];
                                        if (spiceLevel !== 'Normal') tasteProfile.push(spiceLevel);
                                        if (customNote.trim()) tasteProfile.push(customNote.trim());

                                        addToCart({
                                            id: selectedItemForCustomization.id!.toString(), // Ensure ID string
                                            name: selectedItemForCustomization!.name,
                                            price: selectedItemForCustomization!.price_full,
                                            quantity: 1,
                                            portion: 'full',
                                            taste: tasteProfile.length > 0 ? tasteProfile.join(' | ') : undefined
                                        });
                                        setIsModalOpen(false);
                                    }}
                                    className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 text-white py-4 rounded-xl font-bold shadow-lg shadow-emerald-900/50 hover:shadow-emerald-500/30 transition-all transform active:scale-95 flex items-center justify-center gap-2"
                                >
                                    <span>Add to Cart</span>
                                    <span>₹{selectedItemForCustomization.price_full}</span>
                                </button>
                            </div>
                        </div>
                    </div>
                )
            }
        </div >
    );
};
