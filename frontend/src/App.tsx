import { BrowserRouter, Routes, Route, Navigate, useParams } from 'react-router-dom';
import { Layout } from './layouts/Layout';
import { MenuPage } from './pages/MenuPage';
import { CartPage } from './pages/CartPage';
import { KitchenDashboard } from './pages/KitchenDashboard';
import { LandingPage } from './pages/LandingPage';
import { SuccessPage } from './pages/SuccessPage';
import { BillPage } from './pages/BillPage';

import { WaiterDashboard } from './pages/WaiterDashboard';
import { WaiterLoginPage } from './pages/WaiterLoginPage';
import { Protect } from './components/Protect';
import { AdminDashboard } from './pages/AdminDashboard';
import { CounterDashboard } from './pages/CounterDashboard';


const RedirectToLogin = () => {
  const { restaurantId } = useParams();
  return <Navigate to={`/waiter/login/${restaurantId}`} replace />;
};

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />

        <Route element={<Layout />}>
          <Route path="/menu" element={<MenuPage />} />
          <Route path="/cart" element={<CartPage />} />
          <Route path="/success" element={<SuccessPage />} />
          <Route path="/bill" element={<BillPage />} />
        </Route>

        <Route path="/waiter/login/:restaurantId" element={<WaiterLoginPage />} />
        <Route path="/kitchen/:restaurantId" element={<Protect><KitchenDashboard /></Protect>} />
        <Route path="/waiter/:restaurantId/dashboard" element={<WaiterDashboard />} />
        <Route path="/admin/:restaurantId/dashboard" element={<AdminDashboard />} />
        <Route path="/counter/:restaurantId" element={<CounterDashboard />} />

        {/* Redirect old waiter route */}
        <Route path="/waiter/:restaurantId" element={<RedirectToLogin />} />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
