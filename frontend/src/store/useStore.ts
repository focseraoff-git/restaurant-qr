import { create } from 'zustand';
import { persist } from 'zustand/middleware';

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
    customerName: string | null;
    orderType: 'dine-in' | 'takeaway' | null;
    cart: CartItem[];
    myOrderIds: string[]; // Device History

    setTableId: (id: string | null, number?: string) => void;
    setRestaurantId: (id: string | null) => void;
    setCustomerName: (name: string | null) => void;
    setOrderType: (type: 'dine-in' | 'takeaway') => void;

    addToCart: (item: CartItem) => void;
    removeFromCart: (itemId: string, portion: string) => void;
    updateQuantity: (itemId: string, portion: string, delta: number) => void;
    clearCart: () => void;
    resetStore: () => void;
    resetSession: () => void; // Keep Name
    resetOrderState: () => void;
    addOrderId: (id: string) => void;
}

export const useStore = create<AppState>()(
    persist(
        (set) => ({
            tableId: null,
            tableNumber: null,
            restaurantId: null,
            customerName: null,
            orderType: null,
            cart: [],
            myOrderIds: [],

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
            resetStore: () => set({
                cart: [],
                customerName: null,
                tableId: null,
                tableNumber: null,
                orderType: null,
                restaurantId: null
            }),
            resetOrderState: () => set({
                cart: [],
                customerName: null,
                tableId: null,
                tableNumber: null,
                orderType: 'takeaway'
            }),
            addOrderId: (id) => set((state) => ({ myOrderIds: [...state.myOrderIds, id] })),
            resetSession: () => set({
                cart: [],
                // customerName: KEEP IT
                tableId: null,
                tableNumber: null,
                orderType: null,
                restaurantId: null
            }),
        }),
        {
            name: 'restaurant-qr-storage',
            partialize: (state) => ({
                // Persist everything except table-specifics if needed, 
                // but user wants to stay on landing page flow, so persisting all is good.
                restaurantId: state.restaurantId,
                customerName: state.customerName,
                cart: state.cart,
                // tableId: state.tableId? Maybe clear logic if QR changes? 
                // Let's persist all for better experience unless explicit clear.
                tableId: state.tableId,
                tableNumber: state.tableNumber,
                orderType: state.orderType,
                myOrderIds: state.myOrderIds
            }),
        }
    )
);
