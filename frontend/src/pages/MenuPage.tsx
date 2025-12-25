import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
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
    const [categories, setCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchParams] = useSearchParams();

    // In real app, we get rid from URL or local storage
    // For MVP, we fetch the first restaurant if not in params? 
    // Or we hardcode a known ID for testing if needed.
    // Let's assume we pass ?restaurantId=... or we fetch logic.
    // For now, let's try to fetch all restaurants and pick first if no ID.

    // Actually, `backend/routes/menu.routes.js` requires `:restaurantId`.
    // I need an ID. 
    // I'll fetch the restaurant ID first OR ask user to provide it.
    // I'll add a helper to fetch restaurant details.

    // cart is unused here
    const { addToCart, restaurantId, setRestaurantId, setTableId } = useStore();

    const fetchMenu = async (rId: string) => {
        try {
            const res = await api.get(`/menu/${rId}`);
            setCategories(res.data);
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
        // If we have an ID from store or URL
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

    if (loading) return <div>Loading Menu...</div>;
    if (!restaurantId && categories.length === 0) return <div>Please Scan QR Code first.</div>;

    return (
        <div className="pb-24 pt-4">
            <header className="mb-8 px-2 flex justify-between items-end">
                <div>
                    <h2 className="text-3xl font-display font-bold text-gray-900 leading-tight">
                        Our <span className="text-primary-600">Menu</span>
                    </h2>
                    <p className="text-gray-500 mt-1">Authentic flavors, crafted with love.</p>
                </div>
                <button onClick={() => window.location.href = '/bill'} className="text-xs font-bold text-primary-600 bg-primary-50 px-3 py-1 rounded-full">
                    View Bill
                </button>
            </header>

            {categories.map(cat => (
                <div key={cat.id} className="mb-10">
                    <h3 className="text-xl font-bold mb-4 text-gray-800 px-2 flex items-center gap-3">
                        {cat.name}
                        <span className="h-px bg-gray-200 flex-grow"></span>
                    </h3>
                    <div className="grid gap-4 px-2">
                        {cat.menu_items.map(item => (
                            <div key={item.id} className="glass-panel rounded-2xl p-4 flex gap-4 transition-transform hover:scale-[1.01] active:scale-[0.99]">
                                {/* Placeholder Image if no image logic yet, or nice styling for text-only */}
                                <div className="flex-1">
                                    <div className="flex items-start justify-between">
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className={`w-4 h-4 border flex items-center justify-center rounded-sm ${item.is_veg ? 'border-green-600' : 'border-red-600'}`}>
                                                <span className={`w-2 h-2 rounded-full ${item.is_veg ? 'bg-green-600' : 'bg-red-600'}`}></span>
                                            </span>
                                            <h4 className="font-display font-bold text-lg text-gray-900 leading-snug">{item.name}</h4>
                                        </div>
                                    </div>

                                    <p className="text-gray-500 text-sm leading-relaxed mb-3 line-clamp-2">{item.description}</p>

                                    <div className="flex items-end justify-between">
                                        <p className="font-bold text-xl text-gray-900">₹{item.price_full}</p>
                                        <button
                                            onClick={() => addToCart({
                                                id: item.id,
                                                name: item.name,
                                                price: item.price_full,
                                                quantity: 1,
                                                portion: 'full'
                                            })}
                                            className="bg-primary-50 text-primary-600 px-5 py-2.5 rounded-xl font-bold text-sm hover:bg-primary-600 hover:text-white transition-colors shadow-sm"
                                        >
                                            ADD
                                        </button>
                                    </div>
                                </div>
                                {item.image && (
                                    <div className="w-24 h-24 bg-gray-100 rounded-xl overflow-hidden flex-shrink-0">
                                        <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            ))}
        </div>
    );
};
