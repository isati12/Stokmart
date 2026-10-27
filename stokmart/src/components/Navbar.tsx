import React from 'react';
import {
  Boxes,
  ShoppingCart,
  ShieldCheck,
  LayoutDashboard,
  Store,
  AlertTriangle,
  Lock,
  LogOut,
  Calendar,
  Sparkles,
  PhoneCall,
  ChevronRight,
  Truck,
} from 'lucide-react';
import { useInventory } from '../context/InventoryContext';
import { ThemeToggle } from './ThemeToggle';

export const Navbar: React.FC = () => {
  const {
    activeView,
    setActiveView,
    cart,
    setIsCartOpen,
    currentUser,
    setIsLoginModalOpen,
    logout,
    allTSBAnalyses,
    currentDay,
    simulateNextDay,
    setIsTrackingModalOpen,
  } = useInventory();

  // Count items below ROP (only relevant for logged-in admin)
  const criticalCount = Array.from(allTSBAnalyses.values()).filter(
    (item) => item.stockStatus === 'CRITICAL' || item.stockStatus === 'OUT_OF_STOCK'
  ).length;

  const cartTotalItems = cart.reduce((acc, item) => acc + item.quantity, 0);

  return (
    <header className="sticky top-0 z-40 bg-slate-900/95 backdrop-blur-md border-b border-slate-800 transition-all">
      {/* Top micro ticker */}
      <div className="bg-gradient-to-r from-emerald-950 via-slate-900 to-indigo-950 px-4 py-1.5 text-xs border-b border-slate-800/80">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2 text-slate-300">
          {currentUser ? (
            /* Admin ticker when user is logged in */
            <>
              <div className="flex items-center gap-3">
                <span className="flex items-center gap-1.5 font-medium text-emerald-400">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                  </span>
                  Mesin TSB Aktif (Sesi Pengelola)
                </span>
                <span className="text-slate-600">|</span>
                <span className="text-slate-400 flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" />
                  Siklus Hari ke-{currentDay}
                </span>
              </div>

              <div className="flex items-center gap-3 text-xs">
                {criticalCount > 0 ? (
                  <button
                    onClick={() => setActiveView('admin')}
                    className="flex items-center gap-1 text-amber-400 bg-amber-950/60 hover:bg-amber-900/80 px-2 py-0.5 rounded border border-amber-800/60 transition cursor-pointer"
                  >
                    <AlertTriangle className="w-3 h-3 text-amber-400" />
                    <span className="font-semibold">{criticalCount} SKU</span> perlu restok (Di Bawah ROP)
                  </button>
                ) : (
                  <span className="text-emerald-400 flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3" />
                    Semua stok dalam level aman
                  </span>
                )}

                <button
                  onClick={simulateNextDay}
                  title="Simulasikan pergerakan waktu 1 hari untuk melihat pembaruan rumus TSB"
                  className="text-indigo-300 hover:text-white bg-indigo-950/70 hover:bg-indigo-900 px-2.5 py-0.5 rounded border border-indigo-800/50 flex items-center gap-1 transition cursor-pointer text-[11px]"
                >
                  <Sparkles className="w-3 h-3 text-indigo-400" />
                  +1 Hari Simulasi
                </button>
              </div>
            </>
          ) : (
            /* Customer ticker for public landing page */
            <>
              <div className="flex items-center gap-2 text-slate-300">
                <span className="text-emerald-400 font-semibold flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                  Distributor Resmi Suku Cadang & Otomasi Industri
                </span>
                <span className="text-slate-600 hidden sm:inline">•</span>
                <span className="text-slate-400 hidden sm:inline">
                  Stok Terjamin Bebas Downtime Pabrik (Didukung Algoritma TSB)
                </span>
              </div>

              <div className="flex items-center gap-3 text-xs text-slate-400">
                <span className="hidden md:flex items-center gap-1">
                  <PhoneCall className="w-3 h-3 text-slate-400" />
                  Layanan B2B & Faktur Pajak
                </span>
                <button
                  onClick={() => setIsLoginModalOpen(true)}
                  className="text-indigo-400 hover:text-indigo-300 font-medium flex items-center gap-0.5 cursor-pointer"
                >
                  <span>Portal Pengelola</span>
                  <ChevronRight className="w-3 h-3" />
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Main navigation bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Brand */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setActiveView('storefront')}
              className="flex items-center gap-2.5 group cursor-pointer text-left focus:outline-none"
            >
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 via-teal-500 to-cyan-500 flex items-center justify-center shadow-lg shadow-emerald-500/20 group-hover:scale-105 transition-transform">
                <Boxes className="w-5 h-5 text-white" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="font-bold text-lg tracking-tight text-white group-hover:text-emerald-400 transition-colors">
                    NetSolusions
                  </span>
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 uppercase tracking-wider">
                    Store
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 leading-none">
                  Katalog Suku Cadang &amp; Komponen Industri
                </p>
              </div>
            </button>
          </div>

          {/* Navigation Pill Switches - ONLY VISIBLE WHEN USER IS LOGGED IN */}
          {currentUser && (
            <div className="flex items-center bg-slate-800/90 p-1 rounded-xl border border-slate-700/80 shadow-inner animate-fadeIn">
              <button
                onClick={() => setActiveView('storefront')}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-all cursor-pointer ${
                  activeView === 'storefront'
                    ? 'bg-emerald-600 text-white shadow-sm shadow-emerald-600/40'
                    : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
                }`}
              >
                <Store className="w-4 h-4" />
                <span>Katalog Penjualan</span>
              </button>

              <button
                onClick={() => setActiveView('admin')}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-all cursor-pointer ${
                  activeView === 'admin'
                    ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-600/40'
                    : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
                }`}
              >
                <LayoutDashboard className="w-4 h-4" />
                <span>Dashboard Admin &amp; TSB</span>
                {criticalCount > 0 && (
                  <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] bg-amber-500 text-slate-950 font-bold">
                    {criticalCount}
                  </span>
                )}
              </button>
            </div>
          )}

          {/* Actions: Theme Toggle, Lacak Pesanan, Cart & Card Login / Profile */}
          <div className="flex items-center gap-2 sm:gap-2.5">
            {/* Dark/Light Mode Switcher */}
            <ThemeToggle />

            {/* Public Tracking Button (No Login Required) */}
            <button
              onClick={() => setIsTrackingModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800/90 hover:bg-slate-700 text-slate-200 border border-slate-700 hover:border-cyan-500/50 text-xs font-semibold transition cursor-pointer group"
              title="Lacak Pengiriman Kurir & Status Pesanan Tanpa Login"
            >
              <Truck className="w-4 h-4 text-cyan-400 group-hover:scale-110 transition-transform" />
              <span className="hidden md:inline">Lacak Pesanan</span>
            </button>

            {/* Storefront Cart button */}
            <button
              onClick={() => setIsCartOpen(true)}
              className="relative p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 hover:border-slate-600 transition cursor-pointer"
              aria-label="Keranjang Belanja"
            >
              <ShoppingCart className="w-5 h-5" />
              {cartTotalItems > 0 && (
                <span className="absolute -top-1.5 -right-1.5 bg-emerald-500 text-white text-[11px] font-bold h-5 min-w-[20px] px-1 rounded-full flex items-center justify-center shadow-md animate-pulse">
                  {cartTotalItems}
                </span>
              )}
            </button>

            {/* Authenticated user session vs Card Login button */}
            {currentUser ? (
              <div className="flex items-center gap-2.5 pl-2 border-l border-slate-800">
                <div className="hidden sm:flex flex-col text-right">
                  <span className="text-xs font-semibold text-slate-200 truncate max-w-[130px]">
                    {currentUser.name}
                  </span>
                  <span className="text-[10px] text-indigo-400 capitalize font-medium">
                    {currentUser.role === 'admin' ? 'Administrator' : 'Staff Gudang'}
                  </span>
                </div>
                <img
                  src={currentUser.avatar}
                  alt={currentUser.name}
                  className="w-9 h-9 rounded-full border border-indigo-500/50 object-cover"
                />
                <button
                  onClick={logout}
                  title="Keluar dari akun (Logout)"
                  className="p-2 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-xl transition cursor-pointer"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              /* Dedicated Card Login Button for Admin Access */
              <button
                onClick={() => setIsLoginModalOpen(true)}
                className="flex items-center gap-2 px-4 py-2 text-xs sm:text-sm font-semibold rounded-xl bg-gradient-to-r from-indigo-600 via-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 text-white shadow-lg shadow-indigo-600/25 border border-indigo-500/30 transition cursor-pointer"
              >
                <Lock className="w-4 h-4 text-indigo-200" />
                <span>Login Admin</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
