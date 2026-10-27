import React, { useState, useRef } from 'react';
import {
  PackagePlus,
  Edit,
  Trash2,
  Boxes,
  Plus,
  Save,
  X,
  Search,
  Check,
  AlertCircle,
  Camera,
  Upload,
  Image as ImageIcon,
  CheckCircle2,
  AlertTriangle,
  Layers,
  ArrowRight,
  Sparkles,
  Link as LinkIcon,
  Eye,
  FileCheck2,
  RefreshCw,
} from 'lucide-react';
import { useInventory } from '../../context/InventoryContext';
import { Product } from '../../types/inventory';
import { formatRupiah } from '../../utils/tsbAlgorithm';
import { PRODUCT_CATEGORIES } from '../../data/mockProducts';

// Sample industrial presets for quick demonstration
const SAMPLE_INDUSTRIAL_PHOTOS = [
  {
    label: 'Bearing SKF Presisi',
    category: 'Mekanikal & Transmisi',
    url: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=800&q=80',
  },
  {
    label: 'Inner Raceway Detail',
    category: 'Mekanikal & Transmisi',
    url: 'https://images.unsplash.com/photo-1537462715879-360eeb61a0ad?auto=format&fit=crop&w=800&q=80',
  },
  {
    label: 'Sensor Omron M12',
    category: 'Sensor & Otomasi',
    url: 'https://images.unsplash.com/photo-1581092335397-9583fe92d232?auto=format&fit=crop&w=800&q=80',
  },
  {
    label: 'LED & Wiring Terminal',
    category: 'Sensor & Otomasi',
    url: 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=800&q=80',
  },
  {
    label: 'Solenoid Valve SMC',
    category: 'Pneumatik & Hidrolik',
    url: 'https://images.unsplash.com/photo-1581092580497-e0d23cbdf1dc?auto=format&fit=crop&w=800&q=80',
  },
  {
    label: 'Pneumatic Cylinder Festo',
    category: 'Pneumatik & Hidrolik',
    url: 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?auto=format&fit=crop&w=800&q=80',
  },
  {
    label: 'Inverter Altivar Schneider',
    category: 'Kelistrikan & Kontrol',
    url: 'https://images.unsplash.com/photo-1581092162384-8987c1d64718?auto=format&fit=crop&w=800&q=80',
  },
  {
    label: 'Solid State Relay Fotek',
    category: 'Kelistrikan & Kontrol',
    url: 'https://images.unsplash.com/photo-1581092334651-ddf26d9a09d0?auto=format&fit=crop&w=800&q=80',
  },
];

