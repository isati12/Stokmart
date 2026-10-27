import React, { useState, useEffect } from 'react';
import {
  X,
  Search,
  Truck,
  ShieldCheck,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Lock,
  Unlock,
  Share2,
  Copy,
  Check,
  Building,
  QrCode,
  MapPin,
  Calendar,
  ExternalLink,
  PackageCheck,
  ChevronRight,
} from 'lucide-react';
import { useInventory } from '../../context/InventoryContext';
import { formatRupiah } from '../../utils/tsbAlgorithm';
import { INDONESIA_BANKS } from '../../data/logisticsAndBanking';
import { CustomerOrder } from '../../types/inventory';

export const OrderTrackingModal: React.FC = () => {
  const {
    isTrackingModalOpen,
    setIsTrackingModalOpen,
    customerOrders,
    trackingSearchQuery,
    setTrackingSearchQuery,
  } = useInventory();

  const [searchInput, setSearchInput] = useState('');
  const [activeOrder, setActiveOrder] = useState<CustomerOrder | null>(null);
  const [copiedText, setCopiedText] = useState<string | null>(null);

  // Sync external search query when opened
  useEffect(() => {
    if (trackingSearchQuery) {
      setSearchInput(trackingSearchQuery);
      performSearch(trackingSearchQuery);
    } else if (customerOrders.length > 0 && !activeOrder) {
      // Default to latest order if available
      setActiveOrder(customerOrders[0]);
    }
  }, [trackingSearchQuery, isTrackingModalOpen, customerOrders]);

  if (!isTrackingModalOpen) return null;

  const performSearch = (query: string) => {
    const q = query.trim().toLowerCase();
    if (!q) {
      setActiveOrder(null);
      return;
    }

    const found = customerOrders.find(
      (o) =>
        o.trackingCode.toLowerCase().includes(q) ||
        o.orderNumber.toLowerCase().includes(q) ||
        o.customerPhone.replace(/[^0-9]/g, '').includes(q.replace(/[^0-9]/g, '')) ||
        o.customerName.toLowerCase().includes(q)
    );

    setActiveOrder(found || null);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    performSearch(searchInput);
  };

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(id);
    setTimeout(() => setCopiedText(null), 2000);
  };

  const handleShareToWhatsApp = () => {
    if (!activeOrder) return;

    let cleanPhone = activeOrder.customerPhone.replace(/[^0-9]/g, '');
    if (cleanPhone.startsWith('0')) {
      cleanPhone = '62' + cleanPhone.slice(1);
    } else if (cleanPhone.startsWith('8')) {
      cleanPhone = '62' + cleanPhone;
    }

    const isUnlocked = activeOrder.status !== 'WAITING_PAYMENT';
    const statusText = isUnlocked
      ? `✅ *TERBUKA & AKTIF* (Resi: ${activeOrder.shippingAwbNumber || '-'})`
      : '🔒 *MENUNGGU KONFIRMASI PEMBAYARAN OLEH ADMIN*';

    const message = `Halo *${activeOrder.customerName}*,

Berikut informasi live tracking pesanan Anda di *NetSolusions Solusi Teknologi*:

📦 *Invoice:* ${activeOrder.orderNumber}
🔍 *Kode Tracking:* ${activeOrder.trackingCode}
🚚 *Kurir:* ${activeOrder.selectedCourier?.name} (${activeOrder.selectedCourier?.service})
⏱️ *Estimasi Tiba:* ${activeOrder.selectedCourier?.eta}
💰 *Total Tagihan:* ${formatRupiah(activeOrder.totalAmount)}

📍 *Status Pengiriman:*
${statusText}

${
  isUnlocked
    ? `Pembayaran telah diverifikasi oleh Admin. Kurir sedang memproses pengiriman ke alamat tujuan.`
    : `Catatan: Tracking perjalanan kurir akan otomatis aktif segera setelah Admin mengonfirmasi pembayaran Anda.`
}

Lacak langsung tanpa login di portal resmi NetSolusions Store.`;

    const encoded = encodeURIComponent(message);
    const waUrl = `https://wa.me/${cleanPhone}?text=${encoded}`;
    window.open(waUrl, '_blank', 'noopener,noreferrer');
  };

  const isPaymentConfirmed = activeOrder && activeOrder.status !== 'WAITING_PAYMENT';

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-fadeIn">
      <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-5 sm:px-6 py-4 border-b border-slate-800 bg-slate-900/90 sticky top-0 z-10">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
              <Truck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-white text-sm sm:text-base">
                  Tracking Pesanan &amp; Logistik Kurir
                </h3>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 uppercase tracking-wider">
                  Bebas Login
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                Lacak status verifikasi pembayaran dan rute armada kurir secara real-time
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              setIsTrackingModalOpen(false);
              setTrackingSearchQuery('');
            }}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 scrollbar-thin text-slate-100">
          {/* Search Box */}
          <form onSubmit={handleSearchSubmit} className="space-y-2">
            <div className="relative flex items-center">
              <input
                type="text"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Cari berdasarkan Kode Tracking (TRK-NETS-...), No. Invoice, atau WhatsApp..."
                className="w-full bg-slate-800/90 border border-slate-700/80 rounded-xl pl-10 pr-24 py-2.5 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition shadow-inner font-mono"
              />
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 pointer-events-none" />
              <button
                type="submit"
                className="absolute right-1.5 px-3 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold shadow transition cursor-pointer"
              >
                Cari Pesanan
              </button>
            </div>

            {/* Quick Demo Search Chips */}
            <div className="flex flex-wrap items-center gap-1.5 text-[11px]">
              <span className="text-slate-400">Contoh Cepat:</span>
              {customerOrders.slice(0, 3).map((order) => (
                <button
                  key={order.id}
                  type="button"
                  onClick={() => {
                    setSearchInput(order.trackingCode);
                    setActiveOrder(order);
                  }}
                  className={`px-2 py-0.5 rounded-lg border text-[11px] transition cursor-pointer flex items-center gap-1 ${
                    activeOrder?.id === order.id
                      ? 'bg-cyan-600/30 border-cyan-500 text-cyan-300 font-semibold'
                      : 'bg-slate-800/60 border-slate-700 text-slate-300 hover:text-white hover:bg-slate-800'
                  }`}
                >
                  <span>{order.trackingCode}</span>
                  <span
                    className={`text-[9px] px-1 rounded font-mono ${
                      order.status === 'WAITING_PAYMENT'
                        ? 'bg-amber-500/20 text-amber-300'
                        : 'bg-emerald-500/20 text-emerald-300'
                    }`}
                  >
                    {order.status === 'WAITING_PAYMENT' ? 'Menunggu Admin' : 'Terbuka'}
                  </span>
                </button>
              ))}
            </div>
          </form>

          {/* If No Order Found */}
          {!activeOrder && (
            <div className="text-center py-12 space-y-3 bg-slate-800/20 rounded-2xl border border-slate-800/60 p-6">
              <div className="w-12 h-12 rounded-xl bg-slate-800 flex items-center justify-center mx-auto text-slate-500">
                <Search className="w-6 h-6" />
              </div>
              <p className="text-sm font-semibold text-slate-300">
                Pesanan Tidak Ditemukan
              </p>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Pastikan Kode Tracking atau Nomor WhatsApp yang Anda masukkan sesuai dengan invoice pembelian NetSolusions.
              </p>
            </div>
          )}

          {/* Order Found Content */}
          {activeOrder && (
            <div className="space-y-4">
              {/* Order Primary Details Card */}
              <div className="p-4 rounded-2xl bg-slate-800/60 border border-slate-700/80 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-700/60">
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase tracking-wider block">
                      Kode Tracking Resmi:
                    </span>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-base sm:text-lg font-mono font-extrabold text-cyan-400">
                        {activeOrder.trackingCode}
                      </span>
                      <button
                        onClick={() => handleCopy(activeOrder.trackingCode, 'trk')}
                        className="p-1 rounded bg-slate-700/60 text-slate-300 hover:text-white hover:bg-slate-700 transition cursor-pointer"
                        title="Salin Kode Tracking"
                      >
                        {copiedText === 'trk' ? (
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="text-[10px] text-slate-400 uppercase tracking-wider block">
                      No. Invoice:
                    </span>
                    <span className="text-xs font-mono font-bold text-slate-200 block">
                      {activeOrder.orderNumber}
                    </span>
                    <span className="text-[10px] text-slate-500">{activeOrder.createdAt}</span>
                  </div>
                </div>

                {/* Logistics & Recipient Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div>
                    <span className="text-slate-400 text-[11px] block">Pemesan &amp; Penerima:</span>
                    <span className="font-semibold text-white block mt-0.5">
                      {activeOrder.customerName}
                    </span>
                    <span className="text-slate-400 font-mono text-[11px] block">
                      WA: {activeOrder.customerPhone}
                    </span>
                    <p className="text-[11px] text-slate-400 mt-1 line-clamp-2">
                      <MapPin className="w-3 h-3 inline mr-1 text-slate-500" />
                      {activeOrder.customerAddress}
                    </p>
                  </div>

                  <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-800 space-y-1.5">
                    <div className="flex justify-between items-center">
                      <span className="text-slate-400 text-[11px]">Kurir Logistik:</span>
                      <span className="font-bold text-white text-xs px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                        {activeOrder.selectedCourier?.name || 'Ekspedisi Rekanan'}
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-[11px]">
                      <span className="text-slate-400">Estimasi Tiba (ETA):</span>
                      <span className="text-amber-400 font-semibold">
                        {activeOrder.selectedCourier?.eta || '2-3 Hari'}
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-[11px]">
                      <span className="text-slate-400">Nomor Resi / AWB:</span>
                      <span className="font-mono font-bold text-slate-200">
                        {activeOrder.shippingAwbNumber || '(Menunggu Verifikasi Admin)'}
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-[11px] pt-1 border-t border-slate-800">
                      <span className="text-slate-400">Total Pembayaran:</span>
                      <span className="font-bold text-emerald-400 font-mono">
                        {formatRupiah(activeOrder.totalAmount)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Items Purchased Mini-List */}
                <div className="pt-2 border-t border-slate-700/50">
                  <span className="text-[11px] text-slate-400 block mb-1.5">
                    Item Komponen Industri ({activeOrder.items?.length || 0} SKU):
                  </span>
                  <div className="space-y-1">
                    {activeOrder.items?.map((item, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between text-xs py-1 px-2.5 rounded-lg bg-slate-900/40"
                      >
                        <span className="text-slate-200 font-medium truncate max-w-[280px]">
                          {item.quantity}x {item.productName}
                        </span>
                        <span className="text-slate-400 font-mono text-[11px]">
                          {formatRupiah(item.price * item.quantity)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* CRITICAL FEATURE: TRACKING UNLOCK CONDITION CHECK */}
              {!isPaymentConfirmed ? (
                /* LOCKED STATE: WAITING FOR ADMIN CONFIRMATION */
                <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-amber-950/50 via-slate-900 to-slate-900 border-2 border-amber-600/60 shadow-xl space-y-3.5">
                  <div className="flex items-start gap-3">
                    <div className="p-2.5 rounded-xl bg-amber-500/20 border border-amber-500/40 text-amber-400 shrink-0">
                      <Lock className="w-6 h-6 animate-pulse" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm sm:text-base font-bold text-amber-200">
                          Tracking Pengiriman Kurir Belum Terbuka
                        </h4>
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40 uppercase">
                          Menunggu Konfirmasi Admin
                        </span>
                      </div>
                      <p className="text-xs text-amber-300/80 mt-1 leading-relaxed">
                        Pesanan Anda telah tercatat dengan aman. Sesuai prosedur operasional NetSolusions, <strong>perjalanan live tracking armada kurir akan otomatis AKTIF dan TERBUKA setelah Administrator mengonfirmasi pembayaran Anda.</strong>
                      </p>
                    </div>
                  </div>

                  {/* Payment reminder box */}
                  <div className="bg-slate-950/70 p-3.5 rounded-xl border border-amber-900/40 space-y-2 text-xs">
                    <div className="flex justify-between items-center text-slate-300">
                      <span>Metode Pembayaran Dipilih:</span>
                      <span className="font-bold text-white uppercase">
                        {activeOrder.paymentMethod === 'bank_transfer'
                          ? `Transfer Bank ${activeOrder.selectedBank || 'BCA'}`
                          : activeOrder.paymentMethod === 'qris'
                          ? 'QRIS Dinamis'
                          : 'PO Corporate'}
                      </span>
                    </div>

                    {activeOrder.paymentMethod === 'bank_transfer' && (
                      <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 text-[11px] space-y-1">
                        <div className="flex justify-between">
                          <span className="text-slate-400">Penerima:</span>
                          <span className="font-semibold text-white">PT NETSOLUSIONS SOLUSI TEKNOLOGI</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400">Nomor Rekening ({activeOrder.selectedBank || 'BCA'}):</span>
                          <span className="font-mono font-bold text-amber-300">
                            {INDONESIA_BANKS.find((b) => b.bank === (activeOrder.selectedBank || 'BCA'))?.accountNumber || '8830-1928-33'}
                          </span>
                        </div>
                      </div>
                    )}

                    <div className="flex justify-between items-center pt-1 border-t border-slate-800">
                      <span className="text-slate-400">Total yang Harus Dibayar:</span>
                      <span className="text-sm font-bold font-mono text-emerald-400">
                        {formatRupiah(activeOrder.totalAmount)}
                      </span>
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 text-xs text-slate-400 flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <Clock className="w-4 h-4 text-amber-400" />
                      Estimasi verifikasi pembayaran admin: &le; 15 menit kerja
                    </span>
                    <span className="text-slate-400 text-[11px]">Sistem Real-Time</span>
                  </div>
                </div>
              ) : (
                /* UNLOCKED STATE: ADMIN CONFIRMED -> LIVE COURIER TRACKING */
                <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-emerald-950/50 via-slate-900 to-slate-900 border-2 border-emerald-500/50 shadow-xl space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="p-2.5 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 shrink-0">
                      <Unlock className="w-6 h-6" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm sm:text-base font-bold text-emerald-300">
                          Tracking Pengiriman Kurir Terbuka &amp; Aktif!
                        </h4>
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 uppercase">
                          Pembayaran Terverifikasi
                        </span>
                      </div>
                      <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                        Pembayaran telah disetujui oleh <strong>{activeOrder.paymentConfirmedBy || 'Admin'}</strong> pada {activeOrder.paymentConfirmedAt || 'Hari ini'}. Barang sedang diproses dan dijemput oleh armada <strong>{activeOrder.selectedCourier?.name}</strong>.
                      </p>
                    </div>
                  </div>

                  {/* Courier Tracking Timeline */}
                  <div className="bg-slate-950/70 p-4 rounded-xl border border-slate-800 space-y-4">
                    <h5 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                      <Truck className="w-4 h-4 text-cyan-400" />
                      Linimasa Perjalanan Kurir ({activeOrder.selectedCourier?.name})
                    </h5>

                    <div className="relative pl-6 space-y-4 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-800">
                      {activeOrder.trackingHistory && activeOrder.trackingHistory.length > 0 ? (
                        activeOrder.trackingHistory.map((step, idx) => (
                          <div key={idx} className="relative">
                            {/* Dot indicator */}
                            <span
                              className={`absolute -left-6 top-1 w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                                step.isCurrent
                                  ? 'bg-cyan-500 border-white ring-4 ring-cyan-500/20 animate-pulse'
                                  : step.isCompleted
                                  ? 'bg-emerald-500 border-slate-900'
                                  : 'bg-slate-800 border-slate-700'
                              }`}
                            >
                              {step.isCompleted && (
                                <Check className="w-2.5 h-2.5 text-white stroke-[3]" />
                              )}
                            </span>

                            <div className="bg-slate-900/80 p-2.5 rounded-lg border border-slate-800 text-xs">
                              <div className="flex items-center justify-between text-[11px] mb-0.5">
                                <span className="font-bold text-white">{step.status}</span>
                                <span className="text-slate-500 font-mono">{step.timestamp}</span>
                              </div>
                              <p className="text-[11px] text-slate-300 leading-relaxed">
                                {step.description}
                              </p>
                              {step.location && (
                                <span className="text-[10px] text-cyan-400 block mt-1">
                                  Lokasi: {step.location}
                                </span>
                              )}
                            </div>
                          </div>
                        ))
                      ) : (
                        <p className="text-xs text-slate-500">Memuat data pergerakan kurir...</p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* ACTION: SHARE TO WHATSAPP DIRECT TO CUSTOMER PHONE */}
              <div className="space-y-2 pt-2">
                <button
                  type="button"
                  onClick={handleShareToWhatsApp}
                  className="w-full py-3 px-4 rounded-xl font-bold text-xs sm:text-sm bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-500 hover:to-green-500 text-white shadow-lg shadow-emerald-600/30 transition flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Share2 className="w-4 h-4" />
                  <span>Kirim / Bagikan Info Tracking ke WhatsApp ({activeOrder.customerPhone})</span>
                </button>

                <div className="flex items-center justify-between text-xs text-slate-400 px-1">
                  <span>Pelanggan dapat melacak kembali kapan saja tanpa login.</span>
                  <button
                    onClick={() => handleCopy(window.location.origin, 'url')}
                    className="text-cyan-400 hover:text-cyan-300 flex items-center gap-1 cursor-pointer"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    <span>{copiedText === 'url' ? 'Tersalin' : 'Salin Link Web'}</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
