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

    return (
        <div className="bg-gray-50 min-h-screen pb-32">
            {/* Cinematic Header */}
            <div className="relative h-48 bg-gray-900 overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-t from-gray-900 to-transparent z-10"></div>
                {/* Abstract or Restaurant Image Background */}
                <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1514362545857-3bc16549766b?auto=format&fit=crop&q=80')] bg-cover bg-center opacity-40 animate-pan-slow"></div>

                <div className="absolute bottom-0 left-0 p-6 z-20 w-full">
                    <h2 className="text-4xl font-display font-bold text-white mb-1 shadow-sm">
                        Our Menu
                    </h2>
                    <p className="text-gray-300 text-sm font-light tracking-wide">Handcrafted dishes for you.</p>
                </div>

                {/* Bill Button (Top Right) */}
                <button
                    onClick={() => navigate('/bill')}
                    className="absolute top-4 right-4 z-30 bg-white/10 backdrop-blur-md border border-white/20 text-white px-4 py-2 rounded-full text-xs font-bold hover:bg-white/20 transition-all flex items-center gap-2"
                >
                    <span>📜</span> View Bill
                </button>
            </div>

            {/* Sticky Categories */}
            <div className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-gray-100 shadow-sm pt-4 pb-2">
                <div className="flex overflow-x-auto no-scrollbar gap-4 px-6 pb-2">
                    {categories.map(cat => (
                        <button
                            key={cat.id}
                            onClick={() => scrollToCategory(cat.id)}
                            className={`whitespace-nowrap px-5 py-2 rounded-full text-sm font-bold transition-all transform duration-300
                                ${activeCategory === cat.id
                                    ? 'bg-gray-900 text-white shadow-lg scale-105'
                                    : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}
                        >
                            {cat.name}
                        </button>
                    ))}
                </div>
            </div>

            {/* Menu Items */}
            <div className="px-4 pt-6 space-y-12">
                {categories.map(cat => (
                    <div
                        key={cat.id}
                        id={cat.id}
                        ref={el => categoryRefs.current[cat.id] = el}
                        className="scroll-mt-40"
                    >
                        <div className="flex items-center gap-4 mb-6">
                            <h3 className="text-2xl font-display font-bold text-gray-800">{cat.name}</h3>
                            <div className="h-px bg-gray-200 flex-grow"></div>
                        </div>

                        <div className="grid gap-6">
                            {cat.menu_items.map(item => (
                                <div key={item.id} className="group bg-white rounded-3xl p-4 shadow-sm hover:shadow-xl transition-all duration-300 border border-transparent hover:border-gray-100 relative overflow-hidden">
                                    {/* Background Hover Decoration */}
                                    <div className="absolute -right-10 -top-10 w-32 h-32 bg-gray-50 rounded-full blur-2xl group-hover:bg-primary-50 transition-colors opacity-0 group-hover:opacity-100"></div>

                                    <div className="relative z-10 flex gap-4">
                                        <div className="flex-1">
                                            <div className="flex items-top justify-between mb-2">
                                                <div className="flex items-center gap-2">
                                                    <div className={`w-4 h-4 border flex items-center justify-center rounded-sm flex-shrink-0 ${item.is_veg ? 'border-green-600' : 'border-red-600'}`}>
                                                        <div className={`w-2 h-2 rounded-full ${item.is_veg ? 'bg-green-600' : 'bg-red-600'}`}></div>
                                                    </div>
                                                    <h4 className="font-bold text-lg text-gray-900 leading-tight group-hover:text-primary-700 transition-colors">{item.name}</h4>
                                                </div>
                                            </div>

                                            <p className="text-gray-500 text-sm leading-relaxed mb-4 line-clamp-2">{item.description}</p>

                                            <div className="flex items-center justify-between mt-auto">
                                                <span className="font-display font-bold text-xl text-gray-900">₹{item.price_full}</span>
                                                <button
                                                    onClick={() => {
                                                        addToCart({
                                                            id: item.id,
                                                            name: item.name,
                                                            price: item.price_full,
                                                            quantity: 1,
                                                            portion: 'full'
                                                        });
                                                        // Haptic feedback logic could go here
                                                    }}
                                                    className="bg-gray-900 text-white px-6 py-2 rounded-xl font-bold text-sm shadow-lg hover:bg-black active:scale-95 transition-all transform"
                                                >
                                                    Add +
                                                </button>
                                            </div>
                                        </div>

                                        {/* Image (Even if simple placeholder, structure supports it) */}
                                        {item.image && (
                                            <div className="w-28 h-28 rounded-2xl overflow-hidden shadow-md flex-shrink-0">
                                                <img src={item.image} alt={item.name} className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-500" />
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>

            {/* Floating Cart Button (If items in cart) */}
            {cartCount > 0 && (
                <div className="fixed bottom-6 left-0 right-0 px-6 z-50 animate-slide-up">
                    <button
                        onClick={() => navigate('/cart')}
                        className="w-full bg-gray-900 text-white p-4 rounded-2xl shadow-2xl flex items-center justify-between border border-gray-800 hover:bg-black transition-colors"
                    >
                        <div className="flex items-center gap-3">
                            <span className="bg-white/20 px-3 py-1 rounded-lg font-bold text-sm">{cartCount} ITEMS</span>
                            <span className="text-gray-300 text-sm">View your cart</span>
                        </div>
                        <span className="font-bold text-lg">Checkout &rarr;</span>
                    </button>
                </div>
            )}
        </div>
    );
};
