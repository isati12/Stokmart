import React, { useState } from 'react';
import {
  Search,
  Filter,
  AlertTriangle,
  CheckCircle,
  PackagePlus,
  TrendingUp,
  Sliders,
  DollarSign,
  Boxes,
  Clock,
  Sparkles,
  ArrowUpRight,
  ShieldAlert,
  ChevronRight,
  RefreshCw,
  Camera,
  Upload,
} from 'lucide-react';
import { useInventory } from '../../context/InventoryContext';
import { formatRupiah, formatDec } from '../../utils/tsbAlgorithm';
import { Product } from '../../types/inventory';

export const InventoryOverviewTab: React.FC<{ onNavigateToTsb: (productId: string) => void }> = ({
  onNavigateToTsb,
}) => {
  const {
    products,
    allTSBAnalyses,
    createRestockOrder,
    adjustProductStock,
    currentDay,
    simulateNextDay,
  } = useInventory();

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [selectedRestockProduct, setSelectedRestockProduct] = useState<Product | null>(null);
  const [restockQty, setRestockQty] = useState<number>(10);
  const [selectedOpnameProduct, setSelectedOpnameProduct] = useState<Product | null>(null);
  const [opnameStock, setOpnameStock] = useState<number>(0);
  const [opnameReason, setOpnameReason] = useState<string>('Stock Opname Rutin Gudang');
  const [opnamePhotos, setOpnamePhotos] = useState<string[]>([]);

  // KPI Calculations
  const totalSku = products.length;
  const totalStockUnits = products.reduce((acc, p) => acc + p.currentStock, 0);
  const totalAssetValue = products.reduce((acc, p) => acc + p.currentStock * p.costPrice, 0);

  const criticalItems = products.filter((p) => {
    const analysis = allTSBAnalyses.get(p.id);
    return analysis && (analysis.stockStatus === 'CRITICAL' || analysis.stockStatus === 'OUT_OF_STOCK');
  });

  const warningItems = products.filter((p) => {
    const analysis = allTSBAnalyses.get(p.id);
    return analysis && analysis.stockStatus === 'WARNING';
  });

  // Filtered List
  const filteredProducts = products.filter((p) => {
    const analysis = allTSBAnalyses.get(p.id);
    const matchesSearch =
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.sku.toLowerCase().includes(search.toLowerCase()) ||
      p.category.toLowerCase().includes(search.toLowerCase());

    if (!matchesSearch) return false;
    if (statusFilter === 'ALL') return true;
    if (statusFilter === 'CRITICAL')
      return analysis?.stockStatus === 'CRITICAL' || analysis?.stockStatus === 'OUT_OF_STOCK';
    if (statusFilter === 'WARNING') return analysis?.stockStatus === 'WARNING';
    if (statusFilter === 'OPTIMAL') return analysis?.stockStatus === 'OPTIMAL';
    if (statusFilter === 'OVERSTOCK') return analysis?.stockStatus === 'OVERSTOCK';
    return true;
  });

  const handleOpenRestock = (product: Product) => {
    const analysis = allTSBAnalyses.get(product.id);
    const recommended = analysis?.recommendedRestockQty || 10;
    setSelectedRestockProduct(product);
    setRestockQty(Math.max(1, recommended));
  };

  const handleConfirmRestock = () => {
    if (!selectedRestockProduct) return;
    createRestockOrder(
      selectedRestockProduct.id,
      restockQty,
      `Order Cepat via Dashboard Overview (Stok: ${selectedRestockProduct.currentStock})`
    );
    setSelectedRestockProduct(null);
  };

  const handleOpenOpname = (product: Product) => {
    setSelectedOpnameProduct(product);
    setOpnameStock(product.currentStock);
    setOpnameReason('Stock Opname Rutin Gudang');
    setOpnamePhotos([]);
  };

  const handleConfirmOpname = () => {
    if (!selectedOpnameProduct) return;
    adjustProductStock(
      selectedOpnameProduct.id,
      opnameStock,
      opnameReason,
      opnamePhotos.length > 0 ? opnamePhotos : undefined
    );
    setSelectedOpnameProduct(null);
    setOpnamePhotos([]);
  };

  return (
    <div className="space-y-6">
      {/* 5 Top KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Total SKU */}
        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 shadow-sm flex items-center gap-3">
          <div className="p-3 rounded-xl bg-indigo-500/10 text-indigo-400">
            <Boxes className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] font-semibold text-slate-400 block">Total SKU Terdaftar</span>
            <div className="flex items-baseline gap-1.5">
              <span className="text-xl font-bold text-white">{totalSku}</span>
              <span className="text-xs text-slate-500">item</span>
            </div>
          </div>
        </div>

        {/* Di Bawah ROP / Kritis */}
        <div className={`p-4 rounded-2xl border shadow-sm flex items-center gap-3 ${
          criticalItems.length > 0
            ? 'bg-rose-950/20 border-rose-800/60 text-rose-300'
            : 'bg-slate-900 border-slate-800'
        }`}>
          <div className={`p-3 rounded-xl ${
            criticalItems.length > 0 ? 'bg-rose-500/20 text-rose-400' : 'bg-slate-800 text-slate-400'
          }`}>
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] font-semibold text-slate-400 block">Stok Kritis (≤ ROP)</span>
            <div className="flex items-baseline gap-1.5">
              <span className={`text-xl font-bold ${criticalItems.length > 0 ? 'text-rose-400' : 'text-white'}`}>
                {criticalItems.length}
              </span>
              <span className="text-xs text-slate-400">SKU perlu PO</span>
            </div>
          </div>
        </div>

        {/* Nilai Aset Inventaris */}
        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 shadow-sm flex items-center gap-3">
          <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-400">
            <DollarSign className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] font-semibold text-slate-400 block">Nilai Aset Stok Fisik</span>
            <div className="flex items-baseline gap-1.5">
              <span className="text-lg font-bold text-white">
                {formatRupiah(totalAssetValue).replace(',00', '')}
              </span>
            </div>
          </div>
        </div>

        {/* Total Unit Stok */}
        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 shadow-sm flex items-center gap-3">
          <div className="p-3 rounded-xl bg-cyan-500/10 text-cyan-400">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] font-semibold text-slate-400 block">Total Kuantitas Fisik</span>
            <div className="flex items-baseline gap-1.5">
              <span className="text-xl font-bold text-white">{totalStockUnits}</span>
              <span className="text-xs text-slate-400">unit</span>
            </div>
          </div>
        </div>

        {/* Service Level TSB Target */}
        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 shadow-sm flex items-center gap-3">
          <div className="p-3 rounded-xl bg-amber-500/10 text-amber-400">
            <Sliders className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] font-semibold text-slate-400 block">Target Ketersediaan</span>
            <div className="flex items-baseline gap-1.5">
              <span className="text-xl font-bold text-amber-400">95.0%</span>
              <span className="text-xs text-slate-400">TSB Buffer</span>
            </div>
          </div>
        </div>
      </div>

      {/* Urgent Restock Callout Banner */}
      {criticalItems.length > 0 && (
        <div className="p-4 rounded-2xl bg-gradient-to-r from-rose-950/60 via-slate-900 to-amber-950/30 border border-rose-800/60 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-xl bg-rose-500/20 text-rose-400 shrink-0 mt-0.5">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-white flex items-center gap-2">
                <span>Peringatan Reorder Point TSB: {criticalItems.length} SKU Membutuhkan Pemesanan</span>
                <span className="text-[10px] bg-rose-500 text-white font-bold px-1.5 py-0.2 rounded-full">
                  URGENT
                </span>
              </h4>
              <p className="text-xs text-slate-300 mt-0.5">
                Stok fisik berada pada atau di bawah batas cadangan keselamatan (ROP = Lead Time Demand + Safety Stock). Segera buat PO ke distributor resmi.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => handleOpenRestock(criticalItems[0])}
              className="px-3.5 py-2 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-500 text-white shadow-lg shadow-rose-600/30 transition flex items-center gap-1.5 cursor-pointer"
            >
              <PackagePlus className="w-4 h-4" />
              <span>Restok SKU Terkritis ({criticalItems[0].sku})</span>
            </button>
          </div>
        </div>
      )}

      {/* Inventory Real-Time Table Section */}
      <div className="bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden shadow-lg">
        {/* Controls Bar */}
        <div className="p-4 border-b border-slate-800 flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
          <div className="relative flex-1 max-w-sm">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Cari SKU, nama produk, kategori..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-slate-800/80 border border-slate-700/80 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center bg-slate-800/80 p-1 rounded-xl border border-slate-700/80 text-xs">
              <span className="px-2 text-slate-400 font-medium">Status:</span>
              {[
                { id: 'ALL', label: 'Semua' },
                { id: 'CRITICAL', label: `Kritis (${criticalItems.length})` },
                { id: 'WARNING', label: `Waspada (${warningItems.length})` },
                { id: 'OPTIMAL', label: 'Optimal' },
              ].map((btn) => (
                <button
                  key={btn.id}
                  onClick={() => setStatusFilter(btn.id)}
                  className={`px-2.5 py-1 rounded-lg font-medium transition cursor-pointer ${
                    statusFilter === btn.id
                      ? 'bg-indigo-600 text-white shadow'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {btn.label}
                </button>
              ))}
            </div>

            <button
              onClick={simulateNextDay}
              title="Simulasikan 1 Hari Baru untuk melihat pergerakan TSB"
              className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 flex items-center gap-1.5 transition cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5 text-indigo-400" />
              <span>Simulasi Hari ke-{currentDay + 1}</span>
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-800/50 text-[11px] uppercase tracking-wider text-slate-400 border-b border-slate-800 font-semibold">
              <tr>
                <th className="py-3 px-4">SKU & Komponen</th>
                <th className="py-3 px-4">Stok Fisik</th>
                <th className="py-3 px-4">
                  <div className="flex items-center gap-1">
                    <span>ROP (TSB)</span>
                    <span className="text-[9px] text-cyan-400 font-normal lowercase">(D_L+SS)</span>
                  </div>
                </th>
                <th className="py-3 px-4">Safety Stock</th>
                <th className="py-3 px-4">
                  <div className="flex items-center gap-1">
                    <span>Forecast (ŷ)</span>
                    <span className="text-[9px] text-slate-500 font-normal">/hari</span>
                  </div>
                </th>
                <th className="py-3 px-4">Status Stok</th>
                <th className="py-3 px-4">Rekomendasi Restok</th>
                <th className="py-3 px-4 text-right">Aksi Manajemen</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredProducts.map((product) => {
                const analysis = allTSBAnalyses.get(product.id)!;
                const isOutOfStock = product.currentStock <= 0;
                const isCritical = analysis.stockStatus === 'CRITICAL' || isOutOfStock;
                const isWarning = analysis.stockStatus === 'WARNING';
                const isOverstock = analysis.stockStatus === 'OVERSTOCK';

                return (
                  <tr
                    key={product.id}
                    className={`hover:bg-slate-800/40 transition-colors ${
                      isCritical ? 'bg-rose-950/10' : ''
                    }`}
                  >
                    {/* SKU & Product info */}
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <img
                          src={product.imageUrl}
                          alt={product.name}
                          className="w-9 h-9 rounded-lg object-cover bg-slate-800 border border-slate-700 shrink-0"
                        />
                        <div className="min-w-0">
                          <button
                            onClick={() => onNavigateToTsb(product.id)}
                            className="text-xs font-bold text-white hover:text-cyan-400 transition truncate block max-w-xs text-left cursor-pointer"
                          >
                            {product.name}
                          </button>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/60 px-1.5 py-0.2 rounded border border-emerald-800/40">
                              {product.sku}
                            </span>
                            <span className="text-[10px] text-slate-500">{product.category}</span>
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Physical Stock */}
                    <td className="py-3 px-4 font-mono">
                      <div className="flex items-baseline gap-1">
                        <span
                          className={`text-sm font-bold ${
                            isCritical
                              ? 'text-rose-400'
                              : isWarning
                              ? 'text-amber-400'
                              : 'text-white'
                          }`}
                        >
                          {product.currentStock}
                        </span>
                        <span className="text-[10px] text-slate-500">{product.unit}</span>
                      </div>
                      {/* Visual stock bar vs ROP */}
                      <div className="w-20 bg-slate-800 rounded-full h-1.5 mt-1 overflow-hidden">
                        <div
                          className={`h-full rounded-full ${
                            isCritical
                              ? 'bg-rose-500'
                              : isWarning
                              ? 'bg-amber-500'
                              : 'bg-emerald-500'
                          }`}
                          style={{
                            width: `${Math.min(100, (product.currentStock / (analysis.orderUpToLevel || 1)) * 100)}%`,
                          }}
                        />
                      </div>
                    </td>

                    {/* Reorder Point (TSB) */}
                    <td className="py-3 px-4 font-mono font-semibold text-slate-200">
                      <span className="text-amber-300 font-bold">{analysis.reorderPoint}</span>
                      <span className="text-[10px] text-slate-500 ml-1">{product.unit}</span>
                    </td>

                    {/* Safety Stock */}
                    <td className="py-3 px-4 font-mono text-slate-300">
                      <span>{analysis.safetyStock}</span>
                      <span className="text-[10px] text-slate-500 ml-1">unit</span>
                    </td>

                    {/* Forecast Demand */}
                    <td className="py-3 px-4 font-mono">
                      <div className="text-cyan-400 font-semibold">
                        {formatDec(analysis.forecastPerDay, 3)}
                      </div>
                      <div className="text-[10px] text-slate-500">
                        Prob: {((analysis.lastP || 0) * 100).toFixed(1)}%
                      </div>
                    </td>

                    {/* Status Badge */}
                    <td className="py-3 px-4">
                      {isOutOfStock ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/20 text-rose-400 border border-rose-500/30">
                          <span className="w-1.5 h-1.5 rounded-full bg-rose-400 animate-pulse" />
                          HABIS (0)
                        </span>
                      ) : isCritical ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/20 text-rose-400 border border-rose-500/30">
                          <AlertTriangle className="w-3 h-3 text-rose-400" />
                          KRITIS (≤ ROP)
                        </span>
                      ) : isWarning ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30">
                          <Clock className="w-3 h-3 text-amber-400" />
                          WAS PADA
                        </span>
                      ) : isOverstock ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-purple-500/20 text-purple-400 border border-purple-500/30">
                          OVERSTOCK
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                          <CheckCircle className="w-3 h-3 text-emerald-400" />
                          OPTIMAL
                        </span>
                      )}
                    </td>

                    {/* Restock Recommendation */}
                    <td className="py-3 px-4 font-mono">
                      {analysis.recommendedRestockQty > 0 ? (
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-emerald-400 bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-700/50">
                            +{analysis.recommendedRestockQty} {product.unit}
                          </span>
                        </div>
                      ) : (
                        <span className="text-slate-500 text-[11px]">-</span>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => handleOpenRestock(product)}
                          title="Buat Purchase Order Restok"
                          className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-emerald-600/30 hover:bg-emerald-600 text-emerald-300 hover:text-white border border-emerald-500/40 transition cursor-pointer flex items-center gap-1"
                        >
                          <PackagePlus className="w-3 h-3" />
                          <span>Restok</span>
                        </button>

                        <button
                          onClick={() => handleOpenOpname(product)}
                          title="Sesuaikan Stok Fisik (Stock Opname)"
                          className="px-2 py-1 rounded-lg text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition cursor-pointer"
                        >
                          Opname
                        </button>

                        <button
                          onClick={() => onNavigateToTsb(product.id)}
                          title="Buka Analisis TSB & Grafik"
                          className="p-1 rounded-lg text-slate-400 hover:text-cyan-300 hover:bg-slate-800 transition cursor-pointer"
                        >
                          <ChevronRight className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Quick Restock PO Modal */}
      {selectedRestockProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs">
          <div className="w-full max-w-md bg-slate-900 border border-slate-700 rounded-2xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <PackagePlus className="w-5 h-5 text-emerald-400" />
                <h3 className="font-bold text-white text-base">Buat Purchase Order (Restok)</h3>
              </div>
              <button
                onClick={() => setSelectedRestockProduct(null)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <span className="text-slate-400 block text-[11px]">Produk & SKU:</span>
                <div className="font-bold text-white text-sm">{selectedRestockProduct.name}</div>
                <div className="font-mono text-emerald-400">{selectedRestockProduct.sku}</div>
              </div>

              <div className="grid grid-cols-2 gap-2 p-3 rounded-xl bg-slate-800/60 border border-slate-700">
                <div>
                  <span className="text-slate-400 block text-[10px]">Stok Saat Ini:</span>
                  <span className="font-bold text-white text-sm">
                    {selectedRestockProduct.currentStock} {selectedRestockProduct.unit}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">Supplier Resmi:</span>
                  <span className="font-bold text-slate-200 truncate block">
                    {selectedRestockProduct.supplier.name}
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">
                  Kuantitas Pemesanan Restok:
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="number"
                    min="1"
                    value={restockQty}
                    onChange={(e) => setRestockQty(Math.max(1, parseInt(e.target.value) || 1))}
                    className="w-32 bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono font-bold text-base focus:outline-none focus:border-emerald-500"
                  />
                  <span className="text-slate-400">{selectedRestockProduct.unit}</span>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-800/40 border border-slate-700/60 flex justify-between items-center text-xs">
                <span className="text-slate-400">Total Nilai Pemesanan (HPP):</span>
                <span className="font-bold text-white text-sm">
                  {formatRupiah(selectedRestockProduct.costPrice * restockQty)}
                </span>
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setSelectedRestockProduct(null)}
                className="flex-1 py-2 rounded-xl border border-slate-700 text-xs font-semibold text-slate-300 hover:bg-slate-800 transition"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleConfirmRestock}
                className="flex-1 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-600/30 transition flex items-center justify-center gap-1.5"
              >
                <PackagePlus className="w-4 h-4" />
                <span>Terbitkan PO</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Quick Stock Opname Modal */}
      {selectedOpnameProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-xs animate-fadeIn">
          <div className="w-full max-w-lg bg-slate-900 border border-slate-700 rounded-2xl p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Boxes className="w-5 h-5 text-indigo-400" />
                <h3 className="font-bold text-white text-base">Penyesuaian Stok Fisik (Opname)</h3>
              </div>
              <button
                onClick={() => setSelectedOpnameProduct(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3.5 text-xs">
              {/* Product Info & Reference Photo */}
              <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-800/60 border border-slate-700/70">
                <img
                  src={selectedOpnameProduct.imageUrl}
                  alt={selectedOpnameProduct.name}
                  className="w-14 h-14 rounded-lg object-cover bg-slate-900 border border-slate-700 shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <div className="font-bold text-white text-sm truncate">
                    {selectedOpnameProduct.name}
                  </div>
                  <div className="font-mono text-emerald-400 font-semibold">
                    {selectedOpnameProduct.sku}
                  </div>
                  <div className="text-[10px] text-slate-400 mt-0.5">
                    {selectedOpnameProduct.category} • HPP: {formatRupiah(selectedOpnameProduct.costPrice)}
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-slate-200 font-semibold mb-1">
                  Stok Fisik Aktual di Gudang:
                </label>
                <input
                  type="number"
                  min="0"
                  value={opnameStock}
                  onChange={(e) => setOpnameStock(Math.max(0, parseInt(e.target.value) || 0))}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono font-bold text-base focus:outline-none focus:border-indigo-500"
                />
                <span className="text-[11px] text-slate-400 block mt-1">
                  Stok sistem saat ini: <strong>{selectedOpnameProduct.currentStock}</strong>{' '}
                  {selectedOpnameProduct.unit} (Selisih:{' '}
                  <strong
                    className={
                      opnameStock - selectedOpnameProduct.currentStock >= 0
                        ? 'text-emerald-400'
                        : 'text-rose-400'
                    }
                  >
                    {opnameStock - selectedOpnameProduct.currentStock >= 0
                      ? `+${opnameStock - selectedOpnameProduct.currentStock}`
                      : opnameStock - selectedOpnameProduct.currentStock}
                  </strong>
                  )
                </span>
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">
                  Alasan Penyesuaian:
                </label>
                <input
                  type="text"
                  value={opnameReason}
                  onChange={(e) => setOpnameReason(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white text-xs focus:outline-none focus:border-indigo-500"
                  placeholder="Misal: Hasil audit fisik bulanan, barang rusak, dll"
                />
              </div>

              {/* Upload Foto Bukti Opname */}
              <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-slate-300 font-medium flex items-center gap-1.5">
                    <Camera className="w-3.5 h-3.5 text-indigo-400" />
                    Upload Foto Bukti Fisik / Kondisi:
                  </span>
                  <span className="text-[10px] text-slate-500 font-mono">
                    {opnamePhotos.length} foto
                  </span>
                </div>

                <label className="block w-full py-2 px-3 rounded-xl border border-dashed border-slate-700 hover:border-indigo-500 bg-slate-800/40 text-center text-slate-400 hover:text-white cursor-pointer transition">
                  <Upload className="w-3.5 h-3.5 mx-auto mb-1 text-slate-500" />
                  <span>Pilih file foto fisik (bisa multiple)</span>
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      if (!e.target.files) return;
                      Array.from(e.target.files).forEach((file) => {
                        const reader = new FileReader();
                        reader.onload = (ev) => {
                          const b64 = ev.target?.result as string;
                          if (b64) setOpnamePhotos((prev) => [...prev, b64]);
                        };
                        reader.readAsDataURL(file);
                      });
                    }}
                  />
                </label>

                {opnamePhotos.length > 0 && (
                  <div className="flex items-center gap-2 overflow-x-auto pt-1">
                    {opnamePhotos.map((img, i) => (
                      <div key={i} className="relative w-12 h-12 rounded-lg overflow-hidden border border-slate-700 shrink-0">
                        <img src={img} alt="Evidence" className="w-full h-full object-cover" />
                        <button
                          type="button"
                          onClick={() => setOpnamePhotos((prev) => prev.filter((_, idx) => idx !== i))}
                          className="absolute top-0 right-0 bg-rose-600 text-white text-[8px] p-0.5 rounded-bl"
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setSelectedOpnameProduct(null)}
                className="flex-1 py-2.5 rounded-xl border border-slate-700 text-xs font-semibold text-slate-300 hover:bg-slate-800 transition cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleConfirmOpname}
                className="flex-1 py-2.5 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/30 transition flex items-center justify-center gap-1.5 cursor-pointer"
              >
                Simpan Penyesuaian
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
