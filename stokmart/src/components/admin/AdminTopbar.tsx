import React, { useState } from 'react';
import {
  Menu,
  Bell,
  Sparkles,
  Calendar,
  Store,
  AlertTriangle,
  PackagePlus,
  CheckCircle,
  ExternalLink,
  ChevronDown,
  ChevronRight,
  ChevronLeft,
  Code,
} from 'lucide-react';
import { useInventory } from '../../context/InventoryContext';
import { AdminMenuKey } from './Sidebar';
import { ThemeToggle } from '../ThemeToggle';

interface AdminTopbarProps {
  currentMenu: AdminMenuKey;
  onOpenMobileSidebar: () => void;
  onSelectMenu: (key: AdminMenuKey) => void;
  onOpenLaravelModal?: () => void;
  isSidebarCollapsed?: boolean;
  onToggleSidebarCollapse?: () => void;
}

const MENU_TITLES: Record<AdminMenuKey, { title: string; subtitle: string }> = {
  overview: {
    title: 'Dashboard Overview',
    subtitle: 'Ringkasan performa inventaris, status stok real-time, dan alert ROP',
  },
  analytics: {
    title: 'Grafik & Analitik Lengkap',
    subtitle: 'Visualisasi tren permintaan intermiten, probabilitas p_t, dan benchmark akurasi',
  },
  'master-data': {
    title: 'Data Master Terpadu',
    subtitle: 'Sentralisasi data entitas inti: Produk & SKU, Kategori, Supplier, Satuan (UoM), dan Gudang',
  },
  'customer-orders': {
    title: 'Pesanan & Konfirmasi Pembayaran',
    subtitle: 'Verifikasi bukti transfer bank / QRIS dan kelola nomor resi ekspedisi kurir untuk membuka live tracking pelanggan',
  },
  'tsb-engine': {
    title: 'Mesin Analisis Algoritma TSB',
    subtitle: 'Tuning parameter pemulusan alpha & beta serta formulasi matematika EJOR 2011',
  },
  'tsb-compare': {
    title: 'Komparasi Model Peramalan',
    subtitle: 'Perbandingan komparatif metode TSB vs Croston vs Simple Moving Average (SMA)',
  },
  inventory: {
    title: 'Monitoring Stok & Reorder Point',
    subtitle: 'Pengendalian level stok fisik terhadap ambang batas cadangan keselamatan',
  },
  'restock-po': {
    title: 'Manajemen Restok & Purchase Order',
    subtitle: 'Daftar pengadaan barang, pelacakan supplier, dan konfirmasi penerimaan gudang',
  },
  products: {
    title: 'Katalog SKU & Stock Opname',
    subtitle: 'Manajemen master data suku cadang, penyesuaian stok fisik, dan audit lead time',
  },
  reports: {
    title: 'Pusat Laporan & Ekspor Dokumen',
    subtitle: 'Unduh laporan valuasi stok, rekomendasi TSB, dan PO format Excel & PDF resmi berkop surat NetSolusions',
  },
  simulation: {
    title: 'Simulator Waktu & Audit Stream',
    subtitle: 'Uji responsivitas algoritma terhadap lonjakan permintaan dan peluruhan waktu',
  },
};

