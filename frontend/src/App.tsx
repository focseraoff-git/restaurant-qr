import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from './layouts/Layout';

// Auth & Store
import { useAuthStore } from './store/useAuthStore';
import { ProtectedRoute } from './components/auth/ProtectedRoute';

// Public Pages
import { LandingPage } from './pages/LandingPage';
import { LoginPage } from './pages/LoginPage';
import { SignupPage } from './pages/SignupPage';
import { ForgotPasswordPage } from './pages/ForgotPasswordPage';

// Customer QR Pages
import { MenuPage } from './pages/MenuPage';
import { CartPage } from './pages/CartPage';
import { SuccessPage } from './pages/SuccessPage';
import { BillPage } from './pages/BillPage';

// Protected Module Pages
import { KitchenDashboard } from './pages/KitchenDashboard';
import { AdminDashboard } from './pages/AdminDashboard';
import { CounterDashboard } from './pages/CounterDashboard';
import { StaffManagement } from './pages/StaffManagement';
import { InventoryManagement } from './pages/InventoryManagement';
import { BillingControl } from './pages/BillingControl';
import { WaiterDashboard } from './pages/WaiterDashboard';

import { Toaster } from 'react-hot-toast'; // Assuming usage of react-hot-toast or similar, or existing Toast

// Helper to redirect authenticated user to their dashboard
const DashboardRedirect = () => {
  const { profile, loading, user } = useAuthStore();

  console.log('DashboardRedirect State:', {
    hasUser: !!user,
    hasProfile: !!profile,
    isLoading: loading,
    role: profile?.role
  });

  if (loading) return <div className="p-10 text-white">Loading Dashboard...</div>;

  // CRITICAL: If we have user but no profile, do NOT redirect to login yet. 
  // It might be fetching. Show error or loading instead.
  if (user && !profile) {
    return <div className="p-10 text-red-400">Error: Profile not loaded for user {user.email}</div>;
  }

  if (!profile) return <Navigate to="/login" replace />;

  // Redirect based on role
  if (profile.role === 'admin' || profile.role === 'vendor_manager') {
    return <Navigate to={`/admin/${profile.restaurant_id}/dashboard`} replace />;
  }
  if (profile.role === 'manager') {
    // Managers default to Billing/Finance View
    return <Navigate to={`/billing/${profile.restaurant_id}`} replace />;
  }
  if (profile.role === 'billing') {
    return <Navigate to={`/billing/${profile.restaurant_id}`} replace />;
  }
  if (profile.role === 'inventory') {
    return <Navigate to={`/inventory/${profile.restaurant_id}`} replace />;
  }
  if (profile.role === 'staff' || profile.role === 'staff_manager') {
    return <Navigate to={`/staff/${profile.restaurant_id}`} replace />;
  }
  if (profile.role === 'kitchen' || profile.role === 'staff_kitchen') {
    return <Navigate to={`/kitchen/${profile.restaurant_id}`} replace />;
  }
  if (profile.role === 'waiter') {
    return <Navigate to={`/waiter/${profile.restaurant_id}`} replace />;
  }
  // Default to Counter for everyone else (Counter role, Staff_Counter)
  return <Navigate to={`/counter/${profile.restaurant_id}`} replace />;
};

function App() {
  const { initialize } = useAuthStore();

  useEffect(() => {
    initialize();
  }, [initialize]);

  return (
    <BrowserRouter>
      <div className="min-h-screen bg-slate-950 text-white font-sans selection:bg-emerald-500/30">
        <Routes>
          {/* --- Public Routes --- */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/" element={<LandingPage />} />

          {/* --- Customer QR Routes (Public) --- */}
          <Route element={<Layout />}>
            <Route path="/menu" element={<MenuPage />} />
            <Route path="/cart" element={<CartPage />} />
            <Route path="/success" element={<SuccessPage />} />
            <Route path="/bill" element={<BillPage />} />
          </Route>

          {/* --- Authentication Wrapper --- */}
          <Route element={<ProtectedRoute />}>

            {/* Intelligent Redirect */}
            <Route path="/dashboard" element={<DashboardRedirect />} />

            {/* Operations Modules (Accessible to specific roles + Admin/Manager) */}
            <Route element={<ProtectedRoute allowedRoles={['admin', 'manager', 'counter', 'staff_counter']} />}>
              <Route path="/counter/:restaurantId" element={<CounterDashboard />} />
            </Route>

            <Route element={<ProtectedRoute allowedRoles={['admin', 'manager', 'kitchen', 'staff_kitchen']} />}>
              <Route path="/kitchen/:restaurantId" element={<KitchenDashboard />} />
            </Route>

            <Route element={<ProtectedRoute allowedRoles={['admin', 'manager', 'waiter']} />}>
              <Route path="/waiter/:restaurantId" element={<WaiterDashboard />} />
            </Route>

            {/* Granular Management Modules */}
            <Route element={<ProtectedRoute allowedRoles={['admin', 'manager', 'inventory']} />}>
              <Route path="/inventory/:restaurantId" element={<InventoryManagement />} />
            </Route>

            <Route element={<ProtectedRoute allowedRoles={['admin', 'manager', 'staff']} />}>
              <Route path="/staff/:restaurantId" element={<StaffManagement />} />
            </Route>

            <Route element={<ProtectedRoute allowedRoles={['admin', 'manager', 'billing']} />}>
              <Route path="/billing/:restaurantId" element={<BillingControl />} />
            </Route>

            <Route element={<ProtectedRoute allowedRoles={['admin', 'manager', 'vendor_manager']} />}>
              <Route path="/admin/:restaurantId/dashboard" element={<AdminDashboard />} />
            </Route>

          </Route>

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>

        {/* Global Toaster */}
        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              background: '#1e293b', // slate-800
              color: '#fff',
              border: '1px solid rgba(255,255,255,0.1)',
            },
          }}
        />
      </div>
    </BrowserRouter>
  );
}

export default App;
