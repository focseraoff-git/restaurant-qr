import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from './layouts/Layout';
import { MenuPage } from './pages/MenuPage';
import { CartPage } from './pages/CartPage';
import { KitchenDashboard } from './pages/KitchenDashboard';
import { LandingPage } from './pages/LandingPage';
import { SuccessPage } from './pages/SuccessPage';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />

        <Route element={<Layout />}>
          <Route path="/menu" element={<MenuPage />} />
          <Route path="/cart" element={<CartPage />} />
          <Route path="/success" element={<SuccessPage />} />
        </Route>

        <Route path="/kitchen/:restaurantId" element={<KitchenDashboard />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
