import React, { useState } from 'react';
import {
  Sparkles,
  Zap,
  Calendar,
  RotateCcw,
  Activity,
  ShoppingCart,
  Package,
  Boxes,
  Sliders,
  CheckCircle2,
  TrendingDown,
  Clock,
} from 'lucide-react';
import { useInventory } from '../../context/InventoryContext';

export const SimulationTab: React.FC = () => {
  const {
    currentDay,
    simulateNextDay,
    resetToSampleData,
    activityLogs,
    products,
    allTSBAnalyses,
    adjustProductStock,
  } = useInventory();

  const [logFilter, setLogFilter] = useState<string>('ALL');
  const [isSimulating, setIsSimulating] = useState(false);

  // Multi-day advance
  const handleSimulateSevenDays = () => {
    setIsSimulating(true);
    let count = 0;
    const interval = setInterval(() => {
      simulateNextDay();
      count++;
      if (count >= 7) {
        clearInterval(interval);
        setIsSimulating(false);
      }
    }, 180);
  };

  // Simulate Sudden Spike
  const handleTriggerDemandSpike = () => {
    const randomProduct = products[Math.floor(Math.random() * products.length)];
    if (!randomProduct) return;

    const spikeDemand = 6;
    const newStock = Math.max(0, randomProduct.currentStock - spikeDemand);
    adjustProductStock(
      randomProduct.id,
      newStock,
      `Simulasi Demand Shock Mendadak (${spikeDemand} unit terjual serentak)`
    );
  };

  const filteredLogs = activityLogs.filter((log) => {
    if (logFilter === 'ALL') return true;
    return log.type === logFilter;
  });

  return (
    <div className="space-y-6">
      {/* Simulation Controls Dashboard */}
      <div className="p-6 rounded-2xl bg-white dark:bg-gradient-to-r dark:from-slate-900 dark:via-indigo-950/40 dark:to-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-indigo-50 text-indigo-600 border border-indigo-100 dark:bg-indigo-500/20 dark:text-indigo-400 dark:border-indigo-500/30">
              <Sparkles className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 dark:text-white text-base flex flex-wrap items-center gap-2">
                <span>Mesin Simulator Real-Time &amp; Audit Stream TSB</span>
                <span className="text-xs bg-indigo-50 text-indigo-700 dark:bg-indigo-500/30 dark:text-indigo-300 font-mono px-2.5 py-0.5 rounded-md border border-indigo-200 dark:border-indigo-500/40 font-semibold shadow-xs">
                  Hari ke-{currentDay}
                </span>
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5 font-normal">
                Uji responsivitas rumus peramalan TSB terhadap fluktuasi permintaan intermiten harian dan periode nol penjualan.
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              if (confirm('Kembalikan semua data ke sampel awal?')) resetToSampleData();
            }}
            className="px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-700 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-750 border border-slate-200 dark:border-slate-700 transition flex items-center gap-1.5 cursor-pointer shadow-xs"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Data Sample</span>
          </button>
        </div>

        {/* Action Trigger Buttons */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
          {/* Button 1: Advance 1 Day */}
          <button
            onClick={simulateNextDay}
            disabled={isSimulating}
            className="p-3.5 rounded-xl bg-slate-50/90 hover:bg-indigo-50/50 dark:bg-slate-800/80 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700/80 hover:border-indigo-200 dark:hover:border-slate-600 text-left transition flex items-start gap-3 cursor-pointer group shadow-xs"
          >
            <div className="p-2 rounded-lg bg-emerald-50 text-emerald-600 border border-emerald-100 dark:border-transparent dark:bg-emerald-500/10 dark:text-emerald-400 group-hover:scale-110 transition-transform shrink-0">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xs font-bold text-slate-900 dark:text-white block">
                +1 Hari Simulasi
              </span>
              <span className="text-[11px] text-slate-600 dark:text-slate-400 leading-snug">
                Memajukan waktu 1 siklus hari kerja. Permintaan acak dihasilkan &amp; probabilitas diperbarui.
              </span>
            </div>
          </button>

          {/* Button 2: Advance 7 Days */}
          <button
            onClick={handleSimulateSevenDays}
            disabled={isSimulating}
            className="p-3.5 rounded-xl bg-slate-50/90 hover:bg-indigo-50/50 dark:bg-slate-800/80 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700/80 hover:border-indigo-200 dark:hover:border-slate-600 text-left transition flex items-start gap-3 cursor-pointer group disabled:opacity-50 shadow-xs"
          >
            <div className="p-2 rounded-lg bg-indigo-50 text-indigo-600 border border-indigo-100 dark:border-transparent dark:bg-indigo-500/10 dark:text-indigo-400 group-hover:scale-110 transition-transform shrink-0">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xs font-bold text-slate-900 dark:text-white block flex items-center gap-1.5">
                <span>+7 Hari Beruntun (1 Minggu)</span>
                {isSimulating && (
                  <span className="w-2 h-2 rounded-full bg-indigo-500 animate-ping" />
                )}
              </span>
              <span className="text-[11px] text-slate-600 dark:text-slate-400 leading-snug">
                Simulasi cepat 1 minggu kerja untuk mengamati laju peluruhan probabilitas (obsolescence test).
              </span>
            </div>
          </button>

          {/* Button 3: Demand Spike */}
          <button
            onClick={handleTriggerDemandSpike}
            disabled={isSimulating}
            className="p-3.5 rounded-xl bg-slate-50/90 hover:bg-indigo-50/50 dark:bg-slate-800/80 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700/80 hover:border-indigo-200 dark:hover:border-slate-600 text-left transition flex items-start gap-3 cursor-pointer group shadow-xs"
          >
            <div className="p-2 rounded-lg bg-amber-50 text-amber-600 border border-amber-100 dark:border-transparent dark:bg-amber-500/10 dark:text-amber-400 group-hover:scale-110 transition-transform shrink-0">
              <Zap className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xs font-bold text-slate-900 dark:text-white block">
                Simulasi Lonjakan Pesanan Mendadak
              </span>
              <span className="text-[11px] text-slate-600 dark:text-slate-400 leading-snug">
                Menghasilkan pesanan borongan 6 unit pada SKU acak untuk menguji respons ROP dan Safety Stock.
              </span>
            </div>
          </button>
        </div>
      </div>

      {/* Live Activity Stream & Audit Feed */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm space-y-3">
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Activity className="w-5 h-5 text-emerald-500 dark:text-emerald-400" />
            <h4 className="font-bold text-slate-900 dark:text-white text-sm">
              Log Aktivitas Real-Time &amp; Riwayat Transaksi
            </h4>
          </div>

          {/* Filter pills */}
          <div className="flex flex-wrap items-center gap-1.5 text-xs">
            {[
              { id: 'ALL', label: 'Semua Aktivitas' },
              { id: 'SALE', label: 'Penjualan' },
              { id: 'RESTOCK_ORDER', label: 'Order Restok (PO)' },
              { id: 'STOCK_RECEIVED', label: 'Barang Masuk' },
              { id: 'STOCK_ADJUSTMENT', label: 'Opname Fisik' },
            ].map((f) => (
              <button
                key={f.id}
                onClick={() => setLogFilter(f.id)}
                className={`px-2.5 py-1 rounded-lg font-medium transition cursor-pointer ${
                  logFilter === f.id
                    ? 'bg-indigo-600 text-white shadow'
                    : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200 bg-slate-100 dark:bg-slate-800/60 border border-slate-200 dark:border-transparent'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {/* Stream List */}
        <div className="p-4 space-y-3 max-h-[500px] overflow-y-auto">
          {filteredLogs.length === 0 ? (
            <div className="text-center py-8 text-slate-500 text-xs">
              Belum ada log aktivitas untuk kategori yang dipilih.
            </div>
          ) : (
            filteredLogs.map((log) => {
              const isSale = log.type === 'SALE';
              const isRestock = log.type === 'RESTOCK_ORDER';
              const isReceived = log.type === 'STOCK_RECEIVED';
              const isOpname = log.type === 'STOCK_ADJUSTMENT';

              return (
                <div
                  key={log.id}
                  className="p-3.5 rounded-xl bg-slate-50/80 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 transition flex items-start gap-3.5 text-xs"
                >
                  <div
                    className={`p-2 rounded-lg shrink-0 ${
                      isSale
                        ? 'bg-cyan-50 text-cyan-600 dark:bg-cyan-500/10 dark:text-cyan-400'
                        : isRestock
                        ? 'bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400'
                        : isReceived
                        ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400'
                        : 'bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-400'
                    }`}
                  >
                    {isSale ? (
                      <ShoppingCart className="w-4 h-4" />
                    ) : isRestock ? (
                      <Package className="w-4 h-4" />
                    ) : isReceived ? (
                      <CheckCircle2 className="w-4 h-4" />
                    ) : (
                      <Boxes className="w-4 h-4" />
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-bold text-slate-900 dark:text-white leading-tight">
                        {log.title}
                      </span>
                      <span className="text-[11px] text-slate-500 shrink-0 font-mono">
                        {log.timestamp}
                      </span>
                    </div>

                    <p className="text-slate-700 dark:text-slate-300 mt-1 leading-relaxed">
                      {log.description}
                    </p>

                    <div className="flex items-center gap-3 mt-2 text-[11px] text-slate-500 dark:text-slate-400">
                      {log.quantityChange !== undefined && (
                        <span
                          className={`font-mono font-bold ${
                            log.quantityChange > 0
                              ? 'text-emerald-600 dark:text-emerald-400'
                              : 'text-rose-600 dark:text-rose-400'
                          }`}
                        >
                          {log.quantityChange > 0
                            ? `+${log.quantityChange} unit`
                            : `${log.quantityChange} unit`}
                        </span>
                      )}
                      <span>Oleh: {log.user || 'Sistem'}</span>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
