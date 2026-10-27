import React, { useState } from 'react';
import {
  X,
  ShoppingCart,
  Trash2,
  ArrowRight,
  ShieldCheck,
  Building,
  QrCode,
  CreditCard,
  CheckCircle2,
  Copy,
  Check,
  Truck,
  Share2,
  Clock,
  AlertCircle,
  CheckCircle,
  HelpCircle,
  Search,
} from 'lucide-react';
import { useInventory } from '../../context/InventoryContext';
import { formatRupiah } from '../../utils/tsbAlgorithm';
import { COURIER_OPTIONS, INDONESIA_BANKS, QRIS_CONFIG } from '../../data/logisticsAndBanking';
import { CourierOption, CustomerOrder } from '../../types/inventory';

export const CartDrawer: React.FC = () => {
  const {
    cart,
    isCartOpen,
    setIsCartOpen,
    updateCartQuantity,
    removeFromCart,
    checkout,
    openTrackingForOrder,
  } = useInventory();

  const [step, setStep] = useState<'cart' | 'checkout' | 'success'>('cart');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form fields
  const [customerName, setCustomerName] = useState('PT Cahaya Manufaktur Mandiri');
  const [customerEmail, setCustomerEmail] = useState('procurement@cahayamanufaktur.com');
  const [customerPhone, setCustomerPhone] = useState('081298765432');
  const [customerAddress, setCustomerAddress] = useState('Jl. Jababeka Raya Kav. 8, Cikarang Industri, Bekasi');
  const [orderNotes, setOrderNotes] = useState('Mohon sertakan sertifikat kalibrasi dan packing kayu palet');

  // Logistics & Payment choices
  const [selectedCourier, setSelectedCourier] = useState<CourierOption>(COURIER_OPTIONS[0]);
  const [paymentMethod, setPaymentMethod] = useState<'bank_transfer' | 'qris' | 'po_corporate'>('bank_transfer');
  const [selectedBank, setSelectedBank] = useState<string>('BCA');
  const [copiedBank, setCopiedBank] = useState<boolean>(false);
  const [copiedTracking, setCopiedTracking] = useState<boolean>(false);

  // Success state
  const [createdOrder, setCreatedOrder] = useState<CustomerOrder | null>(null);

  if (!isCartOpen) return null;

  const subtotalAmount = cart.reduce((acc, item) => acc + item.product.price * item.quantity, 0);
  const shippingCost = selectedCourier.cost;
  const totalAmount = subtotalAmount + (cart.length > 0 ? shippingCost : 0);

  const activeBankAccount = INDONESIA_BANKS.find((b) => b.bank === selectedBank) || INDONESIA_BANKS[0];

  const handleCopyText = (text: string, type: 'bank' | 'tracking') => {
    navigator.clipboard.writeText(text);
    if (type === 'bank') {
      setCopiedBank(true);
      setTimeout(() => setCopiedBank(false), 2000);
    } else {
      setCopiedTracking(true);
      setTimeout(() => setCopiedTracking(false), 2000);
    }
  };

  const handleCheckoutSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (cart.length === 0) return;
    setIsSubmitting(true);

    try {
      const res = await checkout({
        name: customerName,
        email: customerEmail,
        phone: customerPhone,
        address: customerAddress,
        paymentMethod,
        selectedBank: paymentMethod === 'bank_transfer' ? selectedBank : undefined,
        courier: selectedCourier,
        notes: orderNotes,
      });

      if (res.success && res.order) {
        setCreatedOrder(res.order);
        setStep('success');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setIsCartOpen(false);
    setTimeout(() => {
      setStep('cart');
    }, 300);
  };

  // WhatsApp share builder
  const handleShareToWhatsApp = () => {
    if (!createdOrder) return;
    // Format customer phone: 0812... -> 62812...
    let cleanPhone = createdOrder.customerPhone.replace(/[^0-9]/g, '');
    if (cleanPhone.startsWith('0')) {
      cleanPhone = '62' + cleanPhone.slice(1);
    } else if (cleanPhone.startsWith('8')) {
      cleanPhone = '62' + cleanPhone;
    }

    const bankInfo =
      createdOrder.paymentMethod === 'bank_transfer'
        ? `\n*Bank Tujuan:* ${createdOrder.selectedBank} - PT NETSOLUSIONS SOLUSI TEKNOLOGI\n*No Rekening:* ${activeBankAccount.accountNumber}`
        : createdOrder.paymentMethod === 'qris'
        ? '\n*Metode:* QRIS Dinamis Standar Nasional Indonesia'
        : '\n*Metode:* PO Corporate TOP 30';

    const message = `Halo *${createdOrder.customerName}*,

Terima kasih telah melakukan pemesanan di *NetSolusions Solusi Teknologi*!

Berikut rincian pesanan Anda:
📦 *No. Invoice:* ${createdOrder.orderNumber}
🔍 *Kode Tracking:* ${createdOrder.trackingCode}
🚚 *Kurir:* ${createdOrder.selectedCourier.name} (${createdOrder.selectedCourier.service})
⏱️ *Estimasi Tiba:* ${createdOrder.selectedCourier.eta}
💰 *Total Tagihan:* ${formatRupiah(createdOrder.totalAmount)}${bankInfo}

🔒 *Status Saat Ini:* MENUNGGU KONFIRMASI PEMBAYARAN
_Tracking pengiriman kurir akan otomatis aktif dan terbuka setelah pembayaran Anda diverifikasi oleh Admin NetSolusions._

Pelanggan dapat melacak pesanan kapan saja *tanpa login* menggunakan Kode Tracking di atas.`;

    const encoded = encodeURIComponent(message);
    const waUrl = `https://wa.me/${cleanPhone}?text=${encoded}`;
    window.open(waUrl, '_blank', 'noopener,noreferrer');
  };

  const handleOpenTrackingFromSuccess = () => {
    if (createdOrder) {
      handleClose();
      openTrackingForOrder(createdOrder.trackingCode);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        onClick={handleClose}
        className="absolute inset-0 bg-slate-950/80 backdrop-blur-xs transition-opacity"
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-6 sm:pl-10">
        <div className="w-screen max-w-lg bg-slate-900 border-l border-slate-800 shadow-2xl flex flex-col text-slate-100">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/95 sticky top-0 z-10">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <ShoppingCart className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-white text-sm sm:text-base leading-tight">
                  {step === 'cart'
                    ? 'Keranjang Pengadaan'
                    : step === 'checkout'
                    ? 'Konfirmasi Pembayaran & Kurir'
                    : 'Pesanan Berhasil Diproses'}
                </h3>
                <p className="text-[11px] text-slate-400">
                  {step === 'cart'
                    ? `${cart.reduce((a, b) => a + b.quantity, 0)} item dipilih`
                    : step === 'checkout'
                    ? 'Pilih kurir & metode pembayaran resmi'
                    : 'Kode tracking aktif disimpan'}
                </p>
              </div>
            </div>
            <button
              onClick={handleClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Body Content */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5 scrollbar-thin">
            {/* STEP 1: CART LIST */}
            {step === 'cart' && (
              <>
                {cart.length === 0 ? (
                  <div className="text-center py-20 space-y-4">
                    <div className="w-16 h-16 rounded-2xl bg-slate-800/80 border border-slate-700/60 flex items-center justify-center mx-auto text-slate-500">
                      <ShoppingCart className="w-8 h-8" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-200">
                        Keranjang Pengadaan Kosong
                      </p>
                      <p className="text-xs text-slate-400 max-w-xs mx-auto mt-1">
                        Pilih suku cadang atau komponen otomasi di katalog untuk memulai pemesanan industri.
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-xs text-slate-400 pb-1">
                      <span>Daftar Komponen ({cart.length} SKU)</span>
                      <span className="text-emerald-400 font-medium">Stok Ready Gudang</span>
                    </div>

                    {cart.map(({ product, quantity }) => (
                      <div
                        key={product.id}
                        className="p-3.5 rounded-xl bg-slate-800/60 border border-slate-700/60 flex items-start gap-3 hover:border-slate-600/80 transition"
                      >
                        <img
                          src={product.imageUrl}
                          alt={product.name}
                          className="w-16 h-16 rounded-lg object-cover bg-slate-800 shrink-0 border border-slate-700"
                        />
                        <div className="flex-1 min-w-0">
                          <h4 className="text-xs font-semibold text-white leading-tight line-clamp-2">
                            {product.name}
                          </h4>
                          <span className="text-[11px] font-mono text-emerald-400 block mt-0.5">
                            {product.sku}
                          </span>
                          <div className="flex items-baseline gap-2 mt-1">
                            <span className="text-xs font-bold text-slate-100">
                              {formatRupiah(product.price)}
                            </span>
                            <span className="text-[10px] text-slate-400">/ {product.unit}</span>
                          </div>

                          {/* Stepper & Delete */}
                          <div className="flex items-center justify-between mt-2.5 pt-2 border-t border-slate-700/50">
                            <div className="flex items-center border border-slate-700 rounded-lg bg-slate-900/80 text-xs overflow-hidden">
                              <button
                                onClick={() => updateCartQuantity(product.id, quantity - 1)}
                                className="px-2.5 py-1 text-slate-300 hover:text-white hover:bg-slate-800 transition"
                              >
                                -
                              </button>
                              <span className="px-2.5 py-1 text-white font-medium min-w-[28px] text-center">
                                {quantity}
                              </span>
                              <button
                                onClick={() => updateCartQuantity(product.id, quantity + 1)}
                                disabled={quantity >= product.currentStock}
                                className="px-2.5 py-1 text-slate-300 hover:text-white hover:bg-slate-800 transition disabled:opacity-30"
                              >
                                +
                              </button>
                            </div>

                            <div className="flex items-center gap-2">
                              <span className="text-xs font-semibold text-slate-200">
                                {formatRupiah(product.price * quantity)}
                              </span>
                              <button
                                onClick={() => removeFromCart(product.id)}
                                className="text-slate-400 hover:text-rose-400 p-1 rounded hover:bg-slate-800 transition cursor-pointer"
                                title="Hapus produk"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}

                    <div className="p-3 rounded-xl bg-slate-800/40 border border-slate-700/40 text-xs text-slate-400 flex items-center justify-between">
                      <span className="flex items-center gap-1.5">
                        <Truck className="w-4 h-4 text-emerald-400" />
                        Pilihan kurir tersedia di langkah selanjutnya
                      </span>
                      <span className="text-slate-300 font-medium">JNE, J&amp;T, Lalamove, Grab, Gojek</span>
                    </div>
                  </div>
                )}
              </>
            )}

            {/* STEP 2: CHECKOUT FORM (CUSTOMER, COURIER & INDONESIAN PAYMENT METHODS) */}
            {step === 'checkout' && (
              <form id="checkout-form" onSubmit={handleCheckoutSubmit} className="space-y-5">
                {/* Notice Banner */}
                <div className="p-3 rounded-xl bg-indigo-950/40 border border-indigo-800/50 text-xs text-indigo-300 flex items-start gap-2.5">
                  <ShieldCheck className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold text-white block">Sistem Verifikasi Otomatis NetSolusions</span>
                    <span>
                      Tracking kurir akan langsung terbuka saat admin memverifikasi pembayaran Anda. Pelanggan dapat membagikan resi &amp; lacak tanpa login.
                    </span>
                  </div>
                </div>

                {/* Section 1: Customer Details */}
                <div className="space-y-3 bg-slate-800/40 p-4 rounded-xl border border-slate-800">
                  <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                    1. Data Pemesan &amp; Alamat Kirim
                  </h4>

                  <div>
                    <label className="block text-[11px] font-medium text-slate-300 mb-1">
                      Nama Perusahaan / Pemesan *
                    </label>
                    <input
                      type="text"
                      required
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      placeholder="Contoh: PT Surya Teknik Mandiri / Bpk. Danu"
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500 transition"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <div>
                      <label className="block text-[11px] font-medium text-slate-300 mb-1">
                        Nomor WhatsApp Aktif *
                      </label>
                      <input
                        type="tel"
                        required
                        value={customerPhone}
                        onChange={(e) => setCustomerPhone(e.target.value)}
                        placeholder="0812xxxxxxxx"
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500 transition font-mono"
                      />
                      <span className="text-[10px] text-slate-400 mt-0.5 block">
                        Kode tracking akan dikirimkan ke nomor ini
                      </span>
                    </div>
                    <div>
                      <label className="block text-[11px] font-medium text-slate-300 mb-1">
                        Email Purchasing / Pribadi *
                      </label>
                      <input
                        type="email"
                        required
                        value={customerEmail}
                        onChange={(e) => setCustomerEmail(e.target.value)}
                        placeholder="purchasing@company.co.id"
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500 transition"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-medium text-slate-300 mb-1">
                      Alamat Lengkap Penerima / Plant Pabrik *
                    </label>
                    <textarea
                      rows={2}
                      required
                      value={customerAddress}
                      onChange={(e) => setCustomerAddress(e.target.value)}
                      placeholder="Nama jalan, nomor gedung, blok industri, kota, kode pos"
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500 transition"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-medium text-slate-300 mb-1">
                      Catatan Pengiriman (Opsional)
                    </label>
                    <input
                      type="text"
                      value={orderNotes}
                      onChange={(e) => setOrderNotes(e.target.value)}
                      placeholder="Misal: Titip di Pos Sekuriti Gate 2 / Butuh packing peti"
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500 transition"
                    />
                  </div>
                </div>

                {/* Section 2: Courier Selection (JNE, JNT, Lalamove, Grab, Gojek) */}
                <div className="space-y-3 bg-slate-800/40 p-4 rounded-xl border border-slate-800">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-cyan-400"></span>
                      2. Pilih Jasa Kurir &amp; Estimasi Tiba (ETA)
                    </h4>
                    <span className="text-[10px] text-cyan-400 font-medium">5 Opsi Kurir</span>
                  </div>

                  <div className="space-y-2">
                    {COURIER_OPTIONS.map((courier) => {
                      const isSelected = selectedCourier.id === courier.id;
                      return (
                        <label
                          key={courier.id}
                          onClick={() => setSelectedCourier(courier)}
                          className={`flex items-center justify-between p-3 rounded-xl border transition cursor-pointer ${
                            isSelected
                              ? 'bg-slate-800/90 border-cyan-500 shadow-sm shadow-cyan-500/20 ring-1 ring-cyan-500/50'
                              : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <input
                              type="radio"
                              name="courierOption"
                              checked={isSelected}
                              onChange={() => setSelectedCourier(courier)}
                              className="text-cyan-500 focus:ring-cyan-500 h-4 w-4"
                            />
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-xs text-white">
                                  {courier.name}
                                </span>
                                <span className="text-[10px] px-1.5 py-0.2 rounded font-medium bg-slate-800 text-cyan-300 border border-slate-700">
                                  {courier.badge}
                                </span>
                              </div>
                              <span className="text-[11px] text-slate-400 block mt-0.5">
                                Layanan: <span className="text-slate-300 font-medium">{courier.service}</span>
                              </span>
                              <div className="flex items-center gap-1.5 text-[11px] text-amber-400 font-medium mt-0.5">
                                <Clock className="w-3 h-3" />
                                <span>Estimasi Tiba: {courier.eta}</span>
                              </div>
                            </div>
                          </div>

                          <div className="text-right pl-2">
                            <span className="text-xs font-bold text-white block">
                              {formatRupiah(courier.cost)}
                            </span>
                            <span className="text-[10px] text-slate-400">Tarif Resmi</span>
                          </div>
                        </label>
                      );
                    })}
                  </div>
                </div>

                {/* Section 3: Payment Method (Bank Transfer Indonesia, QRIS, PO Corporate) */}
                <div className="space-y-3 bg-slate-800/40 p-4 rounded-xl border border-slate-800">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                      3. Metode Pembayaran Resmi
                    </h4>
                    <span className="text-[10px] text-emerald-400 font-medium">Rekening Resmi Perusahaan</span>
                  </div>

                  {/* Payment Tabs */}
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => setPaymentMethod('bank_transfer')}
                      className={`p-2.5 rounded-xl border text-xs font-semibold flex flex-col items-center gap-1.5 transition cursor-pointer ${
                        paymentMethod === 'bank_transfer'
                          ? 'bg-slate-800 border-emerald-500 text-white ring-1 ring-emerald-500/40 shadow-sm'
                          : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                      }`}
                    >
                      <Building className="w-4 h-4 text-emerald-400" />
                      <span>Transfer Bank</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setPaymentMethod('qris')}
                      className={`p-2.5 rounded-xl border text-xs font-semibold flex flex-col items-center gap-1.5 transition cursor-pointer ${
                        paymentMethod === 'qris'
                          ? 'bg-slate-800 border-cyan-500 text-white ring-1 ring-cyan-500/40 shadow-sm'
                          : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                      }`}
                    >
                      <QrCode className="w-4 h-4 text-cyan-400" />
                      <span>QRIS Dinamis</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setPaymentMethod('po_corporate')}
                      className={`p-2.5 rounded-xl border text-xs font-semibold flex flex-col items-center gap-1.5 transition cursor-pointer ${
                        paymentMethod === 'po_corporate'
                          ? 'bg-slate-800 border-indigo-500 text-white ring-1 ring-indigo-500/40 shadow-sm'
                          : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                      }`}
                    >
                      <CreditCard className="w-4 h-4 text-indigo-400" />
                      <span>PO Corporate</span>
                    </button>
                  </div>

                  {/* DETAILS: TRANSFER BANK INDONESIA */}
                  {paymentMethod === 'bank_transfer' && (
                    <div className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800 space-y-3">
                      <div>
                        <label className="block text-[11px] font-medium text-slate-300 mb-1.5">
                          Pilih Bank Penerima (Rekening Perusahaan PT NetSolusions Solusi Teknologi):
                        </label>
                        <div className="grid grid-cols-5 gap-1.5">
                          {INDONESIA_BANKS.map((b) => (
                            <button
                              key={b.bank}
                              type="button"
                              onClick={() => setSelectedBank(b.bank)}
                              className={`py-1.5 px-2 rounded-lg text-xs font-bold border transition cursor-pointer ${
                                selectedBank === b.bank
                                  ? 'bg-emerald-600 border-emerald-500 text-white shadow-sm'
                                  : 'bg-slate-800 border-slate-700 text-slate-300 hover:text-white'
                              }`}
                            >
                              {b.bank}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Bank Account Details Card */}
                      <div className="p-3 rounded-xl bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700/80 space-y-2">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-slate-400">Bank Tujuan:</span>
                          <span className="font-bold text-white px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                            Bank {activeBankAccount.bank} Indonesia
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-slate-400">Atas Nama Perusahaan:</span>
                          <span className="font-semibold text-slate-200">
                            {activeBankAccount.accountName}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-slate-400">Kantor Cabang:</span>
                          <span className="text-slate-300">{activeBankAccount.branch}</span>
                        </div>

                        {/* Account Number & Copy Button */}
                        <div className="pt-2 border-t border-slate-700 flex items-center justify-between bg-slate-950/60 p-2.5 rounded-lg border border-slate-800">
                          <div>
                            <span className="text-[10px] text-slate-400 block">Nomor Rekening:</span>
                            <span className="text-base font-mono font-bold text-white tracking-wider">
                              {activeBankAccount.accountNumber}
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleCopyText(activeBankAccount.accountNumber, 'bank')}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow transition cursor-pointer"
                          >
                            {copiedBank ? (
                              <>
                                <Check className="w-3.5 h-3.5 text-white" />
                                <span>Tersalin!</span>
                              </>
                            ) : (
                              <>
                                <Copy className="w-3.5 h-3.5" />
                                <span>Salin No. Rek</span>
                              </>
                            )}
                          </button>
                        </div>

                        <p className="text-[10px] text-slate-400 leading-relaxed italic">
                          * Silakan transfer tepat sejumlah total tagihan (termasuk ongkir). Setelah transfer, admin akan memverifikasi dan membuka tracking kurir pesanan Anda.
                        </p>
                      </div>
                    </div>
                  )}

                  {/* DETAILS: QRIS DINAMIS */}
                  {paymentMethod === 'qris' && (
                    <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 text-center space-y-3">
                      <div className="flex items-center justify-center gap-2">
                        <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
                          QRIS STANDAR NASIONAL
                        </span>
                        <span className="text-slate-400 text-xs">GPN / Bank Indonesia</span>
                      </div>

                      {/* Visual QR Code Card */}
                      <div className="bg-white p-3.5 rounded-2xl inline-block shadow-xl border-4 border-slate-700 max-w-[200px] mx-auto">
                        <img
                          src={QRIS_CONFIG.qrSvgDataUri}
                          alt="QRIS Pembayaran NetSolusions"
                          className="w-40 h-40 object-contain mx-auto"
                        />
                        <span className="text-[10px] font-bold text-slate-800 block mt-1 tracking-wider">
                          NMID: {QRIS_CONFIG.nmid}
                        </span>
                      </div>

                      <div className="space-y-1">
                        <h5 className="text-xs font-bold text-white">
                          {QRIS_CONFIG.merchantName}
                        </h5>
                        <p className="text-xs font-semibold text-cyan-400">
                          Total Bayar: {formatRupiah(totalAmount)}
                        </p>
                        <p className="text-[11px] text-slate-400 max-w-xs mx-auto leading-relaxed">
                          Buka aplikasi m-Banking (BCA, Mandiri, BRI, BNI) atau e-Wallet (GoPay, OVO, ShopeePay, Dana) lalu scan kode QR di atas.
                        </p>
                      </div>
                    </div>
                  )}

                  {/* DETAILS: PO CORPORATE */}
                  {paymentMethod === 'po_corporate' && (
                    <div className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800 space-y-2 text-xs">
                      <span className="font-semibold text-white block">Term of Payment 30 Hari (B2B Industrial):</span>
                      <p className="text-slate-400 leading-relaxed text-[11px]">
                        Faktur pajak elektronik dan invoice resmi akan dikirimkan bersama barang fisik melalui kurir {selectedCourier.name}. Verifikasi PO akan ditinjau oleh Finance NetSolusions dalam waktu maksimal 30 menit.
                      </p>
                    </div>
                  )}
                </div>
              </form>
            )}

            {/* STEP 3: SUCCESS & TRACKING CODE DISPLAY */}
            {step === 'success' && createdOrder && (
              <div className="py-4 space-y-4">
                {/* Success Header */}
                <div className="text-center space-y-2">
                  <div className="w-14 h-14 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/20">
                    <CheckCircle2 className="w-8 h-8" />
                  </div>
                  <h3 className="text-base sm:text-lg font-bold text-white">
                    Pesanan Berhasil Masuk ke Sistem!
                  </h3>
                  <p className="text-xs text-slate-400 max-w-sm mx-auto">
                    Stok telah terpotong dan dialokasikan secara instan di gudang pusat.
                  </p>
                </div>

                {/* TRACKING CODE HIGHLIGHT CARD */}
                <div className="p-4 rounded-2xl bg-gradient-to-br from-indigo-950/80 via-slate-900 to-slate-900 border-2 border-indigo-500/50 shadow-xl space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-indigo-300 flex items-center gap-1.5">
                      <Truck className="w-4 h-4 text-indigo-400" />
                      Kode Tracking Pesanan Anda:
                    </span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                      Bebas Login
                    </span>
                  </div>

                  <div className="flex items-center justify-between bg-slate-950 p-3 rounded-xl border border-slate-800">
                    <span className="text-lg font-mono font-extrabold text-white tracking-widest">
                      {createdOrder.trackingCode}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleCopyText(createdOrder.trackingCode, 'tracking')}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition cursor-pointer"
                    >
                      {copiedTracking ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-white" />
                          <span>Tersalin!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>Salin Kode</span>
                        </>
                      )}
                    </button>
                  </div>

                  {/* Status Tracking Alert */}
                  <div className="p-3 rounded-xl bg-amber-950/40 border border-amber-800/60 text-xs text-amber-300 flex items-start gap-2.5">
                    <Clock className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold text-amber-200 block">
                        Status: Menunggu Konfirmasi Pembayaran oleh Admin
                      </span>
                      <p className="text-[11px] text-amber-300/80 mt-0.5 leading-relaxed">
                        Tracking armada kurir akan otomatis <strong>TERBUKA &amp; AKTIF</strong> segera setelah Admin NetSolusions mengonfirmasi bukti bayar di dashboard.
                      </p>
                    </div>
                  </div>
                </div>

                {/* WHATSAPP SHARE BUTTON - DIRECT TO CUSTOMER PHONE */}
                <div className="space-y-2">
                  <button
                    type="button"
                    onClick={handleShareToWhatsApp}
                    className="w-full py-3 px-4 rounded-xl font-bold text-xs sm:text-sm bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-500 hover:to-green-500 text-white shadow-lg shadow-emerald-600/30 transition flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Share2 className="w-4 h-4" />
                    <span>Bagikan Kode Tracking Langsung ke WhatsApp ({createdOrder.customerPhone})</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleOpenTrackingFromSuccess}
                    className="w-full py-2.5 px-4 rounded-xl font-semibold text-xs bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Search className="w-4 h-4 text-indigo-400" />
                    <span>Buka Layanan Tracking Pesanan (Tanpa Login)</span>
                  </button>
                </div>

                {/* Order Summary Recap */}
                <div className="p-3.5 rounded-xl bg-slate-800/60 border border-slate-700 text-xs space-y-2">
                  <div className="flex justify-between text-slate-400">
                    <span>No. Invoice:</span>
                    <span className="text-white font-mono">{createdOrder.orderNumber}</span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>Nama Pemesan:</span>
                    <span className="text-white font-medium">{createdOrder.customerName}</span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>Kurir Terpilih:</span>
                    <span className="text-cyan-400 font-semibold">
                      {createdOrder.selectedCourier.name} ({createdOrder.selectedCourier.eta})
                    </span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>Metode Bayar:</span>
                    <span className="text-emerald-400 font-semibold uppercase">
                      {createdOrder.paymentMethod === 'bank_transfer'
                        ? `Transfer Bank ${createdOrder.selectedBank}`
                        : createdOrder.paymentMethod === 'qris'
                        ? 'QRIS Dinamis'
                        : 'PO Corporate'}
                    </span>
                  </div>
                  <div className="flex justify-between text-slate-400 pt-2 border-t border-slate-700">
                    <span>Subtotal Barang:</span>
                    <span className="text-slate-200">{formatRupiah(createdOrder.subtotalAmount)}</span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>Ongkos Kirim:</span>
                    <span className="text-slate-200">{formatRupiah(createdOrder.shippingCost)}</span>
                  </div>
                  <div className="flex justify-between text-white font-bold pt-1.5 border-t border-slate-700/80 text-sm">
                    <span>Total Tagihan:</span>
                    <span className="text-emerald-400">{formatRupiah(createdOrder.totalAmount)}</span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleClose}
                  className="w-full py-2.5 px-4 rounded-xl font-medium text-xs text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
                >
                  Tutup Keranjang &amp; Kembali ke Katalog
                </button>
              </div>
            )}
          </div>

          {/* Footer Controls for Cart and Checkout */}
          {cart.length > 0 && step !== 'success' && (
            <div className="p-4 sm:p-5 border-t border-slate-800 bg-slate-900/95 sticky bottom-0 z-10 space-y-3">
              <div className="space-y-1.5 text-xs">
                <div className="flex justify-between text-slate-400">
                  <span>Subtotal Item ({cart.reduce((a, b) => a + b.quantity, 0)} pcs):</span>
                  <span className="text-slate-200 font-mono">{formatRupiah(subtotalAmount)}</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>
                    Ongkir Kurir ({selectedCourier.name}):
                  </span>
                  <span className="text-cyan-400 font-mono font-medium">
                    {formatRupiah(shippingCost)}
                  </span>
                </div>
                <div className="flex justify-between text-white font-bold text-sm sm:text-base pt-2 border-t border-slate-800">
                  <span>Total Tagihan:</span>
                  <span className="text-emerald-400 font-mono">{formatRupiah(totalAmount)}</span>
                </div>
              </div>

              {step === 'cart' ? (
                <button
                  onClick={() => setStep('checkout')}
                  className="w-full py-3 px-4 rounded-xl font-semibold text-xs sm:text-sm bg-gradient-to-r from-emerald-600 via-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-lg shadow-emerald-600/30 transition flex items-center justify-center gap-2 cursor-pointer"
                >
                  <span>Lanjut Pilih Kurir &amp; Pembayaran</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              ) : (
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setStep('cart')}
                    className="px-4 py-2.5 rounded-xl border border-slate-700 text-xs font-semibold text-slate-300 hover:text-white hover:bg-slate-800 transition cursor-pointer"
                  >
                    Kembali
                  </button>
                  <button
                    form="checkout-form"
                    type="submit"
                    disabled={isSubmitting}
                    className="flex-1 py-2.5 px-4 rounded-xl font-semibold text-xs sm:text-sm bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-lg shadow-emerald-600/30 transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    {isSubmitting ? (
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <>
                        <span>Konfirmasi Pembayaran ({selectedCourier.name})</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
