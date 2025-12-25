import { create } from 'zustand';

interface CartItem {
    id: string; // menu_item_id
    name: string;
    price: number;
    quantity: number;
    portion: 'half' | 'full';
    taste?: string;
}

interface AppState {
    tableId: string | null;
    tableNumber: string | null;
    restaurantId: string | null;
    customerName: string | null; // Added customerName
    orderType: 'dine-in' | 'takeaway' | null;
    cart: CartItem[];

    setTableId: (id: string, number?: string) => void;
    setRestaurantId: (id: string) => void;
    setCustomerName: (name: string) => void; // Added setter
    setOrderType: (type: 'dine-in' | 'takeaway') => void;

    addToCart: (item: CartItem) => void;
    removeFromCart: (itemId: string, portion: string) => void;
    updateQuantity: (itemId: string, portion: string, delta: number) => void;
    clearCart: () => void;
}

export const useStore = create<AppState>((set) => ({
    tableId: null,
    tableNumber: null,
    restaurantId: null,
    customerName: null,
    orderType: null,
    cart: [],

    setTableId: (id, number) => set({ tableId: id, tableNumber: number || null }),
    setRestaurantId: (id) => set({ restaurantId: id }),
    setCustomerName: (name) => set({ customerName: name }),
    setOrderType: (type) => set({ orderType: type }),

    addToCart: (item) => set((state) => {
        const existing = state.cart.find(i => i.id === item.id && i.portion === item.portion);
        if (existing) {
            return {
                cart: state.cart.map(i =>
                    (i.id === item.id && i.portion === item.portion)
                        ? { ...i, quantity: i.quantity + item.quantity }
                        : i
                )
            };
        }
        return { cart: [...state.cart, item] };
    }),

    removeFromCart: (itemId, portion) => set((state) => ({
        cart: state.cart.filter(i => !(i.id === itemId && i.portion === portion))
    })),

    updateQuantity: (itemId, portion, delta) => set((state) => ({
        cart: state.cart.map(i =>
            (i.id === itemId && i.portion === portion)
                ? { ...i, quantity: Math.max(0, i.quantity + delta) }
                : i
        ).filter(i => i.quantity > 0)
    })),

    clearCart: () => set({ cart: [] }),
}));
