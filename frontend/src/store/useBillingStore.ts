import { create } from 'zustand';
import api from '../utils/api';

interface Customer {
    id: string;
    name: string;
    phone: string;
    email?: string;
    is_khata_active: boolean;
    credit_limit: number;
    current_due: number;
}

interface Offer {
    id: string;
    name: string;
    code: string;
    value: number;
    type: string;
    description?: string;
    is_active: boolean;
}

interface BillingState {
    stats: any | null;
    onlineStats: any | null;
    customers: Customer[];
    offers: Offer[];
    cancellations: any[];
    ledger: any[];
    loading: boolean;
    error: string | null;

    fetchStats: (restaurantId: string, period?: string) => Promise<void>;
    fetchOnlineStats: (restaurantId: string, period?: string) => Promise<void>;
    fetchCustomers: (restaurantId: string, khataOnly?: boolean) => Promise<void>;
    fetchOffers: (restaurantId: string) => Promise<void>;
    fetchCancellations: (restaurantId: string) => Promise<void>;
    fetchLedger: (customerId: string) => Promise<void>;

    createCustomer: (data: any) => Promise<void>;
    addTransaction: (data: any) => Promise<void>;
    toggleOffer: (id: string, updates: any) => Promise<void>;
    logCancellation: (data: any) => Promise<void>;
    addOnlineOrder: (data: any) => Promise<void>;
}

export const useBillingStore = create<BillingState>((set) => ({
    stats: null,
    onlineStats: null,
    customers: [],
    offers: [],
    cancellations: [],
    ledger: [],
    loading: false,
    error: null,

    fetchStats: async (restaurantId, period = 'daily') => {
        set({ loading: true });
        try {
            const res = await api.get(`/billing/stats?restaurantId=${restaurantId}&period=${period}`);
            set({ stats: res.data, loading: false });
        } catch (err: any) {
            set({ error: err.message, loading: false });
        }
    },

    fetchOnlineStats: async (restaurantId, period = 'daily') => {
        set({ loading: true });
        try {
            const res = await api.get(`/billing/online-stats?restaurantId=${restaurantId}&period=${period}`);
            set({ onlineStats: res.data, loading: false });
        } catch (err: any) {
            set({ error: err.message, loading: false });
        }
    },

    fetchCustomers: async (restaurantId, khataOnly = false) => {
        const res = await api.get(`/khata/customers/${restaurantId}?khataOnly=${khataOnly}`);
        set({ customers: res.data });
    },

    fetchOffers: async (restaurantId) => {
        const res = await api.get(`/offers/${restaurantId}/all`);
        set({ offers: res.data });
    },

    fetchCancellations: async (restaurantId) => {
        const res = await api.get(`/cancellations/${restaurantId}`);
        set({ cancellations: res.data });
    },

    fetchLedger: async (customerId) => {
        const res = await api.get(`/khata/ledger/${customerId}`);
        set({ ledger: res.data });
    },

    createCustomer: async (data) => {
        const res = await api.post('/khata/customers', data);
        // Optimistic update
        set(state => ({ customers: [...state.customers, res.data] }));
    },

    addTransaction: async (data) => {
        await api.post('/khata/transaction', data);
        // Refresh customer list to update due amount
        // ideally we update specific customer in list
    },

    toggleOffer: async (id, updates) => {
        const res = await api.put(`/offers/${id}`, updates);
        set(state => ({
            offers: state.offers.map(o => o.id === id ? res.data : o)
        }));
    },

    logCancellation: async (data) => {
        const res = await api.post('/cancellations', data);
        set(state => ({ cancellations: [res.data, ...state.cancellations] }));
    },

    addOnlineOrder: async (data) => {
        await api.post('/billing/online-order', data);
        // Stats refresh usually needed after this
    }
}));
