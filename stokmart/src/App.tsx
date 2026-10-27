import React from 'react';
import { InventoryProvider, useInventory } from './context/InventoryContext';
import { Navbar } from './components/Navbar';
import { Storefront } from './components/storefront/Storefront';
import { AdminDashboard } from './components/admin/AdminDashboard';
import { ProductDetailModal } from './components/storefront/ProductDetailModal';
import { CartDrawer } from './components/storefront/CartDrawer';
import { OrderTrackingModal } from './components/storefront/OrderTrackingModal';
import { LoginModal } from './components/LoginModal';

const AppContent: React.FC = () => {
  const { activeView, currentUser } = useInventory();

  // Strict access guard: Dashboard Admin is ONLY displayed when the user is logged in
  const shouldShowAdmin = activeView === 'admin' && currentUser !== null;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      <Navbar />

      <main className="flex-1">
        {shouldShowAdmin ? <AdminDashboard /> : <Storefront />}
      </main>

      {/* Global Modals & Drawers */}
      <ProductDetailModal />
      <CartDrawer />
      <OrderTrackingModal />
      <LoginModal />
    </div>
  );
};

export default function App() {
  return (
    <InventoryProvider>
      <AppContent />
    </InventoryProvider>
  );
}
