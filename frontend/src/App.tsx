import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from './layouts/Layout';
import { MenuPage } from './pages/MenuPage';
import { CartPage } from './pages/CartPage';
import { KitchenDashboard } from './pages/KitchenDashboard';
import { LandingPage } from './pages/LandingPage';
import { SuccessPage } from './pages/SuccessPage';
import { BillPage } from './pages/BillPage';

import { WaiterDashboard } from './pages/WaiterDashboard';
import { Protect } from './components/Protect';

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

        <Route path="/kitchen/:restaurantId" element={<Protect><KitchenDashboard /></Protect>} />
        <Route path="/waiter/:restaurantId" element={<Protect><WaiterDashboard /></Protect>} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
