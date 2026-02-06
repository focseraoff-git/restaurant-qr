import { create } from 'zustand';
import { supabase } from '../utils/supabaseClient';
import type { Session, User } from '@supabase/supabase-js';

type UserRole = 'admin' | 'manager' | 'billing' | 'inventory' | 'staff' | 'staff_manager' | 'counter' | 'waiter' | 'kitchen' | 'vendor_manager' | 'staff_counter' | 'staff_kitchen';

// Profile now comes from the 'staff' table
interface Profile {
    id: string; // This is the Staff ID (UUID)
    user_id: string | null; // This is the Auth ID
    restaurant_id: string;
    role: UserRole;
    name: string; // Changed from full_name to name to match staff table
    status: string; // 'active' | 'inactive'
    full_name?: string; // Optional helper for compatibility
}

interface AuthState {
    user: User | null;
    session: Session | null;
    profile: Profile | null;
    loading: boolean;
    initialized: boolean;
    initialize: () => Promise<void>;
    signIn: (email: string, password: string) => Promise<{ error: any }>;
    signUp: (email: string, password: string, metaData: any) => Promise<{ error: any }>;
    resetPasswordForEmail: (email: string) => Promise<{ error: any }>;
    signOut: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
    user: null,
    session: null,
    profile: null,
    loading: false,
    initialized: false,

    initialize: async () => {
        // Prevent double initialization
        if (get().initialized) return;

        set({ loading: true });

        // Get initial session
        const { data: { session } } = await supabase.auth.getSession();

        if (session?.user) {
            // Fetch profile from STAFF table using user_id
            const { data: staffData } = await supabase
                .from('staff')
                .select('*')
                .eq('user_id', session.user.id)
                .single();

            // Map staff data to Profile interface
            const profile = staffData ? {
                ...staffData,
                full_name: staffData.name // Ensure compatibility
            } : null;

            set({ session, user: session.user, profile: profile as Profile, loading: false, initialized: true });
        } else {
            set({ session: null, user: null, profile: null, loading: false, initialized: true });
        }

        // Listen for changes
        supabase.auth.onAuthStateChange(async (event, session) => {
            console.log('Auth State Change:', event, session?.user?.id);

            if (session?.user) {
                // Determine if we need to refetch profile
                const currentUserId = get().user?.id;
                if (currentUserId !== session.user.id || !get().profile) {
                    const { data: staffData } = await supabase
                        .from('staff')
                        .select('*')
                        .eq('user_id', session.user.id)
                        .single();

                    const profile = staffData ? {
                        ...staffData,
                        full_name: staffData.name
                    } : null;

                    set({ session, user: session.user, profile: profile as Profile });
                } else {
                    set({ session, user: session.user });
                }
            } else {
                set({ session: null, user: null, profile: null });
            }
        });

        // REALTIME SECURITY: Listen for Account Deletion
        // If the 'staff' record linked to this user is DELETED or made INACTIVE, force logout.
        supabase
            .channel('public:staff')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'staff' }, (payload) => {
                const currentUser = get().user;
                const currentProfile = get().profile;
                if (!currentUser || !currentProfile) return;

                const myAuthId = currentUser.id;
                const myStaffId = currentProfile.id;

                if (payload.eventType === 'DELETE') {
                    // payload.old contains the ID of the deleted row
                    if (payload.old.id === myStaffId) {
                        console.warn('⚠️ SECURITY: Staff record deleted. Forcing logout.');
                        get().signOut();
                        window.location.href = '/login?reason=account_deleted';
                    }
                } else if (payload.eventType === 'UPDATE') {
                    // payload.new contains the new state
                    // Check if the update affects "MY" staff record (by ID)
                    if (payload.new.id === myStaffId) {

                        // 1. Check if I was Unlinked (Auth User ID removed or changed)
                        if (payload.new.user_id !== myAuthId) {
                            console.warn('⚠️ SECURITY: User unlinked from Staff. Forcing logout.');
                            get().signOut();
                            window.location.href = '/login?reason=access_revoked';
                            return;
                        }

                        // 2. Check Status Deactivation
                        if (payload.new.status === 'inactive' || payload.new.status === 'banned') {
                            console.warn('⚠️ SECURITY: Account deactivated. Forcing logout.');
                            get().signOut();
                            window.location.href = '/login?reason=account_deactivated';
                            return;
                        }
                    }
                }
            })
            .subscribe();
    },

    signIn: async (email, password) => {
        set({ loading: true });
        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password
        });

        if (data.session?.user && !error) {
            // Explicitly fetch profile from STAFF table
            const { data: staffData } = await supabase
                .from('staff')
                .select('*')
                .eq('user_id', data.session.user.id)
                .single();

            const profile = staffData ? {
                ...staffData,
                full_name: staffData.name
            } : null;

            set({ session: data.session, user: data.session.user, profile: profile as Profile, loading: false });
        } else {
            set({ loading: false });
        }

        return { error };
    },

    signUp: async (email, password, metaData) => {
        set({ loading: true });
        const { error } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: metaData // full_name, role, restaurant_id
            }
        });
        set({ loading: false });
        // Profile is not fetched here immediately as trigger needs to run (handled by initialize/onAuthStateChange usually)
        return { error };
    },

    resetPasswordForEmail: async (email) => {
        set({ loading: true });
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
            redirectTo: window.location.origin + '/reset-password',
        });
        set({ loading: false });
        return { error };
    },

    signOut: async () => {
        await supabase.auth.signOut();
        set({ session: null, user: null, profile: null });
    }
}));