export const AdminTopbar: React.FC<AdminTopbarProps> = ({
  currentMenu,
  onOpenMobileSidebar,
  onSelectMenu,
  onOpenLaravelModal,
  isSidebarCollapsed,
  onToggleSidebarCollapse,
}) => {
  const {
    currentDay,
    simulateNextDay,
    allTSBAnalyses,
    products,
    createRestockOrder,
    setActiveView,
  } = useInventory();

  const [isNotifOpen, setIsNotifOpen] = useState(false);

  // Critical restock items
  const criticalItems = products.filter((p) => {
    const analysis = allTSBAnalyses.get(p.id);
    return analysis && (analysis.stockStatus === 'CRITICAL' || analysis.stockStatus === 'OUT_OF_STOCK');
  });

  const currentInfo = MENU_TITLES[currentMenu] || {
    title: 'Dashboard Admin',
    subtitle: 'Sistem Monitoring Stok TSB',
  };

  return (
    <header className="sticky top-0 z-30 h-16 bg-slate-900/95 backdrop-blur-md border-b border-slate-800 px-4 sm:px-6 flex items-center justify-between gap-4 w-full">
      {/* Left: Mobile Toggle / Desktop Collapse Toggle & Page Title */}
      <div className="flex items-center gap-2 sm:gap-3 min-w-0">
        {/* Mobile Hamburger */}
        <button
          onClick={onOpenMobileSidebar}
          className="lg:hidden p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
          title="Buka Menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Desktop Sidebar Width Toggle Button */}
        {onToggleSidebarCollapse && (
          <button
            onClick={onToggleSidebarCollapse}
            className="hidden lg:flex p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer shrink-0 border border-slate-800"
            title={isSidebarCollapsed ? "Perlebar Sidebar (Buka Menu)" : "Perkecil Sidebar (Luaskan Layar)"}
          >
            {isSidebarCollapsed ? (
              <ChevronRight className="w-4 h-4 text-emerald-400" />
            ) : (
              <ChevronLeft className="w-4 h-4 text-slate-400" />
            )}
          </button>
        )}

        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-mono text-slate-500 hidden sm:inline">
              Dashboard /
            </span>
            <h2 className="text-sm sm:text-base font-bold text-white tracking-tight truncate">
              {currentInfo.title}
            </h2>
          </div>
          <p className="text-[11px] text-slate-400 truncate hidden md:block">
            {currentInfo.subtitle}
          </p>
        </div>
      </div>

      {/* Right Action Widgets */}
      <div className="flex items-center gap-2.5 sm:gap-3 shrink-0">
        {/* Day Cycle Badge */}
        <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-800 border border-slate-700/80 text-xs text-slate-300">
          <Calendar className="w-3.5 h-3.5 text-indigo-400" />
          <span>Hari ke-<strong>{currentDay}</strong></span>
        </div>

        {/* Quick Simulator Step */}
        <button
          onClick={simulateNextDay}
          title="Simulasikan 1 Hari Baru untuk melihat adaptasi probabilitas TSB"
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-indigo-600/20 hover:bg-indigo-600 text-indigo-300 hover:text-white border border-indigo-500/40 transition cursor-pointer"
        >
          <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
          <span className="hidden sm:inline">+1 Hari Simulasi</span>
        </button>

        {/* Theme Toggle (Dark / Light) */}
        <ThemeToggle />

        {/* Laravel Project Code Modal Trigger */}
        {onOpenLaravelModal && (
          <button
            onClick={onOpenLaravelModal}
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-red-600/20 hover:bg-red-600 text-red-300 hover:text-white border border-red-500/40 transition cursor-pointer"
            title="Lihat & Salin Kode Proyek Laravel 11"
          >
            <Code className="w-3.5 h-3.5 text-red-400" />
            <span>Kode Laravel</span>
          </button>
        )}

        {/* Notifications Dropdown (Restock Alerts) */}
        <div className="relative">
          <button
            onClick={() => setIsNotifOpen(!isNotifOpen)}
            className="relative p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition cursor-pointer"
            aria-label="Pemberitahuan Restok"
          >
            <Bell className="w-4 h-4" />
            {criticalItems.length > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-rose-500 text-white text-[9px] font-bold flex items-center justify-center animate-pulse">
                {criticalItems.length}
              </span>
            )}
          </button>

          {isNotifOpen && (
            <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl bg-slate-900 border border-slate-700 shadow-2xl overflow-hidden z-50 animate-fadeIn">
              <div className="p-3.5 border-b border-slate-800 flex items-center justify-between bg-slate-850">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-400" />
                  <span className="text-xs font-bold text-white">
                    Peringatan Stok &amp; Restok TSB
                  </span>
                </div>
                <span className="text-[10px] text-slate-400">
                  {criticalItems.length} item kritis
                </span>
              </div>

              <div className="max-h-72 overflow-y-auto p-2 space-y-2">
                {criticalItems.length === 0 ? (
                  <div className="text-center py-6 text-slate-400 text-xs flex flex-col items-center gap-2">
                    <CheckCircle className="w-8 h-8 text-emerald-400" />
                    <span>Semua stok komponen berada dalam batas aman ROP!</span>
                  </div>
                ) : (
                  criticalItems.map((item) => {
                    const analysis = allTSBAnalyses.get(item.id);
                    return (
                      <div
                        key={item.id}
                        className="p-3 rounded-xl bg-slate-800/70 border border-slate-700/60 text-xs space-y-1.5"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-white truncate max-w-[190px]">
                            {item.name}
                          </span>
                          <span className="text-[10px] font-mono text-rose-400 bg-rose-950/80 px-1.5 py-0.2 rounded border border-rose-800/60 font-bold">
                            Stok: {item.currentStock}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-[11px] text-slate-400">
                          <span>ROP: {analysis?.reorderPoint} pcs</span>
                          <button
                            onClick={() => {
                              createRestockOrder(
                                item.id,
                                analysis?.recommendedRestockQty || 10,
                                'Restok Otomatis via Dropdown Notifikasi'
                              );
                              setIsNotifOpen(false);
                            }}
                            className="text-emerald-400 hover:text-emerald-300 font-bold flex items-center gap-1 cursor-pointer"
                          >
                            <PackagePlus className="w-3.5 h-3.5" />
                            <span>Pesan (+{analysis?.recommendedRestockQty || 10})</span>
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              <div className="p-2.5 border-t border-slate-800 bg-slate-850/80 text-center">
                <button
                  onClick={() => {
                    onSelectMenu('inventory');
                    setIsNotifOpen(false);
                  }}
                  className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold"
                >
                  Lihat Semua Monitoring Stok &rarr;
                </button>
              </div>
            </div>
          )}
        </div>

        {/* View Storefront Quick Button */}
        <button
          onClick={() => setActiveView('storefront')}
          className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-750 border border-slate-700 transition cursor-pointer"
          title="Buka Toko / Landing Page"
        >
          <Store className="w-3.5 h-3.5 text-emerald-400" />
          <span>Lihat Toko</span>
          <ExternalLink className="w-3 h-3 text-slate-400" />
        </button>
      </div>
    </header>
  );
};
