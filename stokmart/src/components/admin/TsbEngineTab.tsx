import React, { useState } from 'react';
import {
  Sliders,
  Calculator,
  Info,
  TrendingDown,
  TrendingUp,
  ShieldCheck,
  CheckCircle2,
  Table,
  Zap,
  BookOpen,
} from 'lucide-react';
import { useInventory } from '../../context/InventoryContext';
import { TsbChart } from './TsbChart';
import {
  formatDec,
  formatRupiah,
  compareForecastingMethods,
} from '../../utils/tsbAlgorithm';

export const TsbEngineTab: React.FC<{ initialProductId?: string }> = ({
  initialProductId,
}) => {
  const {
    products,
    tsbSettings,
    updateTSBSettings,
    getTSBAnalysis,
  } = useInventory();

  const [selectedProductId, setSelectedProductId] = useState<string>(
    initialProductId || products[0]?.id || ''
  );
  const [showFormulaDetails, setShowFormulaDetails] = useState(true);
  const [showComparison, setShowComparison] = useState(true);

  const selectedProduct =
    products.find((p) => p.id === selectedProductId) || products[0];

  const tsbResult = selectedProduct
    ? getTSBAnalysis(selectedProduct.id)
    : null;

  const comparisonData = selectedProduct
    ? compareForecastingMethods(
        selectedProduct.demandHistory,
        tsbSettings.alpha,
        tsbSettings.beta,
        5
      )
    : [];

  if (!selectedProduct || !tsbResult) {
    return <div>Pilih produk untuk menganalisis data algoritma TSB</div>;
  }

  return (
    <div className="space-y-6">
      {/* Parameter Control & Configuration Bar */}
      <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-lg space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-white text-base">
                Penyetelan Parameter Mesin Algoritma TSB
              </h3>
              <p className="text-xs text-slate-400">
                Sesuaikan faktor pemulusan (smoothing factors) dan target service level inventaris.
              </p>
            </div>
          </div>

          {/* Product selector */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400 font-medium">Pilih SKU:</span>
            <select
              value={selectedProduct.id}
              onChange={(e) => setSelectedProductId(e.target.value)}
              className="bg-slate-800 border border-slate-700 text-white rounded-xl px-3 py-1.5 text-xs font-semibold focus:outline-none focus:border-cyan-500 max-w-xs cursor-pointer"
            >
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.sku} - {p.name.slice(0, 30)}...
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Sliders Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-1">
          {/* Alpha Slider */}
          <div className="space-y-2 p-3.5 rounded-xl bg-slate-800/40 border border-slate-700/60">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-200">
                Alpha (α) - Smoothing Besaran Demand
              </span>
              <span className="font-mono font-bold text-cyan-400 bg-cyan-950/80 px-2 py-0.5 rounded border border-cyan-800/60">
                {tsbSettings.alpha.toFixed(2)}
              </span>
            </div>
            <input
              type="range"
              min="0.05"
              max="0.50"
              step="0.01"
              value={tsbSettings.alpha}
              onChange={(e) => updateTSBSettings({ alpha: parseFloat(e.target.value) })}
              className="w-full accent-cyan-500 cursor-pointer h-1.5 bg-slate-700 rounded-lg appearance-none"
            />
            <p className="text-[11px] text-slate-400 leading-snug">
              Mengatur bobot pembaruan magnitude demand saat order terjadi (z_t = α·y_t + (1-α)·z_(t-1)).
            </p>
          </div>

          {/* Beta Slider */}
          <div className="space-y-2 p-3.5 rounded-xl bg-slate-800/40 border border-slate-700/60">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-200">
                Beta (β) - Smoothing Probabilitas
              </span>
              <span className="font-mono font-bold text-amber-400 bg-amber-950/80 px-2 py-0.5 rounded border border-amber-800/60">
                {tsbSettings.beta.toFixed(2)}
              </span>
            </div>
            <input
              type="range"
              min="0.05"
              max="0.50"
              step="0.01"
              value={tsbSettings.beta}
              onChange={(e) => updateTSBSettings({ beta: parseFloat(e.target.value) })}
              className="w-full accent-amber-500 cursor-pointer h-1.5 bg-slate-700 rounded-lg appearance-none"
            />
            <p className="text-[11px] text-slate-400 leading-snug">
              Mengontrol laju peluruhan probabilitas (p_t = (1-β)·p_(t-1)) saat tidak ada order (zero demand).
            </p>
          </div>

          {/* Service Level Select */}
          <div className="space-y-2 p-3.5 rounded-xl bg-slate-800/40 border border-slate-700/60">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-200">Target Service Level (SL)</span>
              <span className="font-mono font-bold text-emerald-400 bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-800/60">
                {(tsbSettings.serviceLevel * 100).toFixed(0)}%
              </span>
            </div>
            <div className="grid grid-cols-4 gap-1.5 pt-1">
              {[0.90, 0.95, 0.98, 0.99].map((lvl) => (
                <button
                  key={lvl}
                  onClick={() => updateTSBSettings({ serviceLevel: lvl })}
                  className={`py-1.5 text-xs font-bold rounded-lg border transition cursor-pointer ${
                    tsbSettings.serviceLevel === lvl
                      ? 'bg-emerald-600 border-emerald-500 text-white shadow'
                      : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-white'
                  }`}
                >
                  {(lvl * 100).toFixed(0)}%
                </button>
              ))}
            </div>
            <p className="text-[11px] text-slate-400 leading-snug">
              Z-score untuk Safety Stock: Z ={' '}
              {tsbSettings.serviceLevel === 0.9 ? '1.28' : tsbSettings.serviceLevel === 0.95 ? '1.65' : tsbSettings.serviceLevel === 0.98 ? '2.05' : '2.33'}.
            </p>
          </div>
        </div>
      </div>

      {/* Main Analysis Summary Cards for Selected Product */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Forecast Demand Per Hari */}
        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800">
          <span className="text-[11px] text-slate-400 block font-medium">
            Forecast Demand Harian (ŷ_t+1)
          </span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-black text-cyan-400 font-mono">
              {formatDec(tsbResult.forecastPerDay, 4)}
            </span>
            <span className="text-xs text-slate-500">unit/hari</span>
          </div>
          <div className="text-[11px] text-slate-400 mt-2 pt-2 border-t border-slate-800 flex justify-between">
            <span>z_t: {formatDec(tsbResult.lastZ, 3)}</span>
            <span>p_t: {formatDec(tsbResult.lastP * 100, 1)}%</span>
          </div>
        </div>

        {/* Safety Stock */}
        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800">
          <span className="text-[11px] text-slate-400 block font-medium">
            Safety Stock (SS) Cadangan
          </span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-black text-rose-400 font-mono">
              {tsbResult.safetyStock}
            </span>
            <span className="text-xs text-slate-500">{selectedProduct.unit}</span>
          </div>
          <div className="text-[11px] text-slate-400 mt-2 pt-2 border-t border-slate-800 flex justify-between">
            <span>Lead Time: {selectedProduct.leadTimeDays} Hari</span>
            <span>σ: {formatDec(tsbResult.standardDeviation, 2)}</span>
          </div>
        </div>

        {/* Reorder Point (ROP) */}
        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800">
          <span className="text-[11px] text-slate-400 block font-medium">
            Reorder Point (ROP) Batas Pesan
          </span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-black text-amber-400 font-mono">
              {tsbResult.reorderPoint}
            </span>
            <span className="text-xs text-slate-500">{selectedProduct.unit}</span>
          </div>
          <div className="text-[11px] text-slate-400 mt-2 pt-2 border-t border-slate-800 flex justify-between">
            <span>Demand Saat LT: {formatDec(tsbResult.demandDuringLeadTime, 2)}</span>
            <span>+ SS: {tsbResult.safetyStock}</span>
          </div>
        </div>

        {/* Rekomendasi Restok Sekarang */}
        <div className={`p-4 rounded-2xl border ${
          tsbResult.recommendedRestockQty > 0
            ? 'bg-emerald-950/20 border-emerald-800/80'
            : 'bg-slate-900 border-slate-800'
        }`}>
          <span className="text-[11px] text-slate-400 block font-medium">
            Rekomendasi Pemesanan Restok
          </span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className={`text-2xl font-black font-mono ${
              tsbResult.recommendedRestockQty > 0 ? 'text-emerald-400' : 'text-slate-400'
            }`}>
              {tsbResult.recommendedRestockQty > 0
                ? `+${tsbResult.recommendedRestockQty}`
                : '0'}
            </span>
            <span className="text-xs text-slate-500">{selectedProduct.unit}</span>
          </div>
          <div className="text-[11px] text-slate-400 mt-2 pt-2 border-t border-slate-800 flex justify-between">
            <span>Stok Fisik: {selectedProduct.currentStock}</span>
            <span>Order-Up-To (S): {tsbResult.orderUpToLevel}</span>
          </div>
        </div>
      </div>

      {/* SVG Interactive Chart */}
      <TsbChart
        periods={tsbResult.periods}
        reorderPoint={tsbResult.reorderPoint}
        safetyStock={tsbResult.safetyStock}
        productName={selectedProduct.name}
      />

      {/* Scientific Explanation & Mathematical Formulas */}
      <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-indigo-400" />
            <h4 className="font-bold text-white text-sm">
              Formulasi Matematika Algoritma TSB (Teunter-Syntetos-Babai 2011)
            </h4>
          </div>
          <button
            onClick={() => setShowFormulaDetails(!showFormulaDetails)}
            className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold cursor-pointer"
          >
            {showFormulaDetails ? 'Sembunyikan' : 'Tampilkan Rumus Lengkap'}
          </button>
        </div>

        {showFormulaDetails && (
          <div className="space-y-4 text-xs text-slate-300 pt-1">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Box 1: Kondisi Jika Ada Permintaan */}
              <div className="p-4 rounded-xl bg-slate-800/60 border border-slate-700/60 space-y-2">
                <span className="font-bold text-emerald-400 block text-xs flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4" /> Kasus 1: Ada Permintaan (y_t &gt; 0)
                </span>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Ketika terjadi transaksi penjualan aktual, estimasi magnitude permintaan (z_t) dan probabilitas permintaan (p_t) keduanya diperbarui:
                </p>
                <div className="p-2.5 rounded-lg bg-slate-900/90 font-mono text-cyan-300 text-[11px] space-y-1">
                  <div>z_t = α · y_t + (1 - α) · z_(t-1)</div>
                  <div>p_t = β · 1 + (1 - β) · p_(t-1)</div>
                </div>
              </div>

              {/* Box 2: Kondisi Jika Tidak Ada Permintaan */}
              <div className="p-4 rounded-xl bg-slate-800/60 border border-slate-700/60 space-y-2">
                <span className="font-bold text-amber-400 block text-xs flex items-center gap-1.5">
                  <TrendingDown className="w-4 h-4" /> Kasus 2: Nol Permintaan (y_t = 0) [Kunci TSB]
                </span>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Pada periode tanpa transaksi, magnitude (z_t) tetap dipertahankan, namun probabilitas (p_t) meluruh secara eksponensial anggun:
                </p>
                <div className="p-2.5 rounded-lg bg-slate-900/90 font-mono text-amber-300 text-[11px] space-y-1">
                  <div>z_t = z_(t-1)  (tidak berubah)</div>
                  <div>p_t = (1 - β) · p_(t-1)  (meluruh turun)</div>
                </div>
              </div>
            </div>

            {/* Box 3: Perhitungan ROP & Safety Stock */}
            <div className="p-4 rounded-xl bg-indigo-950/30 border border-indigo-900/60 space-y-2 text-xs">
              <span className="font-bold text-indigo-300 block">
                Perhitungan Reorder Point (ROP) & Safety Stock (SS)
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                <div className="p-2.5 rounded-lg bg-slate-900/80 font-mono text-[11px]">
                  <span className="text-slate-400 block text-[10px]">Forecast Per Periode (ŷ):</span>
                  <span className="text-cyan-400 font-bold">ŷ_(t+1) = z_t × p_t</span>
                </div>
                <div className="p-2.5 rounded-lg bg-slate-900/80 font-mono text-[11px]">
                  <span className="text-slate-400 block text-[10px]">Safety Stock (SS):</span>
                  <span className="text-rose-400 font-bold">SS = Z × √(Lead Time) × σ</span>
                </div>
                <div className="p-2.5 rounded-lg bg-slate-900/80 font-mono text-[11px]">
                  <span className="text-slate-400 block text-[10px]">Reorder Point (ROP):</span>
                  <span className="text-amber-400 font-bold">ROP = (ŷ × Lead Time) + SS</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Step-by-Step Mathematical Trace Table */}
      <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-lg space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Table className="w-5 h-5 text-cyan-400" />
            <h4 className="font-bold text-white text-sm">
              Tabel Iterasi Step-by-Step TSB: {selectedProduct.sku}
            </h4>
          </div>
          <span className="text-xs text-slate-400">
            Total {tsbResult.periods.length} Periode Pengamatan
          </span>
        </div>

        <div className="overflow-x-auto max-h-72 border border-slate-800 rounded-xl">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="sticky top-0 bg-slate-800 text-[10px] uppercase font-bold text-slate-400 border-b border-slate-700">
              <tr>
                <th className="py-2.5 px-3">Periode</th>
                <th className="py-2.5 px-3">Permintaan Riil (y_t)</th>
                <th className="py-2.5 px-3">Status Periode</th>
                <th className="py-2.5 px-3">Demand Size (z_t)</th>
                <th className="py-2.5 px-3">Probabilitas (p_t)</th>
                <th className="py-2.5 px-3">Forecast TSB (ŷ_t)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 font-mono text-[11px]">
              {tsbResult.periods.map((period, i) => (
                <tr
                  key={i}
                  className={`hover:bg-slate-800/40 ${
                    period.actualDemand > 0 ? 'bg-emerald-950/20' : ''
                  }`}
                >
                  <td className="py-2 px-3 text-slate-400">{period.label}</td>
                  <td className="py-2 px-3 font-bold">
                    <span
                      className={
                        period.actualDemand > 0 ? 'text-emerald-400' : 'text-slate-500'
                      }
                    >
                      {period.actualDemand} unit
                    </span>
                  </td>
                  <td className="py-2 px-3">
                    {period.actualDemand > 0 ? (
                      <span className="text-[10px] text-emerald-400 font-sans">
                        Order Terjadi
                      </span>
                    ) : (
                      <span className="text-[10px] text-slate-500 font-sans">
                        Zero Demand (p_t turun)
                      </span>
                    )}
                  </td>
                  <td className="py-2 px-3 text-indigo-300">{period.z_t?.toFixed(4)}</td>
                  <td className="py-2 px-3 text-amber-300">
                    {((period.p_t || 0) * 100).toFixed(2)}%
                  </td>
                  <td className="py-2 px-3 text-cyan-400 font-bold">
                    {period.forecast?.toFixed(4)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Comparison against Croston and Simple Moving Average */}
      <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-lg space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-amber-400" />
            <h4 className="font-bold text-white text-sm">
              Perbandingan: TSB vs Metode Croston vs Moving Average (SMA)
            </h4>
          </div>
          <button
            onClick={() => setShowComparison(!showComparison)}
            className="text-xs text-amber-400 hover:text-amber-300 font-semibold cursor-pointer"
          >
            {showComparison ? 'Sembunyikan' : 'Tampilkan Analisis Benchmark'}
          </button>
        </div>

        {showComparison && (
          <div className="space-y-4">
            <p className="text-xs text-slate-300 leading-relaxed">
              Metode Croston tradisional hanya memperbarui forecast saat ada permintaan positif. Jika suatu produk mendadak usang (obsolete) dan tidak ada lagi yang membeli, Croston akan terus memprediksi permintaan tinggi masa lalu selamanya. TSB memperbaiki kekurangan fatal ini dengan terus memperbarui probabilitas setiap periode.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
              <div className="p-3.5 rounded-xl bg-cyan-950/30 border border-cyan-800/50 space-y-1.5">
                <span className="font-bold text-cyan-300 block text-xs">1. Algoritma TSB (Dipakai)</span>
                <p className="text-[11px] text-slate-300 leading-relaxed">
                  ✅ Sangat akurat untuk suku cadang intermiten. Probabilitas meluruh saat demand nol, mencegah overstock barang usang.
                </p>
                <div className="pt-1 text-[11px] font-mono text-cyan-400 font-bold">
                  Latest Forecast: {formatDec(tsbResult.forecastPerDay, 3)} unit/hari
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-800/40 border border-slate-700/60 space-y-1.5">
                <span className="font-bold text-slate-300 block text-xs">2. Metode Croston (1972)</span>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  ⚠️ Hanya memperbarui nilai saat y_t &gt; 0. Tidak mendeteksi barang mati (obsolescence) jika tidak ada order baru.
                </p>
                <div className="pt-1 text-[11px] font-mono text-slate-400 font-semibold">
                  Macet pada magnitude historis
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-800/40 border border-slate-700/60 space-y-1.5">
                <span className="font-bold text-slate-300 block text-xs">3. Simple Moving Average (SMA)</span>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  ❌ Terdistorsi parah oleh periode 0. Sering menghasilkan fluktuasi tajam (bullwhip effect) pada rantai pasok.
                </p>
                <div className="pt-1 text-[11px] font-mono text-slate-400 font-semibold">
                  Jeda waktu tinggi & bias nol
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
