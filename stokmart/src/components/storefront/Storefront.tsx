import React, { useState, useMemo } from 'react';
import {
  Search,
  Filter,
  ShoppingCart,
  Eye,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  ShieldCheck,
  Cpu,
  Layers,
  Sparkles,
  TrendingUp,
  Warehouse,
  ChevronRight,
  Camera,
} from 'lucide-react';
import { useInventory } from '../../context/InventoryContext';
import { PRODUCT_CATEGORIES } from '../../data/mockProducts';
import { formatRupiah } from '../../utils/tsbAlgorithm';

export const Storefront: React.FC = () => {
  const {
    products,
    allTSBAnalyses,
    addToCart,
    setSelectedProductId,
    setActiveView,
    setIsLoginModalOpen,
    currentUser,
    setIsTrackingModalOpen,
  } = useInventory();

  const [selectedCategory, setSelectedCategory] = useState('Semua Kategori');
  const [searchQuery, setSearchQuery] = useState('');
  const [onlyInStock, setOnlyInStock] = useState(false);
  const [sortBy, setSortBy] = useState<'featured' | 'price-asc' | 'price-desc' | 'rating'>('featured');

  // Filter & sort logic
  const filteredProducts = useMemo(() => {
    return products
      .filter((p) => {
        const matchesCategory =
          selectedCategory === 'Semua Kategori' || p.category === selectedCategory;
        const matchesSearch =
          p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          p.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
          p.category.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesStock = onlyInStock ? p.currentStock > 0 : true;
        return matchesCategory && matchesSearch && matchesStock;
      })
      .sort((a, b) => {
        if (sortBy === 'price-asc') return a.price - b.price;
        if (sortBy === 'price-desc') return b.price - a.price;
        if (sortBy === 'rating') return b.rating - a.rating;
        // featured default
        return (b.isFeatured ? 1 : 0) - (a.isFeatured ? 1 : 0);
      });
  }, [products, selectedCategory, searchQuery, onlyInStock, sortBy]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-slate-900 via-slate-900/90 to-slate-950 pt-10 pb-16 border-b border-slate-800">
        {/* Background glow orbs */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-emerald-500/10 blur-[120px] pointer-events-none rounded-full" />
        <div className="absolute top-1/3 left-1/4 w-[350px] h-[250px] bg-indigo-500/10 blur-[100px] pointer-events-none rounded-full" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            {/* Left Copy */}
            <div className="lg:col-span-7 space-y-5">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold">
                <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                <span>Pengadaan Komponen Industri Berbasis Algoritma TSB</span>
              </div>

              <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight leading-tight">
                Katalog Penjualan Suku Cadang & Sensor Presisi{' '}
                <span className="bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400 bg-clip-text text-transparent">
                  Stok Real-Time Akurat
                </span>
              </h1>

              <p className="text-sm sm:text-base text-slate-300 leading-relaxed max-w-2xl">
                Solusi suplai komponen otomasi, bearing, pneumatik, dan kontrol industri. Didukung
                mesin peramalan intermiten <strong>Teunter-Syntetos-Babai (TSB)</strong> yang memantau probabilitas permintaan setiap hari untuk memastikan suku cadang langka tidak pernah kehabisan stok.
              </p>

              {/* Value Props & CTA */}
              <div className="flex flex-wrap items-center gap-3 pt-2">
                <a
                  href="#katalog-produk"
                  className="px-5 py-3 rounded-xl font-bold text-sm bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-lg shadow-emerald-600/30 transition flex items-center gap-2 cursor-pointer"
                >
                  <ShoppingCart className="w-4 h-4" />
                  <span>Jelajahi Katalog Produk</span>
                </a>

                {currentUser ? (
                  <button
                    onClick={() => setActiveView('admin')}
                    className="px-5 py-3 rounded-xl font-semibold text-sm bg-indigo-600/30 hover:bg-indigo-600 text-indigo-300 hover:text-white border border-indigo-500/50 transition flex items-center gap-2 cursor-pointer"
                  >
                    <Warehouse className="w-4 h-4" />
                    <span>Buka Dashboard Admin</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                ) : (
                  <a
                    href="#keunggulan-pengadaan"
                    className="px-5 py-3 rounded-xl font-semibold text-sm bg-slate-800/80 hover:bg-slate-700 text-slate-200 border border-slate-700 hover:border-slate-600 transition flex items-center gap-2 cursor-pointer"
                  >
                    <ShieldCheck className="w-4 h-4 text-emerald-400" />
                    <span>Jaminan Bebas Stockout</span>
                  </a>
                )}
              </div>

              {/* Trust badges */}
              <div className="pt-4 grid grid-cols-3 gap-4 border-t border-slate-800/80 text-xs text-slate-400">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>100% Original & Teruji Pabrik</span>
                </div>
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-cyan-400 shrink-0" />
                  <span>99.4% Ketersediaan Stok</span>
                </div>
                <div className="flex items-center gap-2">
                  <Cpu className="w-4 h-4 text-indigo-400 shrink-0" />
                  <span>Pengiriman Cepat 24 Jam</span>
                </div>
              </div>
            </div>

            {/* Right Customer Guarantee & Supply Protection Card */}
            <div className="lg:col-span-5">
              <div className="p-6 rounded-2xl bg-gradient-to-br from-slate-900 via-slate-850 to-slate-900 border border-slate-700/80 shadow-2xl space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-700/80">
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                    <span className="text-xs font-bold text-white uppercase tracking-wider">
                      Standar Ketersediaan Stok
                    </span>
                  </div>
                  <span className="text-[11px] font-mono font-bold text-emerald-400 bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-800/60">
                    Zero-Stockout Buffer
                  </span>
                </div>

                <div className="space-y-3">
                  <div className="p-3.5 rounded-xl bg-slate-800/50 border border-slate-700/50 text-xs space-y-2">
                    <span className="font-bold text-white block">
                      Proteksi Kontinuitas Pabrik dengan Algoritma TSB
                    </span>
                    <p className="text-[11px] text-slate-300 leading-relaxed">
                      Sistem kami secara otomatis menghitung probabilitas pemesanan suku cadang kritis secara berkala. Hal ini memastikan komponen slow-moving tetap tersedia di gudang tanpa risiko kehabisan saat mesin pabrik membutuhkan penggantian darurat.
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="p-2.5 rounded-lg bg-slate-800/40 border border-slate-700/40">
                      <span className="text-[11px] text-slate-400 block">Kesiapan Suku Cadang:</span>
                      <span className="text-base font-bold text-emerald-400">99.4% Siap Kirim</span>
                    </div>
                    <div className="p-2.5 rounded-lg bg-slate-800/40 border border-slate-700/40">
                      <span className="text-[11px] text-slate-400 block">Faktur & Pajak:</span>
                      <span className="text-base font-bold text-white">Lengkap & Resmi</span>
                    </div>
                  </div>

                  {!currentUser && (
                    <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
                      <span>Staf pengelola gudang?</span>
                      <button
                        onClick={() => setIsLoginModalOpen(true)}
                        className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 flex items-center gap-1 cursor-pointer"
                      >
                        <Warehouse className="w-3.5 h-3.5" />
                        <span>Akses Card Login Admin</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Catalog & Search Section */}
      <section id="katalog-produk" className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full space-y-8">
        {/* Controls Bar: Search, Category, Sort */}
        <div className="space-y-4">
          <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
            {/* Search input */}
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Cari suku cadang, sensor, SKU (mis: SKF, OMRON, FESTO)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 focus:border-emerald-500 rounded-xl pl-10 pr-4 py-2.5 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none transition shadow-inner"
              />
            </div>

            {/* In-Stock & Sort filters */}
            <div className="flex items-center gap-3">
              <label className="flex items-center gap-2 text-xs text-slate-300 bg-slate-900 border border-slate-800 px-3 py-2.5 rounded-xl cursor-pointer hover:border-slate-700">
                <input
                  type="checkbox"
                  checked={onlyInStock}
                  onChange={(e) => setOnlyInStock(e.target.checked)}
                  className="rounded text-emerald-500 focus:ring-0"
                />
                <span>Hanya Stok Tersedia</span>
              </label>

              <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-xl text-xs text-slate-300">
                <Filter className="w-3.5 h-3.5 text-slate-500" />
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="bg-transparent text-slate-200 focus:outline-none cursor-pointer"
                >
                  <option value="featured" className="bg-slate-900">Urutkan: Rekomendasi</option>
                  <option value="price-asc" className="bg-slate-900">Harga: Termurah</option>
                  <option value="price-desc" className="bg-slate-900">Harga: Tertinggi</option>
                  <option value="rating" className="bg-slate-900">Rating Tertinggi</option>
                </select>
              </div>
            </div>
          </div>

          {/* Category Pills */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
            {PRODUCT_CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition cursor-pointer ${
                  selectedCategory === cat
                    ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
                    : 'bg-slate-900 text-slate-400 hover:text-white hover:bg-slate-800 border border-slate-800'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Product Cards Grid */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-slate-300 uppercase tracking-wider">
              Menampilkan {filteredProducts.length} Produk
            </h3>
            <span className="text-xs text-slate-500">
              Sinkronisasi Stok Real-Time Terhubung
            </span>
          </div>

          {filteredProducts.length === 0 ? (
            <div className="p-12 text-center rounded-2xl bg-slate-900/60 border border-slate-800">
              <Layers className="w-10 h-10 text-slate-600 mx-auto mb-3" />
              <p className="text-sm font-medium text-slate-300">Tidak ada produk yang cocok</p>
              <p className="text-xs text-slate-500 mt-1">
                Coba ubah kata kunci pencarian atau reset filter kategori.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
              {filteredProducts.map((product) => {
                const tsb = allTSBAnalyses.get(product.id);
                const isOutOfStock = product.currentStock <= 0;
                const isLowStock =
                  tsb && product.currentStock <= tsb.reorderPoint && !isOutOfStock;

                return (
                  <div
                    key={product.id}
                    className="group rounded-2xl bg-slate-900 border border-slate-800 hover:border-slate-700 shadow-md hover:shadow-xl transition-all duration-200 flex flex-col overflow-hidden"
                  >
                    {/* Image Area */}
                    <div
                      onClick={() => setSelectedProductId(product.id)}
                      className="relative aspect-4/3 bg-slate-800/80 overflow-hidden cursor-pointer"
                      title="Klik untuk melihat detail & galeri foto lengkap"
                    >
                      <img
                        src={product.imageUrl}
                        alt={product.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        loading="lazy"
                      />

                      {/* Stock Pill Status */}
                      <div className="absolute bottom-2.5 left-2.5">
                        {isOutOfStock ? (
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-rose-950/90 text-rose-300 border border-rose-800/80 backdrop-blur-xs flex items-center gap-1">
                            <AlertTriangle className="w-3 h-3 text-rose-400" />
                            Stok Habis (Restok PO)
                          </span>
                        ) : isLowStock ? (
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-950/90 text-amber-300 border border-amber-800/80 backdrop-blur-xs flex items-center gap-1 animate-pulse">
                            <AlertTriangle className="w-3 h-3 text-amber-400" />
                            Sisa {product.currentStock} {product.unit}!
                          </span>
                        ) : (
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-950/90 text-emerald-300 border border-emerald-800/80 backdrop-blur-xs flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                            Ready: {product.currentStock} {product.unit}
                          </span>
                        )}
                      </div>

                      {/* Top Badges: SKU & Photo Count */}
                      <div className="absolute top-2.5 right-2.5 flex items-center gap-1.5">
                        {product.images && product.images.length > 1 && (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-950/90 text-indigo-300 border border-indigo-700/80 backdrop-blur-xs flex items-center gap-1 shadow">
                            <Camera className="w-2.5 h-2.5" />
                            {product.images.length} Foto
                          </span>
                        )}
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-slate-950/80 text-slate-300 border border-slate-700/80 backdrop-blur-xs">
                          {product.sku.split('-')[0]}
                        </span>
                      </div>
                    </div>

                    {/* Content Details */}
                    <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                      <div>
                        <div className="text-[11px] text-slate-400 font-medium mb-1">
                          {product.category}
                        </div>
                        <h4 className="text-sm font-bold text-white group-hover:text-emerald-400 transition-colors line-clamp-2 leading-snug">
                          {product.name}
                        </h4>
                        <p className="text-xs text-slate-400 line-clamp-2 mt-1 leading-relaxed">
                          {product.description}
                        </p>
                      </div>

                      {/* Specs Highlights */}
                      <div className="grid grid-cols-2 gap-1.5 text-[11px] p-2 rounded-lg bg-slate-800/40 border border-slate-800">
                        {Object.entries(product.specs)
                          .slice(0, 2)
                          .map(([k, v]) => (
                            <div key={k} className="truncate">
                              <span className="text-slate-500 block text-[10px]">{k}</span>
                              <span className="text-slate-300 font-medium truncate block">{v}</span>
                            </div>
                          ))}
                      </div>

                      {/* Price & Action */}
                      <div className="pt-2 border-t border-slate-800 space-y-2.5">
                        <div className="flex items-baseline justify-between">
                          <div>
                            <span className="text-[10px] text-slate-500 block">Harga Satuan</span>
                            <span className="text-base font-extrabold text-emerald-400">
                              {formatRupiah(product.price)}
                            </span>
                          </div>
                          <span className="text-[11px] text-slate-400">per {product.unit}</span>
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                          <button
                            onClick={() => setSelectedProductId(product.id)}
                            className="py-2.5 px-3 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 flex items-center justify-center gap-1.5 transition cursor-pointer hover:border-slate-600"
                            title="Lihat spesifikasi & galeri foto lengkap"
                          >
                            <Eye className="w-3.5 h-3.5 text-slate-400" />
                            <span>Detail</span>
                          </button>

                          <button
                            onClick={() => addToCart(product, 1)}
                            disabled={isOutOfStock}
                            title={isOutOfStock ? 'Stok sedang habis' : 'Pesan / Tambah ke Keranjang Belanja'}
                            className={`py-2.5 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                              isOutOfStock
                                ? 'bg-slate-800 text-slate-500 border border-slate-700/60 cursor-not-allowed'
                                : 'bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white shadow-md shadow-emerald-600/30 border border-emerald-500/50 hover:scale-[1.02]'
                            }`}
                          >
                            <ShoppingCart className="w-3.5 h-3.5 text-white" />
                            <span>{isOutOfStock ? 'Stok Habis' : '+ Keranjang'}</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Why TSB section (Trust & Engineering Value) */}
        <div id="keunggulan-pengadaan" className="mt-16 p-8 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-900 to-indigo-950/40 border border-slate-800 space-y-6">
          <div className="max-w-3xl">
            <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider block mb-1">
              Keunggulan Sistem Inventaris TSB
            </span>
            <h3 className="text-2xl font-black text-white">
              Mengapa Pengadaan Melalui NetSolusions Selalu Siap Sedia?
            </h3>
            <p className="text-xs sm:text-sm text-slate-300 mt-2 leading-relaxed">
              Komponen suku cadang industri umumnya memiliki pola <em>intermittent demand</em> (permintaan tidak beraturan, banyak hari tanpa penjualan kemudian terjadi pemesanan tiba-tiba). Sistem konvensional kerap gagal atau menumpuk stok mati.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">
            <div className="p-4 rounded-xl bg-slate-800/50 border border-slate-700/60 space-y-2">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-sm">
                1
              </div>
              <h4 className="text-sm font-bold text-white">Pembaruan Probabilitas Harian (p_t)</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Algoritma TSB memperbarui probabilitas permintaan setiap hari bahkan saat nol penjualan, mencegah peramalan berlebih untuk produk yang mulai usang.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-slate-800/50 border border-slate-700/60 space-y-2">
              <div className="w-8 h-8 rounded-lg bg-indigo-500/20 text-indigo-400 flex items-center justify-center font-bold text-sm">
                2
              </div>
              <h4 className="text-sm font-bold text-white">Buffer Safety Stock Akurat</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Reorder Point (ROP) dihitung otomatis berdasarkan varians permintaan dan lead time supplier resmi, meminimalkan downtime mesin pabrik pelanggan.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-slate-800/50 border border-slate-700/60 space-y-2">
              <div className="w-8 h-8 rounded-lg bg-cyan-500/20 text-cyan-400 flex items-center justify-center font-bold text-sm">
                3
              </div>
              <h4 className="text-sm font-bold text-white">Dukungan Pembelian Korporasi</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Tersedia metode pembayaran fleksibel: Virtual Account instan, QRIS, hingga PO Perusahaan dengan tempo pembayaran (TOP 30) untuk rekanan industri.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-800 bg-slate-900/60 py-8 text-xs text-slate-400 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-bold text-white">NetSolusions TSB</span>
            <span>— Sistem Monitoring Stok Real-Time & Rekomendasi Restok Berbasis Algoritma TSB</span>
          </div>
          <div className="flex items-center gap-4 text-slate-400">
            <button
              onClick={() => setIsTrackingModalOpen(true)}
              className="text-cyan-400 hover:text-cyan-300 font-semibold flex items-center gap-1 cursor-pointer"
            >
              <span>Lacak Pesanan (Bebas Login)</span>
            </button>
            <span>•</span>
            <span>Standar EJOR 2011 (Teunter-Syntetos-Babai)</span>
            <span>•</span>
            <button
              onClick={() => {
                if (!currentUser) setIsLoginModalOpen(true);
                else setActiveView('admin');
              }}
              className="text-indigo-400 hover:text-indigo-300 font-semibold flex items-center gap-1 cursor-pointer"
            >
              <span>{currentUser ? 'Buka Dashboard Admin' : 'Login Admin / Staf Gudang'}</span>
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
};
