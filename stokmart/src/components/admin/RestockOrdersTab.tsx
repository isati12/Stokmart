import React, { useState } from 'react';
import {
  Package,
  Truck,
  CheckCircle,
  Plus,
  Clock,
  Calendar,
  AlertCircle,
  Building,
  DollarSign,
  Search,
  Filter,
} from 'lucide-react';
import { useInventory } from '../../context/InventoryContext';
import { formatRupiah } from '../../utils/tsbAlgorithm';

export const RestockOrdersTab: React.FC = () => {
  const {
    products,
    restockOrders,
    createRestockOrder,
    receiveRestockOrder,
    cancelRestockOrder,
    allTSBAnalyses,
  } = useInventory();

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'IN_TRANSIT' | 'RECEIVED'>('ALL');
  const [isManualModalOpen, setIsManualModalOpen] = useState(false);

  // Form states for manual PO
  const [selectedProdId, setSelectedProdId] = useState(products[0]?.id || '');
  const [poQuantity, setPoQuantity] = useState(10);
  const [poNotes, setPoNotes] = useState('Pemesanan Rutin Suplai Gudang');

  const filteredOrders = restockOrders.filter((po) => {
    const matchesSearch =
      po.poNumber.toLowerCase().includes(search.toLowerCase()) ||
      po.productName.toLowerCase().includes(search.toLowerCase()) ||
      po.sku.toLowerCase().includes(search.toLowerCase()) ||
      po.supplierName.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'ALL' || po.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const totalPoValue = restockOrders.reduce((acc, o) => acc + o.totalCost, 0);
  const inTransitCount = restockOrders.filter((o) => o.status === 'IN_TRANSIT').length;

  const handleCreateManualPo = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProdId) return;
    createRestockOrder(selectedProdId, poQuantity, poNotes);
    setIsManualModalOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Top Stats Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 shadow-sm flex items-center gap-3">
          <div className="p-3 rounded-xl bg-indigo-500/10 text-indigo-400">
            <Truck className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] font-semibold text-slate-400 block">
              PO Dalam Perjalanan (In Transit)
            </span>
            <div className="flex items-baseline gap-1.5">
              <span className="text-xl font-bold text-white">{inTransitCount}</span>
              <span className="text-xs text-slate-400">pengiriman</span>
            </div>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 shadow-sm flex items-center gap-3">
          <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-400">
            <DollarSign className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] font-semibold text-slate-400 block">
              Total Akumulasi Nilai PO Restok
            </span>
            <div className="flex items-baseline gap-1.5">
              <span className="text-xl font-bold text-emerald-400">
                {formatRupiah(totalPoValue).replace(',00', '')}
              </span>
            </div>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[11px] font-semibold text-slate-400 block">
              Pengadaan Manual
            </span>
            <span className="text-xs text-slate-400">
              Terbitkan PO baru ke distributor
            </span>
          </div>
          <button
            onClick={() => setIsManualModalOpen(true)}
            className="px-3 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-600/30 transition flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Buat PO Baru</span>
          </button>
        </div>
      </div>

      {/* Orders Table Container */}
      <div className="bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden shadow-lg">
        {/* Filter controls */}
        <div className="p-4 border-b border-slate-800 flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
          <div className="relative flex-1 max-w-sm">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Cari nomor PO, SKU, distributor..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-slate-800/80 border border-slate-700/80 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center bg-slate-800/80 p-1 rounded-xl border border-slate-700/80 text-xs">
              <span className="px-2 text-slate-400 font-medium">Status:</span>
              {[
                { id: 'ALL', label: 'Semua PO' },
                { id: 'IN_TRANSIT', label: 'Dalam Perjalanan' },
                { id: 'RECEIVED', label: 'Sudah Diterima' },
              ].map((btn) => (
                <button
                  key={btn.id}
                  onClick={() => setStatusFilter(btn.id as any)}
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
          </div>
        </div>

        {/* Orders Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-800/50 text-[11px] uppercase tracking-wider text-slate-400 border-b border-slate-800 font-semibold">
              <tr>
                <th className="py-3 px-4">Nomor PO & Tanggal</th>
                <th className="py-3 px-4">Komponen & SKU</th>
                <th className="py-3 px-4">Distributor / Supplier</th>
                <th className="py-3 px-4">Kuantitas</th>
                <th className="py-3 px-4">Total Biaya (HPP)</th>
                <th className="py-3 px-4">Estimasi Tiba</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Aksi Gudang</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono text-[11px]">
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-500 font-sans">
                    Belum ada Purchase Order restok yang sesuai.
                  </td>
                </tr>
              ) : (
                filteredOrders.map((order) => {
                  const isInTransit = order.status === 'IN_TRANSIT';
                  const isReceived = order.status === 'RECEIVED';

                  return (
                    <tr key={order.id} className="hover:bg-slate-800/30 transition-colors">
                      {/* PO Number & Date */}
                      <td className="py-3 px-4">
                        <span className="font-bold text-white block">{order.poNumber}</span>
                        <span className="text-[10px] text-slate-500 font-sans">
                          {order.createdAt}
                        </span>
                      </td>

                      {/* Product */}
                      <td className="py-3 px-4 font-sans">
                        <span className="font-bold text-white block max-w-xs truncate">
                          {order.productName}
                        </span>
                        <span className="text-[10px] font-mono text-emerald-400">
                          {order.sku}
                        </span>
                      </td>

                      {/* Supplier */}
                      <td className="py-3 px-4 font-sans">
                        <span className="text-slate-300 flex items-center gap-1">
                          <Building className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span className="truncate max-w-[140px]">{order.supplierName}</span>
                        </span>
                      </td>

                      {/* Qty */}
                      <td className="py-3 px-4 font-bold text-white">
                        <span>{order.quantity} pcs</span>
                      </td>

                      {/* Total Cost */}
                      <td className="py-3 px-4 text-emerald-400 font-bold">
                        {formatRupiah(order.totalCost)}
                      </td>

                      {/* Arrival Date */}
                      <td className="py-3 px-4 text-slate-300">
                        <span className="flex items-center gap-1 font-sans">
                          <Calendar className="w-3.5 h-3.5 text-slate-400" />
                          {order.expectedArrivalDate}
                        </span>
                        <span className="text-[10px] text-slate-500 font-sans block">
                          Lead Time: {order.leadTimeDays} Hari
                        </span>
                      </td>

                      {/* Status */}
                      <td className="py-3 px-4 font-sans">
                        {isInTransit ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30">
                            <Clock className="w-3 h-3 animate-spin" />
                            Dalam Perjalanan
                          </span>
                        ) : isReceived ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                            <CheckCircle className="w-3 h-3" />
                            Diterima di Gudang
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-800 text-slate-400">
                            Dibatalkan
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-right font-sans">
                        {isInTransit ? (
                          <button
                            onClick={() => receiveRestockOrder(order.id)}
                            className="px-3 py-1.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm shadow-emerald-600/30 transition flex items-center gap-1.5 ml-auto cursor-pointer"
                          >
                            <Package className="w-3.5 h-3.5" />
                            <span>Terima di Gudang</span>
                          </button>
                        ) : (
                          <span className="text-slate-500 text-[11px]">Selesai</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Manual PO Modal */}
      {isManualModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs">
          <div className="w-full max-w-md bg-slate-900 border border-slate-700 rounded-2xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Truck className="w-5 h-5 text-indigo-400" />
                <h3 className="font-bold text-white text-base">Terbitkan Purchase Order Manual</h3>
              </div>
              <button
                onClick={() => setIsManualModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateManualPo} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-300 font-medium mb-1">
                  Pilih Produk Komponen:
                </label>
                <select
                  value={selectedProdId}
                  onChange={(e) => setSelectedProdId(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white text-xs focus:outline-none focus:border-indigo-500"
                >
                  {products.map((p) => {
                    const tsb = allTSBAnalyses.get(p.id);
                    return (
                      <option key={p.id} value={p.id}>
                        {p.sku} - {p.name.slice(0, 35)}... (Stok: {p.currentStock}, ROP: {tsb?.reorderPoint})
                      </option>
                    );
                  })}
                </select>
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">
                  Kuantitas Pemesanan (Pcs):
                </label>
                <input
                  type="number"
                  min="1"
                  required
                  value={poQuantity}
                  onChange={(e) => setPoQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono font-bold text-sm focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">
                  Catatan / Keterangan PO:
                </label>
                <input
                  type="text"
                  value={poNotes}
                  onChange={(e) => setPoNotes(e.target.value)}
                  placeholder="Catatan pesanan ke supplier..."
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white text-xs focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="flex gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setIsManualModalOpen(false)}
                  className="flex-1 py-2 rounded-xl border border-slate-700 text-xs font-semibold text-slate-300 hover:bg-slate-800 transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/30 transition flex items-center justify-center gap-1.5"
                >
                  <Package className="w-4 h-4" />
                  <span>Kirim PO</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