export const ProductManagementTab: React.FC = () => {
  const { products, addNewProduct, updateProduct, deleteProduct, adjustProductStock } =
    useInventory();

  // Sub-tab view: 'catalog' | 'opname'
  const [activeSubTab, setActiveSubTab] = useState<'catalog' | 'opname'>('catalog');

  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('Semua Kategori');

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [editImages, setEditImages] = useState<string[]>([]);
  const [editUrlInput, setEditUrlInput] = useState('');

  // Stock Opname modal state
  const [opnameTargetProduct, setOpnameTargetProduct] = useState<Product | null>(null);
  const [opnamePhysicalStock, setOpnamePhysicalStock] = useState<number>(0);
  const [opnameReason, setOpnameReason] = useState<string>('Stock Opname Rutin Gudang');
  const [opnameEvidencePhotos, setOpnameEvidencePhotos] = useState<string[]>([]);
  const [syncOpnamePhotosToCatalog, setSyncOpnamePhotosToCatalog] = useState<boolean>(true);
  const [opnameUrlInput, setOpnameUrlInput] = useState('');

  // Form states for adding new SKU
  const [formData, setFormData] = useState({
    sku: '',
    name: '',
    category: PRODUCT_CATEGORIES[1],
    description: '',
    price: 250000,
    costPrice: 175000,
    currentStock: 10,
    minimumStock: 5,
    leadTimeDays: 4,
    unit: 'Unit',
    supplierName: 'PT Mitra Presisi Jaya',
    supplierContact: 'sales@mitrapresisi.co.id',
  });

  const [formImages, setFormImages] = useState<string[]>([
    'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1537462715879-360eeb61a0ad?auto=format&fit=crop&w=800&q=80',
  ]);
  const [newUrlInput, setNewUrlInput] = useState('');

  const fileInputRefNew = useRef<HTMLInputElement>(null);
  const fileInputRefEdit = useRef<HTMLInputElement>(null);
  const fileInputRefOpname = useRef<HTMLInputElement>(null);

  // Filtered products list
  const filteredProducts = products.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.sku.toLowerCase().includes(search.toLowerCase()) ||
      p.category.toLowerCase().includes(search.toLowerCase());
    const matchesCategory =
      categoryFilter === 'Semua Kategori' || p.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  // Handle local file uploads (multiple files) converted to Base64
  const handleFileUpload = (
    files: FileList | null,
    target: 'new' | 'edit' | 'opname'
  ) => {
    if (!files || files.length === 0) return;

    Array.from(files).forEach((file) => {
      if (!file.type.startsWith('image/')) return;
      const reader = new FileReader();
      reader.onload = (e) => {
        const base64 = e.target?.result as string;
        if (!base64) return;

        if (target === 'new') {
          setFormImages((prev) => [...prev, base64]);
        } else if (target === 'edit') {
          setEditImages((prev) => [...prev, base64]);
        } else if (target === 'opname') {
          setOpnameEvidencePhotos((prev) => [...prev, base64]);
        }
      };
      reader.readAsDataURL(file);
    });
  };

  // Add image by URL
  const handleAddUrlImage = (target: 'new' | 'edit' | 'opname') => {
    if (target === 'new') {
      if (!newUrlInput.trim()) return;
      setFormImages((prev) => [...prev, newUrlInput.trim()]);
      setNewUrlInput('');
    } else if (target === 'edit') {
      if (!editUrlInput.trim()) return;
      setEditImages((prev) => [...prev, editUrlInput.trim()]);
      setEditUrlInput('');
    } else if (target === 'opname') {
      if (!opnameUrlInput.trim()) return;
      setOpnameEvidencePhotos((prev) => [...prev, opnameUrlInput.trim()]);
      setOpnameUrlInput('');
    }
  };

  // Set primary photo (reorder to index 0)
  const handleSetPrimary = (index: number, target: 'new' | 'edit') => {
    if (index === 0) return;
    if (target === 'new') {
      setFormImages((prev) => {
        const copy = [...prev];
        const [moved] = copy.splice(index, 1);
        return [moved, ...copy];
      });
    } else {
      setEditImages((prev) => {
        const copy = [...prev];
        const [moved] = copy.splice(index, 1);
        return [moved, ...copy];
      });
    }
  };

  // Remove photo
  const handleRemovePhoto = (index: number, target: 'new' | 'edit' | 'opname') => {
    if (target === 'new') {
      setFormImages((prev) => prev.filter((_, i) => i !== index));
    } else if (target === 'edit') {
      setEditImages((prev) => prev.filter((_, i) => i !== index));
    } else {
      setOpnameEvidencePhotos((prev) => prev.filter((_, i) => i !== index));
    }
  };

  // Handle Submit New SKU
  const handleAddNew = (e: React.FormEvent) => {
    e.preventDefault();
    const finalImages =
      formImages.length > 0
        ? formImages
        : [
            'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=800&q=80',
          ];

    addNewProduct({
      sku: formData.sku.toUpperCase(),
      name: formData.name,
      category: formData.category,
      description: formData.description,
      price: Number(formData.price),
      costPrice: Number(formData.costPrice),
      currentStock: Number(formData.currentStock),
      minimumStock: Number(formData.minimumStock),
      leadTimeDays: Number(formData.leadTimeDays),
      unit: formData.unit,
      imageUrl: finalImages[0],
      images: finalImages,
      supplier: {
        name: formData.supplierName,
        contact: formData.supplierContact,
        deliveryRating: 4.8,
      },
      demandHistory: [0, 0, 1, 0, 0, 0, 2, 0, 0, 0, 1, 0, 0, 0, 2, 0],
      specs: {
        'Standar Mutu': 'ISO 9001:2015',
        'Garansi Pabrik': '12 Bulan Resmi',
      },
    });

    setIsAddModalOpen(false);
    // Reset form
    setFormData({
      sku: '',
      name: '',
      category: PRODUCT_CATEGORIES[1],
      description: '',
      price: 250000,
      costPrice: 175000,
      currentStock: 10,
      minimumStock: 5,
      leadTimeDays: 4,
      unit: 'Unit',
      supplierName: 'PT Mitra Presisi Jaya',
      supplierContact: 'sales@mitrapresisi.co.id',
    });
    setFormImages([
      'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1537462715879-360eeb61a0ad?auto=format&fit=crop&w=800&q=80',
    ]);
  };

  // Open Edit Modal and load existing photos
  const handleOpenEdit = (p: Product) => {
    setEditingProduct(p);
    const existing =
      p.images && p.images.length > 0 ? [...p.images] : [p.imageUrl];
    setEditImages(existing);
  };

  // Handle Save Edit
  const handleUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct) return;

    const finalImages =
      editImages.length > 0 ? editImages : [editingProduct.imageUrl];

    updateProduct(editingProduct.id, {
      name: editingProduct.name,
      category: editingProduct.category,
      price: Number(editingProduct.price),
      costPrice: Number(editingProduct.costPrice),
      leadTimeDays: Number(editingProduct.leadTimeDays),
      currentStock: Number(editingProduct.currentStock),
      unit: editingProduct.unit,
      description: editingProduct.description,
      images: finalImages,
      imageUrl: finalImages[0],
    });
    setEditingProduct(null);
  };

  // Open Stock Opname Modal
  const handleOpenOpname = (p: Product) => {
    setOpnameTargetProduct(p);
    setOpnamePhysicalStock(p.currentStock);
    setOpnameReason('Audit Fisik Rutin Stok Gudang');
    setOpnameEvidencePhotos([]);
    setSyncOpnamePhotosToCatalog(true);
  };

  // Confirm Stock Opname
  const handleConfirmOpname = () => {
    if (!opnameTargetProduct) return;

    // If staff wants to sync opname photos to the SKU catalog, pass them into adjustProductStock
    const photosToSync = syncOpnamePhotosToCatalog ? opnameEvidencePhotos : undefined;

    adjustProductStock(
      opnameTargetProduct.id,
      opnamePhysicalStock,
      opnameReason,
      photosToSync
    );

    setOpnameTargetProduct(null);
    setOpnameEvidencePhotos([]);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Sub-Tabs Navigation */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              <Layers className="w-5 h-5" />
            </span>
            <h2 className="text-xl font-bold text-white">Katalog SKU & Stock Opname</h2>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Kelola master SKU, unggah multi-foto contoh visual komponen, dan lakukan verifikasi stok fisik gudang secara presisi.
          </p>
        </div>

        {/* Sub-tab Pills */}
        <div className="flex items-center bg-slate-950 p-1.5 rounded-xl border border-slate-800 self-start md:self-auto">
          <button
            onClick={() => setActiveSubTab('catalog')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
              activeSubTab === 'catalog'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Camera className="w-4 h-4" />
            <span>Katalog SKU & Galeri Foto</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-slate-800 text-indigo-300 font-mono">
              {products.length}
            </span>
          </button>

          <button
            onClick={() => setActiveSubTab('opname')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
              activeSubTab === 'opname'
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Boxes className="w-4 h-4" />
            <span>Audit Opname Fisik & Bukti</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-slate-800 text-emerald-300 font-mono">
              Audit
            </span>
          </button>
        </div>
      </div>

      {/* SUB-TAB 1: KATALOG SKU & MULTI-FOTO */}
      {activeSubTab === 'catalog' && (
        <div className="space-y-4">
          {/* Action Header & Search */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2 flex-1">
              <div className="relative flex-1 min-w-[200px] max-w-sm">
                <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Cari SKU atau nama komponen..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-indigo-500"
              >
                {PRODUCT_CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            <button
              onClick={() => setIsAddModalOpen(true)}
              className="px-4 py-2.5 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-600/30 transition flex items-center justify-center gap-2 cursor-pointer shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span>Tambah SKU & Upload Foto Contoh</span>
            </button>
          </div>

          {/* Product List Table */}
          <div className="bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden shadow-lg">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-800/60 text-[11px] uppercase tracking-wider text-slate-400 border-b border-slate-800 font-semibold">
                  <tr>
                    <th className="py-3 px-4">SKU & Foto Utama</th>
                    <th className="py-3 px-4">Nama Komponen</th>
                    <th className="py-3 px-4">Galeri Foto Contoh</th>
                    <th className="py-3 px-4">Kategori</th>
                    <th className="py-3 px-4">Harga Jual</th>
                    <th className="py-3 px-4">HPP (Modal)</th>
                    <th className="py-3 px-4">Stok Fisik</th>
                    <th className="py-3 px-4 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-mono text-[11px]">
                  {filteredProducts.map((p) => {
                    const sampleImages =
                      p.images && p.images.length > 0 ? p.images : [p.imageUrl];

                    return (
                      <tr key={p.id} className="hover:bg-slate-800/30 transition-colors">
                        {/* SKU & Cover Image */}
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2.5">
                            <div className="relative group shrink-0">
                              <img
                                src={p.imageUrl}
                                alt={p.name}
                                className="w-10 h-10 rounded-lg object-cover bg-slate-800 border border-slate-700 shadow-xs"
                              />
                              <span className="absolute -top-1.5 -right-1.5 bg-indigo-600 text-white text-[9px] font-bold px-1 rounded-full border border-slate-900">
                                {sampleImages.length}
                              </span>
                            </div>
                            <span className="font-bold text-emerald-400 bg-emerald-950/70 px-2 py-0.5 rounded border border-emerald-800/60">
                              {p.sku}
                            </span>
                          </div>
                        </td>

                        {/* Name */}
                        <td className="py-3 px-4 font-sans font-bold text-white max-w-xs">
                          <div className="truncate">{p.name}</div>
                          <div className="text-[10px] text-slate-500 font-normal truncate">
                            {p.supplier.name} • Lead: {p.leadTimeDays} Hari
                          </div>
                        </td>

                        {/* Photo Gallery Thumbnails */}
                        <td className="py-3 px-4 font-sans">
                          <div className="flex items-center gap-1.5">
                            {sampleImages.slice(0, 3).map((img, idx) => (
                              <img
                                key={idx}
                                src={img}
                                alt={`Sample ${idx + 1}`}
                                className="w-7 h-7 rounded-md object-cover border border-slate-700/80 bg-slate-800"
                              />
                            ))}
                            {sampleImages.length > 3 && (
                              <span className="text-[10px] font-mono font-bold text-indigo-300 bg-indigo-950/80 px-1.5 py-0.5 rounded border border-indigo-800/80">
                                +{sampleImages.length - 3}
                              </span>
                            )}
                            <button
                              onClick={() => handleOpenEdit(p)}
                              className="text-[10px] font-medium text-indigo-400 hover:text-indigo-300 ml-1 underline cursor-pointer"
                            >
                              +Kelola Foto
                            </button>
                          </div>
                        </td>

                        {/* Category */}
                        <td className="py-3 px-4 font-sans text-slate-400">{p.category}</td>

                        {/* Selling Price */}
                        <td className="py-3 px-4 text-emerald-400 font-bold">
                          {formatRupiah(p.price)}
                        </td>

                        {/* Cost Price */}
                        <td className="py-3 px-4 text-slate-300">{formatRupiah(p.costPrice)}</td>

                        {/* Stock */}
                        <td className="py-3 px-4">
                          <span className="font-bold text-white">{p.currentStock}</span>{' '}
                          <span className="text-slate-500 font-sans">{p.unit}</span>
                        </td>

                        {/* Actions */}
                        <td className="py-3 px-4 text-right font-sans">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => handleOpenOpname(p)}
                              className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-emerald-600/20 hover:bg-emerald-600 text-emerald-300 hover:text-white border border-emerald-500/30 transition cursor-pointer flex items-center gap-1"
                              title="Audit Stok Fisik (Opname)"
                            >
                              <Boxes className="w-3 h-3" />
                              <span>Opname</span>
                            </button>

                            <button
                              onClick={() => handleOpenEdit(p)}
                              className="p-1.5 rounded-lg text-slate-300 hover:text-indigo-400 hover:bg-slate-800 transition cursor-pointer"
                              title="Edit SKU & Kelola Foto"
                            >
                              <Edit className="w-4 h-4" />
                            </button>

                            <button
                              onClick={() => {
                                if (confirm(`Yakin ingin menghapus SKU ${p.sku}?`)) {
                                  deleteProduct(p.id);
                                }
                              }}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition cursor-pointer"
                              title="Hapus"
                            >
                              <Trash2 className="w-4 h-4" />
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
        </div>
      )}

      {/* SUB-TAB 2: AUDIT STOCK OPNAME FISIK */}
      {activeSubTab === 'opname' && (
        <div className="space-y-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <FileCheck2 className="w-4 h-4 text-emerald-400" />
                Lembar Kerja Audit Stock Opname Gudang
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Cocokkan fisik barang aktual dengan foto katalog SKU dan lampirkan bukti foto kondisi fisik saat penyesuaian.
              </p>
            </div>

            <div className="relative min-w-[240px]">
              <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Cari SKU untuk di-opname..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          {/* Opname Table */}
          <div className="bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden shadow-lg">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-800/60 text-[11px] uppercase tracking-wider text-slate-400 border-b border-slate-800 font-semibold">
                  <tr>
                    <th className="py-3 px-4">SKU & Foto Referensi</th>
                    <th className="py-3 px-4">Nama Komponen</th>
                    <th className="py-3 px-4">Kategori</th>
                    <th className="py-3 px-4 text-center">Stok di Sistem</th>
                    <th className="py-3 px-4">Foto Contoh Tersedia</th>
                    <th className="py-3 px-4 text-right">Aksi Audit</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-mono text-[11px]">
                  {filteredProducts.map((p) => {
                    const sampleImages =
                      p.images && p.images.length > 0 ? p.images : [p.imageUrl];

                    return (
                      <tr key={p.id} className="hover:bg-slate-800/30 transition-colors">
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2.5">
                            <img
                              src={p.imageUrl}
                              alt={p.name}
                              className="w-10 h-10 rounded-lg object-cover bg-slate-800 border border-slate-700 shadow-xs shrink-0"
                            />
                            <span className="font-bold text-emerald-400 bg-emerald-950/70 px-2 py-0.5 rounded border border-emerald-800/60">
                              {p.sku}
                            </span>
                          </div>
                        </td>

                        <td className="py-3 px-4 font-sans font-bold text-white max-w-xs truncate">
                          {p.name}
                        </td>

                        <td className="py-3 px-4 font-sans text-slate-400">{p.category}</td>

                        <td className="py-3 px-4 text-center">
                          <span className="font-bold text-white text-sm bg-slate-800 px-2.5 py-1 rounded-md border border-slate-700">
                            {p.currentStock} {p.unit}
                          </span>
                        </td>

                        <td className="py-3 px-4 font-sans">
                          <span className="inline-flex items-center gap-1 text-[11px] text-indigo-300 bg-indigo-950/70 px-2 py-0.5 rounded border border-indigo-800/60">
                            <Camera className="w-3 h-3" />
                            {sampleImages.length} Foto Tersimpan
                          </span>
                        </td>

                        <td className="py-3 px-4 text-right font-sans">
                          <button
                            onClick={() => handleOpenOpname(p)}
                            className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow-md shadow-emerald-600/30 transition inline-flex items-center gap-1.5 cursor-pointer"
                          >
                            <Boxes className="w-3.5 h-3.5" />
                            <span>Mulai Opname Fisik</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 1: TAMBAH SKU BARU DENGAN MULTI-UPLOAD FOTO CONTOH */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-2xl bg-slate-900 border border-slate-700 rounded-2xl p-6 shadow-2xl space-y-4 max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <PackagePlus className="w-5 h-5 text-indigo-400" />
                <h3 className="font-bold text-white text-base">
                  Tambah SKU & Upload Foto Contoh Banyak
                </h3>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddNew} className="space-y-4 text-xs">
              {/* Product Identifiers */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Kode SKU:</label>
                  <input
                    type="text"
                    required
                    placeholder="mis: BRG-7002-SKF"
                    value={formData.sku}
                    onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono uppercase focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Kategori:</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
                  >
                    {PRODUCT_CATEGORIES.filter((c) => c !== 'Semua Kategori').map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">
                  Nama Lengkap Komponen:
                </label>
                <input
                  type="text"
                  required
                  placeholder="mis: Angular Contact Ball Bearing 7002 High Precision"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">
                  Deskripsi & Aplikasi Industri:
                </label>
                <textarea
                  rows={2}
                  required
                  placeholder="Deskripsi teknis, material, serta kegunaan industri..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              {/* SECTION: MULTI-IMAGE UPLOADER */}
              <div className="p-4 rounded-xl bg-slate-950/70 border border-indigo-900/40 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <Camera className="w-4 h-4 text-indigo-400" />
                    <span className="font-bold text-white text-xs">
                      Upload Foto Contoh SKU (Mendukung Banyak Foto)
                    </span>
                  </div>
                  <span className="text-[11px] font-mono font-bold text-emerald-400 bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-800/60">
                    {formImages.length} Foto Terlampir
                  </span>
                </div>

                <p className="text-[11px] text-slate-400">
                  Foto-foto contoh ini akan langsung ditampilkan dalam galeri interaktif di Landing Page ketika calon pembeli mengklik tombol Detail.
                </p>

                {/* Upload Options: Local Multi-File Picker & URL */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {/* File Upload Button / Area */}
                  <div>
                    <input
                      type="file"
                      ref={fileInputRefNew}
                      multiple
                      accept="image/*"
                      onChange={(e) => handleFileUpload(e.target.files, 'new')}
                      className="hidden"
                    />
                    <button
                      type="button"
                      onClick={() => fileInputRefNew.current?.click()}
                      className="w-full py-2.5 px-3 rounded-xl border border-dashed border-indigo-500/50 hover:border-indigo-400 bg-indigo-950/20 hover:bg-indigo-950/40 text-indigo-300 font-medium text-xs flex items-center justify-center gap-2 transition cursor-pointer"
                    >
                      <Upload className="w-4 h-4" />
                      <span>Pilih Foto dari Komputer (Bisa Banyak)</span>
                    </button>
                  </div>

                  {/* URL Input */}
                  <div className="flex gap-1.5">
                    <input
                      type="url"
                      placeholder="Atau tempel URL gambar..."
                      value={newUrlInput}
                      onChange={(e) => setNewUrlInput(e.target.value)}
                      className="flex-1 bg-slate-800 border border-slate-700 rounded-xl px-2.5 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                    />
                    <button
                      type="button"
                      onClick={() => handleAddUrlImage('new')}
                      className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold cursor-pointer shrink-0"
                    >
                      +Tambah
                    </button>
                  </div>
                </div>

                {/* Industrial Photo Presets */}
                <div className="space-y-1">
                  <span className="text-[10px] text-slate-500 block">
                    Preset Foto Contoh Industri Cepat:
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {SAMPLE_INDUSTRIAL_PHOTOS.slice(0, 4).map((p, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setFormImages((prev) => [...prev, p.url])}
                        className="text-[10px] bg-slate-800 hover:bg-slate-700 text-slate-300 px-2 py-1 rounded-lg border border-slate-700/80 transition cursor-pointer flex items-center gap-1"
                      >
                        <Plus className="w-2.5 h-2.5 text-indigo-400" />
                        <span>{p.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Thumbnails preview list */}
                {formImages.length > 0 && (
                  <div className="grid grid-cols-4 sm:grid-cols-6 gap-2 pt-1">
                    {formImages.map((img, i) => (
                      <div
                        key={i}
                        className={`relative group rounded-xl overflow-hidden aspect-square border-2 bg-slate-900 ${
                          i === 0
                            ? 'border-indigo-500 shadow-md shadow-indigo-500/20'
                            : 'border-slate-800'
                        }`}
                      >
                        <img src={img} alt={`Preview ${i}`} className="w-full h-full object-cover" />
                        {i === 0 && (
                          <span className="absolute top-1 left-1 bg-indigo-600 text-white text-[8px] font-bold px-1 rounded shadow">
                            Cover
                          </span>
                        )}
                        <div className="absolute inset-0 bg-slate-950/70 opacity-0 group-hover:opacity-100 transition flex flex-col items-center justify-center gap-1 p-1">
                          {i !== 0 && (
                            <button
                              type="button"
                              onClick={() => handleSetPrimary(i, 'new')}
                              className="text-[8px] font-bold bg-indigo-600 text-white px-1.5 py-0.5 rounded shadow cursor-pointer hover:bg-indigo-500"
                              title="Jadikan Foto Utama (Cover)"
                            >
                              Jadikan Cover
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => handleRemovePhoto(i, 'new')}
                            className="p-1 rounded bg-rose-600/80 hover:bg-rose-600 text-white transition cursor-pointer"
                            title="Hapus Foto"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Pricing & Stock Details */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Harga Jual (Rp):</label>
                  <input
                    type="number"
                    min="1000"
                    required
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: Number(e.target.value) })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-medium mb-1">
                    Harga Modal / HPP (Rp):
                  </label>
                  <input
                    type="number"
                    min="1000"
                    required
                    value={formData.costPrice}
                    onChange={(e) =>
                      setFormData({ ...formData, costPrice: Number(e.target.value) })
                    }
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Stok Awal:</label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={formData.currentStock}
                    onChange={(e) =>
                      setFormData({ ...formData, currentStock: Number(e.target.value) })
                    }
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-medium mb-1">
                    Lead Time (Hari):
                  </label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={formData.leadTimeDays}
                    onChange={(e) =>
                      setFormData({ ...formData, leadTimeDays: Number(e.target.value) })
                    }
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Satuan:</label>
                  <input
                    type="text"
                    required
                    value={formData.unit}
                    onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="flex gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="flex-1 py-2.5 rounded-xl border border-slate-700 text-xs font-semibold text-slate-300 hover:bg-slate-800 transition cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/30 transition flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Check className="w-4 h-4" />
                  <span>Daftarkan SKU & Simpan Galeri Foto</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: EDIT SKU & KELOLA FOTO CONTOH */}
      {editingProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-2xl bg-slate-900 border border-slate-700 rounded-2xl p-6 shadow-2xl space-y-4 max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Edit className="w-5 h-5 text-indigo-400" />
                <h3 className="font-bold text-white text-base">
                  Edit SKU & Foto Galeri ({editingProduct.sku})
                </h3>
              </div>
              <button
                onClick={() => setEditingProduct(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpdate} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-medium mb-1">Nama Produk:</label>
                <input
                  type="text"
                  required
                  value={editingProduct.name}
                  onChange={(e) =>
                    setEditingProduct({ ...editingProduct, name: e.target.value })
                  }
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Deskripsi:</label>
                <textarea
                  rows={2}
                  value={editingProduct.description}
                  onChange={(e) =>
                    setEditingProduct({ ...editingProduct, description: e.target.value })
                  }
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              {/* Photo Manager for Existing Product */}
              <div className="p-4 rounded-xl bg-slate-950/70 border border-indigo-900/40 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <Camera className="w-4 h-4 text-indigo-400" />
                    <span className="font-bold text-white text-xs">
                      Foto Contoh SKU untuk Landing Page
                    </span>
                  </div>
                  <span className="text-[11px] font-mono font-bold text-emerald-400 bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-800/60">
                    {editImages.length} Foto Aktif
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div>
                    <input
                      type="file"
                      ref={fileInputRefEdit}
                      multiple
                      accept="image/*"
                      onChange={(e) => handleFileUpload(e.target.files, 'edit')}
                      className="hidden"
                    />
                    <button
                      type="button"
                      onClick={() => fileInputRefEdit.current?.click()}
                      className="w-full py-2.5 px-3 rounded-xl border border-dashed border-indigo-500/50 hover:border-indigo-400 bg-indigo-950/20 hover:bg-indigo-950/40 text-indigo-300 font-medium text-xs flex items-center justify-center gap-2 transition cursor-pointer"
                    >
                      <Upload className="w-4 h-4" />
                      <span>Upload Foto Tambahan</span>
                    </button>
                  </div>

                  <div className="flex gap-1.5">
                    <input
                      type="url"
                      placeholder="Tempel URL gambar baru..."
                      value={editUrlInput}
                      onChange={(e) => setEditUrlInput(e.target.value)}
                      className="flex-1 bg-slate-800 border border-slate-700 rounded-xl px-2.5 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                    />
                    <button
                      type="button"
                      onClick={() => handleAddUrlImage('edit')}
                      className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold cursor-pointer shrink-0"
                    >
                      +Tambah
                    </button>
                  </div>
                </div>

                {/* Thumbnails grid */}
                <div className="grid grid-cols-4 sm:grid-cols-6 gap-2 pt-1">
                  {editImages.map((img, i) => (
                    <div
                      key={i}
                      className={`relative group rounded-xl overflow-hidden aspect-square border-2 bg-slate-900 ${
                        i === 0
                          ? 'border-indigo-500 shadow-md shadow-indigo-500/20'
                          : 'border-slate-800'
                      }`}
                    >
                      <img src={img} alt={`Edit sample ${i}`} className="w-full h-full object-cover" />
                      {i === 0 && (
                        <span className="absolute top-1 left-1 bg-indigo-600 text-white text-[8px] font-bold px-1 rounded shadow">
                          Cover
                        </span>
                      )}
                      <div className="absolute inset-0 bg-slate-950/70 opacity-0 group-hover:opacity-100 transition flex flex-col items-center justify-center gap-1 p-1">
                        {i !== 0 && (
                          <button
                            type="button"
                            onClick={() => handleSetPrimary(i, 'edit')}
                            className="text-[8px] font-bold bg-indigo-600 text-white px-1.5 py-0.5 rounded shadow cursor-pointer hover:bg-indigo-500"
                            title="Jadikan Foto Utama (Cover)"
                          >
                            Jadikan Cover
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => handleRemovePhoto(i, 'edit')}
                          className="p-1 rounded bg-rose-600/80 hover:bg-rose-600 text-white transition cursor-pointer"
                          title="Hapus Foto"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Harga Jual (Rp):</label>
                  <input
                    type="number"
                    required
                    value={editingProduct.price}
                    onChange={(e) =>
                      setEditingProduct({
                        ...editingProduct,
                        price: Number(e.target.value),
                      })
                    }
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-medium mb-1">HPP (Rp):</label>
                  <input
                    type="number"
                    required
                    value={editingProduct.costPrice}
                    onChange={(e) =>
                      setEditingProduct({
                        ...editingProduct,
                        costPrice: Number(e.target.value),
                      })
                    }
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Stok Fisik:</label>
                  <input
                    type="number"
                    required
                    value={editingProduct.currentStock}
                    onChange={(e) =>
                      setEditingProduct({
                        ...editingProduct,
                        currentStock: Number(e.target.value),
                      })
                    }
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-medium mb-1">
                    Lead Time (Hari):
                  </label>
                  <input
                    type="number"
                    required
                    value={editingProduct.leadTimeDays}
                    onChange={(e) =>
                      setEditingProduct({
                        ...editingProduct,
                        leadTimeDays: Number(e.target.value),
                      })
                    }
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="flex gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setEditingProduct(null)}
                  className="flex-1 py-2.5 rounded-xl border border-slate-700 text-xs font-semibold text-slate-300 hover:bg-slate-800 transition cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/30 transition flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Save className="w-4 h-4" />
                  <span>Simpan Perubahan & Foto</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: AUDIT STOCK OPNAME DENGAN FOTO FISIK */}
      {opnameTargetProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-3xl bg-slate-900 border border-slate-700 rounded-2xl p-6 shadow-2xl space-y-4 max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Boxes className="w-5 h-5 text-emerald-400" />
                <h3 className="font-bold text-white text-base">
                  Audit Stock Opname Fisik & Bukti Foto ({opnameTargetProduct.sku})
                </h3>
              </div>
              <button
                onClick={() => setOpnameTargetProduct(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-5 text-xs">
              {/* Left Column: Reference Catalog Photos */}
              <div className="md:col-span-5 space-y-3">
                <span className="text-slate-300 font-bold block text-[11px] uppercase tracking-wider">
                  Foto Referensi Katalog SKU:
                </span>
                <div className="relative aspect-4/3 rounded-xl overflow-hidden bg-slate-800 border border-slate-700">
                  <img
                    src={opnameTargetProduct.imageUrl}
                    alt={opnameTargetProduct.name}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute bottom-2 left-2 bg-slate-950/80 px-2 py-0.5 rounded text-[10px] text-slate-300 font-mono">
                    {opnameTargetProduct.sku}
                  </div>
                </div>

                {/* Additional Catalog Photos strip */}
                {opnameTargetProduct.images && opnameTargetProduct.images.length > 1 && (
                  <div className="space-y-1">
                    <span className="text-[10px] text-slate-500">Foto sample lainnya:</span>
                    <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
                      {opnameTargetProduct.images.map((img, idx) => (
                        <img
                          key={idx}
                          src={img}
                          alt="Ref"
                          className="w-12 h-12 rounded-lg object-cover border border-slate-700 shrink-0"
                        />
                      ))}
                    </div>
                  </div>
                )}

                <div className="p-3 rounded-xl bg-slate-800/40 border border-slate-700/60 space-y-1 text-[11px]">
                  <div className="text-slate-400">Nama SKU:</div>
                  <div className="font-bold text-white">{opnameTargetProduct.name}</div>
                  <div className="text-slate-400 mt-2">HPP Modal:</div>
                  <div className="font-mono text-slate-200">
                    {formatRupiah(opnameTargetProduct.costPrice)}
                  </div>
                </div>
              </div>

              {/* Right Column: Physical Stock Count & Upload Evidence Photos */}
              <div className="md:col-span-7 space-y-3.5">
                {/* Current Stock vs Physical Count */}
                <div className="p-3.5 rounded-xl bg-slate-800/50 border border-slate-700 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400 text-[11px]">Stok Sistem Tercatat:</span>
                    <span className="font-bold text-white font-mono text-sm">
                      {opnameTargetProduct.currentStock} {opnameTargetProduct.unit}
                    </span>
                  </div>

                  <div>
                    <label className="block text-slate-200 font-bold mb-1">
                      Hasil Hitung Fisik Aktual di Gudang:
                    </label>
                    <div className="flex items-center gap-3">
                      <input
                        type="number"
                        min="0"
                        value={opnamePhysicalStock}
                        onChange={(e) =>
                          setOpnamePhysicalStock(Math.max(0, parseInt(e.target.value) || 0))
                        }
                        className="w-32 bg-slate-900 border border-emerald-500/80 rounded-xl px-3 py-2 text-white font-mono font-bold text-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
                      />
                      <span className="text-slate-400 font-medium">
                        {opnameTargetProduct.unit}
                      </span>

                      {/* Variance badge */}
                      {(() => {
                        const diff = opnamePhysicalStock - opnameTargetProduct.currentStock;
                        return (
                          <div
                            className={`px-3 py-1 rounded-xl font-bold font-mono text-xs flex items-center gap-1 ${
                              diff === 0
                                ? 'bg-slate-700 text-slate-300'
                                : diff > 0
                                ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                                : 'bg-rose-950 text-rose-300 border border-rose-800'
                            }`}
                          >
                            <span>Selisih:</span>
                            <span>{diff > 0 ? `+${diff}` : diff}</span>
                          </div>
                        );
                      })()}
                    </div>
                  </div>
                </div>

                {/* Audit Reason Input */}
                <div>
                  <label className="block text-slate-300 font-medium mb-1">
                    Alasan / Keterangan Penyesuaian:
                  </label>
                  <input
                    type="text"
                    value={opnameReason}
                    onChange={(e) => setOpnameReason(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                    placeholder="mis: Hasil audit rak B3, segel utuh, selisih pengiriman"
                  />
                </div>

                {/* Upload Physical Condition / Opname Evidence Photos */}
                <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-white flex items-center gap-1.5">
                      <Camera className="w-3.5 h-3.5 text-emerald-400" />
                      Upload Foto Bukti Fisik / Kondisi Barang Opname:
                    </span>
                    <span className="text-[10px] text-emerald-400 font-mono">
                      {opnameEvidencePhotos.length} Bukti Foto
                    </span>
                  </div>

                  <div className="flex gap-2">
                    <input
                      type="file"
                      ref={fileInputRefOpname}
                      multiple
                      accept="image/*"
                      onChange={(e) => handleFileUpload(e.target.files, 'opname')}
                      className="hidden"
                    />
                    <button
                      type="button"
                      onClick={() => fileInputRefOpname.current?.click()}
                      className="flex-1 py-2 px-3 rounded-xl border border-dashed border-emerald-500/50 hover:border-emerald-400 bg-emerald-950/20 text-emerald-300 text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <Upload className="w-3.5 h-3.5" />
                      <span>Pilih Foto Bukti Opname (Multi-Upload)</span>
                    </button>
                  </div>

                  {/* Previews of uploaded opname evidence photos */}
                  {opnameEvidencePhotos.length > 0 && (
                    <div className="grid grid-cols-4 gap-2 pt-1">
                      {opnameEvidencePhotos.map((img, i) => (
                        <div
                          key={i}
                          className="relative group rounded-xl overflow-hidden aspect-square border border-emerald-600/40 bg-slate-900"
                        >
                          <img
                            src={img}
                            alt={`Evidence ${i}`}
                            className="w-full h-full object-cover"
                          />
                          <button
                            type="button"
                            onClick={() => handleRemovePhoto(i, 'opname')}
                            className="absolute top-1 right-1 p-1 rounded bg-rose-600/90 text-white opacity-0 group-hover:opacity-100 transition cursor-pointer"
                          >
                            <Trash2 className="w-2.5 h-2.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  <label className="flex items-center gap-2 pt-1 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={syncOpnamePhotosToCatalog}
                      onChange={(e) => setSyncOpnamePhotosToCatalog(e.target.checked)}
                      className="rounded border-slate-700 text-emerald-600 focus:ring-emerald-500 w-4 h-4 cursor-pointer"
                    />
                    <span className="text-[11px] text-slate-300">
                      Tambahkan juga foto bukti ini ke <strong>Katalog Foto SKU</strong> (agar tampil di Landing Page saat user klik Detail).
                    </span>
                  </label>
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setOpnameTargetProduct(null)}
                    className="flex-1 py-2.5 rounded-xl border border-slate-700 text-xs font-semibold text-slate-300 hover:bg-slate-800 transition cursor-pointer"
                  >
                    Batal
                  </button>
                  <button
                    type="button"
                    onClick={handleConfirmOpname}
                    className="flex-1 py-2.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-600/30 transition flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Simpan Penyesuaian Stok & Foto</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
