import { create } from 'zustand';
import api from '../utils/api';

interface Vendor {
    id: string;
    name: string;
    contact_person: string;
    phone: string;
    email?: string;
    category: string;
    payment_terms: string;
    status: string;
}

interface InventoryItem {
    id: string;
    name: string;
    type: string;
    unit: string;
    current_stock: number;
    min_stock_level: number;
    purchase_price: number;
}

interface Purchase {
    id: string;
    vendor_id: string;
    invoice_no: string;
    date: string;
    total_amount: number;
}

interface InventoryState {
    vendors: Vendor[];
    items: InventoryItem[];
    purchases: Purchase[];
    movements: any[];
    loading: boolean;
    error: string | null;

    init: (restaurantId: string) => Promise<void>;
    fetchVendors: (restaurantId: string) => Promise<void>;
    fetchItems: (restaurantId: string) => Promise<void>;

    addVendor: (data: any) => Promise<void>;
    updateVendor: (id: string, data: any) => Promise<void>;
    deleteVendor: (id: string) => Promise<void>;

    addItem: (data: any) => Promise<void>;
    updateItem: (id: string, data: any) => Promise<void>;
    deleteItem: (id: string) => Promise<void>;

    logMovement: (data: any) => Promise<void>;
    createPurchase: (data: any) => Promise<void>;
}

export const useInventoryStore = create<InventoryState>((set, get) => ({
    vendors: [],
    items: [],
    purchases: [],
    movements: [],
    loading: false,
    error: null,

    init: async (restaurantId) => {
        set({ loading: true, error: null });
        try {
            const [vendorsRes, itemsRes] = await Promise.all([
                api.get(`/vendors/${restaurantId}`),
                api.get(`/inventory/${restaurantId}`)
            ]);
            set({
                vendors: vendorsRes.data,
                items: itemsRes.data,
                loading: false
            });
        } catch (err: any) {
            set({ error: err.message, loading: false });
        }
    },

    fetchVendors: async (restaurantId) => {
        const res = await api.get(`/vendors/${restaurantId}`);
        set({ vendors: res.data });
    },

    fetchItems: async (restaurantId) => {
        const res = await api.get(`/inventory/${restaurantId}`);
        set({ items: res.data });
    },

    addVendor: async (data) => {
        const res = await api.post('/vendors', data);
        set(state => ({ vendors: [...state.vendors, res.data] }));
    },

    updateVendor: async (id, data) => {
        const res = await api.put(`/vendors/${id}`, data);
        set(state => ({
            vendors: state.vendors.map(v => v.id === id ? res.data : v)
        }));
    },

    deleteVendor: async (id) => {
        await api.delete(`/vendors/${id}`);
        set(state => ({
            vendors: state.vendors.filter(v => v.id !== id)
        }));
    },

    addItem: async (data) => {
        const res = await api.post('/inventory', data);
        set(state => ({ items: [...state.items, res.data] }));
    },

    updateItem: async (id, data) => {
        const res = await api.put(`/inventory/${id}`, data);
        set(state => ({
            items: state.items.map(i => i.id === id ? res.data : i)
        }));
    },

    deleteItem: async (id) => {
        await api.delete(`/inventory/${id}`);
        set(state => ({
            items: state.items.filter(i => i.id !== id)
        }));
    },

    logMovement: async (data) => {
        // Optimistic update for stock
        const { item_id, type, quantity } = data;
        const qty = parseFloat(quantity);

        // Calculate delta
        let delta = 0;
        if (type === 'IN' || type === 'RETURN') delta = qty;
        else if (type === 'OUT' || type === 'WASTAGE') delta = -qty;
        else if (type === 'ADJUST') delta = qty; // Assumes adjust carries sign or is additive

        set(state => ({
            items: state.items.map(i => i.id === item_id ? { ...i, current_stock: Number(i.current_stock) + delta } : i)
        }));

        await api.post('/movements', data);
        // Ideally re-fetch to ensure server calc is trusted, but optimistic is fine for now
    },

    createPurchase: async (data) => {
        await api.post('/purchases', data);
        // Refresh everything as purchase affects stock and logs and financial
        // But for speed, we might just re-fetch items
        // get().fetchItems(data.restaurant_id);
        // Assuming restaurantId is not easily available in `get()`, we rely on component to trigger refresh or specific fetch
    }
}));
