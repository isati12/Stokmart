import React, { useState } from 'react';
import {
  X,
  ShoppingCart,
  ShieldCheck,
  Truck,
  Building2,
  CheckCircle,
  AlertTriangle,
  Star,
  Package,
  ChevronLeft,
  ChevronRight,
  Maximize2,
  Camera,
  Layers,
} from 'lucide-react';
import { useInventory } from '../../context/InventoryContext';
import { formatRupiah } from '../../utils/tsbAlgorithm';

export const ProductDetailModal: React.FC = () => {
  const { products, selectedProductId, setSelectedProductId, addToCart, getTSBAnalysis } =
    useInventory();
  const [qty, setQty] = useState(1);
  const [activeIdx, setActiveIdx] = useState(0);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);

  if (!selectedProductId) return null;

  const product = products.find((p) => p.id === selectedProductId);
  if (!product) return null;

  const tsbResult = getTSBAnalysis(product.id);
  const isOutOfStock = product.currentStock <= 0;
  const isLowStock = product.currentStock <= tsbResult.reorderPoint && !isOutOfStock;

  // Resolve multiple sample images with fallback
  const images =
    product.images && product.images.length > 0 ? product.images : [product.imageUrl];
  const safeIdx = Math.min(activeIdx, images.length - 1);
  const currentImage = images[safeIdx] || product.imageUrl;

  const handleAddToCart = () => {
    if (product.currentStock < qty) return;
    addToCart(product, qty);
    setSelectedProductId(null);
  };

  const handlePrevImage = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    setActiveIdx((prev) => (prev === 0 ? images.length - 1 : prev - 1));
  };

  const handleNextImage = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    setActiveIdx((prev) => (prev === images.length - 1 ? 0 : prev + 1));
  };

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
        <div className="relative w-full max-w-4xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-2xl overflow-hidden max-h-[92vh] flex flex-col transition-colors">
          {/* Header Bar */}
          <div className="flex items-center justify-between px-5 sm:px-6 py-3.5 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50">
            <div className="flex items-center gap-2.5 flex-wrap">
              <span className="text-xs font-mono font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-950/70 border border-emerald-300 dark:border-emerald-800/80 px-2.5 py-0.5 rounded-md">
                {product.sku}
              </span>
              <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                • {product.category}
              </span>
              <span className="hidden sm:inline-flex items-center gap-1 text-[11px] font-semibold text-indigo-700 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 px-2 py-0.5 rounded border border-indigo-200 dark:border-indigo-800/60">
                <Camera className="w-3 h-3" />
                {images.length} Foto Contoh SKU
              </span>
            </div>
            <button
              onClick={() => setSelectedProductId(null)}
              className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-white rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800 transition cursor-pointer"
              title="Tutup"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Content Body */}
          <div className="p-5 sm:p-6 overflow-y-auto space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Product Gallery Section (Col 1-7) */}
              <div className="lg:col-span-7 space-y-3">
                {/* Main Large Image Display */}
                <div className="relative aspect-4/3 rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700/80 group select-none">
                  <img
                    src={currentImage}
                    alt={`${product.name} - Foto ${safeIdx + 1}`}
                    className="w-full h-full object-cover transition-all duration-300 group-hover:scale-102 cursor-zoom-in"
                    onClick={() => setIsLightboxOpen(true)}
                  />

                  {/* Stock status overlay */}
                  <div className="absolute bottom-3 left-3 pointer-events-none">
                    {isOutOfStock ? (
                      <span className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-rose-600/90 text-white backdrop-blur shadow">
                        <AlertTriangle className="w-3.5 h-3.5" /> Stok Habis (Sedang Restok PO)
                      </span>
                    ) : isLowStock ? (
                      <span className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-500/95 text-slate-950 backdrop-blur shadow font-bold">
                        <AlertTriangle className="w-3.5 h-3.5" /> Sisa {product.currentStock} {product.unit} (Menipis)
                      </span>
                    ) : (
                      <span className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-600/95 text-white backdrop-blur shadow">
                        <CheckCircle className="w-3.5 h-3.5" /> Ready: {product.currentStock} {product.unit}
                      </span>
                    )}
                  </div>

                  {/* Photo Counter Badge */}
                  <div className="absolute top-3 left-3 bg-slate-950/80 backdrop-blur-xs text-white text-[11px] font-semibold px-2.5 py-1 rounded-full border border-slate-700/80 flex items-center gap-1.5">
                    <Camera className="w-3 h-3 text-emerald-400" />
                    <span>
                      Foto {safeIdx + 1} / {images.length}
                    </span>
                  </div>

                  {/* Fullscreen Zoom Trigger */}
                  <button
                    onClick={() => setIsLightboxOpen(true)}
                    className="absolute top-3 right-3 p-1.5 rounded-lg bg-slate-950/75 hover:bg-slate-900 text-white border border-slate-700/80 shadow transition opacity-90 hover:opacity-100 cursor-pointer"
                    title="Perbesar Foto (Resolusi Penuh)"
                  >
                    <Maximize2 className="w-4 h-4" />
                  </button>

                  {/* Left / Right Carousel Controls */}
                  {images.length > 1 && (
                    <>
                      <button
                        onClick={handlePrevImage}
                        className="absolute left-2.5 top-1/2 -translate-y-1/2 p-2 rounded-full bg-slate-950/70 hover:bg-slate-900 text-white border border-slate-700/60 opacity-80 hover:opacity-100 transition shadow-lg cursor-pointer"
                        title="Foto Sebelumnya"
                      >
                        <ChevronLeft className="w-5 h-5" />
                      </button>
                      <button
                        onClick={handleNextImage}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 p-2 rounded-full bg-slate-950/70 hover:bg-slate-900 text-white border border-slate-700/60 opacity-80 hover:opacity-100 transition shadow-lg cursor-pointer"
                        title="Foto Berikutnya"
                      >
                        <ChevronRight className="w-5 h-5" />
                      </button>
                    </>
                  )}
                </div>

                {/* Thumbnails Strip / Multi-photo Selectors */}
                {images.length > 1 && (
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 px-0.5">
                      <span className="flex items-center gap-1 font-medium">
                        <Layers className="w-3.5 h-3.5 text-indigo-500 dark:text-indigo-400" />
                        Pilih foto contoh untuk dilihat:
                      </span>
                      <span>Klik thumbnail untuk beralih</span>
                    </div>

                    <div className="flex items-center gap-2.5 overflow-x-auto pb-1 pt-0.5 scrollbar-thin">
                      {images.map((imgUrl, i) => (
                        <button
                          key={i}
                          onClick={() => setActiveIdx(i)}
                          className={`relative w-16 h-16 sm:w-18 sm:h-18 rounded-xl overflow-hidden shrink-0 border-2 transition-all cursor-pointer ${
                            safeIdx === i
                              ? 'border-emerald-500 ring-2 ring-emerald-500/30 scale-105 shadow-md shadow-emerald-500/20'
                              : 'border-slate-200 dark:border-slate-700/80 opacity-70 hover:opacity-100 hover:border-slate-400'
                          }`}
                        >
                          <img
                            src={imgUrl}
                            alt={`Thumbnail ${i + 1}`}
                            className="w-full h-full object-cover"
                          />
                          {i === 0 && (
                            <span className="absolute top-0.5 left-0.5 bg-slate-950/80 text-white text-[8px] font-bold px-1 rounded">
                              Utama
                            </span>
                          )}
                          <span className="absolute bottom-0.5 right-0.5 bg-slate-950/80 text-slate-200 text-[8px] font-mono px-1 rounded">
                            #{i + 1}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Supplier Info Card */}
                <div className="p-3.5 rounded-xl bg-slate-100 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 space-y-2 text-xs">
                  <div className="flex items-center justify-between text-slate-700 dark:text-slate-300">
                    <span className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400">
                      <Building2 className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" /> Distributor Resmi
                    </span>
                    <span className="font-semibold text-slate-900 dark:text-slate-200">{product.supplier.name}</span>
                  </div>
                  <div className="flex items-center justify-between text-slate-700 dark:text-slate-300">
                    <span className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400">
                      <Truck className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" /> Waktu Kirim Restok
                    </span>
                    <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
                      {product.leadTimeDays} Hari Kerja
                    </span>
                  </div>
                </div>
              </div>

              {/* Product Details & Purchase Form (Col 8-12) */}
              <div className="lg:col-span-5 space-y-4 flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-1.5">
                    <div className="flex items-center text-amber-500 dark:text-amber-400 text-xs">
                      <Star className="w-3.5 h-3.5 fill-current" />
                      <span className="ml-1 font-bold text-slate-800 dark:text-slate-200">
                        {product.rating.toFixed(1)}
                      </span>
                    </div>
                    <span className="text-xs text-slate-400">|</span>
                    <span className="text-xs text-slate-500 dark:text-slate-400">
                      {product.soldCount} Unit Terjual
                    </span>
                  </div>

                  <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white leading-snug mb-2">
                    {product.name}
                  </h2>

                  <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mb-3">
                    {formatRupiah(product.price)}
                    <span className="text-xs text-slate-500 dark:text-slate-400 font-normal ml-1">
                      / {product.unit}
                    </span>
                  </div>

                  <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed mb-4">
                    {product.description}
                  </p>

                  {/* Technical Specifications */}
                  <div>
                    <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                      <Package className="w-3.5 h-3.5 text-indigo-500 dark:text-indigo-400" /> Spesifikasi Teknis
                    </h4>
                    <div className="grid grid-cols-2 gap-2 text-xs bg-slate-50 dark:bg-slate-800/40 p-3 rounded-xl border border-slate-200 dark:border-slate-700/50">
                      {Object.entries(product.specs).map(([key, val]) => (
                        <div key={key} className="space-y-0.5">
                          <span className="text-[10px] text-slate-500 dark:text-slate-400 block">{key}</span>
                          <div className="font-semibold text-slate-800 dark:text-slate-200 truncate">{val}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Purchase Controls */}
                <div className="pt-4 border-t border-slate-200 dark:border-slate-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-700 dark:text-slate-300 font-medium">
                      Jumlah Pembelian:
                    </span>
                    <div className="flex items-center border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800/80">
                      <button
                        onClick={() => setQty((prev) => Math.max(1, prev - 1))}
                        disabled={qty <= 1 || isOutOfStock}
                        className="px-3 py-1 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white disabled:opacity-40 transition cursor-pointer"
                      >
                        -
                      </button>
                      <span className="px-3 py-1 text-sm font-semibold text-slate-900 dark:text-white min-w-[32px] text-center">
                        {qty}
                      </span>
                      <button
                        onClick={() => setQty((prev) => Math.min(product.currentStock, prev + 1))}
                        disabled={qty >= product.currentStock || isOutOfStock}
                        className="px-3 py-1 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white disabled:opacity-40 transition cursor-pointer"
                      >
                        +
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                    <span>Subtotal:</span>
                    <span className="font-bold text-slate-900 dark:text-white text-base">
                      {formatRupiah(product.price * qty)}
                    </span>
                  </div>

                  <button
                    onClick={handleAddToCart}
                    disabled={isOutOfStock}
                    className="w-full py-3 px-4 rounded-xl font-bold text-sm bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 active:from-emerald-700 active:to-teal-700 text-white shadow-lg shadow-emerald-600/30 transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ShoppingCart className="w-4 h-4" />
                    {isOutOfStock ? 'Stok Tidak Tersedia' : 'Pesan / Tambah ke Keranjang Belanja'}
                  </button>

                  <div className="flex items-center justify-center gap-4 text-[11px] text-slate-500 dark:text-slate-400 pt-1">
                    <span className="flex items-center gap-1">
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" /> 100% Produk Original & Bergaransi
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Lightbox Modal for Full Resolution Photo Inspection */}
      {isLightboxOpen && (
        <div
          className="fixed inset-0 z-60 bg-black/95 backdrop-blur-md flex flex-col items-center justify-center p-4 animate-fadeIn"
          onClick={() => setIsLightboxOpen(false)}
        >
          <div className="absolute top-4 right-4 flex items-center gap-3">
            <span className="text-white text-xs bg-slate-800/80 px-3 py-1 rounded-full border border-slate-700">
              Foto {safeIdx + 1} dari {images.length}
            </span>
            <button
              onClick={() => setIsLightboxOpen(false)}
              className="p-2 rounded-full bg-slate-800/80 hover:bg-slate-700 text-white transition cursor-pointer"
              title="Tutup"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          <div
            className="relative max-w-5xl max-h-[85vh] flex items-center justify-center"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={currentImage}
              alt={product.name}
              className="max-w-full max-h-[82vh] object-contain rounded-xl shadow-2xl border border-slate-800"
            />

            {images.length > 1 && (
              <>
                <button
                  onClick={handlePrevImage}
                  className="absolute -left-4 sm:-left-12 top-1/2 -translate-y-1/2 p-3 rounded-full bg-slate-900/80 hover:bg-slate-800 text-white border border-slate-700 transition cursor-pointer"
                >
                  <ChevronLeft className="w-6 h-6" />
                </button>
                <button
                  onClick={handleNextImage}
                  className="absolute -right-4 sm:-right-12 top-1/2 -translate-y-1/2 p-3 rounded-full bg-slate-900/80 hover:bg-slate-800 text-white border border-slate-700 transition cursor-pointer"
                >
                  <ChevronRight className="w-6 h-6" />
                </button>
              </>
            )}
          </div>

          {/* Lightbox thumbnail indicator bar */}
          {images.length > 1 && (
            <div
              className="mt-4 flex items-center gap-2 overflow-x-auto max-w-xl p-2 bg-slate-900/70 rounded-xl border border-slate-800"
              onClick={(e) => e.stopPropagation()}
            >
              {images.map((img, i) => (
                <button
                  key={i}
                  onClick={() => setActiveIdx(i)}
                  className={`w-14 h-14 rounded-lg overflow-hidden shrink-0 border-2 transition ${
                    safeIdx === i ? 'border-emerald-400 scale-105' : 'border-transparent opacity-60 hover:opacity-100'
                  }`}
                >
                  <img src={img} alt={`Thumb ${i}`} className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </>
  );
};
