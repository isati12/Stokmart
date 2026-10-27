import React from 'react';
import {
  Boxes,
  LayoutDashboard,
  Cpu,
  LineChart,
  Package,
  Layers,
  Sparkles,
  Store,
  LogOut,
  ChevronLeft,
  ChevronRight,
  ShieldAlert,
  Sliders,
  Activity,
  GitCompare,
  Database,
  FileSpreadsheet,
  CreditCard,
} from 'lucide-react';
import { useInventory } from '../../context/InventoryContext';
import { ThemeToggle } from '../ThemeToggle';

export type AdminMenuKey =
  | 'overview'
  | 'analytics'
  | 'master-data'
  | 'customer-orders'
  | 'tsb-engine'
  | 'tsb-compare'
  | 'inventory'
  | 'restock-po'
  | 'products'
  | 'reports'
  | 'simulation';

interface SidebarProps {
  currentMenu: AdminMenuKey;
  onSelectMenu: (key: AdminMenuKey) => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  isMobileOpen: boolean;
  onCloseMobile: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentMenu,
  onSelectMenu,
  isCollapsed,
  onToggleCollapse,
  isMobileOpen,
  onCloseMobile,
}) => {
  const {
    setActiveView,
    currentUser,
    logout,
    allTSBAnalyses,
    restockOrders,
    customerOrders,
  } = useInventory();

  const criticalCount = Array.from(allTSBAnalyses.values()).filter(
    (i) => i.stockStatus === 'CRITICAL' || i.stockStatus === 'OUT_OF_STOCK'
  ).length;

  const inTransitCount = restockOrders.filter((o) => o.status === 'IN_TRANSIT').length;
  const waitingCount = customerOrders.filter((o) => o.status === 'WAITING_PAYMENT').length;

  const menuSections = [
    {
      group: 'MENU UTAMA',
      items: [
        {
          key: 'overview' as AdminMenuKey,
          label: 'Dashboard Overview',
          icon: LayoutDashboard,
          badge: undefined,
        },
        {
          key: 'analytics' as AdminMenuKey,
          label: 'Grafik & Analitik Lengkap',
          icon: LineChart,
          badge: 'New',
          badgeColor: 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30',
        },
      ],
    },
    {
      group: 'DATA MASTER',
      items: [
        {
          key: 'master-data' as AdminMenuKey,
          label: 'Data Master Terpadu',
          icon: Database,
          badge: '5 Modul',
          badgeColor: 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30',
        },
      ],
    },
    {
      group: 'PENJUALAN & KURIR',
      items: [
        {
          key: 'customer-orders' as AdminMenuKey,
          label: 'Pesanan & Konfirmasi Bayar',
          icon: CreditCard,
          badge: waitingCount > 0 ? `${waitingCount} Bayar` : undefined,
          badgeColor: 'bg-amber-500 text-slate-950 font-bold animate-pulse',
        },
      ],
    },
    {
      group: 'ALGORITMA TSB CORE',
      items: [
        {
          key: 'tsb-engine' as AdminMenuKey,
          label: 'Mesin Analisis TSB & Parameter',
          icon: Cpu,
        },
        {
          key: 'tsb-compare' as AdminMenuKey,
          label: 'Komparasi TSB vs Croston',
          icon: GitCompare,
        },
      ],
    },
    {
      group: 'INVENTARIS & RESTOK',
      items: [
        {
          key: 'inventory' as AdminMenuKey,
          label: 'Monitoring Stok & ROP',
          icon: Activity,
          badge: criticalCount > 0 ? `${criticalCount}` : undefined,
          badgeColor: 'bg-rose-500 text-white animate-pulse',
        },
        {
          key: 'restock-po' as AdminMenuKey,
          label: 'Purchase Order (PO)',
          icon: Package,
          badge: inTransitCount > 0 ? `${inTransitCount}` : undefined,
          badgeColor: 'bg-amber-500 text-slate-950 font-bold',
        },
        {
          key: 'products' as AdminMenuKey,
          label: 'Katalog SKU & Opname',
          icon: Layers,
        },
      ],
    },
    {
      group: 'LAPORAN & DOKUMEN',
      items: [
        {
          key: 'reports' as AdminMenuKey,
          label: 'Laporan & Ekspor Resmi',
          icon: FileSpreadsheet,
          badge: 'Excel & PDF',
          badgeColor: 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30',
        },
      ],
    },
    {
      group: 'SISTEM & AUDIT',
      items: [
        {
          key: 'simulation' as AdminMenuKey,
          label: 'Simulator & Log Audit',
          icon: Sparkles,
        },
      ],
    },
  ];

  const handleItemClick = (key: AdminMenuKey) => {
    onSelectMenu(key);
    onCloseMobile();
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isMobileOpen && (
        <div
          onClick={onCloseMobile}
          className="fixed inset-0 z-40 bg-slate-950/80 backdrop-blur-xs lg:hidden"
        />
      )}

      {/* Sidebar Container - Locked fixed in place, independent from menu view scrolling */}
      <aside
        className={`h-full flex flex-col bg-slate-900 border-r border-slate-800 transition-all duration-300 ease-in-out shrink-0 select-none ${
          isCollapsed ? 'lg:w-20' : 'lg:w-64'
        } ${
          isMobileOpen
            ? 'fixed top-0 bottom-0 left-0 z-50 w-64 h-full translate-x-0 shadow-2xl'
            : 'fixed top-0 bottom-0 left-0 z-40 w-64 h-full -translate-x-full lg:translate-x-0 lg:static lg:h-full lg:z-30'
        }`}
      >
        {/* Brand Header */}
        <div
          className={`h-16 px-3 flex items-center ${
            isCollapsed ? 'lg:justify-center' : 'justify-between'
          } border-b border-slate-800 bg-slate-900/90 gap-2`}
        >
          <div className="flex items-center gap-2.5 overflow-hidden">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-600 via-teal-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-600/20 shrink-0">
              <Boxes className="w-5 h-5 text-white" />
            </div>
            {!isCollapsed && (
              <div className="min-w-0 animate-fadeIn">
                <div className="flex items-center gap-1.5">
                  <span className="font-black text-base text-white tracking-tight truncate">
                    NetSolusions
                  </span>
                  <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 shrink-0">
                    TSB Pro
                  </span>
                </div>
                <p className="text-[10px] text-slate-400 truncate">
                  Enterprise Inventory Suite
                </p>
              </div>
            )}
          </div>

          {/* Desktop Collapse Toggle */}
          <button
            onClick={onToggleCollapse}
            className="hidden lg:flex p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer shrink-0"
            title={isCollapsed ? 'Perlebar Sidebar (Buka Menu)' : 'Perkecil Sidebar (Luaskan Layar)'}
          >
            {isCollapsed ? (
              <ChevronRight className="w-4 h-4 text-emerald-400" />
            ) : (
              <ChevronLeft className="w-4 h-4" />
            )}
          </button>
        </div>

        {/* Navigation Items (Scrollable) */}
        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-6 scrollbar-thin">
          {menuSections.map((sec, idx) => (
            <div key={idx} className="space-y-1">
              {!isCollapsed && (
                <div className="px-3 text-[10px] font-bold tracking-wider text-slate-400 uppercase">
                  {sec.group}
                </div>
              )}
              {sec.items.map((item) => {
                const Icon = item.icon;
                const isActive = currentMenu === item.key;
                return (
                  <button
                    key={item.key}
                    onClick={() => handleItemClick(item.key)}
                    title={isCollapsed ? item.label : undefined}
                    className={`w-full flex items-center gap-3 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer group relative ${
                      isCollapsed ? 'lg:justify-center lg:px-0 px-3' : 'px-3'
                    } ${
                      isActive
                        ? 'bg-gradient-to-r from-indigo-600 to-indigo-700 text-white shadow-md shadow-indigo-600/30'
                        : 'text-slate-300 hover:text-white hover:bg-slate-800/80'
                    }`}
                  >
                    <Icon
                      className={`w-4 h-4 shrink-0 transition-transform ${
                        isActive
                          ? 'text-white scale-110'
                          : 'text-slate-400 group-hover:text-indigo-400'
                      }`}
                    />
                    {!isCollapsed && (
                      <span className="truncate flex-1 text-left">{item.label}</span>
                    )}

                    {!isCollapsed && item.badge && (
                      <span
                        className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                          item.badgeColor || 'bg-slate-800 text-slate-300'
                        }`}
                      >
                        {item.badge}
                      </span>
                    )}

                    {/* Collapsed Badge Dot indicator */}
                    {isCollapsed && item.badge && (
                      <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-rose-500 ring-2 ring-slate-900" />
                    )}
                  </button>
                );
              })}
            </div>
          ))}
        </div>

        {/* Sidebar Footer with Theme Toggle, User Card & Storefront Switch */}
        <div className="p-3 border-t border-slate-800 bg-slate-900/90 space-y-2">
          {/* Dark / Light Mode Switcher */}
          <ThemeToggle
            showLabel={!isCollapsed}
            className={`w-full ${isCollapsed ? 'justify-center p-2' : 'justify-center py-2 text-xs font-semibold'}`}
          />

          {/* Back to Storefront Link */}
          <button
            onClick={() => setActiveView('storefront')}
            className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-emerald-400 bg-emerald-950/40 hover:bg-emerald-900/60 border border-emerald-800/50 transition cursor-pointer ${
              isCollapsed ? 'justify-center' : ''
            }`}
            title="Lihat Landing Page Penjualan"
          >
            <Store className="w-4 h-4 shrink-0" />
            {!isCollapsed && <span>Katalog Penjualan</span>}
          </button>

          {/* User Profile Bar */}
          <div
            className={`flex items-center gap-2.5 p-2 rounded-xl bg-slate-800/60 border border-slate-700/60 ${
              isCollapsed ? 'justify-center' : 'justify-between'
            }`}
          >
            <div className="flex items-center gap-2 min-w-0">
              <img
                src={
                  currentUser?.avatar ||
                  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80'
                }
                alt="Avatar"
                className="w-8 h-8 rounded-full border border-indigo-500/50 object-cover shrink-0"
              />
              {!isCollapsed && (
                <div className="min-w-0">
                  <div className="text-xs font-bold text-white truncate max-w-[110px]">
                    {currentUser?.name || 'Administrator'}
                  </div>
                  <div className="text-[10px] text-emerald-400 capitalize">
                    {currentUser?.role === 'admin' ? 'Super Admin' : 'Staff Gudang'}
                  </div>
                </div>
              )}
            </div>

            {!isCollapsed && (
              <button
                onClick={logout}
                title="Keluar / Logout"
                className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-700/50 rounded-lg transition cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </aside>
    </>
  );
};
