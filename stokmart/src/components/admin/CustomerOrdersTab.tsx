import React, { useState } from 'react';
import {
  CreditCard,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  Truck,
  ExternalLink,
  Share2,
  AlertCircle,
  Building,
  QrCode,
  MapPin,
  Check,
  ChevronDown,
  Sparkles,
  ShieldCheck,
  FileText,
  User,
  Phone,
  ArrowUpRight,
  Send,
  X,
} from 'lucide-react';
import { useInventory } from '../../context/InventoryContext';
import { formatRupiah } from '../../utils/tsbAlgorithm';
import { CustomerOrder } from '../../types/inventory';
import { INDONESIA_BANKS } from '../../data/logisticsAndBanking';

export const CustomerOrdersTab: React.FC = () => {
  const {
    customerOrders,
    confirmPayment,
    updateOrderStatus,
    openTrackingForOrder,
    currentUser,
  } = useInventory();

  const [activeFilter, setActiveFilter] = useState<'ALL' | 'WAITING' | 'CONFIRMED' | 'SHIPPED' | 'DELIVERED'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Confirmation modal state
  const [selectedOrderForConfirm, setSelectedOrderForConfirm] = useState<CustomerOrder | null>(null);
  const [inputAwbNumber, setInputAwbNumber] = useState('');
  const [inputAdminNotes, setInputAdminNotes] = useState('');
  const [isConfirming, setIsConfirming] = useState(false);

  // Status update modal state
  const [selectedOrderForStatus, setSelectedOrderForStatus] = useState<CustomerOrder | null>(null);
  const [newStatusChoice, setNewStatusChoice] = useState<CustomerOrder['status']>('SHIPPED');
  const [statusUpdateNotes, setStatusUpdateNotes] = useState('');

  const waitingCount = customerOrders.filter((o) => o.status === 'WAITING_PAYMENT').length;

  const filteredOrders = customerOrders.filter((order) => {
    // Tab filter
    if (activeFilter === 'WAITING' && order.status !== 'WAITING_PAYMENT') return false;
    if (activeFilter === 'CONFIRMED' && order.status !== 'PAID' && order.status !== 'PROCESSING') return false;
    if (activeFilter === 'SHIPPED' && order.status !== 'SHIPPED') return false;
    if (activeFilter === 'DELIVERED' && order.status !== 'DELIVERED') return false;

    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchNumber = order.orderNumber.toLowerCase().includes(q);
      const matchTrack = order.trackingCode.toLowerCase().includes(q);
      const matchName = order.customerName.toLowerCase().includes(q);
      const matchPhone = order.customerPhone.includes(q);
      const matchCourier = order.selectedCourier?.name.toLowerCase().includes(q);
      return matchNumber || matchTrack || matchName || matchPhone || matchCourier;
    }
    return true;
  });

  const handleOpenConfirmModal = (order: CustomerOrder) => {
    setSelectedOrderForConfirm(order);
    const courierCode = (order.selectedCourier?.id || 'NETS').toUpperCase();
    const suggestedAwb = `${courierCode}-${Math.floor(100000000 + Math.random() * 900000000)}`;
    setInputAwbNumber(suggestedAwb);
    setInputAdminNotes(
      `Pembayaran pesanan #${order.orderNumber} telah diverifikasi dan masuk ke rekening perusahaan. Siap dipacking gudang.`
    );
  };

  const handleExecuteConfirm = () => {
    if (!selectedOrderForConfirm) return;
    setIsConfirming(true);
    setTimeout(() => {
      confirmPayment(selectedOrderForConfirm.id, inputAwbNumber, inputAdminNotes);
      setIsConfirming(false);
      setSelectedOrderForConfirm(null);
    }, 400);
  };

  const handleExecuteStatusUpdate = () => {
    if (!selectedOrderForStatus) return;
    updateOrderStatus(selectedOrderForStatus.id, newStatusChoice, statusUpdateNotes);
    setSelectedOrderForStatus(null);
  };

  const handleSendWhatsAppUpdate = (order: CustomerOrder) => {
    let cleanPhone = order.customerPhone.replace(/[^0-9]/g, '');
    if (cleanPhone.startsWith('0')) cleanPhone = '62' + cleanPhone.slice(1);
    else if (cleanPhone.startsWith('8')) cleanPhone = '62' + cleanPhone;

    const isPaid = order.status !== 'WAITING_PAYMENT';
    const message = `Halo *${order.customerName}*,

Pemberitahuan resmi dari *NetSolusions Solusi Teknologi*:

Pesanan Anda #${order.orderNumber} dengan Kode Tracking: *${order.trackingCode}* saat ini berstatus:
${isPaid ? '✅ *PEMBAYARAN TERVERIFIKASI & SEDANG DIPROSES*' : '⏳ *MENUNGGU KONFIRMASI PEMBAYARAN*'}

🚚 Kurir: ${order.selectedCourier?.name} (${order.selectedCourier?.service})
📍 Estimasi Tiba: ${order.selectedCourier?.eta}
📦 Nomor Resi: ${order.shippingAwbNumber || 'Sedang digenerate'}

Anda dapat memantau pergerakan kurir secara berkala tanpa login di sistem NetSolusions Store. Terima kasih!`;

    const encoded = encodeURIComponent(message);
    window.open(`https://wa.me/${cleanPhone}?text=${encoded}`, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="space-y-6 pb-12 animate-fadeIn">
      {/* Top Banner & Quick Metrics */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950/60 to-slate-900 p-5 sm:p-6 rounded-2xl border border-indigo-900/40 shadow-xl">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 flex items-center justify-center shadow-lg shadow-indigo-500/10">
              <CreditCard className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg sm:text-xl font-bold text-white">
                  Pesanan Pelanggan &amp; Konfirmasi Pembayaran
                </h2>
                {waitingCount > 0 && (
                  <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-amber-500 text-slate-950 animate-pulse">
                    {waitingCount} Menunggu Konfirmasi
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Verifikasi bukti transfer bank atau QRIS untuk membuka hak akses live tracking kurir pelanggan secara instan.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 text-xs">
            <div className="bg-slate-800/80 px-3.5 py-2 rounded-xl border border-slate-700/80">
              <span className="text-slate-400 block text-[10px]">Total Pesanan:</span>
              <span className="text-white font-bold font-mono text-sm">
                {customerOrders.length} Pesanan
              </span>
            </div>
            <div className="bg-slate-800/80 px-3.5 py-2 rounded-xl border border-slate-700/80">
              <span className="text-slate-400 block text-[10px]">Nilai Transaksi:</span>
              <span className="text-emerald-400 font-bold font-mono text-sm">
                {formatRupiah(customerOrders.reduce((acc, o) => acc + o.totalAmount, 0))}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Filter Tabs & Search Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-900/80 p-3 rounded-2xl border border-slate-800">
        <div className="flex flex-wrap items-center gap-1.5 text-xs font-medium">
          <button
            onClick={() => setActiveFilter('ALL')}
            className={`px-3 py-1.5 rounded-xl transition cursor-pointer ${
              activeFilter === 'ALL'
                ? 'bg-indigo-600 text-white font-semibold shadow-sm'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            Semua ({customerOrders.length})
          </button>

          <button
            onClick={() => setActiveFilter('WAITING')}
            className={`px-3 py-1.5 rounded-xl transition cursor-pointer flex items-center gap-1.5 ${
              activeFilter === 'WAITING'
                ? 'bg-amber-600 text-white font-semibold shadow-sm'
                : 'text-amber-400 hover:bg-amber-950/40'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Menunggu Konfirmasi ({waitingCount})</span>
          </button>

          <button
            onClick={() => setActiveFilter('CONFIRMED')}
            className={`px-3 py-1.5 rounded-xl transition cursor-pointer ${
              activeFilter === 'CONFIRMED'
                ? 'bg-cyan-600 text-white font-semibold shadow-sm'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            Diproses / Siap Kirim
          </button>

          <button
            onClick={() => setActiveFilter('SHIPPED')}
            className={`px-3 py-1.5 rounded-xl transition cursor-pointer ${
              activeFilter === 'SHIPPED'
                ? 'bg-purple-600 text-white font-semibold shadow-sm'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            Dalam Pengiriman Kurir
          </button>

          <button
            onClick={() => setActiveFilter('DELIVERED')}
            className={`px-3 py-1.5 rounded-xl transition cursor-pointer ${
              activeFilter === 'DELIVERED'
                ? 'bg-emerald-600 text-white font-semibold shadow-sm'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            Selesai / Terkirim
          </button>
        </div>

        {/* Search */}
        <div className="relative min-w-[240px]">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari invoice, resi, nama, WA..."
            className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition font-mono"
          />
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
        </div>
      </div>

      {/* Orders List Cards */}
      <div className="space-y-4">
        {filteredOrders.length === 0 ? (
          <div className="text-center py-16 bg-slate-900/40 rounded-2xl border border-slate-800/80 p-8 space-y-3">
            <div className="w-12 h-12 rounded-xl bg-slate-800 flex items-center justify-center mx-auto text-slate-500">
              <Search className="w-6 h-6" />
            </div>
            <p className="text-sm font-semibold text-slate-300">
              Tidak Ada Pesanan Pada Filter Ini
            </p>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Coba ganti filter status atau kata kunci pencarian di atas.
            </p>
          </div>
        ) : (
          filteredOrders.map((order) => {
            const isWaitingPayment = order.status === 'WAITING_PAYMENT';
            const isProcessing = order.status === 'PROCESSING' || order.status === 'PAID';
            const isShipped = order.status === 'SHIPPED';
            const isDelivered = order.status === 'DELIVERED';

            return (
              <div
                key={order.id}
                className={`p-4 sm:p-5 rounded-2xl border transition-all ${
                  isWaitingPayment
                    ? 'bg-slate-900/90 border-amber-600/50 shadow-lg shadow-amber-950/20 ring-1 ring-amber-500/20'
                    : 'bg-slate-900/70 border-slate-800 hover:border-slate-700/80'
                }`}
              >
                {/* Header row */}
                <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-800">
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="text-xs font-mono font-bold text-white px-2.5 py-1 rounded-lg bg-slate-800 border border-slate-700">
                      {order.orderNumber}
                    </span>
                    <span className="text-xs font-mono text-cyan-400 bg-cyan-950/40 px-2 py-0.5 rounded border border-cyan-800/40">
                      Tracking: {order.trackingCode}
                    </span>
                    <span className="text-[11px] text-slate-400">{order.createdAt}</span>
                  </div>

                  {/* Status Pill Badge */}
                  <div>
                    {isWaitingPayment && (
                      <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40 flex items-center gap-1.5 animate-pulse">
                        <Clock className="w-3.5 h-3.5" />
                        <span>MENUNGGU KONFIRMASI BAYAR</span>
                      </span>
                    )}
                    {isProcessing && (
                      <span className="px-3 py-1 rounded-full text-xs font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>BAYAR TERKONFIRMASI / GUDANG</span>
                      </span>
                    )}
                    {isShipped && (
                      <span className="px-3 py-1 rounded-full text-xs font-bold bg-purple-500/20 text-purple-300 border border-purple-500/40 flex items-center gap-1.5">
                        <Truck className="w-3.5 h-3.5" />
                        <span>DALAM PENGIRIMAN ({order.selectedCourier?.name})</span>
                      </span>
                    )}
                    {isDelivered && (
                      <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 flex items-center gap-1.5">
                        <Check className="w-3.5 h-3.5" />
                        <span>PESANAN TERKIRIM</span>
                      </span>
                    )}
                  </div>
                </div>

                {/* Main Order Content */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 pt-4 text-xs">
                  {/* Col 1: Customer Details */}
                  <div className="space-y-1.5">
                    <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-semibold">
                      Informasi Pelanggan
                    </span>
                    <h4 className="font-bold text-white text-sm leading-snug">
                      {order.customerName}
                    </h4>
                    <p className="text-slate-300 flex items-center gap-1 font-mono text-[11px]">
                      <Phone className="w-3 h-3 text-emerald-400" />
                      {order.customerPhone} ({order.customerEmail})
                    </p>
                    <p className="text-slate-400 text-[11px] line-clamp-2">
                      <MapPin className="w-3 h-3 inline mr-1 text-slate-500" />
                      {order.customerAddress}
                    </p>
                    {order.notes && (
                      <p className="text-[11px] text-amber-300/90 italic bg-amber-950/30 p-2 rounded-lg border border-amber-900/40">
                        Catatan: &ldquo;{order.notes}&rdquo;
                      </p>
                    )}
                  </div>

                  {/* Col 2: Logistics & Payment Method */}
                  <div className="space-y-2 bg-slate-950/50 p-3 rounded-xl border border-slate-800">
                    <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-semibold">
                      Kurir &amp; Pembayaran
                    </span>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-400">Jasa Kurir:</span>
                      <span className="font-bold text-cyan-300">
                        {order.selectedCourier?.name} ({order.selectedCourier?.service})
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-400">Estimasi Tiba (ETA):</span>
                      <span className="text-amber-400 font-medium">
                        {order.selectedCourier?.eta}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-400">Resi Kurir (AWB):</span>
                      <span className="font-mono font-bold text-white">
                        {order.shippingAwbNumber ? (
                          <span className="text-emerald-400">{order.shippingAwbNumber}</span>
                        ) : (
                          <span className="text-amber-400 italic">Belum Diterbitkan</span>
                        )}
                      </span>
                    </div>
                    <div className="flex justify-between items-center pt-1.5 border-t border-slate-800/80">
                      <span className="text-slate-400">Metode Bayar:</span>
                      <span className="font-bold text-white uppercase text-[11px]">
                        {order.paymentMethod === 'bank_transfer'
                          ? `Transfer Bank ${order.selectedBank || 'BCA'}`
                          : order.paymentMethod === 'qris'
                          ? 'QRIS Dinamis'
                          : 'PO Corporate'}
                      </span>
                    </div>
                  </div>

                  {/* Col 3: Items & Financial Total */}
                  <div className="space-y-2 bg-slate-950/50 p-3 rounded-xl border border-slate-800 flex flex-col justify-between">
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-semibold mb-1">
                        Rincian Pesanan
                      </span>
                      <div className="space-y-1">
                        {order.items?.map((item, idx) => (
                          <div key={idx} className="flex justify-between text-[11px] text-slate-300">
                            <span className="truncate max-w-[180px]">
                              {item.quantity}x {item.productName}
                            </span>
                            <span className="font-mono text-slate-400">
                              {formatRupiah(item.price * item.quantity)}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="pt-2 border-t border-slate-800 text-xs">
                      <div className="flex justify-between text-slate-400 text-[11px]">
                        <span>Ongkir:</span>
                        <span className="font-mono">{formatRupiah(order.shippingCost || 0)}</span>
                      </div>
                      <div className="flex justify-between font-bold text-white text-sm pt-0.5">
                        <span>Total Tagihan:</span>
                        <span className="text-emerald-400 font-mono">
                          {formatRupiah(order.totalAmount)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Tracking Status Timeline Summary */}
                {order.paymentConfirmedAt && (
                  <div className="mt-3 p-2.5 rounded-xl bg-slate-950/60 border border-slate-800 flex flex-wrap items-center justify-between gap-2 text-[11px]">
                    <div className="flex items-center gap-2 text-emerald-400">
                      <ShieldCheck className="w-3.5 h-3.5" />
                      <span>
                        Dikonfirmasi oleh <strong>{order.paymentConfirmedBy || 'Admin'}</strong> ({order.paymentConfirmedAt})
                      </span>
                    </div>
                    <span className="text-slate-400">
                      Live tracking pelanggan: <strong className="text-cyan-400">Aktif &amp; Terbuka</strong>
                    </span>
                  </div>
                )}

                {/* Footer Action Buttons */}
                <div className="flex flex-wrap items-center justify-between gap-2 mt-4 pt-3 border-t border-slate-800/80">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => openTrackingForOrder(order.trackingCode)}
                      className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-medium transition cursor-pointer flex items-center gap-1.5"
                    >
                      <ExternalLink className="w-3.5 h-3.5 text-cyan-400" />
                      <span>Lihat Live Tracking</span>
                    </button>

                    <button
                      onClick={() => handleSendWhatsAppUpdate(order)}
                      className="px-3 py-1.5 rounded-lg bg-emerald-950/70 hover:bg-emerald-900/80 text-emerald-300 border border-emerald-800/50 text-xs font-medium transition cursor-pointer flex items-center gap-1.5"
                    >
                      <Send className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Kirim Update WA ke Pelanggan</span>
                    </button>
                  </div>

                  <div className="flex items-center gap-2">
                    {/* PRIMARY ACTION: CONFIRM PAYMENT (UNLOCKS TRACKING) */}
                    {isWaitingPayment && (
                      <button
                        onClick={() => handleOpenConfirmModal(order)}
                        className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-500 hover:to-green-500 text-white font-bold text-xs shadow-lg shadow-emerald-600/30 transition flex items-center gap-2 cursor-pointer"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Konfirmasi Pembayaran Diterima</span>
                      </button>
                    )}

                    {/* STATUS PROGRESSION */}
                    {!isWaitingPayment && (
                      <button
                        onClick={() => {
                          setSelectedOrderForStatus(order);
                          setNewStatusChoice(order.status === 'PROCESSING' ? 'SHIPPED' : 'DELIVERED');
                        }}
                        className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold transition cursor-pointer flex items-center gap-1.5"
                      >
                        <Truck className="w-3.5 h-3.5 text-indigo-400" />
                        <span>Perbarui Status Pengiriman</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* MODAL 1: KONFIRMASI PEMBAYARAN & UNLOCK TRACKING */}
      {selectedOrderForConfirm && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="relative w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-6 space-y-4 text-slate-100 animate-fadeIn">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-white text-base">
                    Konfirmasi Pembayaran Pesanan
                  </h3>
                  <span className="text-xs text-slate-400 font-mono">
                    #{selectedOrderForConfirm.orderNumber}
                  </span>
                </div>
              </div>
              <button
                onClick={() => setSelectedOrderForConfirm(null)}
                className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-400">Pemesan:</span>
                <span className="text-white font-semibold">
                  {selectedOrderForConfirm.customerName}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Total Pembayaran:</span>
                <span className="text-emerald-400 font-bold font-mono text-sm">
                  {formatRupiah(selectedOrderForConfirm.totalAmount)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Kurir Pengiriman:</span>
                <span className="text-cyan-400 font-semibold">
                  {selectedOrderForConfirm.selectedCourier?.name} ({selectedOrderForConfirm.selectedCourier?.eta})
                </span>
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Nomor Resi / AWB Kurir Resmi *
                </label>
                <input
                  type="text"
                  required
                  value={inputAwbNumber}
                  onChange={(e) => setInputAwbNumber(e.target.value)}
                  placeholder="Contoh: JNE-8829104921 / JNT-99201"
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white font-mono focus:outline-none focus:border-emerald-500"
                />
                <span className="text-[10px] text-slate-400 mt-1 block">
                  Nomor resi ini akan langsung tampil di halaman tracking tanpa login milik pelanggan.
                </span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Catatan Verifikasi Admin (Opsional)
                </label>
                <textarea
                  rows={2}
                  value={inputAdminNotes}
                  onChange={(e) => setInputAdminNotes(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="p-3 rounded-xl bg-emerald-950/40 border border-emerald-800/50 text-xs text-emerald-300 flex items-start gap-2">
                <Sparkles className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span>
                  Mengonfirmasi pembayaran akan otomatis <strong>MEMBUKA TRACKING KURIR</strong> dan memperbarui status pesanan menjadi <em>Diproses di Gudang</em>.
                </span>
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setSelectedOrderForConfirm(null)}
                className="flex-1 py-2.5 rounded-xl border border-slate-700 text-xs font-semibold text-slate-300 hover:text-white hover:bg-slate-800 transition"
              >
                Batal
              </button>
              <button
                type="button"
                disabled={isConfirming || !inputAwbNumber}
                onClick={handleExecuteConfirm}
                className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-500 hover:to-green-500 text-white font-bold text-xs shadow-lg shadow-emerald-600/30 transition flex items-center justify-center gap-1.5 disabled:opacity-50"
              >
                {isConfirming ? (
                  <span>Memproses...</span>
                ) : (
                  <>
                    <Check className="w-4 h-4" />
                    <span>Verifikasi &amp; Buka Tracking</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: UPDATE STATUS PENGIRIMAN (SHIPPED / DELIVERED) */}
      {selectedOrderForStatus && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="relative w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-6 space-y-4 text-slate-100 animate-fadeIn">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="font-bold text-white text-base">
                Perbarui Status Pengiriman
              </h3>
              <button
                onClick={() => setSelectedOrderForStatus(null)}
                className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Pilih Status Baru:
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setNewStatusChoice('SHIPPED')}
                    className={`p-3 rounded-xl border text-xs font-bold transition flex flex-col items-center gap-1 ${
                      newStatusChoice === 'SHIPPED'
                        ? 'bg-purple-600/30 border-purple-500 text-purple-300 ring-1 ring-purple-500/40'
                        : 'bg-slate-800 border-slate-700 text-slate-400'
                    }`}
                  >
                    <Truck className="w-4 h-4" />
                    <span>Sedang Dikirim</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setNewStatusChoice('DELIVERED')}
                    className={`p-3 rounded-xl border text-xs font-bold transition flex flex-col items-center gap-1 ${
                      newStatusChoice === 'DELIVERED'
                        ? 'bg-emerald-600/30 border-emerald-500 text-emerald-300 ring-1 ring-emerald-500/40'
                        : 'bg-slate-800 border-slate-700 text-slate-400'
                    }`}
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Paket Diterima</span>
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Keterangan Linimasa (Opsional):
                </label>
                <input
                  type="text"
                  value={statusUpdateNotes}
                  onChange={(e) => setStatusUpdateNotes(e.target.value)}
                  placeholder="Misal: Kurir telah menyerahkan paket ke Pak Satpam"
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setSelectedOrderForStatus(null)}
                className="flex-1 py-2 rounded-xl border border-slate-700 text-xs font-semibold text-slate-300 hover:text-white hover:bg-slate-800 transition"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleExecuteStatusUpdate}
                className="flex-1 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs transition"
              >
                Simpan Perubahan
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
