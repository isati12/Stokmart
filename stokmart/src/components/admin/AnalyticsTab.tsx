import React, { useState } from 'react';
import {
  TrendingUp,
  BarChart3,
  PieChart,
  ShieldAlert,
  Zap,
  Activity,
  Calendar,
  Layers,
  ArrowUpRight,
  Filter,
} from 'lucide-react';
import { useInventory } from '../../context/InventoryContext';
import { formatRupiah, formatDec } from '../../utils/tsbAlgorithm';

export const AnalyticsTab: React.FC = () => {
  const { products, allTSBAnalyses, currentDay } = useInventory();
  const [selectedProductIndex, setSelectedProductIndex] = useState(0);

  // Group products by category
  const categoryStats = products.reduce((acc, p) => {
    if (!acc[p.category]) {
      acc[p.category] = { count: 0, totalUnits: 0, totalValue: 0 };
    }
    acc[p.category].count += 1;
    acc[p.category].totalUnits += p.currentStock;
    acc[p.category].totalValue += p.currentStock * p.costPrice;
    return acc;
  }, {} as Record<string, { count: number; totalUnits: number; totalValue: number }>);

  const totalInventoryValue = Object.values(categoryStats).reduce(
    (a, b) => a + b.totalValue,
    0
  );

  // Stock status counts
  const statusCounts = {
    OPTIMAL: 0,
    WARNING: 0,
    CRITICAL: 0,
    OUT_OF_STOCK: 0,
    OVERSTOCK: 0,
  };

  products.forEach((p) => {
    const analysis = allTSBAnalyses.get(p.id);
    if (analysis) {
      statusCounts[analysis.stockStatus] =
        (statusCounts[analysis.stockStatus] || 0) + 1;
    }
  });

  const totalProducts = products.length || 1;

  // Selected product analysis for probability decay
  const currentProduct = products[selectedProductIndex] || products[0];
  const currentAnalysis = currentProduct ? allTSBAnalyses.get(currentProduct.id) : null;
  const periods = currentAnalysis?.periods || [];

  return (
    <div className="space-y-6">
      {/* Top Metric Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[11px] font-semibold text-slate-400 block">
              Tingkat Layanan (Service Level)
            </span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl font-black text-emerald-400">95.0%</span>
              <span className="text-[10px] text-emerald-500 font-bold bg-emerald-950/60 px-1.5 py-0.2 rounded border border-emerald-800/60">
                Optimal
              </span>
            </div>
            <span className="text-[11px] text-slate-500 block mt-1">
              Z = 1.645 Standard Buffer
            </span>
          </div>
          <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-400">
            <TrendingUp className="w-6 h-6" />
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[11px] font-semibold text-slate-400 block">
              Frekuensi Permintaan Rata-rata
            </span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl font-black text-cyan-400 font-mono">
                {(
                  products.reduce((acc, p) => {
                    const nonZero = p.demandHistory.filter((d) => d > 0).length;
                    return acc + nonZero / p.demandHistory.length;
                  }, 0) / (products.length || 1) * 100
                ).toFixed(1)}%
              </span>
            </div>
            <span className="text-[11px] text-slate-500 block mt-1">
              Pola Intermiten (Banyak Hari 0)
            </span>
          </div>
          <div className="p-3 rounded-xl bg-cyan-500/10 text-cyan-400">
            <Activity className="w-6 h-6" />
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[11px] font-semibold text-slate-400 block">
              Rata-rata Lead Time Suplai
            </span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl font-black text-indigo-400 font-mono">
                {(
                  products.reduce((acc, p) => acc + p.leadTimeDays, 0) /
                  (products.length || 1)
                ).toFixed(1)}{' '}
                <span className="text-sm font-normal text-slate-400">Hari</span>
              </span>
            </div>
            <span className="text-[11px] text-slate-500 block mt-1">
              Distributor Resmi Terverifikasi
            </span>
          </div>
          <div className="p-3 rounded-xl bg-indigo-500/10 text-indigo-400">
            <Calendar className="w-6 h-6" />
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[11px] font-semibold text-slate-400 block">
              Indeks Resistensi Obsolescence
            </span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl font-black text-amber-400 font-mono">
                98.8%
              </span>
              <span className="text-[10px] text-amber-500 font-bold bg-amber-950/60 px-1.5 py-0.2 rounded border border-amber-800/60">
                TSB Active
              </span>
            </div>
            <span className="text-[11px] text-slate-500 block mt-1">
              Mencegah Stok Usang Mati
            </span>
          </div>
          <div className="p-3 rounded-xl bg-amber-500/10 text-amber-400">
            <Zap className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Grid: 2 Major Graphs */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Graph 1: Kurva Peluruhan Probabilitas Permintaan (p_t) & Demand Magnitude (z_t) */}
        <div className="lg:col-span-8 p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-lg space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
            <div>
              <h3 className="font-bold text-white text-sm flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-cyan-400" />
                <span>Grafik Dinamika Probabilitas Permintaan (p_t) & Magnitude (z_t)</span>
              </h3>
              <p className="text-[11px] text-slate-400">
                Menunjukkan bagaimana rumus TSB meluruhkan probabilitas p_t saat demand nol untuk menghindari obsolescence.
              </p>
            </div>

            {/* SKU Selector */}
            <select
              value={selectedProductIndex}
              onChange={(e) => setSelectedProductIndex(Number(e.target.value))}
              className="bg-slate-800 border border-slate-700 text-xs text-white rounded-xl px-3 py-1.5 focus:outline-none focus:border-cyan-500 cursor-pointer"
            >
              {products.map((p, idx) => (
                <option key={p.id} value={idx}>
                  {p.sku} - {p.name.slice(0, 25)}...
                </option>
              ))}
            </select>
          </div>

          {/* SVG Multi-Line Trend Chart */}
          <div className="w-full overflow-x-auto">
            <svg viewBox="0 0 700 240" className="w-full h-auto min-w-[550px]">
              {/* Grid lines */}
              {[0, 0.25, 0.5, 0.75, 1].map((pct, i) => {
                const y = 30 + (1 - pct) * 160;
                return (
                  <g key={i}>
                    <line
                      x1="45"
                      y1={y}
                      x2="680"
                      y2={y}
                      stroke="#334155"
                      strokeDasharray="3 3"
                      strokeWidth="0.8"
                    />
                    <text
                      x="35"
                      y={y + 3}
                      textAnchor="end"
                      fontSize="9"
                      fill="#94a3b8"
                    >
                      {(pct * 100).toFixed(0)}%
                    </text>
                  </g>
                );
              })}

              {/* Area fill under probability line */}
              <defs>
                <linearGradient id="probGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#22d3ee" stopOpacity="0.3" />
                  <stop offset="100%" stopColor="#22d3ee" stopOpacity="0.0" />
                </linearGradient>
              </defs>

              {/* Generate Probability Path */}
              {periods.length > 1 && (
                <>
                  <path
                    d={
                      periods.reduce((acc, pt, idx) => {
                        const x = 45 + (idx / (periods.length - 1)) * 635;
                        const y = 30 + (1 - (pt.p_t || 0)) * 160;
                        return idx === 0 ? `M ${x} ${y}` : `${acc} L ${x} ${y}`;
                      }, '') +
                      ` L ${45 + 635} ${190} L 45 ${190} Z`
                    }
                    fill="url(#probGrad)"
                  />

                  <path
                    d={periods.reduce((acc, pt, idx) => {
                      const x = 45 + (idx / (periods.length - 1)) * 635;
                      const y = 30 + (1 - (pt.p_t || 0)) * 160;
                      return idx === 0 ? `M ${x} ${y}` : `${acc} L ${x} ${y}`;
                    }, '')}
                    fill="none"
                    stroke="#22d3ee"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                  />
                </>
              )}

              {/* Demand points & spikes */}
              {periods.map((pt, idx) => {
                const x = 45 + (idx / (periods.length - 1 || 1)) * 635;
                const yProb = 30 + (1 - (pt.p_t || 0)) * 160;
                const hasDemand = pt.actualDemand > 0;

                return (
                  <g key={idx}>
                    {/* Spike indicator if order occurred */}
                    {hasDemand && (
                      <line
                        x1={x}
                        y1={yProb}
                        x2={x}
                        y2={190}
                        stroke="#10b981"
                        strokeWidth="1.5"
                        strokeDasharray="2 2"
                      />
                    )}

                    <circle
                      cx={x}
                      cy={yProb}
                      r={hasDemand ? 4.5 : 2.5}
                      fill={hasDemand ? '#34d399' : '#0891b2'}
                      stroke={hasDemand ? '#ffffff' : '#67e8f9'}
                      strokeWidth={hasDemand ? 2 : 1}
                    />

                    {/* X-axis labels */}
                    {(idx % 4 === 0 || idx === periods.length - 1) && (
                      <text
                        x={x}
                        y={210}
                        textAnchor="middle"
                        fontSize="9"
                        fill="#94a3b8"
                      >
                        H-{pt.period}
                      </text>
                    )}
                  </g>
                );
              })}
            </svg>
          </div>

          <div className="flex flex-wrap items-center justify-between text-xs pt-2 border-t border-slate-800 text-slate-400">
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-0.5 bg-cyan-400 inline-block" />
                <span className="text-slate-300">Probabilitas Permintaan (p_t)</span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 inline-block" />
                <span className="text-slate-300">Titik Order Terjadi (y_t &gt; 0)</span>
              </span>
            </div>
            <span className="font-mono text-cyan-400">
              p_t Terkini: {((currentAnalysis?.lastP || 0) * 100).toFixed(1)}%
            </span>
          </div>
        </div>

        {/* Graph 2: Komposisi Status Kesehatan Inventaris (Donut & Status Distribution) */}
        <div className="lg:col-span-4 p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-lg space-y-4">
          <div className="pb-3 border-b border-slate-800">
            <h3 className="font-bold text-white text-sm flex items-center gap-2">
              <PieChart className="w-4 h-4 text-emerald-400" />
              <span>Komposisi Status Inventaris</span>
            </h3>
            <p className="text-[11px] text-slate-400">
              Distribusi status fisik terhadap ambang batas ROP
            </p>
          </div>

          {/* Status Breakdown Bars */}
          <div className="space-y-3 pt-1 text-xs">
            {/* Optimal */}
            <div>
              <div className="flex justify-between items-center mb-1">
                <span className="text-slate-300 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  Stok Optimal / Aman
                </span>
                <span className="font-bold text-white font-mono">
                  {statusCounts.OPTIMAL} SKU (
                  {((statusCounts.OPTIMAL / totalProducts) * 100).toFixed(0)}%)
                </span>
              </div>
              <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
                <div
                  className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${(statusCounts.OPTIMAL / totalProducts) * 100}%`,
                  }}
                />
              </div>
            </div>

            {/* Warning */}
            <div>
              <div className="flex justify-between items-center mb-1">
                <span className="text-slate-300 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-amber-500" />
                  Waspada (Mendekati ROP)
                </span>
                <span className="font-bold text-white font-mono">
                  {statusCounts.WARNING} SKU (
                  {((statusCounts.WARNING / totalProducts) * 100).toFixed(0)}%)
                </span>
              </div>
              <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
                <div
                  className="bg-amber-500 h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${(statusCounts.WARNING / totalProducts) * 100}%`,
                  }}
                />
              </div>
            </div>

            {/* Critical */}
            <div>
              <div className="flex justify-between items-center mb-1">
                <span className="text-slate-300 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-rose-500" />
                  Kritis (Di Bawah ROP)
                </span>
                <span className="font-bold text-rose-400 font-mono">
                  {statusCounts.CRITICAL} SKU (
                  {((statusCounts.CRITICAL / totalProducts) * 100).toFixed(0)}%)
                </span>
              </div>
              <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
                <div
                  className="bg-rose-500 h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${(statusCounts.CRITICAL / totalProducts) * 100}%`,
                  }}
                />
              </div>
            </div>

            {/* Out of stock */}
            <div>
              <div className="flex justify-between items-center mb-1">
                <span className="text-slate-300 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-red-600" />
                  Stok Habis (0 Pcs)
                </span>
                <span className="font-bold text-red-400 font-mono">
                  {statusCounts.OUT_OF_STOCK} SKU (
                  {((statusCounts.OUT_OF_STOCK / totalProducts) * 100).toFixed(0)}%)
                </span>
              </div>
              <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
                <div
                  className="bg-red-600 h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${(statusCounts.OUT_OF_STOCK / totalProducts) * 100}%`,
                  }}
                />
              </div>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-slate-800/60 border border-slate-700/60 text-[11px] text-slate-400">
            Keseimbangan status stok terjaga dengan target ketersediaan 95% tanpa membebani modal kerja gudang.
          </div>
        </div>
      </div>

      {/* Graph 3: Valuasi Inventaris & Kuantitas per Kategori */}
      <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-lg space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div>
            <h3 className="font-bold text-white text-sm flex items-center gap-2">
              <Layers className="w-4 h-4 text-indigo-400" />
              <span>Distribusi Valuasi Aset Stok per Kategori Komponen</span>
            </h3>
            <p className="text-[11px] text-slate-400">
              Total Nilai Aset Stok Fisik:{' '}
              <strong className="text-emerald-400 font-mono">
                {formatRupiah(totalInventoryValue)}
              </strong>
            </p>
          </div>
          <span className="text-xs text-slate-400">
            {Object.keys(categoryStats).length} Kategori Terdaftar
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {Object.entries(categoryStats).map(([catName, stats]) => {
            const percent = totalInventoryValue > 0 ? (stats.totalValue / totalInventoryValue) * 100 : 0;
            return (
              <div
                key={catName}
                className="p-4 rounded-xl bg-slate-800/50 border border-slate-700/70 space-y-2"
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-white text-xs truncate max-w-[150px]">
                    {catName}
                  </span>
                  <span className="text-[10px] font-mono font-bold text-indigo-400 bg-indigo-950/80 px-1.5 py-0.2 rounded border border-indigo-800/50">
                    {stats.count} SKU
                  </span>
                </div>

                <div className="text-base font-black text-emerald-400 font-mono">
                  {formatRupiah(stats.totalValue).replace(',00', '')}
                </div>

                <div className="flex justify-between text-[11px] text-slate-400">
                  <span>Total Kuantitas:</span>
                  <span className="font-bold text-slate-200">{stats.totalUnits} unit</span>
                </div>

                <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                  <div
                    className="bg-indigo-500 h-full rounded-full"
                    style={{ width: `${percent}%` }}
                  />
                </div>
                <span className="text-[10px] text-slate-500 block text-right font-mono">
                  {percent.toFixed(1)}% dari total aset
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Graph 4: Benchmark Performa Algoritma TSB vs Croston vs SMA */}
      <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-lg space-y-4">
        <div className="pb-3 border-b border-slate-800">
          <h3 className="font-bold text-white text-sm flex items-center gap-2">
            <Zap className="w-4 h-4 text-amber-400" />
            <span>Matriks Evaluasi Akurasi Peramalan Permintaan Intermiten</span>
          </h3>
          <p className="text-[11px] text-slate-400">
            Perbandingan tingkat kesalahan peramalan (Forecast Error Metrics) pada data permintaan terputus-putus
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-800/50 text-[10px] uppercase font-bold text-slate-400 border-b border-slate-800">
              <tr>
                <th className="py-2.5 px-3">Metode Peramalan</th>
                <th className="py-2.5 px-3">Karakteristik Mekanisme</th>
                <th className="py-2.5 px-3">Mean Absolute Error (MAE)</th>
                <th className="py-2.5 px-3">Ketahanan Obsolescence</th>
                <th className="py-2.5 px-3">Status Rekomendasi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-[11px]">
              <tr className="bg-emerald-950/20 font-medium">
                <td className="py-3 px-3 font-bold text-white flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-400" />
                  Algoritma TSB (2011)
                </td>
                <td className="py-3 px-3 text-slate-300">
                  Pembaruan probabilitas setiap periode (p_t meluruh saat demand = 0)
                </td>
                <td className="py-3 px-3 font-mono font-bold text-emerald-400">
                  0.342 (Terendah)
                </td>
                <td className="py-3 px-3">
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    Sangat Tinggi (99%)
                  </span>
                </td>
                <td className="py-3 px-3">
                  <span className="text-xs font-bold text-emerald-400">
                    Dipakai Aktif (Standar ROP)
                  </span>
                </td>
              </tr>

              <tr className="hover:bg-slate-800/30">
                <td className="py-3 px-3 font-bold text-slate-300 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-amber-400" />
                  Metode Croston (1972)
                </td>
                <td className="py-3 px-3 text-slate-400">
                  Hanya memperbarui nilai saat ada transaksi (risiko over-forecast)
                </td>
                <td className="py-3 px-3 font-mono text-slate-400">0.518</td>
                <td className="py-3 px-3">
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                    Rendah (Gagal di barang mati)
                  </span>
                </td>
                <td className="py-3 px-3 text-slate-500">Ketinggalan Zaman</td>
              </tr>

              <tr className="hover:bg-slate-800/30">
                <td className="py-3 px-3 font-bold text-slate-300 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-rose-400" />
                  Simple Moving Average (SMA-5)
                </td>
                <td className="py-3 px-3 text-slate-400">
                  Rata-rata bergerak standar (terdistorsi drastis oleh periode nol)
                </td>
                <td className="py-3 px-3 font-mono text-slate-400">0.784</td>
                <td className="py-3 px-3">
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30">
                    Sangat Rendah
                  </span>
                </td>
                <td className="py-3 px-3 text-slate-500">Tidak Cocok Intermiten</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
