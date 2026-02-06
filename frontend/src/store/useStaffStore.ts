import { create } from 'zustand';
import api from '../utils/api';
import { supabase } from '../utils/supabaseClient';
import { getLocalDate, getLocalMonth } from '../utils/date';

interface StaffState {
    staff: any[];
    attendance: Record<string, any>;
    payroll: any[];
    advances: any[];
    restaurant: any | null;
    loading: boolean;
    stats: {
        totalStaff: number;
        presentToday: number;
        salaryPending: number;
        advancesOutstanding: number;
    };
    currentDate?: string;
    init: (restaurantId: string) => Promise<void>;
    refresh: (restaurantId: string, date?: string, month?: string) => Promise<void>;
    markAttendance: (staffId: string, status: string, notes?: string, date?: string) => Promise<void>;
    markPayrollPaid: (payrollId: string) => Promise<void>;
    addStaff: (data: any) => Promise<void>;
    updateStaff: (id: string, data: any) => Promise<void>;
    addAdvance: (data: any) => Promise<void>;
}

export const useStaffStore = create<StaffState>((set, get) => ({
    staff: [],
    attendance: {},
    payroll: [],
    advances: [],
    restaurant: null,
    loading: true,
    stats: {
        totalStaff: 0,
        presentToday: 0,
        salaryPending: 0,
        advancesOutstanding: 0
    },

    init: async (restaurantId: string) => {
        set({ loading: true });
        const today = getLocalDate();
        await get().refresh(restaurantId, today);

        // Granular Realtime Subscription
        supabase.channel('staff-system-sync')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'staff' }, () => get().refresh(restaurantId, get().currentDate || getLocalDate()))
            .on('postgres_changes', { event: '*', schema: 'public', table: 'staff_payroll' }, () => get().refresh(restaurantId, get().currentDate || getLocalDate()))
            .on('postgres_changes', { event: '*', schema: 'public', table: 'staff_advances' }, () => get().refresh(restaurantId, get().currentDate || getLocalDate()))
            .on('postgres_changes', { event: '*', schema: 'public', table: 'staff_attendance' }, (payload: any) => {
                const { currentDate, attendance, refresh } = get();
                const record = payload.new;

                // Only merge if it's for the currently viewed date
                if (record && record.date === (currentDate || getLocalDate())) {
                    set({
                        attendance: { ...attendance, [record.staff_id]: record }
                    });
                } else {
                    // If complex change or different date, sync fully or ignore
                    refresh(restaurantId, currentDate || getLocalDate());
                }
            })
            .subscribe();
    },

    refresh: async (restaurantId: string, date?: string, monthOverride?: string) => {
        try {
            const targetDate = date || getLocalDate();
            const month = monthOverride || targetDate.slice(0, 7); // YYYY-MM

            // Store current date/month for realtime refreshes
            set({ currentDate: targetDate, currentMonth: month } as any);

            const [staffRes, attRes, payRes, advRes, restRes] = await Promise.all([
                api.get(`/staff/${restaurantId}`),
                api.get(`/attendance/${restaurantId}?date=${targetDate}`),
                api.get(`/payroll/${restaurantId}/${month}`),
                api.get(`/advances/${restaurantId}`),
                api.get(`/restaurants/${restaurantId}`)
            ]);

            const activeStaff = staffRes.data.filter((s: any) => s.status === 'active');

            // Map attendance to "Record" format for fast lookup
            const attendanceMap: Record<string, any> = {};
            attRes.data.forEach((r: any) => {
                attendanceMap[r.staff_id] = r;
            });

            // Calculate Stats
            const totalAdvances = advRes.data.reduce((sum: number, a: any) => sum + (a.is_recovery ? -parseFloat(a.amount) : parseFloat(a.amount)), 0);
            const pendingSalary = payRes.data.filter((p: any) => p.status === 'pending').reduce((sum: number, p: any) => sum + parseFloat(p.final_amount), 0);

            set({
                staff: staffRes.data,
                attendance: attendanceMap,
                payroll: payRes.data,
                advances: advRes.data,
                restaurant: restRes.data,
                loading: false,
                stats: {
                    totalStaff: activeStaff.length,
                    presentToday: attRes.data.filter((a: any) => a.status === 'present').length,
                    salaryPending: pendingSalary,
                    advancesOutstanding: totalAdvances
                }
            });
        } catch (err) {
            console.error('Failed to refresh store', err);
            set({ loading: false });
        }
    },

    markAttendance: async (staffId: string, status: string, notes: string = '', date?: string) => {
        const targetDate = date || get().currentDate || getLocalDate();
        console.log(`[STORE] markAttendance for ${staffId} on ${targetDate} status: ${status}`);

        // Optimistic Update
        const prevAttendance = { ...get().attendance };
        const newRecord = { ...prevAttendance[staffId], staff_id: staffId, status, notes };

        const newAttendance = { ...prevAttendance, [staffId]: newRecord };
        set({ attendance: newAttendance });

        try {
            await api.post('/attendance/upsert', {
                staff_id: staffId,
                date: targetDate, // Use specific date
                status,
                notes
            });
            console.log('[STORE] API success');
        } catch (err) {
            console.error('[STORE] Failed', err);
            set({ attendance: prevAttendance }); // Revert
            throw err; // Allow UI to handle/notify
        }
    },

    markPayrollPaid: async (payrollId: string) => {
        try {
            // Optimistic Update
            const prevPayroll = [...get().payroll];
            set({
                payroll: prevPayroll.map(p => p.id === payrollId ? { ...p, status: 'paid' } : p)
            });

            await api.post(`/payroll/mark-paid/${payrollId}`);
        } catch (err) {
            console.error('Failed to mark payroll paid', err);
            throw err;
        }
    },

    addStaff: async (data) => {
        try {
            await api.post('/staff', data);
            // Realtime will trigger refresh
        } catch (err) {
            console.error('Failed to add staff', err);
            throw err;
        }
    },

    updateStaff: async (id, data) => {
        try {
            // Optimistic Update
            const prevStaff = [...get().staff];
            set({ staff: prevStaff.map(s => s.id === id ? { ...s, ...data } : s) });

            await api.put(`/staff/${id}`, data);
        } catch (err) {
            console.error('Failed to update staff', err);
            throw err;
        }
    },

    addAdvance: async (data) => {
        try {
            await api.post('/advances', data);
            // Realtime will trigger refresh
        } catch (err) {
            console.error('Failed to add advance', err);
            throw err;
        }
    }
}));
